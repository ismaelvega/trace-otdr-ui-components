/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseSor } from "sor-reader";

import { EventTable } from "../src/components/EventTable.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return parseSor(bytes, name);
}

describe("EventTable", () => {
  it("supports sorting and row selection callbacks", () => {
    const result = loadFixture("demo_ab.sor");
    const onEventSelect = vi.fn();

    render(<EventTable result={result} onEventSelect={onEventSelect} />);

    fireEvent.click(screen.getByText("Distance"));
    fireEvent.click(screen.getByText("Distance"));

    const firstDataCell = screen.getAllByRole("cell")[0];
    if (!firstDataCell) {
      throw new Error("Expected at least one table cell");
    }
    fireEvent.click(firstDataCell);

    expect(onEventSelect).toHaveBeenCalled();
  });
});
