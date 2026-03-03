import { createElement, type ReactElement } from "react";

import { TraceChart } from "../components/TraceChart.js";
import { EventTable } from "../components/EventTable.js";
import { FiberMap } from "../components/FiberMap.js";
import { TraceSummary } from "../components/TraceSummary.js";
import { TraceViewer } from "../components/TraceViewer/TraceViewer.js";
import { SorDropZone } from "../components/SorDropZone.js";
import { normalizeSorResult } from "../adapters/normalize.js";
import { defineOtdrElement } from "./create-element.js";

function asNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function TraceChartElement(props: { data?: unknown; width?: number; height?: number }): ReactElement {
  const normalized = props.data ? normalizeSorResult(props.data as never) : null;
  return createElement(TraceChart, {
    trace: normalized?.trace ?? [],
    events: normalized?.keyEvents.events ?? [],
    width: props.width ?? "auto",
    height: props.height ?? 360,
  });
}

function EventTableElement(props: { data?: unknown }): ReactElement {
  const normalized = props.data ? normalizeSorResult(props.data as never) : null;
  return createElement(EventTable, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: "",
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: "",
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: "",
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0,
        },
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0,
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true,
      },
      trace: [],
    },
  });
}

function FiberMapElement(props: { data?: unknown }): ReactElement {
  const normalized = props.data ? normalizeSorResult(props.data as never) : null;
  return createElement(FiberMap, {
    events: normalized?.keyEvents.events ?? [],
    locationA: normalized?.genParams.locationA,
    locationB: normalized?.genParams.locationB,
  });
}

function TraceSummaryElement(props: { data?: unknown }): ReactElement {
  const normalized = props.data ? normalizeSorResult(props.data as never) : null;
  return createElement(TraceSummary, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: "",
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: "",
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: "",
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0,
        },
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0,
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true,
      },
      trace: [],
    },
  });
}

function TraceViewerElement(props: { data?: unknown }): ReactElement {
  const normalized = props.data ? normalizeSorResult(props.data as never) : null;
  return createElement(TraceViewer, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: "",
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: "",
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: "",
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0,
        },
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0,
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true,
      },
      trace: [],
    },
  });
}

function DropZoneElement(props: { data?: unknown; host?: HTMLElement }): ReactElement {
  void props.data;
  return createElement(SorDropZone, {
    onResult: (result) => {
      props.host?.dispatchEvent(new CustomEvent("result", { detail: result }));
    },
    onError: (error) => {
      props.host?.dispatchEvent(new CustomEvent("error", { detail: error }));
    },
  });
}

defineOtdrElement("otdr-trace-chart", TraceChartElement, ["width", "height"], {
  width: (attr) => (attr === "auto" ? "auto" : asNumber(attr)),
  height: (attr) => asNumber(attr),
});
defineOtdrElement("otdr-event-table", EventTableElement, [], {});
defineOtdrElement("otdr-fiber-map", FiberMapElement, [], {});
defineOtdrElement("otdr-trace-summary", TraceSummaryElement, [], {});
defineOtdrElement("otdr-trace-viewer", TraceViewerElement, [], {});
defineOtdrElement("otdr-drop-zone", DropZoneElement, [], {});
