import type { ReactElement } from "react";

import styles from "./StatusBadge.module.css";

export type StatusBadgeState = "pass" | "warn" | "fail" | "neutral";

export interface StatusBadgeProps {
  status: StatusBadgeState;
  label?: string;
}

const DEFAULT_LABELS: Record<StatusBadgeState, string> = {
  pass: "Pass",
  warn: "Warning",
  fail: "Fail",
  neutral: "Neutral",
};

export function StatusBadge({ status, label }: StatusBadgeProps): ReactElement {
  const resolvedLabel = label ?? DEFAULT_LABELS[status];

  return (
    <span className={`${styles.badge} ${styles[status] ?? ""}`} role="status" aria-label={`Status: ${resolvedLabel}`}>
      {resolvedLabel}
    </span>
  );
}
