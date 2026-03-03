import type { KeyEvents } from "sor-reader";

export interface LossBudget {
  totalSpliceLoss: number;
  totalReflLoss: number;
  avgSpliceLoss: number;
  maxSpliceLoss: number;
  eventCount: number;
  spanLengths: number[];
}

function parseNumeric(input: string): number {
  const value = Number.parseFloat(input);
  return Number.isFinite(value) ? value : 0;
}

export function computeLossBudget(events: KeyEvents): LossBudget {
  const normalizedEvents = events.events.slice();
  const eventCount = normalizedEvents.length;

  const totalSpliceLoss = normalizedEvents.reduce((total, event) => total + parseNumeric(event.spliceLoss), 0);
  const totalReflLoss = normalizedEvents.reduce((total, event) => total + parseNumeric(event.reflLoss), 0);

  const maxSpliceLoss =
    eventCount === 0
      ? 0
      : normalizedEvents.reduce((max, event) => Math.max(max, parseNumeric(event.spliceLoss)), Number.NEGATIVE_INFINITY);

  const avgSpliceLoss = eventCount > 0 ? totalSpliceLoss / eventCount : 0;

  const byDistance = normalizedEvents
    .map((event) => parseNumeric(event.distance))
    .filter((distance) => Number.isFinite(distance))
    .sort((a, b) => a - b);

  const spanLengths: number[] = [];
  for (let i = 1; i < byDistance.length; i += 1) {
    const current = byDistance[i];
    const previous = byDistance[i - 1];
    if (current === undefined || previous === undefined) continue;
    spanLengths.push(current - previous);
  }

  return {
    totalSpliceLoss,
    totalReflLoss,
    avgSpliceLoss,
    maxSpliceLoss,
    eventCount,
    spanLengths,
  };
}
