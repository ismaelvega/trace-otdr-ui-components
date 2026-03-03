import type { ReactElement } from "react";

export interface PrintButtonProps {
  label?: string;
}

export function PrintButton({ label = "Print" }: PrintButtonProps): ReactElement {
  return (
    <button type="button" onClick={() => window.print()}>
      {label}
    </button>
  );
}
