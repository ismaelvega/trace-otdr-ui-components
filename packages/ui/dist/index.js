import {
  DISTANCE_CONVERSION_FACTORS,
  EquipmentInfoPanel,
  EventSelectionProvider,
  EventTable,
  FiberInfoPanel,
  FiberMap,
  InfoPanel,
  LossBudgetChart,
  MARGIN,
  MeasurementInfoPanel,
  PrintButton,
  SorDropZone,
  StatusBadge,
  TraceChart,
  TraceMeasurementPanel,
  TraceSummary,
  TraceViewer,
  assessEvent,
  assessSummary,
  clampViewport,
  classifyEvent,
  computeCursorMeasurement,
  computeEventMarkers,
  computeViewport,
  configureHiDpiCanvas,
  convertDistance,
  convertDistanceLabel,
  createCanvas,
  createRenderScheduler,
  dataToPixel,
  drawCrosshair,
  drawEventMarkers,
  drawMeasurementCursors,
  drawTrace,
  drawTraceOverlays,
  drawXAxis,
  drawYAxis,
  findNearestTracePointIndex,
  formatDateTime,
  formatDistance,
  formatEventTooltip,
  formatPower,
  formatSlope,
  formatWavelength,
  getDevicePixelRatio,
  getPlotRect,
  getZoomAxisFromModifiers,
  hitTestEventMarkers,
  hitTestMeasurementCursors,
  lttb,
  normalizeSorResult,
  panViewportByPixels,
  pixelToData,
  renderFrame,
  resolveCrosshairState,
  toCursorPoints,
  useEventSelection,
  zoomViewportAtPixel
} from "./chunk-KAUXE3SD.js";

// src/utils/loss-budget.ts
function parseNumeric(input) {
  const value = Number.parseFloat(input);
  return Number.isFinite(value) ? value : 0;
}
function computeLossBudget(events) {
  const normalizedEvents = events.events.slice();
  const eventCount = normalizedEvents.length;
  const totalSpliceLoss = normalizedEvents.reduce((total, event) => total + parseNumeric(event.spliceLoss), 0);
  const totalReflLoss = normalizedEvents.reduce((total, event) => total + parseNumeric(event.reflLoss), 0);
  const maxSpliceLoss = eventCount === 0 ? 0 : normalizedEvents.reduce((max, event) => Math.max(max, parseNumeric(event.spliceLoss)), Number.NEGATIVE_INFINITY);
  const avgSpliceLoss = eventCount > 0 ? totalSpliceLoss / eventCount : 0;
  const byDistance = normalizedEvents.map((event) => parseNumeric(event.distance)).filter((distance) => Number.isFinite(distance)).sort((a, b) => a - b);
  const spanLengths = [];
  for (let i = 1; i < byDistance.length; i += 1) {
    const current = byDistance[i];
    const previous = byDistance[i - 1];
    if (current === void 0 || previous === void 0) continue;
    spanLengths.push(current - previous);
  }
  return {
    totalSpliceLoss,
    totalReflLoss,
    avgSpliceLoss,
    maxSpliceLoss,
    eventCount,
    spanLengths
  };
}

// src/components/TraceComparison.tsx
import { useMemo, useState } from "react";

// src/components/TraceComparison.module.css
var TraceComparison_default = {};

