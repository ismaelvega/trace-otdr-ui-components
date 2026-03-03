import { describe, expect, it } from "vitest";

import { normalizeSorResult } from "../src/adapters/normalize.js";
import { computeLossBudget } from "../src/utils/loss-budget.js";
import { createMockSorData, createMockSorDataVariant } from "./mock-sor-data.js";

describe("computeLossBudget", () => {
  it("computes loss budget metrics using deterministic sample data", () => {
    const normalized = normalizeSorResult(createMockSorData());
    const budget = computeLossBudget(normalized.keyEvents);

    expect(budget.eventCount).toBe(5);
    expect(budget.totalSpliceLoss).toBeCloseTo(1.46, 6);
    expect(budget.totalReflLoss).toBeCloseTo(-52.75, 6);
    expect(budget.avgSpliceLoss).toBeCloseTo(0.292, 6);
    expect(budget.maxSpliceLoss).toBeCloseTo(1.025, 6);
    expect(budget.spanLengths).toHaveLength(4);
    expect(budget.spanLengths[0]).toBeCloseTo(2.953, 6);
    expect(budget.spanLengths[1]).toBeCloseTo(5.495, 6);
    expect(budget.spanLengths[2]).toBeCloseTo(56.671, 6);
    expect(budget.spanLengths[3]).toBeCloseTo(6.695, 6);
  });

  it("computes span lengths from second deterministic sample", () => {
    const normalized = normalizeSorResult(createMockSorDataVariant());
    const budget = computeLossBudget(normalized.keyEvents);

    expect(budget.eventCount).toBe(3);
    expect(budget.totalSpliceLoss).toBeCloseTo(1.6, 6);
    expect(budget.spanLengths).toHaveLength(2);
    expect(budget.spanLengths[0]).toBeCloseTo(2.02, 6);
    expect(budget.spanLengths[1]).toBeCloseTo(15.045, 6);
  });
});
