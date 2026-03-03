import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { parseSor } from "sor-reader";
import { normalizeSorResult } from "../src/adapters/normalize.js";
import { computeLossBudget } from "../src/utils/loss-budget.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(
    readFileSync(new URL(`../../../sor-reader/tests/fixtures/${name}`, import.meta.url)),
  );
  return parseSor(bytes, name);
}

describe("computeLossBudget", () => {
  it("computes loss budget metrics using demo_ab fixture", () => {
    const normalized = normalizeSorResult(loadFixture("demo_ab.sor"));
    const budget = computeLossBudget(normalized.keyEvents);

    expect(budget.eventCount).toBe(5);
    expect(budget.totalSpliceLoss).toBeCloseTo(13.677, 6);
    expect(budget.totalReflLoss).toBeCloseTo(-118.24, 6);
    expect(budget.avgSpliceLoss).toBeCloseTo(2.7354, 6);
    expect(budget.maxSpliceLoss).toBeCloseTo(13.232, 6);
    expect(budget.spanLengths).toHaveLength(4);
    expect(budget.spanLengths[0]).toBeCloseTo(12.711, 6);
    expect(budget.spanLengths[1]).toBeCloseTo(12.64, 6);
    expect(budget.spanLengths[2]).toBeCloseTo(12.696, 6);
    expect(budget.spanLengths[3]).toBeCloseTo(12.681, 6);
  });

  it("computes span lengths from another real fixture", () => {
    const normalized = normalizeSorResult(loadFixture("sample1310_lowDR.sor"));
    const budget = computeLossBudget(normalized.keyEvents);

    expect(budget.eventCount).toBe(3);
    expect(budget.totalSpliceLoss).toBeCloseTo(23.377, 6);
    expect(budget.spanLengths).toHaveLength(2);
    expect(budget.spanLengths[0]).toBeCloseTo(2.02, 6);
    expect(budget.spanLengths[1]).toBeCloseTo(15.045, 6);
  });
});
