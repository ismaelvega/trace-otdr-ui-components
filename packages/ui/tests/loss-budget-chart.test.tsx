/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseSor } from "sor-reader";

import { normalizeSorResult } from "../src/adapters/normalize.js";
import { LossBudgetChart } from "../src/components/LossBudgetChart.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return normalizeSorResult(parseSor(bytes, name));
}

describe("LossBudgetChart", () => {
  it("renders bars and emits click callback", () => {
    const data = loadFixture("demo_ab.sor");
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
    const data = loadFixture("demo_ab.sor");
    const { container } = render(<LossBudgetChart events={data.keyEvents.events} vertical />);
    const bar = container.querySelector('[class*="bar"]');
    expect(bar?.getAttribute("style")).toContain("height:");
  });
});
