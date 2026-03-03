/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EventTable } from "../src/components/EventTable.js";
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

const mockResult = {
  filename: "demo.sor",
  format: 2 as const,
  version: "2.00",
  mapBlock: { nbytes: 0, nblocks: 0 },
  blocks: {},
  genParams: {
    language: "en",
    cableId: "c1",
    fiberId: "f1",
    wavelength: "1550 nm",
    locationA: "A",
    locationB: "B",
    cableCode: "",
    buildCondition: "",
    userOffset: "",
    operator: "",
    comments: "",
  },
  supParams: {
    supplier: "",
    otdr: "",
    otdrSerialNumber: "",
    module: "",
    moduleSerialNumber: "",
    software: "",
    other: "",
  },
  fxdParams: {
    dateTime: "",
    dateTimeRaw: 0,
    unit: "",
    wavelength: "",
    acquisitionOffset: 0,
    pulseWidthEntries: 0,
    pulseWidth: "",
    sampleSpacing: 0,
    numDataPoints: 0,
    indexOfRefraction: 0,
    backscatterCoeff: "",
    numAverages: 0,
    range: 0,
    resolution: 0,
    frontPanelOffset: 0,
    noiseFloorLevel: 0,
    noiseFloorScalingFactor: 0,
    powerOffsetFirstPoint: 0,
    lossThreshold: "",
    reflThreshold: "",
    eotThreshold: "",
  },
  keyEvents: {
    numEvents: 2,
    events,
    summary: {
      totalLoss: 1,
      orl: 40,
      lossStart: 0,
      lossEnd: 1,
      orlStart: 0,
      orlFinish: 1,
    },
  },
  dataPts: {
    numDataPoints: 0,
    numTraces: 0,
    scalingFactor: 0,
    maxBeforeOffset: 0,
    minBeforeOffset: 0,
  },
  checksum: {
    stored: 0,
    calculated: 0,
    valid: true,
  },
  trace: [],
};

describe("keyboard accessibility", () => {
  it("supports Enter/Escape on EventTable rows", () => {
    const onEventSelect = vi.fn();
    render(<EventTable result={mockResult} onEventSelect={onEventSelect} />);

    const row = screen.getAllByRole("row")[1];
    if (!row) {
      throw new Error("Expected first data row");
    }
    fireEvent.keyDown(row, { key: "Enter" });
    fireEvent.keyDown(row, { key: "Escape" });

    expect(onEventSelect).toHaveBeenCalled();
  });

  it("supports keyboard activation on FiberMap markers", () => {
    const onEventClick = vi.fn();
    render(<FiberMap events={events} onEventClick={onEventClick} />);

    const marker = screen.getByLabelText("Event 1");
    fireEvent.keyDown(marker, { key: "Enter" });

    expect(onEventClick).toHaveBeenCalled();
  });
});
