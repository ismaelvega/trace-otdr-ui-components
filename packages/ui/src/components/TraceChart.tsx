import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import type { KeyEvent, TracePoint } from "sor-reader";

import type { TraceOverlay, ViewportRange } from "../types/chart.js";
import type { DistanceUnit } from "../types/units.js";
import { createCanvas, type CanvasHandle } from "../canvas/canvas-manager.js";
import { computeViewport } from "../canvas/coordinates.js";
import { resolveCrosshairState, type CrosshairState } from "../canvas/crosshair.js";
import {
  computeEventMarkers,
  drawEventMarkers as renderEventMarkers,
  formatEventTooltip,
  hitTestEventMarkers,
  type EventMarker,
} from "../canvas/event-markers.js";
import { getZoomAxisFromModifiers, panViewportByPixels, zoomViewportAtPixel, type ZoomAxis } from "../canvas/interactions.js";
import { createRenderScheduler, renderFrame, type RenderScheduler } from "../canvas/render-pipeline.js";
import styles from "./TraceChart.module.css";

export interface TraceChartProps {
  trace: TracePoint[];
  events?: KeyEvent[];
  overlays?: TraceOverlay[];
  viewport?: ViewportRange;
  width?: number | "auto";
  height?: number;
  xUnit?: DistanceUnit;
  selectedEvent?: number | null;
  className?: string;
  onPointHover?: (point: TracePoint, index: number) => void;
  onEventClick?: (event: KeyEvent, index: number) => void;
  onZoomChange?: (viewport: ViewportRange) => void;
}

interface TooltipState {
  left: number;
  top: number;
  text: string;
}

interface DragState {
  active: boolean;
  pointerId: number | null;
  lastX: number;
  lastY: number;
}

function getCanvasRect(canvas: HTMLCanvasElement): { width: number; height: number } {
  return {
    width: canvas.clientWidth || Math.max(1, canvas.width),
    height: canvas.clientHeight || Math.max(1, canvas.height),
  };
}

function readCssVariable(style: CSSStyleDeclaration, key: string, fallback: string): string {
  const value = style.getPropertyValue(key).trim();
  return value.length > 0 ? value : fallback;
}

function computeMinSpanX(trace: TracePoint[]): number {
  if (trace.length < 2) return 0.001;
  const lastIndex = Math.min(trace.length - 1, 10);
  const first = trace[0];
  const last = trace[lastIndex];
  if (!first || !last) return 0.001;
  return Math.max(0.001, last.distance - first.distance);
}

