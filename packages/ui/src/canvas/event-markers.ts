import type { KeyEvent, TracePoint } from "sor-reader";

import type { ViewportRange } from "../types/chart.js";
import type { EventCategory } from "../types/events.js";
import type { DistanceUnit } from "../types/units.js";
import { classifyEvent } from "../utils/classifiers.js";
import { formatDistance, formatPower } from "../utils/formatters.js";
import { dataToPixel, getPlotRect, type CanvasRect } from "./coordinates.js";
import { findNearestTracePointIndex } from "./crosshair.js";

export interface EventMarker {
  index: number;
  event: KeyEvent;
  category: EventCategory;
  distance: number;
  power: number;
  px: number;
  py: number;
}

interface MarkerStyle {
  colors: Record<EventCategory, string>;
  stemColor: string;
  selectedStemColor: string;
  labelColor: string;
  mutedLabelColor: string;
  selectedRingColor: string;
  selectedHaloColor: string;
  hoverRingColor: string;
  hoverHaloColor: string;
}

const DEFAULT_MARKER_STYLE: MarkerStyle = {
  colors: {
    reflection: "#c3342f",
    loss: "#0f766e",
    connector: "#2563eb",
    "end-of-fiber": "#111827",
    manual: "#a16207",
    unknown: "#64748b",
  },
  stemColor: "rgba(49, 82, 116, 0.36)",
  selectedStemColor: "rgba(37, 99, 235, 0.66)",
  labelColor: "#334e68",
  mutedLabelColor: "#6f859e",
  selectedRingColor: "#2563eb",
  selectedHaloColor: "rgba(37, 99, 235, 0.28)",
  hoverRingColor: "#0891b2",
  hoverHaloColor: "rgba(8, 145, 178, 0.24)",
};

function parseDistance(distance: string): number {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : Number.NaN;
}

function drawMarkerShape(ctx: CanvasRenderingContext2D, category: EventCategory, px: number, py: number, radius: number): void {
  ctx.beginPath();

  if (category === "reflection") {
    ctx.moveTo(px, py - radius);
    ctx.lineTo(px + radius, py + radius);
    ctx.lineTo(px - radius, py + radius);
    ctx.closePath();
    return;
  }

  if (category === "connector") {
    ctx.moveTo(px, py - radius);
    ctx.lineTo(px + radius, py);
    ctx.lineTo(px, py + radius);
    ctx.lineTo(px - radius, py);
    ctx.closePath();
    return;
  }

  if (category === "end-of-fiber") {
    ctx.moveTo(px - radius, py - radius);
    ctx.lineTo(px + radius, py + radius);
    ctx.moveTo(px + radius, py - radius);
    ctx.lineTo(px - radius, py + radius);
    return;
  }

  ctx.arc(px, py, radius, 0, Math.PI * 2);
}

export function computeEventMarkers(
  events: KeyEvent[],
  trace: TracePoint[],
  viewport: ViewportRange,
  canvasRect: CanvasRect,
): EventMarker[] {
  if (events.length === 0 || trace.length === 0) return [];

  const plotRect = getPlotRect(canvasRect);
  const markers: EventMarker[] = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event) continue;

    const distance = parseDistance(event.distance);
    if (!Number.isFinite(distance)) continue;

    const traceIndex = findNearestTracePointIndex(trace, distance);
    if (traceIndex < 0) continue;
    const tracePoint = trace[traceIndex];
    if (!tracePoint) continue;

    const position = dataToPixel(distance, tracePoint.power, viewport, canvasRect);
    if (
      position.px < plotRect.left ||
      position.px > plotRect.right ||
      position.py < plotRect.top ||
      position.py > plotRect.bottom
    ) {
      continue;
    }

    markers.push({
      index,
      event,
      category: classifyEvent(event),
      distance,
      power: tracePoint.power,
      px: position.px,
      py: position.py,
    });
  }

  return markers;
}

export function drawEventMarkers(
  ctx: CanvasRenderingContext2D,
  markers: EventMarker[],
  canvasRect: CanvasRect,
  selectedIndex: number | null = null,
  hoveredIndex: number | null = null,
  style: Partial<MarkerStyle> = {},
): void {
  if (markers.length === 0) return;
  const plotRect = getPlotRect(canvasRect);
  const mergedStyle: MarkerStyle = {
    ...DEFAULT_MARKER_STYLE,
    ...style,
    colors: {
      ...DEFAULT_MARKER_STYLE.colors,
      ...(style.colors ?? {}),
    },
  };
  const dense = markers.length > 20;

  ctx.save();
  ctx.beginPath();
  ctx.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
  ctx.clip();

  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const isHovered = hoveredIndex === marker.index;
    const isPriority = isSelected || isHovered;
    const color = mergedStyle.colors[marker.category] ?? mergedStyle.colors.unknown;
    const radius = isSelected ? 8 : isHovered ? 7.5 : 7;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isPriority ? 2.4 : 1.6;

    ctx.globalAlpha = isPriority ? 1 : 0.86;
    ctx.setLineDash(isPriority ? [4, 3] : [2, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(marker.px) + 0.5, marker.py);
    ctx.lineTo(Math.round(marker.px) + 0.5, plotRect.bottom);
    ctx.strokeStyle = isPriority ? mergedStyle.selectedStemColor : mergedStyle.stemColor;
    ctx.lineWidth = isPriority ? 1.4 : 1;
    ctx.stroke();
    ctx.setLineDash([]);

    if (isSelected || isHovered) {
      const haloColor = isSelected ? mergedStyle.selectedHaloColor : mergedStyle.hoverHaloColor;
      const ringColor = isSelected ? mergedStyle.selectedRingColor : mergedStyle.hoverRingColor;
      ctx.beginPath();
      ctx.fillStyle = haloColor;
      ctx.arc(marker.px, marker.py, radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1.2;
      ctx.arc(marker.px, marker.py, radius + 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    }

    drawMarkerShape(ctx, marker.category, marker.px, marker.py, radius);
    if (marker.category === "end-of-fiber") {
      ctx.stroke();
    } else {
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  }

  ctx.restore();

  ctx.save();
  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const isHovered = hoveredIndex === marker.index;
    const isPriority = isSelected || isHovered;
    const shouldShowLabel = !dense || isPriority || marker.index % 2 === 0;
    if (!shouldShowLabel) continue;

    const label = `${marker.index + 1}`;
    ctx.font = isPriority ? "600 11px sans-serif" : "10px sans-serif";
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = isPriority ? mergedStyle.labelColor : mergedStyle.mutedLabelColor;
    ctx.fillText(label, marker.px - labelWidth / 2, marker.py - 12);
  }
  ctx.restore();
}

export function hitTestEventMarkers(markers: EventMarker[], px: number, py: number, hitRadius = 12): number | null {
  const radiusSq = hitRadius * hitRadius;
  for (const marker of markers) {
    const dx = marker.px - px;
    const dy = marker.py - py;
    if (dx * dx + dy * dy <= radiusSq) {
      return marker.index;
    }
  }

  return null;
}

export function formatEventTooltip(marker: EventMarker, unit: DistanceUnit): string {
  return [
    `Event #${marker.index + 1} — ${marker.category}`,
    `Distance: ${formatDistance(marker.distance, unit)}`,
    `Power: ${formatPower(marker.power, 2)}`,
    `Splice Loss: ${marker.event.spliceLoss} dB`,
    `Refl. Loss: ${marker.event.reflLoss} dB`,
  ].join("\n");
}
