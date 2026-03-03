import { describe, expect, it } from "vitest";

import type { TracePoint } from "sor-reader";
import { drawTrace } from "../src/canvas/trace-renderer.js";

function buildTrace(points: number): TracePoint[] {
  const trace: TracePoint[] = [];
  for (let i = 0; i < points; i += 1) {
    trace.push({ distance: i / 10, power: -30 + Math.sin(i / 20) });
  }
  return trace;
}

type DrawSpy = {
  moveToCount: number;
  lineToCount: number;
  strokeCount: number;
};

function createContextSpy(): { ctx: CanvasRenderingContext2D; spy: DrawSpy } {
  const spy: DrawSpy = {
    moveToCount: 0,
    lineToCount: 0,
    strokeCount: 0,
  };

  const ctx = {
    save: () => undefined,
    restore: () => undefined,
    beginPath: () => undefined,
    moveTo: () => {
      spy.moveToCount += 1;
    },
    lineTo: () => {
      spy.lineToCount += 1;
    },
    stroke: () => {
      spy.strokeCount += 1;
    },
    strokeStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;

  return { ctx, spy };
}

describe("drawTrace", () => {
  it("draws a single path for small traces", () => {
    const trace = buildTrace(20);
    const { ctx, spy } = createContextSpy();

    drawTrace(ctx, trace, { xMin: 0, xMax: 2, yMin: -32, yMax: -28 }, { width: 600, height: 300 }, { color: "#000" });

    expect(spy.moveToCount).toBe(1);
    expect(spy.lineToCount).toBeGreaterThan(1);
    expect(spy.strokeCount).toBe(1);
  });

  it("downsamples when visible points exceed pixel width", () => {
    const trace = buildTrace(10_000);
    const { ctx, spy } = createContextSpy();

    drawTrace(
      ctx,
      trace,
      { xMin: 0, xMax: 200, yMin: -35, yMax: -25 },
      { width: 300, height: 240 },
      { color: "#0f766e" },
    );

    // 300px chart width should produce roughly <= 300 lines after LTTB.
    expect(spy.lineToCount).toBeLessThanOrEqual(320);
    expect(spy.strokeCount).toBe(1);
  });
});
