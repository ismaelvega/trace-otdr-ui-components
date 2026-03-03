/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseSor } from "sor-reader";

import { normalizeSorResult } from "../src/adapters/normalize.js";
import { FiberInfoPanel } from "../src/components/info/FiberInfoPanel.js";
import { EquipmentInfoPanel } from "../src/components/info/EquipmentInfoPanel.js";
import { MeasurementInfoPanel } from "../src/components/info/MeasurementInfoPanel.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return normalizeSorResult(parseSor(bytes, name));
}

describe("Info panels", () => {
  it("render panel titles and key labels", () => {
    const data = loadFixture("sample1310_lowDR.sor");

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
