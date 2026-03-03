import { useMemo, useState, type ReactElement } from "react";
import type { SorData, SorResult, TracePoint } from "sor-reader";

import { normalizeSorResult } from "../adapters/normalize.js";
import type { ViewportRange } from "../types/chart.js";
import { TraceChart } from "./TraceChart.js";
import { TraceSummary } from "./TraceSummary.js";
import styles from "./TraceComparison.module.css";

export interface TraceComparisonItem {
  label: string;
  result: SorResult | SorData;
  color?: string;
}

export interface TraceComparisonProps {
  traces: TraceComparisonItem[];
  mode?: "overlay" | "side-by-side" | "difference";
  syncZoom?: boolean;
}

const DEFAULT_COLORS = ["#0f766e", "#1d4ed8", "#b91c1c", "#a16207", "#7c3aed"];

function interpolatePower(trace: TracePoint[], distance: number): number {
  if (trace.length === 0) return 0;
  if (distance <= trace[0]!.distance) return trace[0]!.power;
  if (distance >= trace[trace.length - 1]!.distance) return trace[trace.length - 1]!.power;

  let left = 0;
  let right = trace.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const point = trace[middle];
    if (!point) break;

    if (point.distance === distance) {
      return point.power;
    }

    if (point.distance < distance) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  const lowerIndex = Math.max(0, right);
  const upperIndex = Math.min(trace.length - 1, left);
  const lower = trace[lowerIndex] ?? trace[0]!;
  const upper = trace[upperIndex] ?? trace[trace.length - 1]!;

  if (upper.distance === lower.distance) {
    return lower.power;
  }

  const ratio = (distance - lower.distance) / (upper.distance - lower.distance);
  return lower.power + ratio * (upper.power - lower.power);
}

function computeDifferenceTrace(a: TracePoint[], b: TracePoint[]): TracePoint[] {
  if (a.length === 0 || b.length === 0) return [];

  return a.map((point) => {
    const power = point.power - interpolatePower(b, point.distance);
    return {
      distance: point.distance,
      power,
    };
  });
}

export function TraceComparison({ traces, mode = "overlay", syncZoom = true }: TraceComparisonProps): ReactElement {
  const normalized = useMemo(
    () =>
      traces.map((item, index) => ({
        ...item,
        data: normalizeSorResult(item.result),
        color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? "#0f766e",
      })),
    [traces],
  );

  const [sharedSelection, setSharedSelection] = useState<number | null>(null);
  const [sharedViewport, setSharedViewport] = useState<ViewportRange | undefined>(undefined);

  if (mode === "side-by-side") {
    return (
      <section className={styles.root}>
        <div className={styles.sideBySide}>
          {normalized.map((item) => (
            <article key={item.label} className={styles.panel}>
              <h3 className={styles.title}>{item.label}</h3>
              <TraceSummary result={item.data} />
              <TraceChart
                trace={item.data.trace}
                events={item.data.keyEvents.events}
                selectedEvent={sharedSelection}
                onEventClick={(_, index) => setSharedSelection(index)}
                {...(syncZoom && sharedViewport ? { viewport: sharedViewport } : {})}
                {...(syncZoom ? { onZoomChange: (viewport: ViewportRange) => setSharedViewport(viewport) } : {})}
              />
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (mode === "difference") {
    const first = normalized[0]?.data.trace ?? [];
    const second = normalized[1]?.data.trace ?? [];
    const difference = computeDifferenceTrace(first, second);

    return (
      <section className={styles.root}>
        <article className={styles.panel}>
          <h3 className={styles.title}>Difference (Trace 1 - Trace 2)</h3>
          <TraceChart trace={difference} events={[]} />
        </article>
      </section>
    );
  }

  const primary = normalized[0];
  const overlays = normalized.slice(1).map((item) => ({ trace: item.data.trace, label: item.label, color: item.color }));

  return (
    <section className={styles.root}>
      <div className={styles.legend}>
        {normalized.map((item) => (
          <span key={`legend-${item.label}`} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
      {primary ? (
        <article className={styles.panel}>
          <h3 className={styles.title}>Overlay</h3>
          <TraceChart trace={primary.data.trace} events={primary.data.keyEvents.events} overlays={overlays} />
        </article>
      ) : null}
    </section>
  );
}
