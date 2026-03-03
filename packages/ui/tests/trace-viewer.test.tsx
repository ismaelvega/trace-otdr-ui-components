/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TraceViewer } from "../src/components/TraceViewer/TraceViewer.js";
import { createMockSorData } from "./mock-sor-data.js";

function createCanvasContextMock(): CanvasRenderingContext2D {
  return {
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    setLineDash: () => undefined,
    measureText: (text: string) => ({ width: text.length * 7 } as TextMetrics),
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
  } as unknown as CanvasRenderingContext2D;
}

describe("TraceViewer", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi
      .fn(() => createCanvasContextMock())
      .mockName("getContext") as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  });

  it("renders composed sections and supports event selection callback", () => {
    const result = createMockSorData();
    const onEventSelect = vi.fn();

    render(<TraceViewer result={result} onEventSelect={onEventSelect} />);

    expect(screen.getByText("Fiber Info")).toBeTruthy();
    expect(screen.getByText("Equipment")).toBeTruthy();

    const row = screen.getAllByRole("row")[1];
    if (!row) {
      throw new Error("Expected first data row");
    }
    fireEvent.click(row);

    expect(onEventSelect).toHaveBeenCalled();
  });
});
