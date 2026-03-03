import { useMemo, useState } from "react";

import type { AllThresholds } from "../types/thresholds.js";

const DEFAULT_THRESHOLDS: AllThresholds = {
  event: {
    spliceLoss: { warn: 0.3, fail: 0.5 },
    reflLoss: { warn: -50, fail: -40 },
    slope: { warn: 0.3, fail: 0.5 },
  },
  summary: {
    totalLoss: { fail: 10 },
    orl: { fail: 30 },
    fiberLength: { max: 100 },
  },
};

function mergeThresholds(base: AllThresholds, partial: Partial<AllThresholds>): AllThresholds {
  return {
    event: {
      ...base.event,
      ...partial.event,
    },
    summary: {
      ...base.summary,
      ...partial.summary,
    },
  };
}

export function useThresholds(defaults?: Partial<AllThresholds>): {
  thresholds: AllThresholds;
  updateThresholds: (partial: Partial<AllThresholds>) => void;
  resetThresholds: () => void;
} {
  const base = useMemo(() => mergeThresholds(DEFAULT_THRESHOLDS, defaults ?? {}), [defaults]);
  const [thresholds, setThresholds] = useState<AllThresholds>(base);

  return {
    thresholds,
    updateThresholds: (partial) => {
      setThresholds((current) => mergeThresholds(current, partial));
    },
    resetThresholds: () => {
      setThresholds(base);
    },
  };
}
