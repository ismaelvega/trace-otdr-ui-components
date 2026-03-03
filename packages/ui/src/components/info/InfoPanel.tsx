import { Fragment, type ReactElement } from "react";

import styles from "./InfoPanel.module.css";

export interface InfoEntry {
  label: string;
  value: string;
}

export interface InfoPanelProps {
  title: string;
  entries: InfoEntry[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

function Entries({ entries }: { entries: InfoEntry[] }): ReactElement {
  return (
    <dl className={styles.list}>
      {entries.map((entry) => (
        <Fragment key={entry.label}>
          <dt className={styles.term}>
            {entry.label}
          </dt>
          <dd className={styles.value}>
            {entry.value}
          </dd>
        </Fragment>
      ))}
    </dl>
  );
}

export function InfoPanel({ title, entries, collapsible = true, defaultExpanded = true }: InfoPanelProps): ReactElement {
  if (!collapsible) {
    return (
      <section className={styles.root} aria-label={title}>
        <header className={styles.header}>{title}</header>
        <div className={styles.body}>
          <Entries entries={entries} />
        </div>
      </section>
    );
  }

  return (
    <details className={styles.root} open={defaultExpanded}>
      <summary className={styles.summary}>{title}</summary>
      <div className={styles.body}>
        <Entries entries={entries} />
      </div>
    </details>
  );
}
