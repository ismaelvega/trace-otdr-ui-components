import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import type { KeyEvent, SorData, SorResult } from "sor-reader";

import { normalizeSorResult } from "../adapters/normalize.js";
import type { EventThresholds } from "../types/thresholds.js";
import type { DistanceUnit } from "../types/units.js";
import { assessEvent, classifyEvent, type AssessmentStatus } from "../utils/classifiers.js";
import { formatDistance } from "../utils/formatters.js";
import { StatusBadge } from "./primitives/StatusBadge.js";
import styles from "./EventTable.module.css";

type SortKey = "index" | "distance" | "type" | "spliceLoss" | "reflLoss" | "slope";
type SortDirection = "asc" | "desc";

interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export interface EventTableProps {
  result: SorResult | SorData;
  compact?: boolean;
  xUnit?: DistanceUnit;
  thresholds?: EventThresholds | undefined;
  selectedEvent?: number | null;
  onEventSelect?: (event: KeyEvent | null, index: number | null) => void;
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

function renderType(category: string): string {
  if (category === "end-of-fiber") return "End of Fiber";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function ariaSortValue(sortState: SortState | null, key: SortKey): "none" | "ascending" | "descending" {
  if (!sortState || sortState.key !== key) return "none";
  return sortState.direction === "asc" ? "ascending" : "descending";
}

export function EventTable({
  result,
  compact = false,
  xUnit = "km",
  thresholds = {},
  selectedEvent = null,
  onEventSelect,
}: EventTableProps): ReactElement {
  const normalized = useMemo(() => normalizeSorResult(result), [result]);
  const [sortState, setSortState] = useState<SortState | null>(null);
  const rowRefs = useRef<Array<HTMLTableRowElement | null>>([]);

  const rows = useMemo(() => {
    const prepared = normalized.keyEvents.events.map((event, index) => {
      const category = classifyEvent(event);
      const status = assessEvent(event, thresholds);
      return {
        index,
        event,
        distance: parseNumber(event.distance),
        type: category,
        spliceLoss: parseNumber(event.spliceLoss),
        reflLoss: parseNumber(event.reflLoss),
        slope: parseNumber(event.slope),
        status,
      };
    });

    if (!sortState) return prepared;

    const { key, direction } = sortState;
    const sorted = prepared.slice().sort((a, b) => {
      const multiplier = direction === "asc" ? 1 : -1;
      if (key === "type") {
        return a.type.localeCompare(b.type) * multiplier;
      }
      if (key === "index") {
        return (a.index - b.index) * multiplier;
      }

      return (a[key] - b[key]) * multiplier;
    });

    return sorted;
  }, [normalized, sortState, thresholds]);

  useEffect(() => {
    if (selectedEvent === null || selectedEvent < 0) return;

    const row = rowRefs.current[selectedEvent];
    if (!row) return;

    if (typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [selectedEvent]);

  const summary = normalized.keyEvents.summary;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.head}>
          <tr>
            <th scope="col" aria-sort={ariaSortValue(sortState, "index")} onClick={() => setSortState((current) => cycleSortState(current, "index"))}>#</th>
            <th scope="col" aria-sort={ariaSortValue(sortState, "distance")} onClick={() => setSortState((current) => cycleSortState(current, "distance"))}>Distance</th>
            <th scope="col" aria-sort={ariaSortValue(sortState, "type")} onClick={() => setSortState((current) => cycleSortState(current, "type"))}>Type</th>
            <th scope="col" aria-sort={ariaSortValue(sortState, "spliceLoss")} onClick={() => setSortState((current) => cycleSortState(current, "spliceLoss"))}>Splice Loss</th>
            <th scope="col" aria-sort={ariaSortValue(sortState, "reflLoss")} onClick={() => setSortState((current) => cycleSortState(current, "reflLoss"))}>Refl. Loss</th>
            {!compact ? (
              <>
                <th scope="col" aria-sort={ariaSortValue(sortState, "slope")} onClick={() => setSortState((current) => cycleSortState(current, "slope"))}>Slope</th>
                <th scope="col">Status</th>
              </>
            ) : null}
          </tr>
        </thead>
        <tbody className={styles.body}>
          {rows.map((row) => (
            <tr
              key={`${row.index}-${row.event.distance}-${row.event.type}`}
              ref={(node) => {
                rowRefs.current[row.index] = node;
              }}
              className={selectedEvent === row.index ? styles.selected : undefined}
              onClick={() => onEventSelect?.(row.event, row.index)}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onEventSelect?.(row.event, row.index);
                  return;
                }

                if (event.key === "Escape") {
                  event.preventDefault();
                  onEventSelect?.(null, null);
                  return;
                }

                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  rowRefs.current[row.index + 1]?.focus();
                  return;
                }

                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  rowRefs.current[Math.max(0, row.index - 1)]?.focus();
                }
              }}
            >
              <td>{row.index + 1}</td>
              <td>{formatDistance(row.distance, xUnit)}</td>
              <td>
                <span className={styles.typeCell}>
                  <span className={styles.icon} />
                  {renderType(row.type)}
                </span>
              </td>
              <td>{row.spliceLoss.toFixed(3)} dB</td>
              <td>{row.reflLoss.toFixed(3)} dB</td>
              {!compact ? (
                <>
                  <td>{row.slope.toFixed(3)} dB/km</td>
                  <td>
                    <StatusBadge status={row.status as AssessmentStatus} />
                  </td>
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
        <tfoot className={styles.footer}>
          <tr>
            <td colSpan={compact ? 3 : 5}>Summary</td>
            <td colSpan={compact ? 2 : 1}>Total Loss: {summary.totalLoss.toFixed(3)} dB</td>
            {!compact ? <td>ORL: {summary.orl.toFixed(3)} dB</td> : null}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
