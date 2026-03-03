/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SorDropZone } from "../src/components/SorDropZone.js";

vi.mock("sor-reader/browser", async () => {
  const helpers = await import("./mock-sor-data.js");
  return {
    parseSor: vi.fn(() => helpers.createMockSorResultRawV1()),
  };
});

function loadFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3, 4])], name, { type: "application/octet-stream" });
}

describe("SorDropZone", () => {
  it("parses dropped files and emits onResult", async () => {
    const onResult = vi.fn();
    render(<SorDropZone onResult={onResult} />);

    const zone = screen.getByText("Drop .sor file here or click to select").closest("label");
    if (!zone) {
      throw new Error("Drop zone not found");
    }

    const file = loadFile("demo_ab.sor");
    fireEvent.drop(zone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(onResult).toHaveBeenCalled();
    });
  });
});
