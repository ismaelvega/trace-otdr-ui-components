import type { ViewportRange } from "../types/chart.js";
import type { CanvasRect } from "./coordinates.js";
import { clampViewport, getPlotRect, pixelToData } from "./coordinates.js";

export type ZoomAxis = "both" | "x" | "y";

export interface ZoomOptions {
  minSpanX?: number;
  minSpanY?: number;
}

export function getZoomAxisFromModifiers(modifiers: { shiftKey?: boolean; ctrlKey?: boolean }): ZoomAxis {
  if (modifiers.shiftKey) return "x";
  if (modifiers.ctrlKey) return "y";
  return "both";
}

function clampSpan(span: number, minSpan: number, maxSpan: number): number {
  if (maxSpan <= 0) return minSpan;
  return Math.min(maxSpan, Math.max(minSpan, span));
}

export function zoomViewportAtPixel(
  viewport: ViewportRange,
  dataBounds: ViewportRange,
  cursorPx: number,
  cursorPy: number,
  canvasRect: CanvasRect,
  zoomFactor: number,
  axis: ZoomAxis = "both",
  options: ZoomOptions = {},
): ViewportRange {
  const anchor = pixelToData(cursorPx, cursorPy, viewport, canvasRect);

  let next: ViewportRange = { ...viewport };
  const maxSpanX = Math.max(0, dataBounds.xMax - dataBounds.xMin);
  const maxSpanY = Math.max(0, dataBounds.yMax - dataBounds.yMin);
  const minSpanX = options.minSpanX ?? (maxSpanX / 10_000 || 0.001);
  const minSpanY = options.minSpanY ?? (maxSpanY / 10_000 || 0.001);

  if (axis === "both" || axis === "x") {
    const currentSpanX = Math.max(0, viewport.xMax - viewport.xMin);
    const clampedSpanX = clampSpan(currentSpanX / zoomFactor, minSpanX, maxSpanX);
    const ratioX = currentSpanX > 0 ? (anchor.dataX - viewport.xMin) / currentSpanX : 0.5;
    const xMin = anchor.dataX - ratioX * clampedSpanX;
    next = {
      ...next,
      xMin,
      xMax: xMin + clampedSpanX,
    };
  }

  if (axis === "both" || axis === "y") {
    const currentSpanY = Math.max(0, viewport.yMax - viewport.yMin);
    const clampedSpanY = clampSpan(currentSpanY / zoomFactor, minSpanY, maxSpanY);
    const ratioY = currentSpanY > 0 ? (anchor.dataY - viewport.yMin) / currentSpanY : 0.5;
    const yMin = anchor.dataY - ratioY * clampedSpanY;
    next = {
      ...next,
      yMin,
      yMax: yMin + clampedSpanY,
    };
  }

  return clampViewport(next, dataBounds);
}

export function panViewportByPixels(
  viewport: ViewportRange,
  dataBounds: ViewportRange,
  deltaPx: number,
  deltaPy: number,
  canvasRect: CanvasRect,
): ViewportRange {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = viewport.xMax - viewport.xMin;
  const ySpan = viewport.yMax - viewport.yMin;
  const xPerPixel = xSpan / plotRect.width;
  const yPerPixel = ySpan / plotRect.height;

  const next = {
    xMin: viewport.xMin - deltaPx * xPerPixel,
    xMax: viewport.xMax - deltaPx * xPerPixel,
    yMin: viewport.yMin + deltaPy * yPerPixel,
    yMax: viewport.yMax + deltaPy * yPerPixel,
  };

  return clampViewport(next, dataBounds);
}
