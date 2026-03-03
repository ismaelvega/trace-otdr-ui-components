/** @vitest-environment jsdom */

import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TraceChart } from "../src/components/TraceChart.js";

type CanvasContextMock = {
  setTransform: () => void;
  clearRect: () => void;
  beginPath: () => void;
  moveTo: () => void;
  lineTo: () => void;
  stroke: () => void;
  setLineDash: () => void;
  measureText: (text: string) => { width: number };
  fillText: () => void;
  fillRect: () => void;
  strokeRect: () => void;
  rect: () => void;
  clip: () => void;
  save: () => void;
  restore: () => void;
  translate: () => void;
  rotate: () => void;
  arc: () => void;
  closePath: () => void;
  fill: () => void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  globalAlpha: number;
  font: string;
};

function createCanvasContextMock(): CanvasContextMock {
  return {
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    setLineDash: () => undefined,
    measureText: (text: string) => ({ width: text.length * 7 }),
    fillText: () => undefined,
    fillRect: () => undefined,
    strokeRect: () => undefined,
    rect: () => undefined,
    clip: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    rotate: () => undefined,
    arc: () => undefined,
    closePath: () => undefined,
    fill: () => undefined,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "12px sans-serif",
  };
}

describe("TraceChart", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalSetPointerCapture = HTMLCanvasElement.prototype.setPointerCapture;
  const originalReleasePointerCapture = HTMLCanvasElement.prototype.releasePointerCapture;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi
      .fn(() => createCanvasContextMock() as unknown as CanvasRenderingContext2D)
      .mockName("getContext") as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.setPointerCapture = originalSetPointerCapture;
    HTMLCanvasElement.prototype.releasePointerCapture = originalReleasePointerCapture;
  });

  it("mounts a canvas without console errors and handles keyboard controls", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const trace = Array.from({ length: 64 }, (_, index) => ({
      distance: index * 0.1,
      power: -35 + Math.sin(index / 6),
    }));
    const events = [
      {
        type: "1F9999LS {auto} reflection",
        distance: "1.200",
        slope: "0.100",
        spliceLoss: "0.250",
        reflLoss: "-45.000",
        comments: "",
      },
    ];

    const { container, unmount } = render(<TraceChart trace={trace} events={events} width={640} height={300} />);
    const canvas = container.querySelector("canvas");
    const chart = container.querySelector('[role="img"]');
    if (!chart) {
      throw new Error("Chart root not found");
    }

    expect(canvas).not.toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    fireEvent.keyDown(chart, { key: "+" });
    fireEvent.keyDown(chart, { key: "Home" });

    unmount();
    consoleErrorSpy.mockRestore();
  });
});
