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

export interface MeasurementCursor {
  distance: number;
  power: number;
  traceIndex: number;
}

export interface MeasurementCursors {
  a: MeasurementCursor | null;
  b: MeasurementCursor | null;
}
