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
  it("shows event number only on hover and emits clicks", () => {
    const onEventClick = vi.fn();
    render(<FiberMap events={events} onEventClick={onEventClick} />);

    expect(screen.queryByText("#1")).toBeNull();
    const marker = screen.getByLabelText("Event 1");
    fireEvent.mouseEnter(marker);
    expect(screen.getByText("#1")).toBeTruthy();
    fireEvent.mouseLeave(marker);
    expect(screen.queryByText("#1")).toBeNull();

    fireEvent.click(marker);

    expect(onEventClick).toHaveBeenCalled();
  });

  it("supports wheel zoom in and out", () => {
    render(<FiberMap events={events} />);

    const fiberMap = screen.getByLabelText("Fiber map");
    const beforeMarker = screen.getByLabelText("Event 1");
    const beforeCircle = beforeMarker.querySelector("circle");
    const beforeX = Number.parseFloat(beforeCircle?.getAttribute("cx") ?? "0");

    fireEvent.wheel(fiberMap, { deltaY: -120 });

    const zoomedMarker = screen.getByLabelText("Event 1");
    const zoomedCircle = zoomedMarker.querySelector("circle");
    const zoomedX = Number.parseFloat(zoomedCircle?.getAttribute("cx") ?? "0");
    expect(zoomedX).not.toBe(beforeX);

    fireEvent.wheel(fiberMap, { deltaY: 120 });

    const resetMarker = screen.getByLabelText("Event 1");
    const resetCircle = resetMarker.querySelector("circle");
    const resetX = Number.parseFloat(resetCircle?.getAttribute("cx") ?? "0");
    expect(resetX).toBeCloseTo(beforeX, 2);
  });
});
