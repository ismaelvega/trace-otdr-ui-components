import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from "react";
import type { KeyEvent, TracePoint } from "sor-reader";

import type { MeasurementCursor, MeasurementCursors, TraceOverlay, ViewportRange } from "../types/chart.js";
import type { DistanceUnit } from "../types/units.js";
import { drawMeasurementCursors, hitTestMeasurementCursors } from "../canvas/measurement-cursors.js";
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
import { computeCursorMeasurement } from "../utils/cursor-measurement.js";
import { formatDistance, formatPower, formatSlope } from "../utils/formatters.js";
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
  measurementCursors?: MeasurementCursors;
  defaultMeasurementCursors?: MeasurementCursors;
  className?: string;
  onPointHover?: (point: TracePoint, index: number) => void;
  onEventClick?: (event: KeyEvent, index: number) => void;
  onMeasurementCursorsChange?: (value: MeasurementCursors) => void;
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
  moved: boolean;
}

interface CursorDragState {
  active: boolean;
  pointerId: number | null;
  key: "a" | "b" | null;
  moved: boolean;
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

function createEmptyMeasurementCursors(): MeasurementCursors {
  return {
    a: null,
    b: null,
  };
}

function normalizeMeasurementCursors(value: MeasurementCursors | undefined): MeasurementCursors {
  if (!value) return createEmptyMeasurementCursors();

  return {
    a: value.a ?? null,
    b: value.b ?? null,
  };
}

function isSameCursor(a: MeasurementCursor | null, b: MeasurementCursor | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;

  return a.distance === b.distance && a.power === b.power && a.traceIndex === b.traceIndex;
}

function areMeasurementCursorsEqual(a: MeasurementCursors, b: MeasurementCursors): boolean {
  return isSameCursor(a.a, b.a) && isSameCursor(a.b, b.b);
}

function buildMeasurementCursor(state: CrosshairState): MeasurementCursor {
  return {
    distance: state.point.distance,
    power: state.point.power,
    traceIndex: state.index,
  };
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
  measurementCursors: controlledMeasurementCursors,
  defaultMeasurementCursors,
  className,
  onPointHover,
  onEventClick,
  onMeasurementCursorsChange,
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
  const onMeasurementCursorsChangeRef = useRef(onMeasurementCursorsChange);
  const onZoomChangeRef = useRef(onZoomChange);

  traceRef.current = trace;
  eventsRef.current = events;
  overlaysRef.current = overlays;
  xUnitRef.current = xUnit;
  selectedEventRef.current = selectedEvent;
  onPointHoverRef.current = onPointHover;
  onEventClickRef.current = onEventClick;
  onMeasurementCursorsChangeRef.current = onMeasurementCursorsChange;
  onZoomChangeRef.current = onZoomChange;

  const isMeasurementControlled = controlledMeasurementCursors !== undefined;
  const normalizedControlledMeasurementCursors = useMemo(
    () => normalizeMeasurementCursors(controlledMeasurementCursors),
    [controlledMeasurementCursors],
  );
  const [uncontrolledMeasurementCursors, setUncontrolledMeasurementCursors] = useState<MeasurementCursors>(() =>
    normalizeMeasurementCursors(defaultMeasurementCursors),
  );
  const resolvedMeasurementCursors = isMeasurementControlled
    ? normalizedControlledMeasurementCursors
    : uncontrolledMeasurementCursors;

  const baseViewport = useMemo(() => computeViewport(trace), [trace]);
  const [viewport, setViewportState] = useState<ViewportRange>(baseViewport);
  const viewportRef = useRef(viewport);
  const boundsRef = useRef(computeViewport(trace, 0));
  const crosshairRef = useRef<CrosshairState | null>(null);
  const markersRef = useRef<EventMarker[]>([]);
  const measurementCursorsRef = useRef<MeasurementCursors>(resolvedMeasurementCursors);
  const dragRef = useRef<DragState>({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    moved: false,
  });
  const cursorDragRef = useRef<CursorDragState>({
    active: false,
    pointerId: null,
    key: null,
    moved: false,
  });
  const suppressClickRef = useRef(false);
  const renderRef = useRef<() => void>(() => undefined);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [liveLabel, setLiveLabel] = useState("");
  const keyboardMarkerIndexRef = useRef<number>(-1);
  const hoveredMarkerIndexRef = useRef<number | null>(null);

  measurementCursorsRef.current = resolvedMeasurementCursors;

  const measurement = useMemo(
    () => computeCursorMeasurement(trace, events, resolvedMeasurementCursors),
    [events, resolvedMeasurementCursors, trace],
  );

  const setViewport = (next: ViewportRange, notify = true): void => {
    viewportRef.current = next;
    setViewportState(next);
    if (notify) {
      onZoomChangeRef.current?.(next);
    }
    schedulerRef.current?.scheduleRender();
  };

  const setMeasurementCursors = (next: MeasurementCursors, notify = true): void => {
    const normalized = normalizeMeasurementCursors(next);
    if (areMeasurementCursorsEqual(measurementCursorsRef.current, normalized)) return;

    measurementCursorsRef.current = normalized;
    if (!isMeasurementControlled) {
      setUncontrolledMeasurementCursors(normalized);
    }

    if (notify) {
      onMeasurementCursorsChangeRef.current?.(normalized);
    }

    schedulerRef.current?.scheduleRender();
  };

  const resolveMeasurementCursorAtPointer = (
    pointerX: number,
    pointerY: number,
    canvasRect: { width: number; height: number },
  ): MeasurementCursor | null => {
    const crosshair = resolveCrosshairState(
      traceRef.current,
      pointerX,
      pointerY,
      viewportRef.current,
      canvasRect,
      xUnitRef.current,
    );
    if (!crosshair) return null;

    return buildMeasurementCursor(crosshair);
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
    const cursorAColor = readCssVariable(computed, "--otdr-cursor-a", "#7c3aed");
    const cursorBColor = readCssVariable(computed, "--otdr-cursor-b", "#ea580c");
    const cursorSpanColor = readCssVariable(computed, "--otdr-cursor-span", "rgba(124, 58, 237, 0.12)");

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
      drawCrosshair: () => {
        drawMeasurementCursors(handle.ctx, measurementCursorsRef.current, viewportRef.current, canvasRect, {
          cursorAColor,
          cursorBColor,
          cursorSpanColor,
          labelBackground: crosshairLabelBackground,
          labelTextColor: crosshairTextColor,
          labelBorder: tooltipBorder,
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
      if (event.button !== 0) return;

      const canvasRect = getCanvasRect(handle.canvas);
      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY,
      );

      if (cursorHit) {
        cursorDragRef.current = {
          active: true,
          pointerId: event.pointerId,
          key: cursorHit,
          moved: false,
        };
        handle.canvas.setPointerCapture(event.pointerId);
        handle.canvas.style.cursor = "ew-resize";
        return;
      }

      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        lastX: event.offsetX,
        lastY: event.offsetY,
        moved: false,
      };
      handle.canvas.setPointerCapture(event.pointerId);
      handle.canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent): void => {
      const canvasRect = getCanvasRect(handle.canvas);
      const cursorDrag = cursorDragRef.current;

      if (cursorDrag.active && cursorDrag.pointerId === event.pointerId && cursorDrag.key) {
        const cursor = resolveMeasurementCursorAtPointer(event.offsetX, event.offsetY, canvasRect);
        if (cursor) {
          const current = measurementCursorsRef.current;
          const next = cursorDrag.key === "a" ? { ...current, a: cursor } : { ...current, b: cursor };
          setMeasurementCursors(next);

          setLiveLabel(
            `Cursor ${cursorDrag.key.toUpperCase()}: ${formatDistance(cursor.distance, xUnitRef.current)}, ${formatPower(cursor.power, 2)}`,
          );
        }

        cursorDragRef.current = {
          ...cursorDrag,
          moved: true,
        };

        scheduler.scheduleRender();
        return;
      }

      const drag = dragRef.current;
      if (drag.active && drag.pointerId === event.pointerId) {
        const deltaX = event.offsetX - drag.lastX;
        const deltaY = event.offsetY - drag.lastY;

        dragRef.current = {
          ...drag,
          lastX: event.offsetX,
          lastY: event.offsetY,
          moved: drag.moved || Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0,
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

      const markerHit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (markerHit === null) {
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
      } else {
        hoveredMarkerIndexRef.current = markerHit;
        const marker = markersRef.current.find((candidate: EventMarker) => candidate.index === markerHit);
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

      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY,
      );
      handle.canvas.style.cursor = cursorHit ? "ew-resize" : "crosshair";

      scheduler.scheduleRender();
    };

    const onPointerUp = (event: PointerEvent): void => {
      const cursorDrag = cursorDragRef.current;
      if (cursorDrag.active && cursorDrag.pointerId === event.pointerId) {
        cursorDragRef.current = {
          active: false,
          pointerId: null,
          key: null,
          moved: false,
        };

        suppressClickRef.current = cursorDrag.moved;
        handle.canvas.releasePointerCapture(event.pointerId);
        handle.canvas.style.cursor = "crosshair";
        return;
      }

      if (dragRef.current.pointerId !== event.pointerId) return;
      suppressClickRef.current = dragRef.current.moved;
      dragRef.current = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
        moved: false,
      };
      handle.canvas.releasePointerCapture(event.pointerId);
      handle.canvas.style.cursor = "crosshair";
    };

    const onPointerLeave = (): void => {
      if (!dragRef.current.active && !cursorDragRef.current.active) {
        crosshairRef.current = null;
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
        scheduler.scheduleRender();
      }
    };

    const onClick = (event: MouseEvent): void => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      const canvasRect = getCanvasRect(handle.canvas);
      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY,
      );
      if (cursorHit) return;

      const markerHit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (markerHit !== null) {
        const selected = eventsRef.current[markerHit];
        if (!selected) return;
        onEventClickRef.current?.(selected, markerHit);
        return;
      }

      const cursor = resolveMeasurementCursorAtPointer(event.offsetX, event.offsetY, canvasRect);
      if (!cursor) return;

      const current = measurementCursorsRef.current;
      const next = !current.a ? { a: cursor, b: null } : !current.b ? { ...current, b: cursor } : { a: cursor, b: null };
      setMeasurementCursors(next);

      setLiveLabel(`Cursor ${!current.a || current.b ? "A" : "B"}: ${formatDistance(cursor.distance, xUnitRef.current)}`);
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
  }, [height, isMeasurementControlled, width]);

