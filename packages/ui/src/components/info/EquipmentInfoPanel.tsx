import { useMemo, type ReactElement } from "react";
import type { SupParams } from "sor-reader";

import { InfoPanel, type InfoEntry } from "./InfoPanel.js";

export interface EquipmentInfoPanelProps {
  supParams: SupParams;
}

export function EquipmentInfoPanel({ supParams }: EquipmentInfoPanelProps): ReactElement {
  const entries = useMemo<InfoEntry[]>(
    () => [
      { label: "Supplier", value: supParams.supplier },
      { label: "OTDR", value: supParams.otdr },
      { label: "OTDR S/N", value: supParams.otdrSerialNumber },
      { label: "Module", value: supParams.module },
      { label: "Module S/N", value: supParams.moduleSerialNumber },
      { label: "Software", value: supParams.software },
      { label: "Other", value: supParams.other },
    ].filter((entry) => entry.value.trim().length > 0),
    [supParams],
  );

  return <InfoPanel title="Equipment" entries={entries} />;
}
