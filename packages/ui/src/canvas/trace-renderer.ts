import type { TracePoint } from "sor-reader";

import type { TraceOverlay, ViewportRange } from "../types/chart.js";
import { lttb } from "../utils/downsampling.js";
import { dataToPixel, getPlotRect, type CanvasRect } from "./coordinates.js";

export interface TraceStyle {
  color: string;
  lineWidth?: number;
  opacity?: number;
}

const DEFAULT_TRACE_STYLE: Required<TraceStyle> = {
  color: "#0f766e",
  lineWidth: 1.5,
  opacity: 1,
};

function findLowerBoundIndex(trace: TracePoint[], distance: number): number {
  let low = 0;
  let high = trace.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const point = trace[mid];
    if (!point || point.distance < distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

function selectVisibleTrace(trace: TracePoint[], viewport: ViewportRange): TracePoint[] {
  if (trace.length === 0) return [];

  const startIndex = Math.max(0, findLowerBoundIndex(trace, viewport.xMin) - 1);
  const selected: TracePoint[] = [];

  for (let i = startIndex; i < trace.length; i += 1) {
    const point = trace[i];
    if (!point) continue;
    selected.push(point);
    if (point.distance > viewport.xMax) break;
  }

  if (selected.length === 0) {
    const nearest = trace[Math.min(trace.length - 1, startIndex)];
    return nearest ? [nearest] : [];
  }

  return selected;
}

function resolveRenderableTrace(trace: TracePoint[], viewport: ViewportRange, canvasRect: CanvasRect): TracePoint[] {
  const visible = selectVisibleTrace(trace, viewport);
  if (visible.length <= 2) return visible;

  const plotRect = getPlotRect(canvasRect);
  const targetCount = Math.max(2, Math.ceil(plotRect.width));

  if (visible.length <= targetCount) return visible;
  return lttb(visible, targetCount);
}

export function drawTrace(
  ctx: CanvasRenderingContext2D,
  trace: TracePoint[],
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  style: TraceStyle,
): void {
  const renderTrace = resolveRenderableTrace(trace, viewport, canvasRect);
  if (renderTrace.length === 0) return;

  const mergedStyle = { ...DEFAULT_TRACE_STYLE, ...style };

  ctx.save();
  ctx.strokeStyle = mergedStyle.color;
  ctx.lineWidth = mergedStyle.lineWidth;
  ctx.globalAlpha = mergedStyle.opacity;
  ctx.beginPath();

  let started = false;
  for (const point of renderTrace) {
    const { px, py } = dataToPixel(point.distance, point.power, viewport, canvasRect);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  if (started) {
    ctx.stroke();
  }
  ctx.restore();
}

export function drawTraceOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: TraceOverlay[],
  viewport: ViewportRange,
  canvasRect: CanvasRect,
): void {
  for (const overlay of overlays) {
    drawTrace(ctx, overlay.trace, viewport, canvasRect, {
      color: overlay.color,
    });
  }
}
