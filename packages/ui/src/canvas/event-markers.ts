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

const MARKER_COLORS: Record<EventCategory, string> = {
  reflection: "#b91c1c",
  loss: "#0f766e",
  connector: "#1d4ed8",
  "end-of-fiber": "#111827",
  manual: "#a16207",
  unknown: "#6b7280",
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
): void {
  if (markers.length === 0) return;
  const plotRect = getPlotRect(canvasRect);

  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const color = MARKER_COLORS[marker.category] ?? MARKER_COLORS.unknown;
    const radius = 8;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    if (isSelected) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
    }

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(marker.px) + 0.5, marker.py);
    ctx.lineTo(Math.round(marker.px) + 0.5, plotRect.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    drawMarkerShape(ctx, marker.category, marker.px, marker.py, radius);
    if (marker.category === "end-of-fiber") {
      ctx.stroke();
    } else {
      ctx.fill();
      ctx.stroke();
    }

    const label = `${marker.index + 1}`;
    ctx.font = "11px sans-serif";
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#111827";
    ctx.fillText(label, marker.px - labelWidth / 2, marker.py - 12);
    ctx.restore();
  }
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
