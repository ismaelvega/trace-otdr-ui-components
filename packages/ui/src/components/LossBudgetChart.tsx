import { useMemo, type ReactElement } from "react";
import type { KeyEvent } from "sor-reader";

import type { EventThresholds } from "../types/thresholds.js";
import { assessEvent } from "../utils/classifiers.js";
import styles from "./LossBudgetChart.module.css";

export interface LossBudgetChartProps {
  events: KeyEvent[];
  thresholds?: EventThresholds | undefined;
  selectedEvent?: number | null;
  onBarClick?: (event: KeyEvent, index: number) => void;
  vertical?: boolean;
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function LossBudgetChart({
  events,
  thresholds = {},
  selectedEvent = null,
  onBarClick,
  vertical = false,
}: LossBudgetChartProps): ReactElement {
  const rows = useMemo(() => {
    const withLoss = events
      .map((event, index) => ({
        event,
        index,
        spliceLoss: parseNumber(event.spliceLoss),
      }))
      .filter((row) => row.spliceLoss !== 0);

    const maxLoss = Math.max(
      0,
      ...withLoss.map((row) => Math.abs(row.spliceLoss)),
      thresholds.spliceLoss?.fail ?? 0,
      thresholds.spliceLoss?.warn ?? 0,
    );

    return {
      maxLoss,
      rows: withLoss.map((row) => {
        const status = assessEvent(row.event, thresholds);
        const widthPct = maxLoss > 0 ? (Math.abs(row.spliceLoss) / maxLoss) * 100 : 0;

        return {
          ...row,
          status,
          widthPct,
        };
      }),
    };
  }, [events, thresholds]);

  const warnPct = rows.maxLoss > 0 && thresholds.spliceLoss?.warn ? (thresholds.spliceLoss.warn / rows.maxLoss) * 100 : null;
  const failPct = rows.maxLoss > 0 && thresholds.spliceLoss?.fail ? (thresholds.spliceLoss.fail / rows.maxLoss) * 100 : null;

  return (
    <section className={`${styles.root} ${vertical ? styles.vertical : ""}`} aria-label="Loss budget chart">
      <div className={styles.chart}>
        {rows.rows.map((row) => (
          <button
            key={`loss-${row.index}`}
            className={`${styles.row} ${selectedEvent === row.index ? styles.selected : ""}`}
            onClick={() => onBarClick?.(row.event, row.index)}
            type="button"
          >
            <span className={styles.label}>#{row.index + 1}</span>
            <span className={`${styles.track} ${vertical ? styles.trackVertical : ""}`}>
              {warnPct !== null ? (
                <span className={`${styles.threshold} ${vertical ? styles.thresholdVertical : ""}`} style={vertical ? { bottom: `${warnPct}%` } : { left: `${warnPct}%` }} />
              ) : null}
              {failPct !== null ? (
                <span className={`${styles.threshold} ${vertical ? styles.thresholdVertical : ""}`} style={vertical ? { bottom: `${failPct}%` } : { left: `${failPct}%` }} />
              ) : null}
              <span
                className={`${styles.bar} ${vertical ? styles.barVertical : ""} ${styles[row.status] ?? styles.pass}`}
                style={vertical ? { height: `${row.widthPct}%` } : { width: `${row.widthPct}%` }}
              />
            </span>
            <span className={styles.value}>{row.spliceLoss.toFixed(3)} dB</span>
          </button>
        ))}
      </div>
    </section>
  );
}
