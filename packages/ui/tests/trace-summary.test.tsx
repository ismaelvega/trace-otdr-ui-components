/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TraceSummary } from "../src/components/TraceSummary.js";
import { createMockSorData } from "./mock-sor-data.js";

describe("TraceSummary", () => {
  it("renders key summary metrics", () => {
    const result = createMockSorData();

    render(<TraceSummary result={result} />);

    expect(screen.getByText("Fiber Length")).toBeTruthy();
    expect(screen.getByText("Total Loss")).toBeTruthy();
    expect(screen.getByText("ORL")).toBeTruthy();
  });
});
