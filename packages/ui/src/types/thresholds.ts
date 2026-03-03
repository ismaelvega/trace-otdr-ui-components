export interface EventThresholds {
  spliceLoss?: { warn: number; fail: number };
  reflLoss?: { warn: number; fail: number };
  slope?: { warn: number; fail: number };
}

export interface SummaryThresholds {
  totalLoss?: { fail: number };
  orl?: { fail: number };
  fiberLength?: { max: number };
}

export interface AllThresholds {
  event: EventThresholds;
  summary: SummaryThresholds;
}
