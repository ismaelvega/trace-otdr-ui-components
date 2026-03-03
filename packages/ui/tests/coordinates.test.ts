import { describe, expect, it } from "vitest";

import {
  clampViewport,
  computeViewport,
  dataToPixel,
  getPlotRect,
  pixelToData,
  type CanvasRect,
} from "../src/canvas/coordinates.js";

const canvasRect: CanvasRect = { width: 800, height: 400 };

describe("coordinates", () => {
  it("roundtrips data -> pixel -> data", () => {
    const viewport = { xMin: 0, xMax: 100, yMin: -50, yMax: 0 };

    const pixel = dataToPixel(37.5, -12.5, viewport, canvasRect);
    const roundTrip = pixelToData(pixel.px, pixel.py, viewport, canvasRect);

    expect(roundTrip.dataX).toBeCloseTo(37.5, 10);
    expect(roundTrip.dataY).toBeCloseTo(-12.5, 10);
  });

  it("maps viewport edges to plotting bounds", () => {
    const viewport = { xMin: 5, xMax: 15, yMin: -40, yMax: -10 };
    const plot = getPlotRect(canvasRect);

    const topLeft = dataToPixel(viewport.xMin, viewport.yMax, viewport, canvasRect);
    const bottomRight = dataToPixel(viewport.xMax, viewport.yMin, viewport, canvasRect);

    expect(topLeft.px).toBeCloseTo(plot.left, 10);
    expect(topLeft.py).toBeCloseTo(plot.top, 10);
    expect(bottomRight.px).toBeCloseTo(plot.right, 10);
    expect(bottomRight.py).toBeCloseTo(plot.bottom, 10);
  });

  it("computes padded viewport from trace bounds", () => {
    const viewport = computeViewport(
      [
        { distance: 0, power: -40 },
        { distance: 10, power: -20 },
      ],
      0.1,
    );

    expect(viewport.xMin).toBeCloseTo(-1, 10);
    expect(viewport.xMax).toBeCloseTo(11, 10);
    expect(viewport.yMin).toBeCloseTo(-42, 10);
    expect(viewport.yMax).toBeCloseTo(-18, 10);
  });

  it("clamps viewport inside data bounds", () => {
    const bounds = { xMin: 0, xMax: 50, yMin: -60, yMax: 0 };
    const viewport = { xMin: 45, xMax: 65, yMin: -10, yMax: 10 };
    const clamped = clampViewport(viewport, bounds);

    expect(clamped).toEqual({
      xMin: 30,
      xMax: 50,
      yMin: -20,
      yMax: 0,
    });
  });
});
