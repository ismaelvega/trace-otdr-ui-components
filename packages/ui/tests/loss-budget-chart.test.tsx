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

    const buttons = screen.getAllByRole("button", { name: /Event \d+/u });
    expect(buttons.length).toBeGreaterThan(0);
    const firstButton = buttons[0];
    if (!firstButton) {
      throw new Error("Expected at least one loss bar button");
    }
    fireEvent.click(firstButton);

    expect(onBarClick).toHaveBeenCalled();
  });

  it("supports sorting loss bars by splice loss", () => {
    const data = createMockSorData();

    render(<LossBudgetChart events={data.keyEvents.events} />);

    fireEvent.click(screen.getByRole("button", { name: /Splice/u }));
    fireEvent.click(screen.getByRole("button", { name: /Splice/u }));

    const barButtons = screen.getAllByRole("button", { name: /Event \d+/u });
    const firstBar = barButtons[0];
    if (!firstBar) {
      throw new Error("Expected bars to be rendered");
    }
    expect(firstBar.getAttribute("aria-label") ?? "").toContain("Event 1");
  });

  it("supports vertical mode bar sizing", () => {
    const data = createMockSorData();
    const { container } = render(<LossBudgetChart events={data.keyEvents.events} vertical />);
    const hasHeightStyle = Array.from(container.querySelectorAll("span")).some((node) =>
      (node.getAttribute("style") ?? "").includes("height:"),
    );
    expect(hasHeightStyle).toBe(true);
  });
});
