import { afterEach, describe, expect, it } from "vitest";

import { configureHiDpiCanvas, createCanvas } from "../src/canvas/canvas-manager.js";

type FakeCtx = {
  setTransform: (...args: number[]) => void;
};

class MockResizeObserver {
  public static lastInstance: MockResizeObserver | null = null;

  public readonly callback: ResizeObserverCallback;

  public observed: unknown = null;

  public disconnected = false;

  public constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.lastInstance = this;
  }

  public observe(target: unknown): void {
    this.observed = target;
  }

  public disconnect(): void {
    this.disconnected = true;
  }

  public emit(width: number, height: number): void {
    const entry = {
      contentRect: { width, height },
    } as ResizeObserverEntry;
    this.callback([entry], this as unknown as ResizeObserver);
  }
}

describe("canvas-manager", () => {
  const originalResizeObserver = globalThis.ResizeObserver;

  afterEach(() => {
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("applies HiDPI scaling math", () => {
    const calls: number[][] = [];
    const canvas = {
      width: 0,
      height: 0,
      style: { width: "", height: "" },
    } as unknown as HTMLCanvasElement;
    const ctx = {
      setTransform: (...args: number[]) => calls.push(args),
    } as FakeCtx as CanvasRenderingContext2D;

    const result = configureHiDpiCanvas(canvas, ctx, 320, 160, 2);

    expect(result).toEqual({
      dpr: 2,
      pixelWidth: 640,
      pixelHeight: 320,
    });
    expect(canvas.style.width).toBe("320px");
    expect(canvas.style.height).toBe("160px");
    expect(calls).toEqual([[2, 0, 0, 2, 0, 0]]);
  });

  it("subscribes to ResizeObserver and resizes canvas in auto mode", () => {
    globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

    const ctx = {
      setTransform: () => undefined,
    } as FakeCtx as CanvasRenderingContext2D;
    let parent: HTMLElement | null = null;

    const canvas = {
      width: 0,
      height: 0,
      style: { width: "", height: "" },
      getContext: () => ctx,
    } as unknown as HTMLCanvasElement;
    Object.defineProperty(canvas, "parentElement", {
      get: () => parent,
      configurable: true,
    });

    const documentStub = {
      createElement: () => canvas,
    } as unknown as Document;

    const container = {
      ownerDocument: documentStub,
      appendChild: (node: unknown) => {
        if (node === canvas) {
          parent = container as unknown as HTMLElement;
        }
      },
      removeChild: (node: unknown) => {
        if (node === canvas) {
          parent = null;
        }
      },
    } as unknown as HTMLElement;

    const handle = createCanvas(container, 300, 120, { autoResize: true });
    const observer = MockResizeObserver.lastInstance;

    expect(observer).not.toBeNull();
    observer?.emit(640, 360);

    expect(handle.canvas.style.width).toBe("640px");
    expect(handle.canvas.style.height).toBe("120px");

    handle.dispose();
    expect(observer?.disconnected).toBe(true);
  });
});
