/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseSor } from "sor-reader";

import { TraceSummary } from "../src/components/TraceSummary.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return parseSor(bytes, name);
}

describe("TraceSummary", () => {
  it("renders key summary metrics", () => {
    const result = loadFixture("demo_ab.sor");

    render(<TraceSummary result={result} />);

    expect(screen.getByText("Fiber Length")).toBeTruthy();
    expect(screen.getByText("Total Loss")).toBeTruthy();
    expect(screen.getByText("ORL")).toBeTruthy();
  });
});