// src/components/TraceComparison.tsx
import { jsx, jsxs } from "react/jsx-runtime";
var DEFAULT_COLORS = ["#0f766e", "#1d4ed8", "#b91c1c", "#a16207", "#7c3aed"];
function interpolatePower(trace, distance) {
  if (trace.length === 0) return 0;
  if (distance <= trace[0].distance) return trace[0].power;
  if (distance >= trace[trace.length - 1].distance) return trace[trace.length - 1].power;
  let left = 0;
  let right = trace.length - 1;
  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const point = trace[middle];
    if (!point) break;
    if (point.distance === distance) {
      return point.power;
    }
    if (point.distance < distance) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }
  const lowerIndex = Math.max(0, right);
  const upperIndex = Math.min(trace.length - 1, left);
  const lower = trace[lowerIndex] ?? trace[0];
  const upper = trace[upperIndex] ?? trace[trace.length - 1];
  if (upper.distance === lower.distance) {
    return lower.power;
  }
  const ratio = (distance - lower.distance) / (upper.distance - lower.distance);
  return lower.power + ratio * (upper.power - lower.power);
}
function computeDifferenceTrace(a, b) {
  if (a.length === 0 || b.length === 0) return [];
  return a.map((point) => {
    const power = point.power - interpolatePower(b, point.distance);
    return {
      distance: point.distance,
      power
    };
  });
}
function TraceComparison({ traces, mode = "overlay", syncZoom = true }) {
  const normalized = useMemo(
    () => traces.map((item, index) => ({
      ...item,
      data: normalizeSorResult(item.result),
      color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? "#0f766e"
    })),
    [traces]
  );
  const [sharedSelection, setSharedSelection] = useState(null);
  const [sharedViewport, setSharedViewport] = useState(void 0);
  if (mode === "side-by-side") {
    return /* @__PURE__ */ jsx("section", { className: TraceComparison_default.root, children: /* @__PURE__ */ jsx("div", { className: TraceComparison_default.sideBySide, children: normalized.map((item) => /* @__PURE__ */ jsxs("article", { className: TraceComparison_default.panel, children: [
      /* @__PURE__ */ jsx("h3", { className: TraceComparison_default.title, children: item.label }),
      /* @__PURE__ */ jsx(TraceSummary, { result: item.data }),
      /* @__PURE__ */ jsx(
        TraceChart,
        {
          trace: item.data.trace,
          events: item.data.keyEvents.events,
          selectedEvent: sharedSelection,
          onEventClick: (_, index) => setSharedSelection(index),
          ...syncZoom && sharedViewport ? { viewport: sharedViewport } : {},
          ...syncZoom ? { onZoomChange: (viewport) => setSharedViewport(viewport) } : {}
        }
      )
    ] }, item.label)) }) });
  }
  if (mode === "difference") {
    const first = normalized[0]?.data.trace ?? [];
    const second = normalized[1]?.data.trace ?? [];
    const difference = computeDifferenceTrace(first, second);
    return /* @__PURE__ */ jsx("section", { className: TraceComparison_default.root, children: /* @__PURE__ */ jsxs("article", { className: TraceComparison_default.panel, children: [
      /* @__PURE__ */ jsx("h3", { className: TraceComparison_default.title, children: "Difference (Trace 1 - Trace 2)" }),
      /* @__PURE__ */ jsx(TraceChart, { trace: difference, events: [] })
    ] }) });
  }
  const primary = normalized[0];
  const overlays = normalized.slice(1).map((item) => ({ trace: item.data.trace, label: item.label, color: item.color }));
  return /* @__PURE__ */ jsxs("section", { className: TraceComparison_default.root, children: [
    /* @__PURE__ */ jsx("div", { className: TraceComparison_default.legend, children: normalized.map((item) => /* @__PURE__ */ jsxs("span", { className: TraceComparison_default.legendItem, children: [
      /* @__PURE__ */ jsx("span", { className: TraceComparison_default.swatch, style: { background: item.color } }),
      item.label
    ] }, `legend-${item.label}`)) }),
    primary ? /* @__PURE__ */ jsxs("article", { className: TraceComparison_default.panel, children: [
      /* @__PURE__ */ jsx("h3", { className: TraceComparison_default.title, children: "Overlay" }),
      /* @__PURE__ */ jsx(TraceChart, { trace: primary.data.trace, events: primary.data.keyEvents.events, overlays })
    ] }) : null
  ] });
}

// src/components/TraceReport/TraceReport.tsx
import { useEffect, useMemo as useMemo2, useState as useState2 } from "react";

// src/utils/trace-to-image.ts
async function traceToImageBlob(trace, options = {}) {
  const width = options.width ?? 1200;
  const height = options.height ?? 400;
  const mimeType = options.mimeType ?? "image/png";
  if (typeof document === "undefined") {
    throw new Error("traceToImageBlob requires a DOM environment");
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to acquire canvas context");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const viewport = computeViewport(trace);
  drawTrace(ctx, trace, viewport, { width, height }, { color: "#0f766e", lineWidth: 1.5, opacity: 1 });
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mimeType));
  if (!blob) {
    throw new Error("Failed to export trace image");
  }
  return blob;
}
async function traceToImageURL(trace, options) {
  const blob = await traceToImageBlob(trace, options);
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(blob);
  }
  if (typeof FileReader !== "undefined") {
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const output = reader.result;
        if (typeof output === "string") {
          resolve(output);
          return;
        }
        reject(new Error("Failed to serialize trace image"));
      };
      reader.onerror = () => reject(new Error("Failed to serialize trace image"));
      reader.readAsDataURL(blob);
    });
  }
  throw new Error("traceToImageURL requires URL.createObjectURL or FileReader support");
}

// src/components/TraceReport/TraceReport.module.css
var TraceReport_default = {};

