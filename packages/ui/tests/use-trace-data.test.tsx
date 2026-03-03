/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTraceData } from "../src/hooks/useTraceData.js";

function loadBytes(name: string): Uint8Array {
  return new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
}

describe("useTraceData", () => {
  it("parses bytes source and returns result", async () => {
    const bytes = loadBytes("demo_ab.sor");

    const { result } = renderHook(() => useTraceData(bytes));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.result).not.toBeNull();
    });

    expect(result.current.error).toBeNull();
  });
});
