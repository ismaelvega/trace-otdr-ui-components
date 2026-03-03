/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TraceMeasurementPanel } from "../src/components/TraceMeasurementPanel.js";

describe("TraceMeasurementPanel", () => {
  it("renders empty hint and disabled actions without cursors", () => {
    render(
      <TraceMeasurementPanel
        cursors={{ a: null, b: null }}
        measurement={null}
        onClear={() => undefined}
        onSwap={() => undefined}
      />,
    );

    expect(screen.getByText(/place Cursor A/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Swap A/B" }).getAttribute("disabled")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Clear" }).getAttribute("disabled")).not.toBeNull();
  });

  it("renders interval metrics and actions", () => {
    const onSwap = vi.fn();
    const onClear = vi.fn();

    render(
      <TraceMeasurementPanel
        cursors={{
          a: { distance: 2, power: 40, traceIndex: 10 },
          b: { distance: 8, power: 37, traceIndex: 30 },
        }}
        measurement={{
          a: { distance: 2, power: 40, traceIndex: 10 },
          b: { distance: 8, power: 37, traceIndex: 30 },
          start: { distance: 2, power: 40, traceIndex: 10 },
          end: { distance: 8, power: 37, traceIndex: 30 },
          distanceA: 2,
          distanceB: 8,
          deltaDistance: 6,
          powerA: 40,
          powerB: 37,
          deltaPower: -3,
          avgAttenuationDbPerKm: -0.5,
          eventCountBetween: 3,
          reflectiveEventCountBetween: 1,
          spliceLossSumBetween: 0.42,
        }}
        onClear={onClear}
        onSwap={onSwap}
      />,
    );

    expect(screen.getByText("Cursor A")).toBeTruthy();
    expect(screen.getByText("Cursor B")).toBeTruthy();
    expect(screen.getByText("Interval Stats")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Swap A/B" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    expect(onSwap).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalled();
  });
});
