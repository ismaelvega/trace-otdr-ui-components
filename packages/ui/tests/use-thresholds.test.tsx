/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useThresholds } from "../src/hooks/useThresholds.js";

describe("useThresholds", () => {
  it("supports defaults, updates and reset", () => {
    const { result } = renderHook(() => useThresholds());

    expect(result.current.thresholds.event.spliceLoss?.warn).toBe(0.3);

    act(() => {
      result.current.updateThresholds({ event: { spliceLoss: { warn: 0.4, fail: 0.6 } } });
    });

    expect(result.current.thresholds.event.spliceLoss?.warn).toBe(0.4);

    act(() => {
      result.current.resetThresholds();
    });

    expect(result.current.thresholds.event.spliceLoss?.warn).toBe(0.3);
  });
});
