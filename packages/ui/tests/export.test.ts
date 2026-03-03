import { describe, expect, it } from "vitest";

import { buildTimestampedFilename, serializeEventsAsCsv, serializeEventsAsTsv } from "../src/utils/export.js";

describe("serializeEventsAsTsv", () => {
  it("serializes rows with tab delimiters and header row", () => {
    const tsv = serializeEventsAsTsv([
      {
        index: 3,
        distance: "8.448 km",
        type: "Loss",
        spliceLoss: "0.154 dB",
        reflLoss: "0.000 dB",
        slope: "0.198 dB/km",
        status: "Pass",
      },
    ]);

    expect(tsv).toBe(
      "#\tDistance\tType\tSplice Loss\tRefl. Loss\tSlope\tStatus\n3\t8.448 km\tLoss\t0.154 dB\t0.000 dB\t0.198 dB/km\tPass\n",
    );
  });
});

describe("serializeEventsAsCsv", () => {
  it("escapes quoted, comma-delimited and multiline cells", () => {
    const csv = serializeEventsAsCsv([
      {
        index: 1,
        distance: "0.000 km",
        type: "Loss, \"Launch\"\nSegment",
        spliceLoss: "1.025 dB",
        reflLoss: "-39.630 dB",
        slope: "0.000 dB/km",
        status: "Pass",
      },
    ]);

    expect(csv).toContain("\"Loss, \"\"Launch\"\"\nSegment\"");
  });
});

describe("buildTimestampedFilename", () => {
  it("sanitizes base names and appends a deterministic timestamp", () => {
    const file = buildTimestampedFilename(" demo trace@2026 ", ".csv", new Date(2026, 2, 3, 18, 4, 5));
    expect(file).toBe("demo-trace2026-20260303-180405.csv");
  });
});