function parseDistance(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function estimateTooltipSize(text: string): { width: number; height: number } {
  const lines = text.split("\n");
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = clamp(24 + longest * 7, 160, 320);
  const height = 12 + lines.length * 18;
  return { width, height };
}

export function TraceChart({
  trace,
  events = [],
  overlays = [],
  viewport: controlledViewport,
  width = "auto",
  height = 360,
  xUnit = "km",
  selectedEvent = null,
  className,
  onPointHover,
  onEventClick,
  onZoomChange,
}: TraceChartProps): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasHandleRef = useRef<CanvasHandle | null>(null);
  const schedulerRef = useRef<RenderScheduler | null>(null);

  const traceRef = useRef(trace);
  const eventsRef = useRef(events);
  const overlaysRef = useRef(overlays);
  const xUnitRef = useRef(xUnit);
  const selectedEventRef = useRef<number | null>(selectedEvent);
  const onPointHoverRef = useRef(onPointHover);
  const onEventClickRef = useRef(onEventClick);
  const onZoomChangeRef = useRef(onZoomChange);

  traceRef.current = trace;
  eventsRef.current = events;
  overlaysRef.current = overlays;
  xUnitRef.current = xUnit;
  selectedEventRef.current = selectedEvent;
  onPointHoverRef.current = onPointHover;
  onEventClickRef.current = onEventClick;
  onZoomChangeRef.current = onZoomChange;

  const baseViewport = useMemo(() => computeViewport(trace), [trace]);
  const [viewport, setViewportState] = useState<ViewportRange>(baseViewport);
  const viewportRef = useRef(viewport);
  const boundsRef = useRef(computeViewport(trace, 0));
  const crosshairRef = useRef<CrosshairState | null>(null);
  const markersRef = useRef<EventMarker[]>([]);
  const dragRef = useRef<DragState>({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
  });
  const renderRef = useRef<() => void>(() => undefined);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [liveLabel, setLiveLabel] = useState("");
  const keyboardMarkerIndexRef = useRef<number>(-1);
  const hoveredMarkerIndexRef = useRef<number | null>(null);

  const setViewport = (next: ViewportRange, notify = true): void => {
    viewportRef.current = next;
    setViewportState(next);
    if (notify) {
      onZoomChangeRef.current?.(next);
    }
    schedulerRef.current?.scheduleRender();
  };

  useEffect(() => {
    boundsRef.current = computeViewport(trace, 0);
    crosshairRef.current = null;
    hoveredMarkerIndexRef.current = null;
    setTooltip(null);
    if (!controlledViewport) {
      setViewport(computeViewport(trace), false);
    }
  }, [trace]);

  useEffect(() => {
    if (!controlledViewport) return;
    setViewport(controlledViewport, false);
  }, [controlledViewport]);

  useEffect(() => {
    if (selectedEvent === null || selectedEvent < 0) return;
    const event = events[selectedEvent];
    if (!event) return;

    const centerX = parseDistance(event.distance);
    if (!Number.isFinite(centerX)) return;

    const current = viewportRef.current;
    const currentSpan = Math.max(computeMinSpanX(traceRef.current), current.xMax - current.xMin);
    const nextSpan = Math.max(computeMinSpanX(traceRef.current), currentSpan * 0.5);
    const next = {
      ...current,
      xMin: centerX - nextSpan / 2,
      xMax: centerX + nextSpan / 2,
    };

    setViewport(next, false);
  }, [events, selectedEvent]);

  renderRef.current = () => {
    const handle = canvasHandleRef.current;
    if (!handle) return;

    const canvasRect = getCanvasRect(handle.canvas);
    const computed = getComputedStyle(handle.canvas);
    const traceColor = readCssVariable(computed, "--otdr-trace-primary", "#0f766e");
    const chartBackground = readCssVariable(computed, "--otdr-chart-bg", "#ffffff");
    const axisColor = readCssVariable(computed, "--otdr-axis-color", "#334155");
    const axisLabelColor = readCssVariable(computed, "--otdr-axis-label", "#0f172a");
    const gridColor = readCssVariable(computed, "--otdr-grid-color", "#cbd5e1");
    const crosshairColor = readCssVariable(computed, "--otdr-crosshair-color", "#64748b");
    const panelColor = readCssVariable(computed, "--otdr-panel", "#ffffff");
    const crosshairTextColor = readCssVariable(computed, "--otdr-crosshair-label-fg", "#0f172a");
    const crosshairLabelBackground = readCssVariable(computed, "--otdr-crosshair-label-bg", panelColor);
    const tooltipBackground = readCssVariable(computed, "--otdr-tooltip-bg", "rgba(7, 26, 45, 0.96)");
    const tooltipForeground = readCssVariable(computed, "--otdr-tooltip-fg", "#eff6ff");
    const tooltipBorder = readCssVariable(computed, "--otdr-tooltip-border", "#1f3b5b");
    const markerStemColor = readCssVariable(computed, "--otdr-marker-stem", "rgba(49, 82, 116, 0.36)");
    const markerSelectedStemColor = readCssVariable(computed, "--otdr-marker-stem-selected", "rgba(37, 99, 235, 0.66)");
    const markerLabelColor = readCssVariable(computed, "--otdr-marker-label", "#334e68");
    const markerLabelMuted = readCssVariable(computed, "--otdr-marker-label-muted", "#6f859e");
    const markerSelectedRing = readCssVariable(computed, "--otdr-marker-selected-ring", "#2563eb");
    const markerSelectedHalo = readCssVariable(computed, "--otdr-marker-selected-halo", "rgba(37, 99, 235, 0.28)");
    const markerHoverRing = readCssVariable(computed, "--otdr-marker-hover-ring", "#0891b2");
    const markerHoverHalo = readCssVariable(computed, "--otdr-marker-hover-halo", "rgba(8, 145, 178, 0.24)");
    const markerReflection = readCssVariable(computed, "--otdr-marker-reflection", "#c3342f");
    const markerLoss = readCssVariable(computed, "--otdr-marker-loss", "#0f766e");
    const markerConnector = readCssVariable(computed, "--otdr-marker-connector", "#2563eb");
    const markerEnd = readCssVariable(computed, "--otdr-marker-end", "#111827");
    const markerManual = readCssVariable(computed, "--otdr-marker-manual", "#a16207");
    const markerUnknown = readCssVariable(computed, "--otdr-marker-unknown", "#64748b");

    if (containerRef.current) {
      containerRef.current.style.setProperty("--otdr-tooltip-bg-runtime", tooltipBackground);
      containerRef.current.style.setProperty("--otdr-tooltip-fg-runtime", tooltipForeground);
      containerRef.current.style.setProperty("--otdr-tooltip-border-runtime", tooltipBorder);
    }

    const composedOverlays: TraceOverlay[] = [
      { trace: traceRef.current, label: "Primary", color: traceColor },
      ...overlaysRef.current,
    ];

    const markers = computeEventMarkers(eventsRef.current, traceRef.current, viewportRef.current, canvasRect);
    markersRef.current = markers;

    renderFrame({
      ctx: handle.ctx,
      canvasRect,
      viewport: viewportRef.current,
      overlays: composedOverlays,
      unit: xUnitRef.current,
      clearColor: chartBackground,
      drawEventMarkers: () => {
        renderEventMarkers(handle.ctx, markers, canvasRect, selectedEventRef.current, hoveredMarkerIndexRef.current, {
          colors: {
            reflection: markerReflection,
            loss: markerLoss,
            connector: markerConnector,
            "end-of-fiber": markerEnd,
            manual: markerManual,
            unknown: markerUnknown,
          },
          stemColor: markerStemColor,
          selectedStemColor: markerSelectedStemColor,
          labelColor: markerLabelColor,
          mutedLabelColor: markerLabelMuted,
          selectedRingColor: markerSelectedRing,
          selectedHaloColor: markerSelectedHalo,
          hoverRingColor: markerHoverRing,
          hoverHaloColor: markerHoverHalo,
        });
      },
      crosshair: crosshairRef.current,
      axisStyle: {
        axisColor,
        gridColor,
        labelColor: axisLabelColor,
      },
      crosshairStyle: {
        lineColor: crosshairColor,
        labelBackground: crosshairLabelBackground,
        textColor: crosshairTextColor,
        labelBorder: tooltipBorder,
      },
    });
  };

  const zoomFromCenter = (zoomFactor: number, axis: ZoomAxis = "both"): void => {
    const handle = canvasHandleRef.current;
    if (!handle) return;
    const canvasRect = getCanvasRect(handle.canvas);
    const next = zoomViewportAtPixel(
      viewportRef.current,
      boundsRef.current,
      canvasRect.width / 2,
      canvasRect.height / 2,
      canvasRect,
      zoomFactor,
      axis,
      { minSpanX: computeMinSpanX(traceRef.current) },
    );
    setViewport(next);
  };

  const panFromKeyboard = (deltaX: number, deltaY: number): void => {
    const handle = canvasHandleRef.current;
    if (!handle) return;
    const canvasRect = getCanvasRect(handle.canvas);
    const next = panViewportByPixels(viewportRef.current, boundsRef.current, deltaX, deltaY, canvasRect);
    setViewport(next);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const initialWidth = width === "auto" ? Math.max(320, container.clientWidth || 0) : width;
    const handle = createCanvas(container, initialWidth, height, { autoResize: width === "auto" });
    handle.canvas.className = styles.canvas ?? "";
    canvasHandleRef.current = handle;

    const scheduler = createRenderScheduler(() => renderRef.current());
    schedulerRef.current = scheduler;

    const onWheel = (event: WheelEvent): void => {
      event.preventDefault();
      const canvasRect = getCanvasRect(handle.canvas);
      const axis = getZoomAxisFromModifiers(event);
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = zoomViewportAtPixel(
        viewportRef.current,
        boundsRef.current,
        event.offsetX,
        event.offsetY,
        canvasRect,
        factor,
        axis,
        { minSpanX: computeMinSpanX(traceRef.current) },
      );
      setViewport(next);
    };

    const onPointerDown = (event: PointerEvent): void => {
      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        lastX: event.offsetX,
        lastY: event.offsetY,
      };
      handle.canvas.setPointerCapture(event.pointerId);
      handle.canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent): void => {
      const drag = dragRef.current;
      const canvasRect = getCanvasRect(handle.canvas);
      if (drag.active && drag.pointerId === event.pointerId) {
        const deltaX = event.offsetX - drag.lastX;
        const deltaY = event.offsetY - drag.lastY;

        dragRef.current = {
          ...drag,
          lastX: event.offsetX,
          lastY: event.offsetY,
        };
        const next = panViewportByPixels(viewportRef.current, boundsRef.current, deltaX, deltaY, canvasRect);
        setViewport(next);
        return;
      }

      const crosshair = resolveCrosshairState(
        traceRef.current,
        event.offsetX,
        event.offsetY,
        viewportRef.current,
        canvasRect,
        xUnitRef.current,
      );
      crosshairRef.current = crosshair;
      if (crosshair) {
        onPointHoverRef.current?.(crosshair.point, crosshair.index);
        setLiveLabel(crosshair.label);
      }

      const hit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (hit === null) {
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
      } else {
        hoveredMarkerIndexRef.current = hit;
        const marker = markersRef.current.find((candidate: EventMarker) => candidate.index === hit);
        if (marker) {
          const text = formatEventTooltip(marker, xUnitRef.current);
          const { width: tooltipWidth, height: tooltipHeight } = estimateTooltipSize(text);
          const viewportWidth = handle.canvas.clientWidth || canvasRect.width;
          const viewportHeight = handle.canvas.clientHeight || canvasRect.height;
          setTooltip({
            left: clamp(event.offsetX + 12, 8, viewportWidth - tooltipWidth - 8),
            top: clamp(event.offsetY + 12, 8, viewportHeight - tooltipHeight - 8),
            text,
          });
        }
      }

      scheduler.scheduleRender();
    };

    const onPointerUp = (event: PointerEvent): void => {
      if (dragRef.current.pointerId !== event.pointerId) return;
      dragRef.current = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
      };
      handle.canvas.releasePointerCapture(event.pointerId);
      handle.canvas.style.cursor = "crosshair";
    };

    const onPointerLeave = (): void => {
      if (!dragRef.current.active) {
        crosshairRef.current = null;
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
        scheduler.scheduleRender();
      }
    };

    const onClick = (event: MouseEvent): void => {
      const hit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (hit === null) return;

      const selected = eventsRef.current[hit];
      if (!selected) return;
      onEventClickRef.current?.(selected, hit);
    };

    const onDoubleClick = (): void => {
      setViewport(computeViewport(traceRef.current));
    };

    handle.canvas.addEventListener("wheel", onWheel, { passive: false });
    handle.canvas.addEventListener("pointerdown", onPointerDown);
    handle.canvas.addEventListener("pointermove", onPointerMove);
    handle.canvas.addEventListener("pointerup", onPointerUp);
    handle.canvas.addEventListener("pointercancel", onPointerUp);
    handle.canvas.addEventListener("pointerleave", onPointerLeave);
    handle.canvas.addEventListener("click", onClick);
    handle.canvas.addEventListener("dblclick", onDoubleClick);
    scheduler.scheduleRender();

    return () => {
      handle.canvas.removeEventListener("wheel", onWheel);
      handle.canvas.removeEventListener("pointerdown", onPointerDown);
      handle.canvas.removeEventListener("pointermove", onPointerMove);
      handle.canvas.removeEventListener("pointerup", onPointerUp);
      handle.canvas.removeEventListener("pointercancel", onPointerUp);
      handle.canvas.removeEventListener("pointerleave", onPointerLeave);
      handle.canvas.removeEventListener("click", onClick);
      handle.canvas.removeEventListener("dblclick", onDoubleClick);
      scheduler.cancel();
      schedulerRef.current = null;
      canvasHandleRef.current = null;
      handle.dispose();
    };
  }, [height, width]);

  useEffect(() => {
    schedulerRef.current?.scheduleRender();
  }, [viewport, events, overlays, xUnit, selectedEvent]);

  const rootStyle: CSSProperties =
    width === "auto" ? { height: `${height}px` } : { width: `${width}px`, height: `${height}px` };

  return (
    <div
      ref={containerRef}
      className={className ? `${styles.root} ${className}` : styles.root}
      style={rootStyle}
      role="img"
      aria-label={`OTDR trace chart with ${trace.length} data points and ${events.length} events`}
      tabIndex={0}
      onKeyDown={(event) => {
        const panPixels = 24;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          panFromKeyboard(-panPixels, 0);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          panFromKeyboard(panPixels, 0);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          panFromKeyboard(0, -panPixels);
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          panFromKeyboard(0, panPixels);
          return;
        }
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomFromCenter(1.15);
          return;
        }
        if (event.key === "-") {
          event.preventDefault();
          zoomFromCenter(1 / 1.15);
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          setViewport(computeViewport(traceRef.current));
          return;
        }

        if (event.key === "Tab" && markersRef.current.length > 0) {
          event.preventDefault();
          const direction = event.shiftKey ? -1 : 1;
          keyboardMarkerIndexRef.current =
            (keyboardMarkerIndexRef.current + direction + markersRef.current.length) % markersRef.current.length;
          const marker = markersRef.current[keyboardMarkerIndexRef.current];
          if (!marker) return;
          const handle = canvasHandleRef.current;
          if (!handle) return;
          const canvasRect = getCanvasRect(handle.canvas);
          const state = resolveCrosshairState(
            traceRef.current,
            marker.px,
            marker.py,
            viewportRef.current,
            canvasRect,
            xUnitRef.current,
          );
          crosshairRef.current = state;
          hoveredMarkerIndexRef.current = marker.index;
          setLiveLabel(state?.label ?? `Event ${marker.index + 1}`);
          onEventClickRef.current?.(marker.event, marker.index);
          schedulerRef.current?.scheduleRender();
          return;
        }

        if (event.key === "Enter" && keyboardMarkerIndexRef.current >= 0) {
          const marker = markersRef.current[keyboardMarkerIndexRef.current];
          if (marker) {
            onEventClickRef.current?.(marker.event, marker.index);
          }
        }
      }}
    >
      {tooltip ? (
        <div className={styles.tooltip} style={{ left: tooltip.left, top: tooltip.top }}>
          {tooltip.text}
        </div>
      ) : null}
      {trace.length === 0 ? <div className={styles.empty}>No trace points available</div> : null}
      <div className={styles.liveRegion} aria-live="polite">
        {liveLabel}
      </div>
    </div>
  );
}
