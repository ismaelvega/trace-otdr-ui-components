import type { KeyEvent, TracePoint } from "sor-reader";

import type { MeasurementCursor, MeasurementCursors } from "../types/chart.js";
import { classifyEvent } from "./classifiers.js";

export interface CursorMeasurement {
  a: MeasurementCursor;
  b: MeasurementCursor;
  start: MeasurementCursor;
  end: MeasurementCursor;
  distanceA: number;
  distanceB: number;
  deltaDistance: number;
  powerA: number;
  powerB: number;
  deltaPower: number;
  avgAttenuationDbPerKm: number | null;
  eventCountBetween: number;
  reflectiveEventCountBetween: number;
  spliceLossSumBetween: number;
}

function parseDistance(distance: string): number {
  const parsed = Number.parseFloat(distance);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function parseValue(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCursors(cursors: MeasurementCursors): { a: MeasurementCursor; b: MeasurementCursor } | null {
  if (!cursors.a || !cursors.b) return null;
  return {
    a: cursors.a,
    b: cursors.b,
  };
}

function countEventsBetween(events: KeyEvent[], minDistance: number, maxDistance: number): {
  eventCountBetween: number;
  reflectiveEventCountBetween: number;
  spliceLossSumBetween: number;
} {
  let eventCountBetween = 0;
  let reflectiveEventCountBetween = 0;
  let spliceLossSumBetween = 0;

  for (const event of events) {
    const distance = parseDistance(event.distance);
    if (!Number.isFinite(distance)) continue;
    if (distance < minDistance || distance > maxDistance) continue;

    eventCountBetween += 1;
    const category = classifyEvent(event);
    if (category === "reflection" || category === "end-of-fiber") {
      reflectiveEventCountBetween += 1;
    }

    spliceLossSumBetween += parseValue(event.spliceLoss);
  }

  return {
    eventCountBetween,
    reflectiveEventCountBetween,
    spliceLossSumBetween,
  };
}

export function computeCursorMeasurement(
  trace: TracePoint[],
  events: KeyEvent[],
  cursors: MeasurementCursors,
): CursorMeasurement | null {
  if (trace.length === 0) return null;

  const normalized = normalizeCursors(cursors);
  if (!normalized) return null;

  const { a, b } = normalized;

  const start = a.distance <= b.distance ? a : b;
  const end = a.distance <= b.distance ? b : a;
  const deltaDistance = Math.abs(b.distance - a.distance);
  const deltaPower = b.power - a.power;
  const avgAttenuationDbPerKm = deltaDistance > 0 ? deltaPower / deltaDistance : null;

  const counts = countEventsBetween(events, start.distance, end.distance);

  return {
    a,
    b,
    start,
    end,
    distanceA: a.distance,
    distanceB: b.distance,
    deltaDistance,
    powerA: a.power,
    powerB: b.power,
    deltaPower,
    avgAttenuationDbPerKm,
    eventCountBetween: counts.eventCountBetween,
    reflectiveEventCountBetween: counts.reflectiveEventCountBetween,
    spliceLossSumBetween: counts.spliceLossSumBetween,
  };
}
