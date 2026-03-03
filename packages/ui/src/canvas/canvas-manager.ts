export interface CanvasHandle {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

export interface CreateCanvasOptions {
  autoResize?: boolean;
}

function resolveDocument(container: HTMLElement): Document {
  if (container.ownerDocument) {
    return container.ownerDocument;
  }

  if (typeof document !== "undefined") {
    return document;
  }

  throw new Error("No document available to create canvas");
}

export function getDevicePixelRatio(): number {
  if (typeof window === "undefined") return 1;
  const ratio = window.devicePixelRatio;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return ratio;
}

export function configureHiDpiCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr = getDevicePixelRatio(),
): { dpr: number; pixelWidth: number; pixelHeight: number } {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;

  canvas.width = Math.round(safeWidth * safeDpr);
  canvas.height = Math.round(safeHeight * safeDpr);
  canvas.style.width = `${safeWidth}px`;
  canvas.style.height = `${safeHeight}px`;
  ctx.setTransform(safeDpr, 0, 0, safeDpr, 0, 0);

  return {
    dpr: safeDpr,
    pixelWidth: canvas.width,
    pixelHeight: canvas.height,
  };
}

export function createCanvas(
  container: HTMLElement,
  width: number,
  height: number,
  options: CreateCanvasOptions = {},
): CanvasHandle {
  const doc = resolveDocument(container);
  const canvas = doc.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to acquire 2D canvas context");
  }

  container.appendChild(canvas);
  configureHiDpiCanvas(canvas, ctx, width, height);

  let resizeObserver: ResizeObserver | null = null;
  const autoResize = options.autoResize ?? false;

  const resize = (nextWidth: number, nextHeight: number): void => {
    configureHiDpiCanvas(canvas, ctx, nextWidth, nextHeight);
  };

  if (autoResize && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const nextWidth = entry.contentRect.width;
      const nextHeight = height > 0 ? height : entry.contentRect.height;
      resize(nextWidth, nextHeight);
    });
    resizeObserver.observe(container);
  }

  const dispose = (): void => {
    resizeObserver?.disconnect();
    resizeObserver = null;

    if (canvas.parentElement === container) {
      container.removeChild(canvas);
    }
  };

  return { canvas, ctx, resize, dispose };
}
