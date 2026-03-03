import type { ReactElement } from "react";

import styles from "./PrintButton.module.css";

export interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "Print" }: PrintButtonProps): ReactElement {
  return (
    <button type="button" className={styles.button} onClick={() => window.print()}>
      {label}
    </button>
  );
}
