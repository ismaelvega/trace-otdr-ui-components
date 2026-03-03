import { describe, expect, it } from "vitest";

import {
  getZoomAxisFromModifiers,
  panViewportByPixels,
  zoomViewportAtPixel,
} from "../src/canvas/interactions.js";

const dataBounds = { xMin: 0, xMax: 100, yMin: -60, yMax: 0 };
const viewport = { xMin: 0, xMax: 100, yMin: -60, yMax: 0 };
const rect = { width: 800, height: 400 };

describe("interactions", () => {
  it("resolves axis mode from keyboard modifiers", () => {
    expect(getZoomAxisFromModifiers({})).toBe("both");
    expect(getZoomAxisFromModifiers({ shiftKey: true })).toBe("x");
    expect(getZoomAxisFromModifiers({ ctrlKey: true })).toBe("y");
  });

  it("zooms toward cursor and clamps at bounds", () => {
    const zoomed = zoomViewportAtPixel(viewport, dataBounds, 400, 200, rect, 1.15);
    expect(zoomed.xMax - zoomed.xMin).toBeLessThan(100);
    expect(zoomed.yMax - zoomed.yMin).toBeLessThan(60);

    const clamped = zoomViewportAtPixel(viewport, dataBounds, 0, 0, rect, 0.2);
    expect(clamped).toEqual(dataBounds);
  });

  it("pans viewport by pixel deltas", () => {
    const current = { xMin: 20, xMax: 60, yMin: -45, yMax: -5 };
    const next = panViewportByPixels(current, dataBounds, 50, -20, rect);

    expect(next.xMin).toBeLessThan(current.xMin);
    expect(next.xMax).toBeLessThan(current.xMax);
    expect(next.yMin).toBeLessThan(current.yMin);
    expect(next.yMax).toBeLessThan(current.yMax);
  });
});
