/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSor } from "sor-reader";

import { TraceComparison } from "../src/components/TraceComparison.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return parseSor(bytes, name);
}

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
    const a = loadFixture("demo_ab.sor");
    const b = loadFixture("sample1310_lowDR.sor");

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
    const a = loadFixture("demo_ab.sor");
    const b = loadFixture("sample1310_lowDR.sor");

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
    const a = loadFixture("demo_ab.sor");
    const b = loadFixture("sample1310_lowDR.sor");

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
