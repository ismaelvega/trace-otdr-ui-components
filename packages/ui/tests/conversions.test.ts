import { describe, expect, it } from "vitest";

import { convertDistance, convertDistanceLabel } from "../src/utils/conversions.js";
import { DISTANCE_CONVERSION_FACTORS, type DistanceUnit } from "../src/types/units.js";

function toKm(value: number, unit: DistanceUnit): number {
  return value / DISTANCE_CONVERSION_FACTORS[unit];
}

describe("convertDistance", () => {
  it("converts across all supported units and roundtrips", () => {
    const km = 42.195;

    const units: DistanceUnit[] = ["km", "m", "mi", "kft"];
    for (const unit of units) {
      const converted = convertDistance(km, unit);
      const roundTrip = toKm(converted, unit);
      expect(roundTrip).toBeCloseTo(km, 10);
    }
  });

  it("handles edge values", () => {
    expect(convertDistance(0, "km")).toBe(0);
    expect(convertDistance(-2.5, "m")).toBe(-2500);
    expect(convertDistance(1_000_000, "kft")).toBeCloseTo(3_280_839.895013123, 6);
  });
});

describe("convertDistanceLabel", () => {
  it("returns labels for all units", () => {
    expect(convertDistanceLabel("km")).toBe("km");
    expect(convertDistanceLabel("m")).toBe("m");
    expect(convertDistanceLabel("mi")).toBe("miles");
    expect(convertDistanceLabel("kft")).toBe("kft");
  });
});
