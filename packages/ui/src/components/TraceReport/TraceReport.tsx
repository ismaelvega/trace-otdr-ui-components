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

export function TraceReport({
  result,
  companyName = "Fiber Services",
  companyLogo,
  technician = "",
  notes = "",
}: TraceReportProps): ReactElement {
  const normalized = useMemo(() => normalizeSorResult(result), [result]);
  const [traceUrl, setTraceUrl] = useState<string | null>(null);

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
              <th>#</th>
              <th>Distance</th>
              <th>Type</th>
              <th>Splice Loss</th>
              <th>Refl. Loss</th>
            </tr>
          </thead>
          <tbody>
            {normalized.keyEvents.events.map((event, index) => (
              <tr key={`report-event-${index}`} className={styles.noSplitRow}>
                <td>{index + 1}</td>
                <td>{event.distance}</td>
                <td>{event.type}</td>
                <td>{event.spliceLoss}</td>
                <td>{event.reflLoss}</td>
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
