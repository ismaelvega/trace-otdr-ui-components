import type { MeasurementCursors } from "../types/chart.js";
import { dataToPixel, getPlotRect, type CanvasRect } from "./coordinates.js";
import type { ViewportRange } from "../types/chart.js";

export type MeasurementCursorKey = "a" | "b";

interface CursorPoint {
  key: MeasurementCursorKey;
  px: number;
  py: number;
}

interface MeasurementCursorStyle {
  cursorAColor: string;
  cursorBColor: string;
  cursorSpanColor: string;
  labelBackground: string;
  labelTextColor: string;
  labelBorder: string;
}

const DEFAULT_STYLE: MeasurementCursorStyle = {
  cursorAColor: "#7c3aed",
  cursorBColor: "#ea580c",
  cursorSpanColor: "rgba(124, 58, 237, 0.12)",
  labelBackground: "rgba(248, 250, 252, 0.94)",
  labelTextColor: "#0f172a",
  labelBorder: "rgba(15, 23, 42, 0.2)",
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function toCursorPoints(
  cursors: MeasurementCursors,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
): CursorPoint[] {
  const points: CursorPoint[] = [];
  if (cursors.a) {
    const position = dataToPixel(cursors.a.distance, cursors.a.power, viewport, canvasRect);
    points.push({ key: "a", px: position.px, py: position.py });
  }

  if (cursors.b) {
    const position = dataToPixel(cursors.b.distance, cursors.b.power, viewport, canvasRect);
    points.push({ key: "b", px: position.px, py: position.py });
  }

  return points;
}

export function hitTestMeasurementCursors(
  cursors: MeasurementCursors,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  px: number,
  py: number,
  radius = 12,
): MeasurementCursorKey | null {
  const points = toCursorPoints(cursors, viewport, canvasRect);
  if (points.length === 0) return null;

  const radiusSq = radius * radius;
  let nearest: { key: MeasurementCursorKey; distanceSq: number } | null = null;

  for (const point of points) {
    const dx = point.px - px;
    const dy = point.py - py;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > radiusSq) continue;

    if (!nearest || distanceSq < nearest.distanceSq) {
      nearest = { key: point.key, distanceSq };
    }
  }

  return nearest?.key ?? null;
}

function drawCursor(
  ctx: CanvasRenderingContext2D,
  point: CursorPoint,
  plotRect: ReturnType<typeof getPlotRect>,
  color: string,
  style: MeasurementCursorStyle,
): void {
  const x = Math.round(point.px) + 0.5;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, plotRect.top);
  ctx.lineTo(x, plotRect.bottom);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.24;
  ctx.arc(point.px, point.py, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(point.px, point.py, 5.5, 0, Math.PI * 2);
  ctx.fill();

  const label = point.key.toUpperCase();
  ctx.font = "700 11px sans-serif";
  const labelWidth = ctx.measureText(label).width + 12;
  const labelHeight = 18;
  const baselineOffset = point.key === "a" ? 7 : 29;
  const labelX = clamp(point.px - labelWidth / 2, plotRect.left + 4, plotRect.right - labelWidth - 4);
  const labelY = plotRect.top + baselineOffset;

  ctx.fillStyle = style.labelBackground;
  ctx.strokeStyle = style.labelBorder;
  ctx.lineWidth = 1;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

  ctx.fillStyle = style.labelTextColor;
  ctx.fillText(label, labelX + (labelWidth - ctx.measureText(label).width) / 2, labelY + 12.5);
  ctx.restore();
}

export function drawMeasurementCursors(
  ctx: CanvasRenderingContext2D,
  cursors: MeasurementCursors,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
  style: Partial<MeasurementCursorStyle> = {},
): void {
  const points = toCursorPoints(cursors, viewport, canvasRect);
  if (points.length === 0) return;

  const plotRect = getPlotRect(canvasRect);
  const mergedStyle: MeasurementCursorStyle = {
    ...DEFAULT_STYLE,
    ...style,
  };

  const pointA = points.find((point) => point.key === "a");
  const pointB = points.find((point) => point.key === "b");

  if (pointA && pointB) {
    const left = Math.min(pointA.px, pointB.px);
    const width = Math.abs(pointA.px - pointB.px);
    ctx.save();
    ctx.fillStyle = mergedStyle.cursorSpanColor;
    ctx.fillRect(left, plotRect.top, width, plotRect.height);
    ctx.restore();
  }

  for (const point of points) {
    drawCursor(
      ctx,
      point,
      plotRect,
      point.key === "a" ? mergedStyle.cursorAColor : mergedStyle.cursorBColor,
      mergedStyle,
    );
  }
}
