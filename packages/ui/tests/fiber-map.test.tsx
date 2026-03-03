/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FiberMap } from "../src/components/FiberMap.js";

const events = [
  {
    type: "1F9999LS {auto} reflection",
    distance: "1.000",
    slope: "0.0",
    spliceLoss: "0.1",
    reflLoss: "-45",
    comments: "",
  },
  {
    type: "0F9999LS {auto} loss/drop/gain",
    distance: "3.000",
    slope: "0.0",
    spliceLoss: "0.2",
    reflLoss: "-50",
    comments: "",
  },
];

describe("FiberMap", () => {
  it("renders event labels and emits clicks", () => {
    const onEventClick = vi.fn();
    const { container } = render(<FiberMap events={events} onEventClick={onEventClick} />);

    expect(screen.getByText("#1")).toBeTruthy();
    expect(screen.getByText("#2")).toBeTruthy();

    const groups = container.querySelectorAll("g");
    const firstGroup = groups[0];
    if (!firstGroup) {
      throw new Error("Expected at least one map marker group");
    }
    fireEvent.click(firstGroup);

    expect(onEventClick).toHaveBeenCalled();
  });
});
