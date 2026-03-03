/** @vitest-environment jsdom */

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTraceData } from "../src/hooks/useTraceData.js";

vi.mock("sor-reader/browser", () => ({
  parseSor: vi.fn(() => ({ filename: "demo_ab.sor" })),
}));

describe("useTraceData", () => {
  it("parses bytes source and returns result", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4]);

    const { result } = renderHook(() => useTraceData(bytes));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.result?.filename).toBe("demo_ab.sor");
  });
});
