/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EventTable } from "../src/components/EventTable.js";
import { createMockSorData } from "./mock-sor-data.js";

describe("EventTable", () => {
  const originalClipboard = navigator.clipboard;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    URL.createObjectURL = vi.fn(() => "blob:event-table");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    vi.restoreAllMocks();
  });

  it("supports sorting and row selection callbacks", () => {
    const result = createMockSorData();
    const onEventSelect = vi.fn();

    render(<EventTable result={result} onEventSelect={onEventSelect} />);

    fireEvent.click(screen.getByText("Distance"));
    fireEvent.click(screen.getByText("Distance"));

    const firstDataCell = screen.getAllByRole("cell")[0];
    if (!firstDataCell) {
      throw new Error("Expected at least one table cell");
    }
    fireEvent.click(firstDataCell);

    expect(onEventSelect).toHaveBeenCalled();
  });

  it("copies sorted table rows as TSV", async () => {
    const result = createMockSorData();
    const clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: clipboardWriteText },
    });

    render(<EventTable result={result} showExportActions />);

    fireEvent.click(screen.getByRole("button", { name: "Distance" }));
    fireEvent.click(screen.getByRole("button", { name: "Distance" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy Table" }));

    await waitFor(() => expect(clipboardWriteText).toHaveBeenCalledTimes(1));
    const copied = clipboardWriteText.mock.calls[0]?.[0] as string;
    const rows = copied.trim().split("\n");
    expect(rows[0]).toBe("#\tDistance\tType\tSplice Loss\tRefl. Loss\tSlope\tStatus");
    expect(rows[1]).toContain("5\t71.814 km\tEnd of Fiber");
  });

  it("downloads table rows as CSV", () => {
    const appendSpy = vi.spyOn(document.body, "append");

    render(<EventTable result={createMockSorData()} showExportActions exportFileBaseName="demo-trace-events" />);

    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    const appended = appendSpy.mock.calls.at(-1)?.[0];
    expect(appended).toBeInstanceOf(HTMLAnchorElement);
    const anchor = appended as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^demo-trace-events-\d{8}-\d{6}\.csv$/u);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:event-table");
  });
});
