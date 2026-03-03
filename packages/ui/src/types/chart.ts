import type { TracePoint } from "sor-reader";

export interface ViewportRange {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface TraceOverlay {
  trace: TracePoint[];
  label: string;
  color: string;
}