// src/components/TraceReport/TraceReport.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
function TraceReport({
  result,
  companyName = "Fiber Services",
  companyLogo,
  technician = "",
  notes = ""
}) {
  const normalized = useMemo2(() => normalizeSorResult(result), [result]);
  const [traceUrl, setTraceUrl] = useState2(null);
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
  return /* @__PURE__ */ jsxs2("article", { className: TraceReport_default.root, children: [
    /* @__PURE__ */ jsxs2("header", { className: TraceReport_default.header, children: [
      /* @__PURE__ */ jsxs2("div", { children: [
        /* @__PURE__ */ jsx2("h1", { children: companyName }),
        /* @__PURE__ */ jsx2("p", { children: "OTDR Trace Report" })
      ] }),
      /* @__PURE__ */ jsx2("div", { children: companyLogo ? /* @__PURE__ */ jsx2("img", { src: companyLogo, alt: `${companyName} logo`, height: 40 }) : null })
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ jsx2("h2", { children: "Fiber Info" }),
      /* @__PURE__ */ jsx2("table", { className: TraceReport_default.table, children: /* @__PURE__ */ jsxs2("tbody", { children: [
        /* @__PURE__ */ jsxs2("tr", { children: [
          /* @__PURE__ */ jsx2("th", { children: "Cable ID" }),
          /* @__PURE__ */ jsx2("td", { children: normalized.genParams.cableId }),
          /* @__PURE__ */ jsx2("th", { children: "Fiber ID" }),
          /* @__PURE__ */ jsx2("td", { children: normalized.genParams.fiberId })
        ] }),
        /* @__PURE__ */ jsxs2("tr", { children: [
          /* @__PURE__ */ jsx2("th", { children: "Location A" }),
          /* @__PURE__ */ jsx2("td", { children: normalized.genParams.locationA }),
          /* @__PURE__ */ jsx2("th", { children: "Location B" }),
          /* @__PURE__ */ jsx2("td", { children: normalized.genParams.locationB })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ jsx2("h2", { children: "Equipment" }),
      /* @__PURE__ */ jsx2("table", { className: TraceReport_default.table, children: /* @__PURE__ */ jsx2("tbody", { children: /* @__PURE__ */ jsxs2("tr", { children: [
        /* @__PURE__ */ jsx2("th", { children: "OTDR" }),
        /* @__PURE__ */ jsx2("td", { children: normalized.supParams.otdr }),
        /* @__PURE__ */ jsx2("th", { children: "Software" }),
        /* @__PURE__ */ jsx2("td", { children: normalized.supParams.software })
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ jsx2("h2", { children: "Trace Plot" }),
      traceUrl ? /* @__PURE__ */ jsx2("img", { src: traceUrl, alt: "Trace plot", className: TraceReport_default.trace }) : /* @__PURE__ */ jsx2("p", { children: "Rendering trace..." })
    ] }),
    /* @__PURE__ */ jsxs2("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ jsx2("h2", { children: "Event Table" }),
      /* @__PURE__ */ jsxs2("table", { className: TraceReport_default.table, children: [
        /* @__PURE__ */ jsx2("thead", { children: /* @__PURE__ */ jsxs2("tr", { children: [
          /* @__PURE__ */ jsx2("th", { children: "#" }),
          /* @__PURE__ */ jsx2("th", { children: "Distance" }),
          /* @__PURE__ */ jsx2("th", { children: "Type" }),
          /* @__PURE__ */ jsx2("th", { children: "Splice Loss" }),
          /* @__PURE__ */ jsx2("th", { children: "Refl. Loss" })
        ] }) }),
        /* @__PURE__ */ jsx2("tbody", { children: normalized.keyEvents.events.map((event, index) => /* @__PURE__ */ jsxs2("tr", { className: TraceReport_default.noSplitRow, children: [
          /* @__PURE__ */ jsx2("td", { children: index + 1 }),
          /* @__PURE__ */ jsx2("td", { children: event.distance }),
          /* @__PURE__ */ jsx2("td", { children: event.type }),
          /* @__PURE__ */ jsx2("td", { children: event.spliceLoss }),
          /* @__PURE__ */ jsx2("td", { children: event.reflLoss })
        ] }, `report-event-${index}`)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs2("footer", { className: TraceReport_default.footer, children: [
      /* @__PURE__ */ jsxs2("p", { children: [
        "Technician: ",
        technician || "-"
      ] }),
      /* @__PURE__ */ jsxs2("p", { children: [
        "Notes: ",
        notes || "-"
      ] })
    ] })
  ] });
}

// src/hooks/useZoomPan.ts
import { useCallback, useEffect as useEffect2, useState as useState3 } from "react";
function useZoomPan(canvasRef, dataBounds) {
  void canvasRef;
  const [viewport, setViewportState] = useState3(dataBounds);
  useEffect2(() => {
    setViewportState(dataBounds);
  }, [dataBounds.xMin, dataBounds.xMax, dataBounds.yMin, dataBounds.yMax]);
  const setViewport = useCallback(
    (next) => {
      setViewportState(clampViewport(next, dataBounds));
    },
    [dataBounds]
  );
  const resetViewport = useCallback(() => {
    setViewportState(dataBounds);
  }, [dataBounds]);
  const zoomTo = useCallback(
    (xRange, yRange) => {
      const next = {
        xMin: xRange[0],
        xMax: xRange[1],
        yMin: yRange ? yRange[0] : viewport.yMin,
        yMax: yRange ? yRange[1] : viewport.yMax
      };
      setViewportState(clampViewport(next, dataBounds));
    },
    [dataBounds, viewport.yMin, viewport.yMax]
  );
  return {
    viewport,
    setViewport,
    resetViewport,
    zoomTo
  };
}

// src/hooks/useTraceData.ts
import { useEffect as useEffect3, useRef, useState as useState4 } from "react";
import { parseSor } from "sor-reader/browser";
function useTraceData(source, options) {
  const [result, setResult] = useState4(null);
  const [loading, setLoading] = useState4(false);
  const [error, setError] = useState4(null);
  const lastSourceRef = useRef(null);
  const lastResultRef = useRef(null);
  useEffect3(() => {
    let active = true;
    if (!source) {
      setResult(null);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }
    if (lastSourceRef.current === source && lastResultRef.current) {
      setResult(lastResultRef.current);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        let bytes;
        let filename = "input.sor";
        if (source instanceof Uint8Array) {
          bytes = source;
        } else {
          filename = source.name;
          bytes = new Uint8Array(await source.arrayBuffer());
        }
        const parsed = parseSor(bytes, filename, options);
        if (!active) return;
        lastSourceRef.current = source;
        lastResultRef.current = parsed;
        setResult(parsed);
      } catch (cause) {
        if (!active) return;
        const resolved = cause instanceof Error ? cause : new Error("Failed to parse SOR source");
        setError(resolved);
        setResult(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [source, options]);
  return { result, loading, error };
}

// src/hooks/useThresholds.ts
import { useMemo as useMemo3, useState as useState5 } from "react";
var DEFAULT_THRESHOLDS = {
  event: {
    spliceLoss: { warn: 0.3, fail: 0.5 },
    reflLoss: { warn: -50, fail: -40 },
    slope: { warn: 0.3, fail: 0.5 }
  },
  summary: {
    totalLoss: { fail: 10 },
    orl: { fail: 30 },
    fiberLength: { max: 100 }
  }
};
function mergeThresholds(base, partial) {
  return {
    event: {
      ...base.event,
      ...partial.event
    },
    summary: {
      ...base.summary,
      ...partial.summary
    }
  };
}
function useThresholds(defaults) {
  const base = useMemo3(() => mergeThresholds(DEFAULT_THRESHOLDS, defaults ?? {}), [defaults]);
  const [thresholds, setThresholds] = useState5(base);
  return {
    thresholds,
    updateThresholds: (partial) => {
      setThresholds((current) => mergeThresholds(current, partial));
    },
    resetThresholds: () => {
      setThresholds(base);
    }
  };
}
export {
  DISTANCE_CONVERSION_FACTORS,
  EquipmentInfoPanel,
  EventSelectionProvider,
  EventTable,
  FiberInfoPanel,
  FiberMap,
  InfoPanel,
  LossBudgetChart,
  MARGIN,
  MeasurementInfoPanel,
  PrintButton,
  SorDropZone,
  StatusBadge,
  TraceChart,
  TraceComparison,
  TraceMeasurementPanel,
  TraceReport,
  TraceSummary,
  TraceViewer,
  assessEvent,
  assessSummary,
  clampViewport,
  classifyEvent,
  computeCursorMeasurement,
  computeEventMarkers,
  computeLossBudget,
  computeViewport,
  configureHiDpiCanvas,
  convertDistance,
  convertDistanceLabel,
  createCanvas,
  createRenderScheduler,
  dataToPixel,
  drawCrosshair,
  drawEventMarkers,
  drawMeasurementCursors,
  drawTrace,
  drawTraceOverlays,
  drawXAxis,
  drawYAxis,
  findNearestTracePointIndex,
  formatDateTime,
  formatDistance,
  formatEventTooltip,
  formatPower,
  formatSlope,
  formatWavelength,
  getDevicePixelRatio,
  getPlotRect,
  getZoomAxisFromModifiers,
  hitTestEventMarkers,
  hitTestMeasurementCursors,
  lttb,
  normalizeSorResult,
  panViewportByPixels,
  pixelToData,
  renderFrame,
  resolveCrosshairState,
  toCursorPoints,
  traceToImageBlob,
  traceToImageURL,
  useEventSelection,
  useThresholds,
  useTraceData,
  useZoomPan,
  zoomViewportAtPixel
};
//# sourceMappingURL=index.js.map