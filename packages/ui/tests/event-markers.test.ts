import { describe, expect, it } from "vitest";

import {
  computeEventMarkers,
  formatEventTooltip,
  hitTestEventMarkers,
} from "../src/canvas/event-markers.js";

const events = [
  {
    type: "1F9999LS {auto} reflection",
    distance: "10.000",
    slope: "0.000",
    spliceLoss: "0.200",
    reflLoss: "-45.000",
    comments: "",
  },
  {
    type: "0F9999LS {auto} loss/drop/gain",
    distance: "20.000",
    slope: "0.100",
    spliceLoss: "0.300",
    reflLoss: "-50.000",
    comments: "",
  },
];

const trace = [
  { distance: 0, power: -40 },
  { distance: 10, power: -35 },
  { distance: 20, power: -32 },
  { distance: 30, power: -30 },
];

describe("event markers", () => {
  it("computes marker positions and categories", () => {
    const markers = computeEventMarkers(
      events,
      trace,
      { xMin: 0, xMax: 30, yMin: -45, yMax: -25 },
      { width: 800, height: 400 },
    );

    expect(markers).toHaveLength(2);
    expect(markers[0]?.category).toBe("reflection");
    expect(markers[1]?.category).toBe("loss");
  });

  it("supports hit testing and tooltip formatting", () => {
    const markers = computeEventMarkers(
      events,
      trace,
      { xMin: 0, xMax: 30, yMin: -45, yMax: -25 },
      { width: 800, height: 400 },
    );
    const marker = markers[0];
    expect(marker).toBeDefined();
    if (!marker) return;

    const hit = hitTestEventMarkers(markers, marker.px, marker.py);
    expect(hit).toBe(0);

    const tooltip = formatEventTooltip(marker, "km");
    expect(tooltip).toContain("Event #1");
    expect(tooltip).toContain("Distance:");
  });
});
