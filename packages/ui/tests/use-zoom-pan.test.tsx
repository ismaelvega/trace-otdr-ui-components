/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { RefObject } from "react";

import { useZoomPan } from "../src/hooks/useZoomPan.js";

const bounds = { xMin: 0, xMax: 100, yMin: -60, yMax: 0 };

describe("useZoomPan", () => {
  it("initializes from bounds and supports zoom/reset/clamped set", () => {
    const canvasRef = { current: null as HTMLCanvasElement | null } as unknown as RefObject<HTMLCanvasElement>;
    const { result } = renderHook(() =>
      useZoomPan(canvasRef, bounds),
    );

    expect(result.current.viewport).toEqual(bounds);

    act(() => {
      result.current.zoomTo([20, 40], [-50, -10]);
    });
    expect(result.current.viewport).toEqual({
      xMin: 20,
      xMax: 40,
      yMin: -50,
      yMax: -10,
    });

    act(() => {
      result.current.setViewport({ xMin: -10, xMax: 120, yMin: -80, yMax: 20 });
    });
    expect(result.current.viewport).toEqual(bounds);

    act(() => {
      result.current.resetViewport();
    });
    expect(result.current.viewport).toEqual(bounds);
  });
});
