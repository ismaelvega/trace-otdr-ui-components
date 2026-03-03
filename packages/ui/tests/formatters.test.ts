import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatDistance,
  formatPower,
  formatSlope,
  formatWavelength,
} from "../src/utils/formatters.js";

describe("formatDistance", () => {
  it("formats km-based values into selected units", () => {
    expect(formatDistance(1.23456, "km")).toBe("1.235 km");
    expect(formatDistance(1.23456, "m")).toBe("1234.6 m");
    expect(formatDistance(1.23456, "mi", 2)).toBe("0.77 miles");
  });
});

describe("power and slope formatters", () => {
  it("formats power and slope and normalizes negative zero", () => {
    expect(formatPower(-0, 3)).toBe("0.000 dB");
    expect(formatSlope(-0, 2)).toBe("0.00 dB/km");
    expect(formatPower(-12.34567, 2)).toBe("-12.35 dB");
  });
});

describe("formatWavelength", () => {
  it("normalizes wavelength strings", () => {
    expect(formatWavelength("1550.0 nm")).toBe("1550 nm");
    expect(formatWavelength("1310.5 nm")).toBe("1310.5 nm");
    expect(formatWavelength(" 1625 nm ")).toBe("1625 nm");
    expect(formatWavelength("invalid")).toBe("invalid");
  });
});

describe("formatDateTime", () => {
  it("parses sor-reader datetime format using unix seconds", () => {
    const raw = "Tue Nov 22 08:49:23 2011 (1321951763 sec)";
    const expected = new Date(1321951763 * 1000).toLocaleString(undefined, { timeZone: "UTC" });
    expect(formatDateTime(raw)).toBe(expected);
  });

  it("falls back gracefully for unparseable strings", () => {
    expect(formatDateTime("not-a-date")).toBe("not-a-date");
  });
});
