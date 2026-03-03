import type { DistanceUnit } from "../types/units.js";
import type { ViewportRange } from "../types/chart.js";
import { formatDistance, formatPower } from "../utils/formatters.js";
import { dataToPixel, getPlotRect, type CanvasRect } from "./coordinates.js";

interface AxisStyle {
  axisColor?: string;
  gridColor?: string;
  labelColor?: string;
  font?: string;
}

const DEFAULT_AXIS_STYLE: Required<AxisStyle> = {
  axisColor: "#334155",
  gridColor: "#cbd5e1",
  labelColor: "#0f172a",
  font: "12px sans-serif",
};

function niceStep(range: number, targetTickCount = 8): number {
  if (!Number.isFinite(range) || range <= 0) return 1;

  const rawStep = range / Math.max(1, targetTickCount);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;

  let snapped = 1;
  if (normalized > 1) snapped = 2;
  if (normalized > 2) snapped = 5;
  if (normalized > 5) snapped = 10;

  return snapped * magnitude;
}

function buildTicks(min: number, max: number, targetTickCount = 8): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];

  const step = niceStep(max - min, targetTickCount);
  const ticks: number[] = [];
  const start = Math.ceil(min / step) * step;

  for (let value = start; value <= max + step * 0.5; value += step) {
    ticks.push(Number(value.toFixed(12)));
  }

  return ticks;
}

function drawVerticalGridLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  gridColor: string,
): void {
  const alignedX = Math.round(x) + 0.5;
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(alignedX, top);
  ctx.lineTo(alignedX, bottom);
  ctx.stroke();
  ctx.restore();
}

function drawHorizontalGridLine(
  ctx: CanvasRenderingContext2D,
  y: number,
  left: number,
  right: number,
  gridColor: string,
): void {
  const alignedY = Math.round(y) + 0.5;
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(left, alignedY);
  ctx.lineTo(right, alignedY);
  ctx.stroke();
  ctx.restore();
}

function getDistancePrecision(stepKm: number): number {
  if (stepKm >= 10) return 1;
  if (stepKm >= 1) return 2;
  return 3;
}

export function drawXAxis(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  unit: DistanceUnit,
  style: AxisStyle = {},
): void {
  const mergedStyle = { ...DEFAULT_AXIS_STYLE, ...style };
  const plotRect = getPlotRect(canvasRect);
  const ticks = buildTicks(viewport.xMin, viewport.xMax);
  const firstTick = ticks[0];
  const secondTick = ticks[1];
  const tickStep =
    firstTick !== undefined && secondTick !== undefined ? secondTick - firstTick : viewport.xMax - viewport.xMin;
  const precision = getDistancePrecision(Math.abs(tickStep));

  ctx.save();
  ctx.font = mergedStyle.font;
  ctx.fillStyle = mergedStyle.labelColor;
  ctx.strokeStyle = mergedStyle.axisColor;

  const axisY = Math.round(plotRect.bottom) + 0.5;
  ctx.beginPath();
  ctx.moveTo(plotRect.left, axisY);
  ctx.lineTo(plotRect.right, axisY);
  ctx.stroke();

  for (const tick of ticks) {
    const { px } = dataToPixel(tick, viewport.yMin, viewport, canvasRect);
    const axisX = Math.round(px) + 0.5;

    drawVerticalGridLine(ctx, axisX, plotRect.top, plotRect.bottom, mergedStyle.gridColor);

    ctx.beginPath();
    ctx.moveTo(axisX, axisY);
    ctx.lineTo(axisX, axisY + 6);
    ctx.stroke();

    const label = formatDistance(tick, unit, precision);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, axisX - labelWidth / 2, plotRect.bottom + 20);
  }

  const title = `Distance (${unit})`;
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, plotRect.left + plotRect.width / 2 - titleWidth / 2, plotRect.bottom + 40);
  ctx.restore();
}

export function drawYAxis(
  ctx: CanvasRenderingContext2D,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  style: AxisStyle = {},
): void {
  const mergedStyle = { ...DEFAULT_AXIS_STYLE, ...style };
  const plotRect = getPlotRect(canvasRect);
  const ticks = buildTicks(viewport.yMin, viewport.yMax);

  ctx.save();
  ctx.font = mergedStyle.font;
  ctx.fillStyle = mergedStyle.labelColor;
  ctx.strokeStyle = mergedStyle.axisColor;

  const axisX = Math.round(plotRect.left) + 0.5;
  ctx.beginPath();
  ctx.moveTo(axisX, plotRect.top);
  ctx.lineTo(axisX, plotRect.bottom);
  ctx.stroke();

  for (const tick of ticks) {
    const { py } = dataToPixel(viewport.xMin, tick, viewport, canvasRect);
    const axisY = Math.round(py) + 0.5;

    drawHorizontalGridLine(ctx, axisY, plotRect.left, plotRect.right, mergedStyle.gridColor);

    ctx.beginPath();
    ctx.moveTo(axisX - 6, axisY);
    ctx.lineTo(axisX, axisY);
    ctx.stroke();

    const label = formatPower(tick, 2);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, plotRect.left - labelWidth - 10, axisY + 4);
  }

  ctx.translate(16, plotRect.top + plotRect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = "Power (dB)";
  ctx.fillText(title, 0, 0);
  ctx.restore();
}
