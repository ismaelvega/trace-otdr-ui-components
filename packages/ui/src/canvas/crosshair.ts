import type { TracePoint } from "sor-reader";

import type { ViewportRange } from "../types/chart.js";
import type { DistanceUnit } from "../types/units.js";
import { formatDistance, formatPower } from "../utils/formatters.js";
import { dataToPixel, getPlotRect, pixelToData, type CanvasRect } from "./coordinates.js";

export interface CrosshairState {
  point: TracePoint;
  index: number;
  px: number;
  py: number;
  label: string;
}

export function findNearestTracePointIndex(trace: TracePoint[], distanceKm: number): number {
  if (trace.length === 0) return -1;

  let low = 0;
  let high = trace.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const point = trace[mid];
    if (!point) return -1;

    if (point.distance < distanceKm) {
      low = mid + 1;
    } else if (point.distance > distanceKm) {
      high = mid - 1;
    } else {
      return mid;
    }
  }

  const rightIndex = Math.min(trace.length - 1, low);
  const leftIndex = Math.max(0, rightIndex - 1);
  const left = trace[leftIndex];
  const right = trace[rightIndex];
  if (!left || !right) return -1;

  return Math.abs(left.distance - distanceKm) <= Math.abs(right.distance - distanceKm) ? leftIndex : rightIndex;
}

export function resolveCrosshairState(
  trace: TracePoint[],
  pointerPx: number,
  pointerPy: number,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  unit: DistanceUnit,
): CrosshairState | null {
  if (trace.length === 0) return null;

  const data = pixelToData(pointerPx, pointerPy, viewport, canvasRect);
  const index = findNearestTracePointIndex(trace, data.dataX);
  if (index < 0) return null;

  const point = trace[index];
  if (!point) return null;

  const position = dataToPixel(point.distance, point.power, viewport, canvasRect);
  return {
    point,
    index,
    px: position.px,
    py: position.py,
    label: `${formatDistance(point.distance, unit)}, ${formatPower(point.power, 2)}`,
  };
}

export function drawCrosshair(
  ctx: CanvasRenderingContext2D,
  state: CrosshairState,
  canvasRect: CanvasRect,
  style: {
    lineColor?: string;
    textColor?: string;
    labelBackground?: string;
    labelBorder?: string;
  } = {},
): void {
  const plotRect = getPlotRect(canvasRect);
  const lineColor = style.lineColor ?? "#64748b";
  const textColor = style.textColor ?? "#0f172a";
  const labelBackground = style.labelBackground ?? "rgba(248, 250, 252, 0.92)";
  const labelBorder = style.labelBorder ?? "rgba(15, 23, 42, 0.15)";

  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(Math.round(state.px) + 0.5, plotRect.top);
  ctx.lineTo(Math.round(state.px) + 0.5, plotRect.bottom);
  ctx.moveTo(plotRect.left, Math.round(state.py) + 0.5);
  ctx.lineTo(plotRect.right, Math.round(state.py) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);

  const paddingX = 8;
  const paddingY = 5;
  ctx.font = "12px sans-serif";
  const labelWidth = ctx.measureText(state.label).width;
  const labelHeight = 20;

  const desiredX = state.px + 10;
  const desiredY = state.py - 30;
  const x = Math.min(Math.max(plotRect.left, desiredX), plotRect.right - labelWidth - paddingX * 2);
  const y = Math.min(Math.max(plotRect.top, desiredY), plotRect.bottom - labelHeight);

  ctx.fillStyle = labelBackground;
  ctx.fillRect(x, y, labelWidth + paddingX * 2, labelHeight);
  ctx.strokeStyle = labelBorder;
  ctx.strokeRect(x, y, labelWidth + paddingX * 2, labelHeight);
  ctx.fillStyle = textColor;
  ctx.fillText(state.label, x + paddingX, y + labelHeight - paddingY);
  ctx.restore();
}
