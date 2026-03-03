/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SorDropZone } from "../src/components/SorDropZone.js";

function loadFile(name: string): File {
  const bytes = readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name));
  return new File([bytes], name, { type: "application/octet-stream" });
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
