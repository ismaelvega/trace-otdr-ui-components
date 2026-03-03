import { useMemo, type ReactElement } from "react";
import type { FxdParams } from "sor-reader";

import { formatDistance } from "../../utils/formatters.js";
import { InfoPanel, type InfoEntry } from "./InfoPanel.js";

export interface MeasurementInfoPanelProps {
  fxdParams: FxdParams;
}

export function MeasurementInfoPanel({ fxdParams }: MeasurementInfoPanelProps): ReactElement {
  const entries = useMemo<InfoEntry[]>(() => {
    const base: InfoEntry[] = [
      { label: "Date/Time", value: fxdParams.dateTime },
      { label: "Pulse Width", value: fxdParams.pulseWidth },
      { label: "Samples", value: `${fxdParams.numDataPoints}` },
      { label: "Range", value: formatDistance(fxdParams.range, "km") },
      { label: "Resolution", value: `${fxdParams.resolution.toFixed(3)} m` },
      { label: "Index", value: fxdParams.indexOfRefraction.toFixed(6) },
      { label: "Backscatter", value: fxdParams.backscatterCoeff },
      { label: "Loss Thr.", value: fxdParams.lossThreshold },
      { label: "Refl Thr.", value: fxdParams.reflThreshold },
      { label: "EOT Thr.", value: fxdParams.eotThreshold },
    ];

    if ("averagingTime" in fxdParams) {
      base.push(
        { label: "Averaging", value: fxdParams.averagingTime },
        { label: "Trace Type", value: fxdParams.traceType },
      );
    }

    return base;
  }, [fxdParams]);

  return <InfoPanel title="Measurement" entries={entries} />;
}
