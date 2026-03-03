import type { TracePoint } from "sor-reader";

import { drawTrace } from "../canvas/trace-renderer.js";
import { computeViewport } from "../canvas/coordinates.js";

export interface TraceImageOptions {
  width?: number;
  height?: number;
  mimeType?: string;
}

export async function traceToImageBlob(trace: TracePoint[], options: TraceImageOptions = {}): Promise<Blob> {
  const width = options.width ?? 1200;
  const height = options.height ?? 400;
  const mimeType = options.mimeType ?? "image/png";

  if (typeof document === "undefined") {
    throw new Error("traceToImageBlob requires a DOM environment");
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to acquire canvas context");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const viewport = computeViewport(trace);
  drawTrace(ctx, trace, viewport, { width, height }, { color: "#0f766e", lineWidth: 1.5, opacity: 1 });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType));
  if (!blob) {
    throw new Error("Failed to export trace image");
  }

  return blob;
}

export async function traceToImageURL(trace: TracePoint[], options?: TraceImageOptions): Promise<string> {
  const blob = await traceToImageBlob(trace, options);

  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(blob);
  }

  if (typeof FileReader !== "undefined") {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const output = reader.result;
        if (typeof output === "string") {
          resolve(output);
          return;
        }
        reject(new Error("Failed to serialize trace image"));
      };
      reader.onerror = () => reject(new Error("Failed to serialize trace image"));
      reader.readAsDataURL(blob);
    });
  }

  throw new Error("traceToImageURL requires URL.createObjectURL or FileReader support");
}
