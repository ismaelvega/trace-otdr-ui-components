import type { KeyEvent, KeyEventsSummary } from "sor-reader";

import type { EventCategory } from "../types/events.js";
import type { EventThresholds, SummaryThresholds } from "../types/thresholds.js";

export type AssessmentStatus = "pass" | "warn" | "fail";

interface ParsedEventTypeCode {
  first: string;
  second: string;
  last: string;
}

function parseEventTypeCode(type: string): ParsedEventTypeCode | null {
  const match = type.match(/^([012])([A-Za-z0-9])9999([A-Za-z0-9])([SE])/);
  if (!match) return null;
  const first = match[1];
  const second = match[2];
  const last = match[4];
  if (!first || !second || !last) return null;

  return {
    first,
    second,
    last,
  };
}

function parseNumeric(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function combineStatus(current: AssessmentStatus, next: AssessmentStatus): AssessmentStatus {
  if (current === "fail" || next === "fail") return "fail";
  if (current === "warn" || next === "warn") return "warn";
  return "pass";
}

function assessHigherIsWorse(
  value: number,
  threshold: { warn: number; fail: number } | undefined,
): AssessmentStatus {
  if (!threshold || !Number.isFinite(value)) return "pass";
  if (value >= threshold.fail) return "fail";
  if (value >= threshold.warn) return "warn";
  return "pass";
}

export function classifyEvent(event: KeyEvent): EventCategory {
  const typeCode = parseEventTypeCode(event.type);
  if (!typeCode) return "unknown";

  const { first, second, last } = typeCode;

  if (last === "E") return "end-of-fiber";
  if (second === "A") return "manual";

  if (first === "1") return "reflection";
  if (first === "0") return "loss";
  if (first === "2") return "connector";

  return "unknown";
}

export function assessEvent(event: KeyEvent, thresholds: EventThresholds): AssessmentStatus {
  const spliceLoss = parseNumeric(event.spliceLoss);
  const reflLoss = parseNumeric(event.reflLoss);
  const slope = parseNumeric(event.slope);

  let status: AssessmentStatus = "pass";
  status = combineStatus(status, assessHigherIsWorse(spliceLoss, thresholds.spliceLoss));
  status = combineStatus(status, assessHigherIsWorse(reflLoss, thresholds.reflLoss));
  status = combineStatus(status, assessHigherIsWorse(slope, thresholds.slope));

  return status;
}

export function assessSummary(summary: KeyEventsSummary, thresholds: SummaryThresholds): AssessmentStatus {
  const fiberLength = Math.max(0, summary.lossEnd - summary.lossStart);

  if (thresholds.totalLoss && summary.totalLoss >= thresholds.totalLoss.fail) {
    return "fail";
  }

  if (thresholds.orl && summary.orl <= thresholds.orl.fail) {
    return "fail";
  }

  if (thresholds.fiberLength && fiberLength > thresholds.fiberLength.max) {
    return "fail";
  }

  if (thresholds.totalLoss && summary.totalLoss >= thresholds.totalLoss.fail * 0.9) {
    return "warn";
  }

  if (thresholds.orl && summary.orl <= thresholds.orl.fail * 1.1) {
    return "warn";
  }

  if (thresholds.fiberLength && fiberLength >= thresholds.fiberLength.max * 0.9) {
    return "warn";
  }

  return "pass";
}
