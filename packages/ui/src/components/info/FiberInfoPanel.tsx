import { useMemo, type ReactElement } from "react";
import type { GenParams } from "sor-reader";

import { InfoPanel, type InfoEntry } from "./InfoPanel.js";

export interface FiberInfoPanelProps {
  genParams: GenParams;
}

function present(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function FiberInfoPanel({ genParams }: FiberInfoPanelProps): ReactElement {
  const entries = useMemo<InfoEntry[]>(() => {
    const candidates: Array<InfoEntry | null> = [
      { label: "Cable ID", value: genParams.cableId },
      { label: "Fiber ID", value: genParams.fiberId },
      { label: "Wavelength", value: genParams.wavelength },
      { label: "Location A", value: genParams.locationA },
      { label: "Location B", value: genParams.locationB },
      { label: "Cable Code", value: genParams.cableCode },
      { label: "Build", value: genParams.buildCondition },
      { label: "Operator", value: genParams.operator },
      { label: "Comments", value: genParams.comments },
      "fiberType" in genParams ? { label: "Fiber Type", value: genParams.fiberType } : null,
      "userOffsetDistance" in genParams ? { label: "User Offset Dist.", value: genParams.userOffsetDistance } : null,
    ];

    return candidates.filter((entry): entry is InfoEntry => Boolean(entry && present(entry.value)));
  }, [genParams]);

  return <InfoPanel title="Fiber Info" entries={entries} />;
}
