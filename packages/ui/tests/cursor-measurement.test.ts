import { describe, expect, it } from "vitest";

import type { MeasurementCursors } from "../src/types/chart.js";
import { computeCursorMeasurement } from "../src/utils/cursor-measurement.js";

const trace = [
  { distance: 0, power: 40 },
  { distance: 5, power: 38 },
  { distance: 10, power: 36 },
  { distance: 15, power: 35 },
];

const events = [
  {
    type: "1F9999LS {auto} reflection",
    distance: "2.000",
    slope: "0.100",
    spliceLoss: "0.120",
    reflLoss: "-45.000",
    comments: "",
  },
  {
    type: "0F9999LS {auto} loss/drop/gain",
    distance: "6.000",
    slope: "0.140",
    spliceLoss: "0.210",
    reflLoss: "0.000",
    comments: "",
  },
  {
    type: "1F9999LE {auto} reflection",
    distance: "12.000",
    slope: "0.100",
    spliceLoss: "0.090",
    reflLoss: "-55.000",
    comments: "",
  },
];

describe("computeCursorMeasurement", () => {
  it("returns null when not enough cursors are set", () => {
    const cursors: MeasurementCursors = {
      a: { distance: 5, power: 38, traceIndex: 1 },
      b: null,
    };

    expect(computeCursorMeasurement(trace, events, cursors)).toBeNull();
  });

  it("computes interval deltas and event stats", () => {
    const measurement = computeCursorMeasurement(trace, events, {
      a: { distance: 3, power: 39, traceIndex: 1 },
      b: { distance: 13, power: 35.4, traceIndex: 3 },
    });

    expect(measurement).not.toBeNull();
    if (!measurement) return;

    expect(measurement.deltaDistance).toBeCloseTo(10, 10);
    expect(measurement.deltaPower).toBeCloseTo(-3.6, 10);
    expect(measurement.avgAttenuationDbPerKm).toBeCloseTo(-0.36, 10);
    expect(measurement.eventCountBetween).toBe(2);
    expect(measurement.reflectiveEventCountBetween).toBe(1);
    expect(measurement.spliceLossSumBetween).toBeCloseTo(0.3, 10);
  });

  it("normalizes out-of-order cursors and handles zero span", () => {
    const reversed = computeCursorMeasurement(trace, events, {
      a: { distance: 10, power: 36, traceIndex: 2 },
      b: { distance: 4, power: 38.5, traceIndex: 1 },
    });

    expect(reversed).not.toBeNull();
    if (!reversed) return;

    expect(reversed.start.distance).toBe(4);
    expect(reversed.end.distance).toBe(10);

    const zeroSpan = computeCursorMeasurement(trace, events, {
      a: { distance: 10, power: 36, traceIndex: 2 },
      b: { distance: 10, power: 36, traceIndex: 2 },
    });

    expect(zeroSpan).not.toBeNull();
    expect(zeroSpan?.avgAttenuationDbPerKm).toBeNull();
  });
});
