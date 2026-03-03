/** @vitest-environment jsdom */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TraceChart } from "../src/components/TraceChart.js";

type CanvasContextMock = {
  setTransform: () => void;
  clearRect: () => void;
  beginPath: () => void;
  moveTo: () => void;
  lineTo: () => void;
  stroke: () => void;
  setLineDash: () => void;
  measureText: (text: string) => { width: number };
  fillText: () => void;
  fillRect: () => void;
  strokeRect: () => void;
  rect: () => void;
  clip: () => void;
  save: () => void;
  restore: () => void;
  translate: () => void;
  rotate: () => void;
  arc: () => void;
  closePath: () => void;
  fill: () => void;
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  globalAlpha: number;
  font: string;
};

function createCanvasContextMock(): CanvasContextMock {
  return {
    setTransform: () => undefined,
    clearRect: () => undefined,
    beginPath: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
    setLineDash: () => undefined,
    measureText: (text: string) => ({ width: text.length * 7 }),
    fillText: () => undefined,
    fillRect: () => undefined,
    strokeRect: () => undefined,
    rect: () => undefined,
    clip: () => undefined,
    save: () => undefined,
    restore: () => undefined,
    translate: () => undefined,
    rotate: () => undefined,
    arc: () => undefined,
    closePath: () => undefined,
    fill: () => undefined,
    strokeStyle: "",
    fillStyle: "",
    lineWidth: 1,
    globalAlpha: 1,
    font: "12px sans-serif",
  };
}

class ClipboardItemMock {
  readonly data: Record<string, Blob>;

  constructor(data: Record<string, Blob>) {
    this.data = data;
  }
}

describe("TraceChart", () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  const originalSetPointerCapture = HTMLCanvasElement.prototype.setPointerCapture;
  const originalReleasePointerCapture = HTMLCanvasElement.prototype.releasePointerCapture;
  const originalToBlob = HTMLCanvasElement.prototype.toBlob;
  const originalClipboard = navigator.clipboard;
  const originalClipboardItem = globalThis.ClipboardItem;
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalAnchorClick = HTMLAnchorElement.prototype.click;

  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi
      .fn(() => createCanvasContextMock() as unknown as CanvasRenderingContext2D)
      .mockName("getContext") as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
    HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
    HTMLCanvasElement.prototype.toBlob = vi
      .fn((callback: BlobCallback, type?: string) => {
        callback(new Blob(["trace-chart"], { type: type ?? "image/png" }));
      })
      .mockName("toBlob") as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: vi.fn().mockResolvedValue(undefined),
      },
    });

    Object.defineProperty(globalThis, "ClipboardItem", {
      configurable: true,
      writable: true,
      value: ClipboardItemMock,
    });

    URL.createObjectURL = vi.fn(() => "blob:trace-chart");
    URL.revokeObjectURL = vi.fn();
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    HTMLCanvasElement.prototype.setPointerCapture = originalSetPointerCapture;
    HTMLCanvasElement.prototype.releasePointerCapture = originalReleasePointerCapture;
    HTMLCanvasElement.prototype.toBlob = originalToBlob;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });
    Object.defineProperty(globalThis, "ClipboardItem", {
      configurable: true,
      writable: true,
      value: originalClipboardItem,
    });
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    HTMLAnchorElement.prototype.click = originalAnchorClick;
    vi.restoreAllMocks();
  });

  it("mounts a canvas without console errors and handles keyboard controls", () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const trace = Array.from({ length: 64 }, (_, index) => ({
      distance: index * 0.1,
      power: -35 + Math.sin(index / 6),
    }));
    const events = [
      {
        type: "1F9999LS {auto} reflection",
        distance: "1.200",
        slope: "0.100",
        spliceLoss: "0.250",
        reflLoss: "-45.000",
        comments: "",
      },
    ];

    const { container, unmount } = render(<TraceChart trace={trace} events={events} width={640} height={300} />);
    const canvas = container.querySelector("canvas");
    const chart = container.querySelector('[role="img"]');
    if (!chart) {
      throw new Error("Chart root not found");
    }

    expect(canvas).not.toBeNull();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    fireEvent.keyDown(chart, { key: "ArrowLeft" });
    fireEvent.keyDown(chart, { key: "+" });
    fireEvent.keyDown(chart, { key: "Home" });

    unmount();
    consoleErrorSpy.mockRestore();
  });

  it("places dual measurement cursors on successive clicks", () => {
    const onMeasurementCursorsChange = vi.fn();
    const trace = Array.from({ length: 80 }, (_, index) => ({
      distance: index * 0.2,
      power: 40 - index * 0.05,
    }));

    const { container } = render(
      <TraceChart
        trace={trace}
        events={[]}
        width={640}
        height={300}
        onMeasurementCursorsChange={onMeasurementCursorsChange}
      />,
    );

    const canvas = container.querySelector("canvas");
    if (!canvas) {
      throw new Error("Expected canvas element");
    }

    fireEvent.click(canvas, { offsetX: 140, offsetY: 120 });
    fireEvent.click(canvas, { offsetX: 320, offsetY: 130 });

    const calls = onMeasurementCursorsChange.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);

    const last = calls[calls.length - 1]?.[0] as { a: unknown; b: unknown } | undefined;
    expect(last?.a).not.toBeNull();
    expect(last?.b).not.toBeNull();
  });

  it("copies chart image to clipboard as PNG", async () => {
    const clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        write: clipboardWrite,
      },
    });

    const trace = Array.from({ length: 32 }, (_, index) => ({
      distance: index * 0.15,
      power: 35 - index * 0.08,
    }));

    render(<TraceChart trace={trace} events={[]} width={640} height={280} showExportActions />);

    fireEvent.click(screen.getByRole("button", { name: "Copy Chart" }));

    await waitFor(() => expect(clipboardWrite).toHaveBeenCalledTimes(1));
    const payload = clipboardWrite.mock.calls[0]?.[0] as unknown[];
    expect(Array.isArray(payload)).toBe(true);
    expect(payload).toHaveLength(1);
  });

  it("downloads chart image as PNG", async () => {
    const appendSpy = vi.spyOn(document.body, "append");
    const trace = Array.from({ length: 24 }, (_, index) => ({
      distance: index * 0.2,
      power: 33 - index * 0.1,
    }));

    render(
      <TraceChart trace={trace} events={[]} width={640} height={280} showExportActions exportFileBaseName="demo-trace-chart" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Download PNG" }));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    const appended = appendSpy.mock.calls.at(-1)?.[0];
    expect(appended).toBeInstanceOf(HTMLAnchorElement);
    const anchor = appended as HTMLAnchorElement;
    expect(anchor.download).toMatch(/^demo-trace-chart-\d{8}-\d{6}\.png$/u);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:trace-chart");
  });
});
