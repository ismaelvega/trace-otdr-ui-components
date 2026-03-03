/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FiberInfoPanel } from "../src/components/info/FiberInfoPanel.js";
import { EquipmentInfoPanel } from "../src/components/info/EquipmentInfoPanel.js";
import { MeasurementInfoPanel } from "../src/components/info/MeasurementInfoPanel.js";
import { createMockSorDataVariant } from "./mock-sor-data.js";

describe("Info panels", () => {
  it("render panel titles and key labels", () => {
    const data = createMockSorDataVariant();

    render(
      <>
        <FiberInfoPanel genParams={data.genParams} />
        <EquipmentInfoPanel supParams={data.supParams} />
        <MeasurementInfoPanel fxdParams={data.fxdParams} />
      </>,
    );

    expect(screen.getByText("Fiber Info")).toBeTruthy();
    expect(screen.getByText("Equipment")).toBeTruthy();
    expect(screen.getByText("Measurement")).toBeTruthy();
  });
});
