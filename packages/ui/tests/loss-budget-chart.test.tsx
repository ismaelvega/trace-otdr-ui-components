/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LossBudgetChart } from "../src/components/LossBudgetChart.js";
import { createMockSorData } from "./mock-sor-data.js";

describe("LossBudgetChart", () => {
  it("renders bars and emits click callback", () => {
    const data = createMockSorData();
    const onBarClick = vi.fn();

    render(<LossBudgetChart events={data.keyEvents.events} onBarClick={onBarClick} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
    const firstButton = buttons[0];
    if (!firstButton) {
      throw new Error("Expected at least one loss bar button");
    }
    fireEvent.click(firstButton);

    expect(onBarClick).toHaveBeenCalled();
  });

  it("supports vertical mode bar sizing", () => {
    const data = createMockSorData();
    const { container } = render(<LossBudgetChart events={data.keyEvents.events} vertical />);
    const bar = container.querySelector('[class*="bar"]');
    expect(bar?.getAttribute("style")).toContain("height:");
  });
});
