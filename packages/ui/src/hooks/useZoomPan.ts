import { useCallback, useEffect, useState, type RefObject } from "react";

import type { ViewportRange } from "../types/chart.js";
import { clampViewport } from "../canvas/coordinates.js";

export function useZoomPan(
  canvasRef: RefObject<HTMLCanvasElement>,
  dataBounds: ViewportRange,
): {
  viewport: ViewportRange;
  setViewport: (next: ViewportRange) => void;
  resetViewport: () => void;
  zoomTo: (xRange: [number, number], yRange?: [number, number]) => void;
} {
  // Hook API keeps a canvas ref for future gesture binding use-cases.
  void canvasRef;

  const [viewport, setViewportState] = useState<ViewportRange>(dataBounds);

  useEffect(() => {
    setViewportState(dataBounds);
  }, [dataBounds.xMin, dataBounds.xMax, dataBounds.yMin, dataBounds.yMax]);

  const setViewport = useCallback(
    (next: ViewportRange) => {
      setViewportState(clampViewport(next, dataBounds));
    },
    [dataBounds],
  );

  const resetViewport = useCallback(() => {
    setViewportState(dataBounds);
  }, [dataBounds]);

  const zoomTo = useCallback(
    (xRange: [number, number], yRange?: [number, number]) => {
      const next: ViewportRange = {
        xMin: xRange[0],
        xMax: xRange[1],
        yMin: yRange ? yRange[0] : viewport.yMin,
        yMax: yRange ? yRange[1] : viewport.yMax,
      };
      setViewportState(clampViewport(next, dataBounds));
    },
    [dataBounds, viewport.yMin, viewport.yMax],
  );

  return {
    viewport,
    setViewport,
    resetViewport,
    zoomTo,
  };
}
