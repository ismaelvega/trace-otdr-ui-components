import type { TracePoint } from "sor-reader";

import type { TraceOverlay, ViewportRange } from "../types/chart.js";
import type { DistanceUnit } from "../types/units.js";
import type { CrosshairState } from "./crosshair.js";
import type { CanvasRect } from "./coordinates.js";
import { drawCrosshair } from "./crosshair.js";
import { drawXAxis, drawYAxis } from "./axes.js";
import { drawTraceOverlays } from "./trace-renderer.js";

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  canvasRect: CanvasRect;
  viewport: ViewportRange;
  overlays: TraceOverlay[];
  unit: DistanceUnit;
  hoverPoint?: TracePoint | null;
  crosshair?: CrosshairState | null;
  clearColor?: string;
  drawEventMarkers?: () => void;
  drawCrosshair?: () => void;
  axisStyle?: {
    axisColor?: string;
    gridColor?: string;
    labelColor?: string;
    font?: string;
  };
  crosshairStyle?: {
    lineColor?: string;
    textColor?: string;
    labelBackground?: string;
    labelBorder?: string;
  };
}

export interface RenderScheduler {
  scheduleRender: () => void;
  markDirty: () => void;
  isDirty: () => boolean;
  cancel: () => void;
}

function clearCanvas(ctx: CanvasRenderingContext2D, canvasRect: CanvasRect, color?: string): void {
  if (color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);
    ctx.restore();
    return;
  }

  ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);
}

export function renderFrame(context: RenderContext): void {
  clearCanvas(context.ctx, context.canvasRect, context.clearColor);
  drawTraceOverlays(context.ctx, context.overlays, context.viewport, context.canvasRect);
  context.drawEventMarkers?.();
  drawXAxis(context.ctx, context.viewport, context.canvasRect, context.unit, context.axisStyle);
  drawYAxis(context.ctx, context.viewport, context.canvasRect, context.axisStyle);
  if (context.crosshair) {
    drawCrosshair(context.ctx, context.crosshair, context.canvasRect, context.crosshairStyle);
  }
  context.drawCrosshair?.();
}

function requestFrame(callback: () => void): number {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(() => callback());
  }

  return setTimeout(callback, 16) as unknown as number;
}

function cancelFrame(frameId: number): void {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(frameId);
    return;
  }

  clearTimeout(frameId as unknown as ReturnType<typeof setTimeout>);
}

export function createRenderScheduler(render: () => void): RenderScheduler {
  let frameId: number | null = null;
  let dirty = false;

  const flush = (): void => {
    frameId = null;
    if (!dirty) return;
    dirty = false;
    render();
  };

  const markDirty = (): void => {
    dirty = true;
  };

  const scheduleRender = (): void => {
    markDirty();
    if (frameId !== null) return;
    frameId = requestFrame(flush);
  };

  const cancel = (): void => {
    if (frameId === null) return;
    cancelFrame(frameId);
    frameId = null;
  };

  return {
    scheduleRender,
    markDirty,
    isDirty: () => dirty,
    cancel,
  };
}