  useEffect(() => {
    schedulerRef.current?.scheduleRender();
  }, [normalizedControlledMeasurementCursors, resolvedMeasurementCursors]);

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
        if (event.key === "Escape") {
          event.preventDefault();
          const current = measurementCursorsRef.current;
          if (current.b) {
            setMeasurementCursors({ ...current, b: null });
            return;
          }

          if (current.a) {
            setMeasurementCursors(createEmptyMeasurementCursors());
          }
          return;
        }

        if ((event.key === "a" || event.key === "A" || event.key === "b" || event.key === "B") && crosshairRef.current) {
          event.preventDefault();
          const key = event.key.toLowerCase() as "a" | "b";
          const cursor = buildMeasurementCursor(crosshairRef.current);
          const next = key === "a" ? { ...measurementCursorsRef.current, a: cursor } : { ...measurementCursorsRef.current, b: cursor };
          setMeasurementCursors(next);
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
      {measurement ? (
        <div className={styles.measurementHud}>
          <div className={styles.measurementRow}>
            <span className={styles.measurementLabel}>A</span>
            <span>{`${formatDistance(measurement.distanceA, xUnit)} · ${formatPower(measurement.powerA, 2)}`}</span>
          </div>
          <div className={styles.measurementRow}>
            <span className={styles.measurementLabel}>B</span>
            <span>{`${formatDistance(measurement.distanceB, xUnit)} · ${formatPower(measurement.powerB, 2)}`}</span>
          </div>
          <div className={styles.measurementDelta}>{`Δ ${formatDistance(measurement.deltaDistance, xUnit)} | ${formatPower(measurement.deltaPower, 3)} | Avg ${measurement.avgAttenuationDbPerKm === null ? "N/A" : formatSlope(measurement.avgAttenuationDbPerKm, 3)}`}</div>
          <div className={styles.measurementMeta}>{`Events ${measurement.eventCountBetween} · Reflective ${measurement.reflectiveEventCountBetween} · Splice Σ ${formatPower(measurement.spliceLossSumBetween, 3)}`}</div>
        </div>
      ) : null}
      {trace.length === 0 ? <div className={styles.empty}>No trace points available</div> : null}
      <div className={styles.liveRegion} aria-live="polite">
        {liveLabel}
      </div>
    </div>
  );
}
