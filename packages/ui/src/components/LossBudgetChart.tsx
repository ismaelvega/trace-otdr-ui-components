import { useMemo, useState, type ReactElement } from "react";
import type { KeyEvent } from "sor-reader";

import type { EventThresholds } from "../types/thresholds.js";
import { assessEvent, type AssessmentStatus } from "../utils/classifiers.js";
import styles from "./LossBudgetChart.module.css";

export interface LossBudgetChartProps {
  events: KeyEvent[];
  thresholds?: EventThresholds | undefined;
  selectedEvent?: number | null;
  onBarClick?: (event: KeyEvent, index: number) => void;
  vertical?: boolean;
}

type SortKey = "index" | "distance" | "spliceLoss" | "status";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cycleSortState(current: SortState | null, key: SortKey): SortState | null {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

function sortIndicator(sortState: SortState | null, key: SortKey): string {
  if (!sortState || sortState.key !== key) return "↕";
  return sortState.direction === "asc" ? "↑" : "↓";
}

function statusRank(status: AssessmentStatus): number {
  if (status === "fail") return 2;
  if (status === "warn") return 1;
  return 0;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function resolveDisplayMax(losses: number[], thresholdMax: number): { displayMax: number; dominantScaleActive: boolean } {
  const maxLoss = Math.max(0, ...losses, thresholdMax);
  if (maxLoss <= 0) {
    return { displayMax: 0, dominantScaleActive: false };
  }

  if (losses.length <= 1) {
    return { displayMax: maxLoss, dominantScaleActive: false };
  }

  const sorted = losses.slice().sort((a, b) => a - b);
  const q3Index = Math.max(0, Math.floor(sorted.length * 0.75) - 1);
  const reference = sorted[q3Index] ?? sorted[sorted.length - 1] ?? maxLoss;
  if (reference <= 0) {
    return { displayMax: maxLoss, dominantScaleActive: false };
  }

  const ratio = maxLoss / reference;
  const dominantScaleActive = ratio >= 2.5;
  if (!dominantScaleActive) {
    return { displayMax: maxLoss, dominantScaleActive };
  }

  const softenedMax = Math.max(reference * 1.75, thresholdMax, 0.001);
  return {
    displayMax: Math.min(maxLoss, softenedMax),
    dominantScaleActive,
  };
}

export function LossBudgetChart({
  events,
  thresholds = {},
  selectedEvent = null,
  onBarClick,
  vertical = false,
}: LossBudgetChartProps): ReactElement {
  const [sortState, setSortState] = useState<SortState | null>(null);

  const rows = useMemo(() => {
    const withLoss = events
      .map((event, index) => ({
        event,
        index,
        distance: parseNumber(event.distance),
        spliceLoss: parseNumber(event.spliceLoss),
        absLoss: Math.abs(parseNumber(event.spliceLoss)),
      }))
      .filter((row) => row.spliceLoss !== 0);

    const thresholdMax = Math.max(
      0,
      thresholds.spliceLoss?.fail ?? 0,
      thresholds.spliceLoss?.warn ?? 0,
    );
    const { displayMax, dominantScaleActive } = resolveDisplayMax(
      withLoss.map((row) => row.absLoss),
      thresholdMax,
    );

    return {
      maxLoss: displayMax,
      dominantScaleActive,
      rows: withLoss.map((row) => {
        const status = assessEvent(row.event, thresholds);
        const rawPct = displayMax > 0 ? (row.absLoss / displayMax) * 100 : 0;

        return {
          ...row,
          status,
          widthPct: clampPercent(rawPct),
          overflow: rawPct > 100,
        };
      }).sort((a, b) => {
        if (!sortState) return a.index - b.index;

        const multiplier = sortState.direction === "asc" ? 1 : -1;
        if (sortState.key === "index") {
          return (a.index - b.index) * multiplier;
        }
        if (sortState.key === "distance") {
          return (a.distance - b.distance) * multiplier;
        }
        if (sortState.key === "spliceLoss") {
          return (a.absLoss - b.absLoss) * multiplier;
        }

        const statusDiff = (statusRank(a.status) - statusRank(b.status)) * multiplier;
        if (statusDiff !== 0) return statusDiff;
        return (a.index - b.index) * multiplier;
      }),
    };
  }, [events, sortState, thresholds]);

  const warnPct = rows.maxLoss > 0 && thresholds.spliceLoss?.warn ? clampPercent((thresholds.spliceLoss.warn / rows.maxLoss) * 100) : null;
  const failPct = rows.maxLoss > 0 && thresholds.spliceLoss?.fail ? clampPercent((thresholds.spliceLoss.fail / rows.maxLoss) * 100) : null;

  return (
    <section className={`${styles.root} ${vertical ? styles.vertical : ""}`} aria-label="Loss budget chart">
      <div className={styles.toolbar} role="group" aria-label="Sort loss budget bars">
        <span className={styles.toolbarLabel}>Sort</span>
        <button type="button" className={styles.sortButton} onClick={() => setSortState((current) => cycleSortState(current, "index"))}>
          {`# ${sortIndicator(sortState, "index")}`}
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setSortState((current) => cycleSortState(current, "distance"))}>
          {`Distance ${sortIndicator(sortState, "distance")}`}
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setSortState((current) => cycleSortState(current, "spliceLoss"))}>
          {`Splice ${sortIndicator(sortState, "spliceLoss")}`}
        </button>
        <button type="button" className={styles.sortButton} onClick={() => setSortState((current) => cycleSortState(current, "status"))}>
          {`Status ${sortIndicator(sortState, "status")}`}
        </button>
      </div>
      {rows.dominantScaleActive ? <p className={styles.scaleHint}>Scaled for readability. Bars with an overflow marker exceed display scale.</p> : null}
      <div className={styles.chart}>
        {rows.rows.map((row) => (
          <button
            key={`loss-${row.index}`}
            className={`${styles.row} ${selectedEvent === row.index ? styles.selected : ""}`}
            onClick={() => onBarClick?.(row.event, row.index)}
            type="button"
            aria-label={`Event ${row.index + 1}, splice loss ${row.spliceLoss.toFixed(3)} dB${row.overflow ? ", exceeds chart scale" : ""}`}
          >
            <span className={styles.label}>#{row.index + 1}</span>
            <span className={`${styles.track} ${vertical ? styles.trackVertical : ""}`}>
              <span className={`${styles.zero} ${vertical ? styles.zeroVertical : ""}`} />
              {warnPct !== null ? (
                <span className={`${styles.threshold} ${styles.warnThreshold} ${vertical ? styles.thresholdVertical : ""}`} style={vertical ? { bottom: `${warnPct}%` } : { left: `${warnPct}%` }} />
              ) : null}
              {failPct !== null ? (
                <span className={`${styles.threshold} ${styles.failThreshold} ${vertical ? styles.thresholdVertical : ""}`} style={vertical ? { bottom: `${failPct}%` } : { left: `${failPct}%` }} />
              ) : null}
              <span
                className={`${styles.bar} ${vertical ? styles.barVertical : ""} ${styles[row.status] ?? styles.pass}`}
                style={vertical ? { height: `${row.widthPct}%` } : { width: `${row.widthPct}%` }}
              />
              {row.overflow ? <span className={`${styles.overflowCue} ${vertical ? styles.overflowCueVertical : ""}`} /> : null}
            </span>
            <span className={styles.value}>{row.spliceLoss.toFixed(3)} dB</span>
          </button>
        ))}
      </div>
    </section>
  );
}
