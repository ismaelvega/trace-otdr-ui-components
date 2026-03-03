import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { SorData, SorResult } from "sor-reader";

import { normalizeSorResult } from "../../adapters/normalize.js";
import type { MeasurementCursors } from "../../types/chart.js";
import type { AllThresholds } from "../../types/thresholds.js";
import type { DistanceUnit } from "../../types/units.js";
import { EventSelectionProvider, useEventSelection } from "../../hooks/useEventSelection.js";
import { computeCursorMeasurement } from "../../utils/cursor-measurement.js";
import { EventTable } from "../EventTable.js";
import { FiberMap } from "../FiberMap.js";
import { LossBudgetChart } from "../LossBudgetChart.js";
import { PrintButton } from "../PrintButton.js";
import { TraceChart } from "../TraceChart.js";
import { TraceMeasurementPanel } from "../TraceMeasurementPanel.js";
import { TraceSummary } from "../TraceSummary.js";
import { EquipmentInfoPanel } from "../info/EquipmentInfoPanel.js";
import { FiberInfoPanel } from "../info/FiberInfoPanel.js";
import { MeasurementInfoPanel } from "../info/MeasurementInfoPanel.js";
import styles from "./TraceViewer.module.css";

export interface TraceViewerHandle {
  zoomToEvent: (index: number) => void;
  resetZoom: () => void;
  exportImage: () => Promise<Blob>;
}

type SectionName =
  | "summary"
  | "chart"
  | "fiberMap"
  | "eventTable"
  | "lossBudget"
  | "fiberInfo"
  | "equipment"
  | "measurement";

export interface TraceViewerProps {
  result: SorResult | SorData;
  thresholds?: AllThresholds | undefined;
  xUnit?: DistanceUnit;
  layout?: "full" | "compact";
  sections?: SectionName[];
  onEventSelect?: (index: number | null) => void;
  showPrintButton?: boolean;
}

function useCompactLayout(layout: "full" | "compact", hostRef: React.RefObject<HTMLDivElement | null>): boolean {
  const [compact, setCompact] = useState(layout === "compact");

  useEffect(() => {
    if (layout === "compact") {
      setCompact(true);
      return;
    }

    const host = hostRef.current;
    if (!host || typeof ResizeObserver === "undefined") {
      setCompact(false);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setCompact(entry.contentRect.width < 768);
    });

    observer.observe(host);
    return () => observer.disconnect();
  }, [layout, hostRef]);

  return compact;
}

interface TraceViewerInnerProps extends TraceViewerProps {
  onExposeApi: (api: { select: (index: number | null) => void; resetZoom: () => void }) => void;
}

