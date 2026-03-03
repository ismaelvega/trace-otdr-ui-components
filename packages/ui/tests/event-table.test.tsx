/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventTable } from "../src/components/EventTable.js";
import { createMockSorData } from "./mock-sor-data.js";

describe("EventTable", () => {
  it("supports sorting and row selection callbacks", () => {
    const result = createMockSorData();
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
