import { useMemo, type ReactElement } from "react";
import type { SorData, SorResult } from "sor-reader";

import type { SummaryThresholds } from "../types/thresholds.js";
import { normalizeSorResult } from "../adapters/normalize.js";
import { assessSummary } from "../utils/classifiers.js";
import { formatDistance, formatPower, formatWavelength } from "../utils/formatters.js";
import { StatusBadge } from "./primitives/StatusBadge.js";
import styles from "./TraceSummary.module.css";

export interface TraceSummaryProps {
  result: SorResult | SorData;
  thresholds?: SummaryThresholds | undefined;
  xUnit?: "km" | "m" | "mi" | "kft";
}

interface MetricCard {
  key: string;
  label: string;
  value: string;
}

function parseDistance(distance: string): number {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : 0;
}

export function TraceSummary({ result, thresholds = {}, xUnit = "km" }: TraceSummaryProps): ReactElement {
  const normalized = useMemo(() => normalizeSorResult(result), [result]);

  const { cards, status } = useMemo(() => {
    const summary = normalized.keyEvents.summary;
    const lastEvent = normalized.keyEvents.events[normalized.keyEvents.events.length - 1];
    const fiberLength = lastEvent ? parseDistance(lastEvent.distance) : normalized.fxdParams.range;
    const avgLossPerKm = fiberLength > 0 ? summary.totalLoss / fiberLength : 0;

    const computedStatus = assessSummary(summary, thresholds);

    const metricCards: MetricCard[] = [
      {
        key: "fiberLength",
        label: "Fiber Length",
        value: formatDistance(fiberLength, xUnit),
      },
      {
        key: "totalLoss",
        label: "Total Loss",
        value: formatPower(summary.totalLoss, 3),
      },
      {
        key: "orl",
        label: "ORL",
        value: formatPower(summary.orl, 3),
      },
      {
        key: "avgLoss",
        label: "Avg Loss/km",
        value: `${avgLossPerKm.toFixed(3)} dB/km`,
      },
      {
        key: "wavelength",
        label: "Wavelength",
        value: formatWavelength(normalized.genParams.wavelength),
      },
      {
        key: "eventCount",
        label: "Events",
        value: `${normalized.keyEvents.events.length}`,
      },
    ];

    return {
      cards: metricCards,
      status: computedStatus,
    };
  }, [normalized, thresholds, xUnit]);

  return (
    <section className={styles.root} aria-label="Trace summary">
      <div className={styles.badge}>
        <StatusBadge status={status} />
      </div>
      <div className={styles.grid}>
        {cards.map((card) => (
          <article key={card.key} className={styles.card}>
            <div className={styles.value}>{card.value}</div>
            <div className={styles.label}>{card.label}</div>
          </article>
        ))}
      </div>
    </section>
  );
}
