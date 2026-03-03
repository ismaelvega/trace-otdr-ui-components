import type { ReactElement } from "react";

import type { MeasurementCursors } from "../types/chart.js";
import type { DistanceUnit } from "../types/units.js";
import type { CursorMeasurement } from "../utils/cursor-measurement.js";
import { formatDistance, formatPower, formatSlope } from "../utils/formatters.js";
import styles from "./TraceMeasurementPanel.module.css";

export interface TraceMeasurementPanelProps {
  cursors: MeasurementCursors;
  measurement: CursorMeasurement | null;
  xUnit?: DistanceUnit;
  onSwap?: () => void;
  onClear?: () => void;
}

export function TraceMeasurementPanel({
  cursors,
  measurement,
  xUnit = "km",
  onSwap,
  onClear,
}: TraceMeasurementPanelProps): ReactElement {
  const hasA = Boolean(cursors.a);
  const hasB = Boolean(cursors.b);
  const ready = Boolean(measurement);

  return (
    <section className={styles.root} aria-label="Trace measurement">
      <header className={styles.header}>
        <h3 className={styles.title}>Cursor Measurement</h3>
        <div className={styles.actions}>
          {onSwap ? (
            <button type="button" className={styles.button} onClick={onSwap} disabled={!ready}>
              Swap A/B
            </button>
          ) : null}
          {onClear ? (
            <button type="button" className={styles.button} onClick={onClear} disabled={!hasA && !hasB}>
              Clear
            </button>
          ) : null}
        </div>
      </header>

      {!hasA && !hasB ? <p className={styles.hint}>Click on the trace to place Cursor A, then place Cursor B.</p> : null}
      {hasA && !hasB ? (
        <p className={styles.hint}>
          Cursor A at {formatDistance(cursors.a?.distance ?? 0, xUnit)}. Click again to place Cursor B.
        </p>
      ) : null}

      {measurement ? (
        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>Cursor A</div>
            <div className={styles.value}>{formatDistance(measurement.distanceA, xUnit)}</div>
            <div className={styles.meta}>{formatPower(measurement.powerA, 3)}</div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardTitle}>Cursor B</div>
            <div className={styles.value}>{formatDistance(measurement.distanceB, xUnit)}</div>
            <div className={styles.meta}>{formatPower(measurement.powerB, 3)}</div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardTitle}>Delta</div>
            <div className={styles.value}>{formatDistance(measurement.deltaDistance, xUnit)}</div>
            <div className={styles.meta}>{formatPower(measurement.deltaPower, 3)}</div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardTitle}>Interval Stats</div>
            <div className={styles.metaStrong}>{`Avg: ${measurement.avgAttenuationDbPerKm === null ? "N/A" : formatSlope(measurement.avgAttenuationDbPerKm, 3)}`}</div>
            <div className={styles.meta}>{`Events: ${measurement.eventCountBetween} · Reflective: ${measurement.reflectiveEventCountBetween}`}</div>
            <div className={styles.meta}>{`Splice Σ: ${formatPower(measurement.spliceLossSumBetween, 3)}`}</div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
