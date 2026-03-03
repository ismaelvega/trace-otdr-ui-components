/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSor } from "sor-reader";

import { TraceReport } from "../src/components/TraceReport/TraceReport.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return parseSor(bytes, name);
}

describe("TraceReport", () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi
      .fn(() => ({
        fillStyle: "",
        fillRect: () => undefined,
        setTransform: () => undefined,
        beginPath: () => undefined,
        moveTo: () => undefined,
        lineTo: () => undefined,
        stroke: () => undefined,
        save: () => undefined,
        restore: () => undefined,
      }))
      .mockName("getContext") as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["x"], { type: "image/png" }));
    });
  });

  it("renders report sections", () => {
    const result = loadFixture("demo_ab.sor");

    render(<TraceReport result={result} companyName="Acme Fiber" />);

    expect(screen.getByText("Acme Fiber")).toBeTruthy();
    expect(screen.getByText("Fiber Info")).toBeTruthy();
    expect(screen.getByText("Equipment")).toBeTruthy();
    expect(screen.getByText("Event Table")).toBeTruthy();
  });
});
