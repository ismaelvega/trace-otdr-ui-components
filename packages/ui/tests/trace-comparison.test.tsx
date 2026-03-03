/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TraceComparison } from "../src/components/TraceComparison.js";
import { createMockSorData, createMockSorDataVariant } from "./mock-sor-data.js";

describe("TraceComparison", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi
      .fn(() => ({
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
      }))
      .mockName("getContext") as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  });

  it("renders legend in overlay mode", () => {
    const a = createMockSorData();
    const b = createMockSorDataVariant();

    render(
      <TraceComparison
        mode="overlay"
        traces={[
          { label: "A", result: a },
          { label: "B", result: b },
        ]}
      />,
    );

    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
  });

  it("renders side-by-side charts with syncZoom enabled", () => {
    const a = createMockSorData();
    const b = createMockSorDataVariant();

    const { container } = render(
      <TraceComparison
        mode="side-by-side"
        syncZoom
        traces={[
          { label: "A", result: a },
          { label: "B", result: b },
        ]}
      />,
    );

    expect(container.querySelectorAll('[role="img"]').length).toBe(2);
  });

  it("renders difference mode", () => {
    const a = createMockSorData();
    const b = createMockSorDataVariant();

    const { container } = render(
      <TraceComparison
        mode="difference"
        traces={[
          { label: "A", result: a },
          { label: "B", result: b },
        ]}
      />,
    );

    expect(container.querySelector('[role="img"]')).toBeTruthy();
  });
});
