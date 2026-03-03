import type { TracePoint } from "sor-reader";

import type { ViewportRange } from "../types/chart.js";

export interface CanvasRect {
  width: number;
  height: number;
}

export interface PlotRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export const MARGIN = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 70,
} as const;

const DEFAULT_VIEWPORT: ViewportRange = {
  xMin: 0,
  xMax: 1,
  yMin: -1,
  yMax: 1,
};

function safeSpan(min: number, max: number): number {
  const span = max - min;
  return span === 0 ? 1 : span;
}

export function getPlotRect(canvasRect: CanvasRect): PlotRect {
  const width = Math.max(1, canvasRect.width - MARGIN.left - MARGIN.right);
  const height = Math.max(1, canvasRect.height - MARGIN.top - MARGIN.bottom);

  return {
    left: MARGIN.left,
    top: MARGIN.top,
    right: MARGIN.left + width,
    bottom: MARGIN.top + height,
    width,
    height,
  };
}

export function dataToPixel(
  dataX: number,
  dataY: number,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
): { px: number; py: number } {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = safeSpan(viewport.xMin, viewport.xMax);
  const ySpan = safeSpan(viewport.yMin, viewport.yMax);

  const xNorm = (dataX - viewport.xMin) / xSpan;
  const yNorm = (viewport.yMax - dataY) / ySpan;

  return {
    px: plotRect.left + xNorm * plotRect.width,
    py: plotRect.top + yNorm * plotRect.height,
  };
}

export function pixelToData(
  px: number,
  py: number,
  viewport: ViewportRange,
  canvasRect: CanvasRect,
): { dataX: number; dataY: number } {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = safeSpan(viewport.xMin, viewport.xMax);
  const ySpan = safeSpan(viewport.yMin, viewport.yMax);

  const xNorm = (px - plotRect.left) / plotRect.width;
  const yNorm = (py - plotRect.top) / plotRect.height;

  return {
    dataX: viewport.xMin + xNorm * xSpan,
    dataY: viewport.yMax - yNorm * ySpan,
  };
}

function computeBounds(trace: TracePoint[]): ViewportRange {
  if (trace.length === 0) {
    return DEFAULT_VIEWPORT;
  }

  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  for (const point of trace) {
    if (point.distance < xMin) xMin = point.distance;
    if (point.distance > xMax) xMax = point.distance;
    if (point.power < yMin) yMin = point.power;
    if (point.power > yMax) yMax = point.power;
  }

  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return DEFAULT_VIEWPORT;
  }

  if (xMin === xMax) {
    xMin -= 0.5;
    xMax += 0.5;
  }

  if (yMin === yMax) {
    yMin -= 0.5;
    yMax += 0.5;
  }

  return { xMin, xMax, yMin, yMax };
}

export function computeViewport(trace: TracePoint[], padding = 0.05): ViewportRange {
  const bounds = computeBounds(trace);
  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const xPad = xSpan * Math.max(0, padding);
  const yPad = ySpan * Math.max(0, padding);

  return {
    xMin: bounds.xMin - xPad,
    xMax: bounds.xMax + xPad,
    yMin: bounds.yMin - yPad,
    yMax: bounds.yMax + yPad,
  };
}

function clampAxis(viewMin: number, viewMax: number, boundMin: number, boundMax: number): { min: number; max: number } {
  if (boundMax <= boundMin) {
    return { min: boundMin, max: boundMax };
  }

  const boundsSpan = boundMax - boundMin;
  const desiredSpan = Math.max(0, viewMax - viewMin);
  const span = Math.min(boundsSpan, desiredSpan);

  if (span <= 0 || span >= boundsSpan) {
    return { min: boundMin, max: boundMax };
  }

  const min = Math.min(Math.max(viewMin, boundMin), boundMax - span);
  return { min, max: min + span };
}

export function clampViewport(viewport: ViewportRange, dataBounds: ViewportRange): ViewportRange {
  const x = clampAxis(viewport.xMin, viewport.xMax, dataBounds.xMin, dataBounds.xMax);
  const y = clampAxis(viewport.yMin, viewport.yMax, dataBounds.yMin, dataBounds.yMax);

  return {
    xMin: x.min,
    xMax: x.max,
    yMin: y.min,
    yMax: y.max,
  };
}
