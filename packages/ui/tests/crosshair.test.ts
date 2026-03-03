import { describe, expect, it } from "vitest";

import { findNearestTracePointIndex, resolveCrosshairState } from "../src/canvas/crosshair.js";

const trace = [
  { distance: 0, power: -40 },
  { distance: 10, power: -35 },
  { distance: 20, power: -30 },
  { distance: 30, power: -28 },
];

describe("crosshair", () => {
  it("finds nearest point by distance with binary search", () => {
    expect(findNearestTracePointIndex(trace, 0)).toBe(0);
    expect(findNearestTracePointIndex(trace, 12)).toBe(1);
    expect(findNearestTracePointIndex(trace, 26)).toBe(3);
  });

  it("resolves a crosshair state with formatted label", () => {
    const state = resolveCrosshairState(
      trace,
      300,
      100,
      { xMin: 0, xMax: 30, yMin: -45, yMax: -20 },
      { width: 800, height: 400 },
      "km",
    );

    expect(state).not.toBeNull();
    expect(state?.label).toContain("km");
    expect(state?.label).toContain("dB");
  });
});
