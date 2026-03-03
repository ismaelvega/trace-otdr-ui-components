import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { SorData, SorResult } from "sor-reader";

import { normalizeSorResult } from "../../adapters/normalize.js";
import { traceToImageURL } from "../../utils/trace-to-image.js";
import styles from "./TraceReport.module.css";

export interface TraceReportProps {
  result: SorResult | SorData;
  companyName?: string;
  companyLogo?: string;
  technician?: string;
  notes?: string;
}

type EventSortKey = "index" | "distance" | "type" | "spliceLoss" | "reflLoss";
type SortDirection = "asc" | "desc";

interface EventSortState {
  key: EventSortKey;
  direction: SortDirection;
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cycleSortState(current: EventSortState | null, key: EventSortKey): EventSortState | null {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }

  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }

  return null;
}

function ariaSortValue(sortState: EventSortState | null, key: EventSortKey): "none" | "ascending" | "descending" {
  if (!sortState || sortState.key !== key) return "none";
  return sortState.direction === "asc" ? "ascending" : "descending";
}

export function TraceReport({
  result,
  companyName = "Fiber Services",
  companyLogo,
  technician = "",
  notes = "",
}: TraceReportProps): ReactElement {
  const normalized = useMemo(() => normalizeSorResult(result), [result]);
  const [traceUrl, setTraceUrl] = useState<string | null>(null);
  const [eventSortState, setEventSortState] = useState<EventSortState | null>(null);

  useEffect(() => {
    let active = true;

    void traceToImageURL(normalized.trace).then((url) => {
      if (!active) return;
      setTraceUrl(url);
    });

    return () => {
      active = false;
    };
  }, [normalized.trace]);

  const sortedEvents = useMemo(() => {
    const prepared = normalized.keyEvents.events.map((event, index) => ({
      index,
      event,
      distance: parseNumber(event.distance),
      type: event.type,
      spliceLoss: parseNumber(event.spliceLoss),
      reflLoss: parseNumber(event.reflLoss),
    }));

    if (!eventSortState) return prepared;

    const { key, direction } = eventSortState;
    const multiplier = direction === "asc" ? 1 : -1;

    return prepared.slice().sort((a, b) => {
      if (key === "type") {
        return a.type.localeCompare(b.type) * multiplier;
      }
      if (key === "index") {
        return (a.index - b.index) * multiplier;
      }

      return (a[key] - b[key]) * multiplier;
    });
  }, [eventSortState, normalized.keyEvents.events]);

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <div>
          <h1>{companyName}</h1>
          <p>OTDR Trace Report</p>
        </div>
        <div>{companyLogo ? <img src={companyLogo} alt={`${companyName} logo`} height={40} /> : null}</div>
      </header>

      <section className={styles.section}>
        <h2>Fiber Info</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th>Cable ID</th>
              <td>{normalized.genParams.cableId}</td>
              <th>Fiber ID</th>
              <td>{normalized.genParams.fiberId}</td>
            </tr>
            <tr>
              <th>Location A</th>
              <td>{normalized.genParams.locationA}</td>
              <th>Location B</th>
              <td>{normalized.genParams.locationB}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2>Equipment</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <th>OTDR</th>
              <td>{normalized.supParams.otdr}</td>
              <th>Software</th>
              <td>{normalized.supParams.software}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section}>
        <h2>Trace Plot</h2>
        {traceUrl ? <img src={traceUrl} alt="Trace plot" className={styles.trace} /> : <p>Rendering trace...</p>}
      </section>

      <section className={styles.section}>
        <h2>Event Table</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th aria-sort={ariaSortValue(eventSortState, "index")}>
                <button type="button" className={styles.sortButton} onClick={() => setEventSortState((current) => cycleSortState(current, "index"))}>
                  #
                </button>
              </th>
              <th aria-sort={ariaSortValue(eventSortState, "distance")}>
                <button type="button" className={styles.sortButton} onClick={() => setEventSortState((current) => cycleSortState(current, "distance"))}>
                  Distance
                </button>
              </th>
              <th aria-sort={ariaSortValue(eventSortState, "type")}>
                <button type="button" className={styles.sortButton} onClick={() => setEventSortState((current) => cycleSortState(current, "type"))}>
                  Type
                </button>
              </th>
              <th aria-sort={ariaSortValue(eventSortState, "spliceLoss")}>
                <button type="button" className={styles.sortButton} onClick={() => setEventSortState((current) => cycleSortState(current, "spliceLoss"))}>
                  Splice Loss
                </button>
              </th>
              <th aria-sort={ariaSortValue(eventSortState, "reflLoss")}>
                <button type="button" className={styles.sortButton} onClick={() => setEventSortState((current) => cycleSortState(current, "reflLoss"))}>
                  Refl. Loss
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((row) => (
              <tr key={`report-event-${row.index}`} className={styles.noSplitRow}>
                <td>{row.index + 1}</td>
                <td>{row.event.distance}</td>
                <td>{row.event.type}</td>
                <td>{row.event.spliceLoss}</td>
                <td>{row.event.reflLoss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className={styles.footer}>
        <p>Technician: {technician || "-"}</p>
        <p>Notes: {notes || "-"}</p>
      </footer>
    </article>
  );
}
