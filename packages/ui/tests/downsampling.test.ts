import { describe, expect, it } from "vitest";

import type { TracePoint } from "sor-reader";
import { lttb } from "../src/utils/downsampling.js";

function buildWave(count: number): TracePoint[] {
  const data: TracePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const spike = i === Math.floor(count / 2) ? 20 : 0;
    data.push({ distance: i, power: Math.sin(i / 8) * 4 + spike });
  }
  return data;
}

describe("lttb", () => {
  it("returns the original array when point count is already below target", () => {
    const data = buildWave(10);
    const out = lttb(data, 10);
    expect(out).toBe(data);
  });

  it("downsamples to the requested count and keeps endpoints", () => {
    const data = buildWave(1000);
    const out = lttb(data, 200);

    expect(out).toHaveLength(200);
    expect(out[0]).toEqual(data[0]);
    expect(out[out.length - 1]).toEqual(data[data.length - 1]);
  });

  it("preserves major peaks/valleys for visual fidelity", () => {
    const data = buildWave(500);
    const out = lttb(data, 50);

    const maxInOriginal = data.reduce((max, point) => Math.max(max, point.power), Number.NEGATIVE_INFINITY);
    const maxInOutput = out.reduce((max, point) => Math.max(max, point.power), Number.NEGATIVE_INFINITY);

    expect(maxInOutput).toBeCloseTo(maxInOriginal, 10);
  });
});