function TraceViewerInner({
  result,
  thresholds,
  xUnit = "km",
  layout = "full",
  sections,
  onEventSelect,
  showPrintButton = false,
  onExposeApi,
}: TraceViewerInnerProps): ReactElement {
  const normalized = useMemo(() => normalizeSorResult(result), [result]);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { selectedIndex, select } = useEventSelection();
  const [measurementCursors, setMeasurementCursors] = useState<MeasurementCursors>({
    a: null,
    b: null,
  });

  const compact = useCompactLayout(layout, hostRef);
  const measurement = useMemo(
    () => computeCursorMeasurement(normalized.trace, normalized.keyEvents.events, measurementCursors),
    [measurementCursors, normalized.keyEvents.events, normalized.trace],
  );
  const exportBaseName = normalized.filename ? normalized.filename.replace(/\.[^.]+$/u, "") : "otdr-trace";

  useEffect(() => {
    onExposeApi({
      select,
      resetZoom: () => {
        select(null);
        setMeasurementCursors({ a: null, b: null });
      },
    });
  }, [onExposeApi, select]);

  useEffect(() => {
    onEventSelect?.(selectedIndex);
  }, [onEventSelect, selectedIndex]);

  useEffect(() => {
    setMeasurementCursors({ a: null, b: null });
  }, [normalized]);

  const visible = new Set<SectionName>(
    sections ?? ["summary", "chart", "fiberMap", "eventTable", "lossBudget", "fiberInfo", "equipment", "measurement"],
  );

  return (
    <div ref={hostRef} className={`${styles.root} ${compact ? styles.compact : styles.full}`}>
      {visible.has("summary") ? (
        <div className={styles.summary}>
          <TraceSummary result={normalized} thresholds={thresholds?.summary} xUnit={xUnit} />
        </div>
      ) : null}

      {visible.has("chart") ? (
        <div className={styles.chart}>
          {showPrintButton ? <PrintButton /> : null}
          <TraceChart
            trace={normalized.trace}
            events={normalized.keyEvents.events}
            xUnit={xUnit}
            selectedEvent={selectedIndex}
            measurementCursors={measurementCursors}
            showExportActions
            exportFileBaseName={`${exportBaseName}-chart`}
            onEventClick={(_, index) => select(index)}
            onMeasurementCursorsChange={setMeasurementCursors}
          />
          <TraceMeasurementPanel
            cursors={measurementCursors}
            measurement={measurement}
            xUnit={xUnit}
            onClear={() => setMeasurementCursors({ a: null, b: null })}
            {...(measurement
              ? {
                  onSwap: () =>
                    setMeasurementCursors((current) => ({
                      a: current.b,
                      b: current.a,
                    })),
                }
              : {})}
          />
        </div>
      ) : null}

      {visible.has("fiberMap") ? (
        <div className={styles.fibermap}>
          <FiberMap
            events={normalized.keyEvents.events}
            locationA={normalized.genParams.locationA}
            locationB={normalized.genParams.locationB}
            selectedEvent={selectedIndex}
            onEventClick={(_, index) => select(index)}
          />
        </div>
      ) : null}

      {visible.has("eventTable") ? (
        <div className={styles.table}>
          <EventTable
            result={normalized}
            xUnit={xUnit}
            thresholds={thresholds?.event}
            selectedEvent={selectedIndex}
            showExportActions
            exportFileBaseName={`${exportBaseName}-events`}
            onEventSelect={(_, index) => select(index)}
          />
        </div>
      ) : null}

      {visible.has("lossBudget") ? (
        <div className={styles.losschart}>
          <LossBudgetChart
            events={normalized.keyEvents.events}
            thresholds={thresholds?.event}
            selectedEvent={selectedIndex}
            onBarClick={(_, index) => select(index)}
          />
        </div>
      ) : null}

      {visible.has("fiberInfo") ? (
        <div className={styles.fiber}>
          <FiberInfoPanel genParams={normalized.genParams} />
        </div>
      ) : null}

      {visible.has("equipment") ? (
        <div className={styles.equip}>
          <EquipmentInfoPanel supParams={normalized.supParams} />
        </div>
      ) : null}

      {visible.has("measurement") ? (
        <div className={styles.measure}>
          <MeasurementInfoPanel fxdParams={normalized.fxdParams} />
        </div>
      ) : null}
    </div>
  );
}

export const TraceViewer = forwardRef<TraceViewerHandle, TraceViewerProps>(function TraceViewer(props, ref) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const apiRef = useRef<{ select: (index: number | null) => void; resetZoom: () => void }>({
    select: () => undefined,
    resetZoom: () => undefined,
  });

  useImperativeHandle(
    ref,
    () => ({
      zoomToEvent: (index: number) => {
        apiRef.current.select(index);
      },
      resetZoom: () => {
        apiRef.current.resetZoom();
      },
      exportImage: async () => {
        const canvas = hostRef.current?.querySelector("canvas");
        if (!canvas) {
          throw new Error("No canvas available for export");
        }

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) {
          throw new Error("Failed to export chart image");
        }

        return blob;
      },
    }),
    [],
  );

  return (
    <div ref={hostRef}>
      <EventSelectionProvider>
        <TraceViewerInner
          {...props}
          onExposeApi={(api) => {
            apiRef.current = api;
          }}
        />
      </EventSelectionProvider>
    </div>
  );
});
