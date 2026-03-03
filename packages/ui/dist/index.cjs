"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  DISTANCE_CONVERSION_FACTORS: () => DISTANCE_CONVERSION_FACTORS,
  EquipmentInfoPanel: () => EquipmentInfoPanel,
  EventSelectionProvider: () => EventSelectionProvider,
  EventTable: () => EventTable,
  FiberInfoPanel: () => FiberInfoPanel,
  FiberMap: () => FiberMap,
  InfoPanel: () => InfoPanel,
  LossBudgetChart: () => LossBudgetChart,
  MARGIN: () => MARGIN,
  MeasurementInfoPanel: () => MeasurementInfoPanel,
  PrintButton: () => PrintButton,
  SorDropZone: () => SorDropZone,
  StatusBadge: () => StatusBadge,
  TraceChart: () => TraceChart,
  TraceComparison: () => TraceComparison,
  TraceReport: () => TraceReport,
  TraceSummary: () => TraceSummary,
  TraceViewer: () => TraceViewer,
  assessEvent: () => assessEvent,
  assessSummary: () => assessSummary,
  clampViewport: () => clampViewport,
  classifyEvent: () => classifyEvent,
  computeEventMarkers: () => computeEventMarkers,
  computeLossBudget: () => computeLossBudget,
  computeViewport: () => computeViewport,
  configureHiDpiCanvas: () => configureHiDpiCanvas,
  convertDistance: () => convertDistance,
  convertDistanceLabel: () => convertDistanceLabel,
  createCanvas: () => createCanvas,
  createRenderScheduler: () => createRenderScheduler,
  dataToPixel: () => dataToPixel,
  drawCrosshair: () => drawCrosshair,
  drawEventMarkers: () => drawEventMarkers,
  drawTrace: () => drawTrace,
  drawTraceOverlays: () => drawTraceOverlays,
  drawXAxis: () => drawXAxis,
  drawYAxis: () => drawYAxis,
  findNearestTracePointIndex: () => findNearestTracePointIndex,
  formatDateTime: () => formatDateTime,
  formatDistance: () => formatDistance,
  formatEventTooltip: () => formatEventTooltip,
  formatPower: () => formatPower,
  formatSlope: () => formatSlope,
  formatWavelength: () => formatWavelength,
  getDevicePixelRatio: () => getDevicePixelRatio,
  getPlotRect: () => getPlotRect,
  getZoomAxisFromModifiers: () => getZoomAxisFromModifiers,
  hitTestEventMarkers: () => hitTestEventMarkers,
  lttb: () => lttb,
  normalizeSorResult: () => normalizeSorResult,
  panViewportByPixels: () => panViewportByPixels,
  pixelToData: () => pixelToData,
  renderFrame: () => renderFrame,
  resolveCrosshairState: () => resolveCrosshairState,
  traceToImageBlob: () => traceToImageBlob,
  traceToImageURL: () => traceToImageURL,
  useEventSelection: () => useEventSelection,
  useThresholds: () => useThresholds,
  useTraceData: () => useTraceData,
  useZoomPan: () => useZoomPan,
  zoomViewportAtPixel: () => zoomViewportAtPixel
});
module.exports = __toCommonJS(index_exports);

// src/types/units.ts
var DISTANCE_CONVERSION_FACTORS = {
  km: 1,
  m: 1e3,
  mi: 0.621371192237334,
  kft: 3.280839895013123
};

// src/utils/conversions.ts
var DISTANCE_LABELS = {
  km: "km",
  m: "m",
  mi: "miles",
  kft: "kft"
};
function convertDistance(km, to) {
  return km * DISTANCE_CONVERSION_FACTORS[to];
}
function convertDistanceLabel(unit) {
  return DISTANCE_LABELS[unit];
}

// src/utils/formatters.ts
var DISTANCE_PRECISION = {
  km: 3,
  m: 1,
  mi: 3,
  kft: 3
};
function normalizeNegativeZero(value) {
  return Object.is(value, -0) ? 0 : value;
}
function formatFixed(value, precision) {
  const normalized = normalizeNegativeZero(value);
  return normalized.toFixed(precision);
}
function formatDistance(valueKm, unit, precision) {
  const converted = convertDistance(valueKm, unit);
  const decimals = precision ?? DISTANCE_PRECISION[unit];
  return `${formatFixed(converted, decimals)} ${convertDistanceLabel(unit)}`;
}
function formatPower(dB, precision = 3) {
  return `${formatFixed(dB, precision)} dB`;
}
function formatSlope(dBkm, precision = 3) {
  return `${formatFixed(dBkm, precision)} dB/km`;
}
function formatWavelength(nm) {
  const trimmed = nm.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*nm$/i);
  if (!match) return trimmed;
  const numericPart = match[1];
  if (!numericPart) return trimmed;
  const value = Number.parseFloat(numericPart);
  if (!Number.isFinite(value)) return trimmed;
  return `${value % 1 === 0 ? value.toFixed(0) : value.toString()} nm`;
}
function formatDateTime(raw) {
  const timestampMatch = raw.match(/\((\d+)\s+sec\)/);
  const secondsPart = timestampMatch?.[1];
  const unixSeconds = secondsPart ? Number.parseInt(secondsPart, 10) : Number.NaN;
  if (Number.isFinite(unixSeconds)) {
    return new Date(unixSeconds * 1e3).toLocaleString(void 0, { timeZone: "UTC" });
  }
  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toLocaleString();
  }
  return raw.trim();
}

// src/utils/classifiers.ts
function parseEventTypeCode(type) {
  const match = type.match(/^([012])([A-Za-z0-9])9999([A-Za-z0-9])([SE])/);
  if (!match) return null;
  const first = match[1];
  const second = match[2];
  const last = match[4];
  if (!first || !second || !last) return null;
  return {
    first,
    second,
    last
  };
}
function parseNumeric(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function combineStatus(current, next) {
  if (current === "fail" || next === "fail") return "fail";
  if (current === "warn" || next === "warn") return "warn";
  return "pass";
}
function assessHigherIsWorse(value, threshold) {
  if (!threshold || !Number.isFinite(value)) return "pass";
  if (value >= threshold.fail) return "fail";
  if (value >= threshold.warn) return "warn";
  return "pass";
}
function classifyEvent(event) {
  const typeCode = parseEventTypeCode(event.type);
  if (!typeCode) return "unknown";
  const { first, second, last } = typeCode;
  if (last === "E") return "end-of-fiber";
  if (second === "A") return "manual";
  if (first === "1") return "reflection";
  if (first === "0") return "loss";
  if (first === "2") return "connector";
  return "unknown";
}
function assessEvent(event, thresholds) {
  const spliceLoss = parseNumeric(event.spliceLoss);
  const reflLoss = parseNumeric(event.reflLoss);
  const slope = parseNumeric(event.slope);
  let status = "pass";
  status = combineStatus(status, assessHigherIsWorse(spliceLoss, thresholds.spliceLoss));
  status = combineStatus(status, assessHigherIsWorse(reflLoss, thresholds.reflLoss));
  status = combineStatus(status, assessHigherIsWorse(slope, thresholds.slope));
  return status;
}
function assessSummary(summary, thresholds) {
  const fiberLength = Math.max(0, summary.lossEnd - summary.lossStart);
  if (thresholds.totalLoss && summary.totalLoss >= thresholds.totalLoss.fail) {
    return "fail";
  }
  if (thresholds.orl && summary.orl <= thresholds.orl.fail) {
    return "fail";
  }
  if (thresholds.fiberLength && fiberLength > thresholds.fiberLength.max) {
    return "fail";
  }
  if (thresholds.totalLoss && summary.totalLoss >= thresholds.totalLoss.fail * 0.9) {
    return "warn";
  }
  if (thresholds.orl && summary.orl <= thresholds.orl.fail * 1.1) {
    return "warn";
  }
  if (thresholds.fiberLength && fiberLength >= thresholds.fiberLength.max * 0.9) {
    return "warn";
  }
  return "pass";
}

// src/utils/loss-budget.ts
function parseNumeric2(input) {
  const value = Number.parseFloat(input);
  return Number.isFinite(value) ? value : 0;
}
function computeLossBudget(events) {
  const normalizedEvents = events.events.slice();
  const eventCount = normalizedEvents.length;
  const totalSpliceLoss = normalizedEvents.reduce((total, event) => total + parseNumeric2(event.spliceLoss), 0);
  const totalReflLoss = normalizedEvents.reduce((total, event) => total + parseNumeric2(event.reflLoss), 0);
  const maxSpliceLoss = eventCount === 0 ? 0 : normalizedEvents.reduce((max, event) => Math.max(max, parseNumeric2(event.spliceLoss)), Number.NEGATIVE_INFINITY);
  const avgSpliceLoss = eventCount > 0 ? totalSpliceLoss / eventCount : 0;
  const byDistance = normalizedEvents.map((event) => parseNumeric2(event.distance)).filter((distance) => Number.isFinite(distance)).sort((a, b) => a - b);
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

// src/utils/downsampling.ts
function lttb(data, targetCount) {
  if (targetCount <= 0) return [];
  if (data.length <= targetCount) return data;
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  if (!firstPoint || !lastPoint) return [];
  if (targetCount === 1) return [firstPoint];
  if (targetCount === 2) return [firstPoint, lastPoint];
  const sampled = [firstPoint];
  const every = (data.length - 2) / (targetCount - 2);
  let a = 0;
  for (let i = 0; i < targetCount - 2; i += 1) {
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, data.length);
    let avgX = 0;
    let avgY = 0;
    let avgRangeLength = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j += 1) {
      const point = data[j];
      if (!point) continue;
      avgX += point.distance;
      avgY += point.power;
      avgRangeLength += 1;
    }
    if (avgRangeLength === 0) avgRangeLength = 1;
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;
    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * every) + 1, data.length - 1);
    const pointA = data[a];
    let maxArea = Number.NEGATIVE_INFINITY;
    let maxAreaIndex = rangeOffs;
    for (let j = rangeOffs; j < rangeTo; j += 1) {
      const point = data[j];
      if (!point || !pointA) continue;
      const area = Math.abs(
        (pointA.distance - avgX) * (point.power - pointA.power) - (pointA.distance - point.distance) * (avgY - pointA.power)
      );
      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }
    const selectedPoint = data[maxAreaIndex];
    if (selectedPoint) {
      sampled.push(selectedPoint);
      a = maxAreaIndex;
    }
  }
  sampled.push(lastPoint);
  return sampled;
}

// src/adapters/normalize.ts
function parseNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function parseTimestamp(dateTime) {
  const match = dateTime.match(/\((\d+)\s+sec\)/);
  if (!match) return 0;
  const secondsPart = match[1];
  if (!secondsPart) return 0;
  const timestamp = Number.parseInt(secondsPart, 10);
  return Number.isFinite(timestamp) ? timestamp : 0;
}
function parseNumberWithUnit(value) {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const numericPart = match[0];
  if (!numericPart) return 0;
  return parseNumber(numericPart);
}
function asString(value, fallback = "") {
  return typeof value === "string" ? value : fallback;
}
function isKeyEventRawLike(input) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  const event = input;
  return typeof event.type === "string" && typeof event.distance === "string" && typeof event.slope === "string" && typeof event["splice loss"] === "string" && typeof event["refl loss"] === "string" && typeof event.comments === "string";
}
function toGenParams(input) {
  const base = {
    language: input.language,
    cableId: input["cable ID"],
    fiberId: input["fiber ID"],
    wavelength: input.wavelength,
    locationA: input["location A"],
    locationB: input["location B"],
    cableCode: input["cable code/fiber type"],
    buildCondition: input["build condition"],
    userOffset: input["user offset"],
    operator: input.operator,
    comments: input.comments
  };
  if (input["fiber type"] !== void 0 || input["user offset distance"] !== void 0) {
    return {
      ...base,
      fiberType: input["fiber type"] ?? "",
      userOffsetDistance: input["user offset distance"] ?? ""
    };
  }
  return base;
}
function toSupParams(input) {
  return {
    supplier: input.supplier,
    otdr: input.OTDR,
    otdrSerialNumber: input["OTDR S/N"],
    module: input.module,
    moduleSerialNumber: input["module S/N"],
    software: input.software,
    other: input.other
  };
}
function toFxdParams(input) {
  const base = {
    dateTime: new Date(parseTimestamp(input["date/time"]) * 1e3).toISOString(),
    dateTimeRaw: parseTimestamp(input["date/time"]),
    unit: input.unit,
    wavelength: input.wavelength,
    acquisitionOffset: input["acquisition offset"],
    pulseWidthEntries: input["number of pulse width entries"],
    pulseWidth: input["pulse width"],
    sampleSpacing: parseNumberWithUnit(input["sample spacing"]),
    numDataPoints: input["num data points"],
    indexOfRefraction: parseNumber(input.index),
    backscatterCoeff: input.BC,
    numAverages: input["num averages"],
    range: input.range,
    resolution: input.resolution,
    frontPanelOffset: input["front panel offset"],
    noiseFloorLevel: input["noise floor level"],
    noiseFloorScalingFactor: input["noise floor scaling factor"],
    powerOffsetFirstPoint: input["power offset first point"],
    lossThreshold: input["loss thr"],
    reflThreshold: input["refl thr"],
    eotThreshold: input["EOT thr"]
  };
  const hasV2Fields = input["acquisition offset distance"] !== void 0 || input["averaging time"] !== void 0 || input["acquisition range distance"] !== void 0 || input["trace type"] !== void 0 || input.X1 !== void 0 || input.Y1 !== void 0 || input.X2 !== void 0 || input.Y2 !== void 0;
  if (!hasV2Fields) return base;
  const v2 = {
    ...base,
    acquisitionOffsetDistance: input["acquisition offset distance"] ?? 0,
    averagingTime: input["averaging time"] ?? "",
    acquisitionRangeDistance: input["acquisition range distance"] ?? 0,
    traceType: input["trace type"] ?? "",
    x1: input.X1 ?? 0,
    y1: input.Y1 ?? 0,
    x2: input.X2 ?? 0,
    y2: input.Y2 ?? 0
  };
  return v2;
}
function toKeyEvent(input) {
  if (!isKeyEventRawLike(input)) {
    throw new TypeError("Invalid key event entry");
  }
  const event = input;
  const base = {
    type: event.type,
    distance: event.distance,
    slope: event.slope,
    spliceLoss: event["splice loss"],
    reflLoss: event["refl loss"],
    comments: event.comments
  };
  const hasV2 = typeof event["end of prev"] === "string" || typeof event["start of curr"] === "string" || typeof event["end of curr"] === "string" || typeof event["start of next"] === "string" || typeof event.peak === "string";
  if (!hasV2) return base;
  const v2 = {
    ...base,
    endOfPrev: asString(event["end of prev"], "0"),
    startOfCurr: asString(event["start of curr"], "0"),
    endOfCurr: asString(event["end of curr"], "0"),
    startOfNext: asString(event["start of next"], "0"),
    peak: asString(event.peak, "0")
  };
  return v2;
}
function toKeyEvents(input) {
  const eventKeys = Object.keys(input).filter((key) => /^event \d+$/.test(key)).sort((a, b) => Number.parseInt(a.slice(6), 10) - Number.parseInt(b.slice(6), 10));
  const events = eventKeys.map((key) => toKeyEvent(input[key]));
  return {
    numEvents: input["num events"],
    events,
    summary: {
      totalLoss: input.Summary["total loss"],
      orl: input.Summary.ORL,
      lossStart: input.Summary["loss start"],
      lossEnd: input.Summary["loss end"],
      orlStart: input.Summary["ORL start"],
      orlFinish: input.Summary["ORL finish"]
    }
  };
}
function toDataPts(input) {
  return {
    numDataPoints: input["num data points"],
    numTraces: input["num traces"],
    scalingFactor: input["scaling factor"],
    maxBeforeOffset: input["max before offset"],
    minBeforeOffset: input["min before offset"]
  };
}
function toChecksum(input) {
  return {
    stored: input.checksum,
    calculated: input.checksum_ours,
    valid: input.match
  };
}
function isSorData(input) {
  return "genParams" in input;
}
function normalizeSorResult(result) {
  if (isSorData(result)) {
    return result;
  }
  return {
    filename: result.filename,
    format: result.format,
    version: result.version,
    mapBlock: result.mapblock,
    blocks: result.blocks,
    genParams: toGenParams(result.GenParams),
    supParams: toSupParams(result.SupParams),
    fxdParams: toFxdParams(result.FxdParams),
    keyEvents: toKeyEvents(result.KeyEvents),
    dataPts: toDataPts(result.DataPts),
    checksum: toChecksum(result.Cksum),
    trace: result.trace
  };
}

// src/canvas/canvas-manager.ts
function resolveDocument(container) {
  if (container.ownerDocument) {
    return container.ownerDocument;
  }
  if (typeof document !== "undefined") {
    return document;
  }
  throw new Error("No document available to create canvas");
}
function getDevicePixelRatio() {
  if (typeof window === "undefined") return 1;
  const ratio = window.devicePixelRatio;
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return ratio;
}
function configureHiDpiCanvas(canvas, ctx, width, height, dpr = getDevicePixelRatio()) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const safeDpr = Number.isFinite(dpr) && dpr > 0 ? dpr : 1;
  canvas.width = Math.round(safeWidth * safeDpr);
  canvas.height = Math.round(safeHeight * safeDpr);
  canvas.style.width = `${safeWidth}px`;
  canvas.style.height = `${safeHeight}px`;
  ctx.setTransform(safeDpr, 0, 0, safeDpr, 0, 0);
  return {
    dpr: safeDpr,
    pixelWidth: canvas.width,
    pixelHeight: canvas.height
  };
}
function createCanvas(container, width, height, options = {}) {
  const doc = resolveDocument(container);
  const canvas = doc.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to acquire 2D canvas context");
  }
  container.appendChild(canvas);
  configureHiDpiCanvas(canvas, ctx, width, height);
  let resizeObserver = null;
  const autoResize = options.autoResize ?? false;
  const resize = (nextWidth, nextHeight) => {
    configureHiDpiCanvas(canvas, ctx, nextWidth, nextHeight);
  };
  if (autoResize && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = entry.contentRect.width;
      const nextHeight = height > 0 ? height : entry.contentRect.height;
      resize(nextWidth, nextHeight);
    });
    resizeObserver.observe(container);
  }
  const dispose = () => {
    resizeObserver?.disconnect();
    resizeObserver = null;
    if (canvas.parentElement === container) {
      container.removeChild(canvas);
    }
  };
  return { canvas, ctx, resize, dispose };
}

// src/canvas/coordinates.ts
var MARGIN = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 70
};
var DEFAULT_VIEWPORT = {
  xMin: 0,
  xMax: 1,
  yMin: -1,
  yMax: 1
};
function safeSpan(min, max) {
  const span = max - min;
  return span === 0 ? 1 : span;
}
function getPlotRect(canvasRect) {
  const width = Math.max(1, canvasRect.width - MARGIN.left - MARGIN.right);
  const height = Math.max(1, canvasRect.height - MARGIN.top - MARGIN.bottom);
  return {
    left: MARGIN.left,
    top: MARGIN.top,
    right: MARGIN.left + width,
    bottom: MARGIN.top + height,
    width,
    height
  };
}
function dataToPixel(dataX, dataY, viewport, canvasRect) {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = safeSpan(viewport.xMin, viewport.xMax);
  const ySpan = safeSpan(viewport.yMin, viewport.yMax);
  const xNorm = (dataX - viewport.xMin) / xSpan;
  const yNorm = (viewport.yMax - dataY) / ySpan;
  return {
    px: plotRect.left + xNorm * plotRect.width,
    py: plotRect.top + yNorm * plotRect.height
  };
}
function pixelToData(px, py, viewport, canvasRect) {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = safeSpan(viewport.xMin, viewport.xMax);
  const ySpan = safeSpan(viewport.yMin, viewport.yMax);
  const xNorm = (px - plotRect.left) / plotRect.width;
  const yNorm = (py - plotRect.top) / plotRect.height;
  return {
    dataX: viewport.xMin + xNorm * xSpan,
    dataY: viewport.yMax - yNorm * ySpan
  };
}
function computeBounds(trace) {
  if (trace.length === 0) {
    return DEFAULT_VIEWPORT;
  }
  let xMin = Number.POSITIVE_INFINITY;
  let xMax = Number.NEGATIVE_INFINITY;
  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;
  for (const point of trace) {
    if (point.distance < xMin) xMin = point.distance;
    if (point.distance > xMax) xMax = point.distance;
    if (point.power < yMin) yMin = point.power;
    if (point.power > yMax) yMax = point.power;
  }
  if (!Number.isFinite(xMin) || !Number.isFinite(xMax) || !Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    return DEFAULT_VIEWPORT;
  }
  if (xMin === xMax) {
    xMin -= 0.5;
    xMax += 0.5;
  }
  if (yMin === yMax) {
    yMin -= 0.5;
    yMax += 0.5;
  }
  return { xMin, xMax, yMin, yMax };
}
function computeViewport(trace, padding = 0.05) {
  const bounds = computeBounds(trace);
  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const xPad = xSpan * Math.max(0, padding);
  const yPad = ySpan * Math.max(0, padding);
  return {
    xMin: bounds.xMin - xPad,
    xMax: bounds.xMax + xPad,
    yMin: bounds.yMin - yPad,
    yMax: bounds.yMax + yPad
  };
}
function clampAxis(viewMin, viewMax, boundMin, boundMax) {
  if (boundMax <= boundMin) {
    return { min: boundMin, max: boundMax };
  }
  const boundsSpan = boundMax - boundMin;
  const desiredSpan = Math.max(0, viewMax - viewMin);
  const span = Math.min(boundsSpan, desiredSpan);
  if (span <= 0 || span >= boundsSpan) {
    return { min: boundMin, max: boundMax };
  }
  const min = Math.min(Math.max(viewMin, boundMin), boundMax - span);
  return { min, max: min + span };
}
function clampViewport(viewport, dataBounds) {
  const x = clampAxis(viewport.xMin, viewport.xMax, dataBounds.xMin, dataBounds.xMax);
  const y = clampAxis(viewport.yMin, viewport.yMax, dataBounds.yMin, dataBounds.yMax);
  return {
    xMin: x.min,
    xMax: x.max,
    yMin: y.min,
    yMax: y.max
  };
}

// src/canvas/axes.ts
var DEFAULT_AXIS_STYLE = {
  axisColor: "#334155",
  gridColor: "#cbd5e1",
  labelColor: "#0f172a",
  font: "12px sans-serif"
};
function niceStep(range, targetTickCount = 8) {
  if (!Number.isFinite(range) || range <= 0) return 1;
  const rawStep = range / Math.max(1, targetTickCount);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  let snapped = 1;
  if (normalized > 1) snapped = 2;
  if (normalized > 2) snapped = 5;
  if (normalized > 5) snapped = 10;
  return snapped * magnitude;
}
function buildTicks(min, max, targetTickCount = 8) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return [];
  const step = niceStep(max - min, targetTickCount);
  const ticks = [];
  const start = Math.ceil(min / step) * step;
  for (let value = start; value <= max + step * 0.5; value += step) {
    ticks.push(Number(value.toFixed(12)));
  }
  return ticks;
}
function drawVerticalGridLine(ctx, x, top, bottom, gridColor) {
  const alignedX = Math.round(x) + 0.5;
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(alignedX, top);
  ctx.lineTo(alignedX, bottom);
  ctx.stroke();
  ctx.restore();
}
function drawHorizontalGridLine(ctx, y, left, right, gridColor) {
  const alignedY = Math.round(y) + 0.5;
  ctx.save();
  ctx.strokeStyle = gridColor;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(left, alignedY);
  ctx.lineTo(right, alignedY);
  ctx.stroke();
  ctx.restore();
}
function getDistancePrecision(stepKm) {
  if (stepKm >= 10) return 1;
  if (stepKm >= 1) return 2;
  return 3;
}
function drawXAxis(ctx, viewport, canvasRect, unit, style = {}) {
  const mergedStyle = { ...DEFAULT_AXIS_STYLE, ...style };
  const plotRect = getPlotRect(canvasRect);
  const ticks = buildTicks(viewport.xMin, viewport.xMax);
  const firstTick = ticks[0];
  const secondTick = ticks[1];
  const tickStep = firstTick !== void 0 && secondTick !== void 0 ? secondTick - firstTick : viewport.xMax - viewport.xMin;
  const precision = getDistancePrecision(Math.abs(tickStep));
  ctx.save();
  ctx.font = mergedStyle.font;
  ctx.fillStyle = mergedStyle.labelColor;
  ctx.strokeStyle = mergedStyle.axisColor;
  const axisY = Math.round(plotRect.bottom) + 0.5;
  ctx.beginPath();
  ctx.moveTo(plotRect.left, axisY);
  ctx.lineTo(plotRect.right, axisY);
  ctx.stroke();
  for (const tick of ticks) {
    const { px } = dataToPixel(tick, viewport.yMin, viewport, canvasRect);
    const axisX = Math.round(px) + 0.5;
    drawVerticalGridLine(ctx, axisX, plotRect.top, plotRect.bottom, mergedStyle.gridColor);
    ctx.beginPath();
    ctx.moveTo(axisX, axisY);
    ctx.lineTo(axisX, axisY + 6);
    ctx.stroke();
    const label = formatDistance(tick, unit, precision);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, axisX - labelWidth / 2, plotRect.bottom + 20);
  }
  const title = `Distance (${unit})`;
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, plotRect.left + plotRect.width / 2 - titleWidth / 2, plotRect.bottom + 40);
  ctx.restore();
}
function drawYAxis(ctx, viewport, canvasRect, style = {}) {
  const mergedStyle = { ...DEFAULT_AXIS_STYLE, ...style };
  const plotRect = getPlotRect(canvasRect);
  const ticks = buildTicks(viewport.yMin, viewport.yMax);
  ctx.save();
  ctx.font = mergedStyle.font;
  ctx.fillStyle = mergedStyle.labelColor;
  ctx.strokeStyle = mergedStyle.axisColor;
  const axisX = Math.round(plotRect.left) + 0.5;
  ctx.beginPath();
  ctx.moveTo(axisX, plotRect.top);
  ctx.lineTo(axisX, plotRect.bottom);
  ctx.stroke();
  for (const tick of ticks) {
    const { py } = dataToPixel(viewport.xMin, tick, viewport, canvasRect);
    const axisY = Math.round(py) + 0.5;
    drawHorizontalGridLine(ctx, axisY, plotRect.left, plotRect.right, mergedStyle.gridColor);
    ctx.beginPath();
    ctx.moveTo(axisX - 6, axisY);
    ctx.lineTo(axisX, axisY);
    ctx.stroke();
    const label = formatPower(tick, 2);
    const labelWidth = ctx.measureText(label).width;
    ctx.fillText(label, plotRect.left - labelWidth - 10, axisY + 4);
  }
  ctx.translate(20, plotRect.top + plotRect.height / 2);
  ctx.rotate(-Math.PI / 2);
  const title = "Power (dB)";
  const titleWidth = ctx.measureText(title).width;
  ctx.fillText(title, -titleWidth / 2, 0);
  ctx.restore();
}

// src/canvas/trace-renderer.ts
var DEFAULT_TRACE_STYLE = {
  color: "#0f766e",
  lineWidth: 1.5,
  opacity: 1
};
function findLowerBoundIndex(trace, distance) {
  let low = 0;
  let high = trace.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const point = trace[mid];
    if (!point || point.distance < distance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
function selectVisibleTrace(trace, viewport) {
  if (trace.length === 0) return [];
  const startIndex = Math.max(0, findLowerBoundIndex(trace, viewport.xMin) - 1);
  const selected = [];
  for (let i = startIndex; i < trace.length; i += 1) {
    const point = trace[i];
    if (!point) continue;
    selected.push(point);
    if (point.distance > viewport.xMax) break;
  }
  if (selected.length === 0) {
    const nearest = trace[Math.min(trace.length - 1, startIndex)];
    return nearest ? [nearest] : [];
  }
  return selected;
}
function resolveRenderableTrace(trace, viewport, canvasRect) {
  const visible = selectVisibleTrace(trace, viewport);
  if (visible.length <= 2) return visible;
  const plotRect = getPlotRect(canvasRect);
  const targetCount = Math.max(2, Math.ceil(plotRect.width));
  if (visible.length <= targetCount) return visible;
  return lttb(visible, targetCount);
}
function drawTrace(ctx, trace, viewport, canvasRect, style) {
  const renderTrace = resolveRenderableTrace(trace, viewport, canvasRect);
  if (renderTrace.length === 0) return;
  const mergedStyle = { ...DEFAULT_TRACE_STYLE, ...style };
  ctx.save();
  ctx.strokeStyle = mergedStyle.color;
  ctx.lineWidth = mergedStyle.lineWidth;
  ctx.globalAlpha = mergedStyle.opacity;
  ctx.beginPath();
  let started = false;
  for (const point of renderTrace) {
    const { px, py } = dataToPixel(point.distance, point.power, viewport, canvasRect);
    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }
  if (started) {
    ctx.stroke();
  }
  ctx.restore();
}
function drawTraceOverlays(ctx, overlays, viewport, canvasRect) {
  for (const overlay of overlays) {
    drawTrace(ctx, overlay.trace, viewport, canvasRect, {
      color: overlay.color
    });
  }
}

// src/canvas/crosshair.ts
function findNearestTracePointIndex(trace, distanceKm) {
  if (trace.length === 0) return -1;
  let low = 0;
  let high = trace.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const point = trace[mid];
    if (!point) return -1;
    if (point.distance < distanceKm) {
      low = mid + 1;
    } else if (point.distance > distanceKm) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  const rightIndex = Math.min(trace.length - 1, low);
  const leftIndex = Math.max(0, rightIndex - 1);
  const left = trace[leftIndex];
  const right = trace[rightIndex];
  if (!left || !right) return -1;
  return Math.abs(left.distance - distanceKm) <= Math.abs(right.distance - distanceKm) ? leftIndex : rightIndex;
}
function resolveCrosshairState(trace, pointerPx, pointerPy, viewport, canvasRect, unit) {
  if (trace.length === 0) return null;
  const data = pixelToData(pointerPx, pointerPy, viewport, canvasRect);
  const index = findNearestTracePointIndex(trace, data.dataX);
  if (index < 0) return null;
  const point = trace[index];
  if (!point) return null;
  const position = dataToPixel(point.distance, point.power, viewport, canvasRect);
  return {
    point,
    index,
    px: position.px,
    py: position.py,
    label: `${formatDistance(point.distance, unit)}, ${formatPower(point.power, 2)}`
  };
}
function drawCrosshair(ctx, state, canvasRect, style = {}) {
  const plotRect = getPlotRect(canvasRect);
  const lineColor = style.lineColor ?? "#64748b";
  const textColor = style.textColor ?? "#0f172a";
  const labelBackground = style.labelBackground ?? "rgba(248, 250, 252, 0.92)";
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(Math.round(state.px) + 0.5, plotRect.top);
  ctx.lineTo(Math.round(state.px) + 0.5, plotRect.bottom);
  ctx.moveTo(plotRect.left, Math.round(state.py) + 0.5);
  ctx.lineTo(plotRect.right, Math.round(state.py) + 0.5);
  ctx.stroke();
  ctx.setLineDash([]);
  const paddingX = 8;
  const paddingY = 5;
  ctx.font = "12px sans-serif";
  const labelWidth = ctx.measureText(state.label).width;
  const labelHeight = 20;
  const desiredX = state.px + 10;
  const desiredY = state.py - 30;
  const x = Math.min(Math.max(plotRect.left, desiredX), plotRect.right - labelWidth - paddingX * 2);
  const y = Math.min(Math.max(plotRect.top, desiredY), plotRect.bottom - labelHeight);
  ctx.fillStyle = labelBackground;
  ctx.fillRect(x, y, labelWidth + paddingX * 2, labelHeight);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
  ctx.strokeRect(x, y, labelWidth + paddingX * 2, labelHeight);
  ctx.fillStyle = textColor;
  ctx.fillText(state.label, x + paddingX, y + labelHeight - paddingY);
  ctx.restore();
}

// src/canvas/render-pipeline.ts
function clearCanvas(ctx, canvasRect, color) {
  if (color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvasRect.width, canvasRect.height);
    ctx.restore();
    return;
  }
  ctx.clearRect(0, 0, canvasRect.width, canvasRect.height);
}
function renderFrame(context) {
  clearCanvas(context.ctx, context.canvasRect, context.clearColor);
  drawTraceOverlays(context.ctx, context.overlays, context.viewport, context.canvasRect);
  context.drawEventMarkers?.();
  drawXAxis(context.ctx, context.viewport, context.canvasRect, context.unit, context.axisStyle);
  drawYAxis(context.ctx, context.viewport, context.canvasRect, context.axisStyle);
  if (context.crosshair) {
    drawCrosshair(context.ctx, context.crosshair, context.canvasRect, context.crosshairStyle);
  }
  context.drawCrosshair?.();
}
function requestFrame(callback) {
  if (typeof requestAnimationFrame === "function") {
    return requestAnimationFrame(() => callback());
  }
  return setTimeout(callback, 16);
}
function cancelFrame(frameId) {
  if (typeof cancelAnimationFrame === "function") {
    cancelAnimationFrame(frameId);
    return;
  }
  clearTimeout(frameId);
}
function createRenderScheduler(render) {
  let frameId = null;
  let dirty = false;
  const flush = () => {
    frameId = null;
    if (!dirty) return;
    dirty = false;
    render();
  };
  const markDirty = () => {
    dirty = true;
  };
  const scheduleRender = () => {
    markDirty();
    if (frameId !== null) return;
    frameId = requestFrame(flush);
  };
  const cancel = () => {
    if (frameId === null) return;
    cancelFrame(frameId);
    frameId = null;
  };
  return {
    scheduleRender,
    markDirty,
    isDirty: () => dirty,
    cancel
  };
}

// src/canvas/interactions.ts
function getZoomAxisFromModifiers(modifiers) {
  if (modifiers.shiftKey) return "x";
  if (modifiers.ctrlKey) return "y";
  return "both";
}
function clampSpan(span, minSpan, maxSpan) {
  if (maxSpan <= 0) return minSpan;
  return Math.min(maxSpan, Math.max(minSpan, span));
}
function zoomViewportAtPixel(viewport, dataBounds, cursorPx, cursorPy, canvasRect, zoomFactor, axis = "both", options = {}) {
  const anchor = pixelToData(cursorPx, cursorPy, viewport, canvasRect);
  let next = { ...viewport };
  const maxSpanX = Math.max(0, dataBounds.xMax - dataBounds.xMin);
  const maxSpanY = Math.max(0, dataBounds.yMax - dataBounds.yMin);
  const minSpanX = options.minSpanX ?? (maxSpanX / 1e4 || 1e-3);
  const minSpanY = options.minSpanY ?? (maxSpanY / 1e4 || 1e-3);
  if (axis === "both" || axis === "x") {
    const currentSpanX = Math.max(0, viewport.xMax - viewport.xMin);
    const clampedSpanX = clampSpan(currentSpanX / zoomFactor, minSpanX, maxSpanX);
    const ratioX = currentSpanX > 0 ? (anchor.dataX - viewport.xMin) / currentSpanX : 0.5;
    const xMin = anchor.dataX - ratioX * clampedSpanX;
    next = {
      ...next,
      xMin,
      xMax: xMin + clampedSpanX
    };
  }
  if (axis === "both" || axis === "y") {
    const currentSpanY = Math.max(0, viewport.yMax - viewport.yMin);
    const clampedSpanY = clampSpan(currentSpanY / zoomFactor, minSpanY, maxSpanY);
    const ratioY = currentSpanY > 0 ? (anchor.dataY - viewport.yMin) / currentSpanY : 0.5;
    const yMin = anchor.dataY - ratioY * clampedSpanY;
    next = {
      ...next,
      yMin,
      yMax: yMin + clampedSpanY
    };
  }
  return clampViewport(next, dataBounds);
}
function panViewportByPixels(viewport, dataBounds, deltaPx, deltaPy, canvasRect) {
  const plotRect = getPlotRect(canvasRect);
  const xSpan = viewport.xMax - viewport.xMin;
  const ySpan = viewport.yMax - viewport.yMin;
  const xPerPixel = xSpan / plotRect.width;
  const yPerPixel = ySpan / plotRect.height;
  const next = {
    xMin: viewport.xMin - deltaPx * xPerPixel,
    xMax: viewport.xMax - deltaPx * xPerPixel,
    yMin: viewport.yMin + deltaPy * yPerPixel,
    yMax: viewport.yMax + deltaPy * yPerPixel
  };
  return clampViewport(next, dataBounds);
}

// src/canvas/event-markers.ts
var MARKER_COLORS = {
  reflection: "#b91c1c",
  loss: "#0f766e",
  connector: "#1d4ed8",
  "end-of-fiber": "#111827",
  manual: "#a16207",
  unknown: "#6b7280"
};
function parseDistance(distance) {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : Number.NaN;
}
function drawMarkerShape(ctx, category, px, py, radius) {
  ctx.beginPath();
  if (category === "reflection") {
    ctx.moveTo(px, py - radius);
    ctx.lineTo(px + radius, py + radius);
    ctx.lineTo(px - radius, py + radius);
    ctx.closePath();
    return;
  }
  if (category === "connector") {
    ctx.moveTo(px, py - radius);
    ctx.lineTo(px + radius, py);
    ctx.lineTo(px, py + radius);
    ctx.lineTo(px - radius, py);
    ctx.closePath();
    return;
  }
  if (category === "end-of-fiber") {
    ctx.moveTo(px - radius, py - radius);
    ctx.lineTo(px + radius, py + radius);
    ctx.moveTo(px + radius, py - radius);
    ctx.lineTo(px - radius, py + radius);
    return;
  }
  ctx.arc(px, py, radius, 0, Math.PI * 2);
}
function computeEventMarkers(events, trace, viewport, canvasRect) {
  if (events.length === 0 || trace.length === 0) return [];
  const markers = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event) continue;
    const distance = parseDistance(event.distance);
    if (!Number.isFinite(distance)) continue;
    const traceIndex = findNearestTracePointIndex(trace, distance);
    if (traceIndex < 0) continue;
    const tracePoint = trace[traceIndex];
    if (!tracePoint) continue;
    const position = dataToPixel(distance, tracePoint.power, viewport, canvasRect);
    markers.push({
      index,
      event,
      category: classifyEvent(event),
      distance,
      power: tracePoint.power,
      px: position.px,
      py: position.py
    });
  }
  return markers;
}
function drawEventMarkers(ctx, markers, canvasRect, selectedIndex = null) {
  if (markers.length === 0) return;
  const plotRect = getPlotRect(canvasRect);
  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const color = MARKER_COLORS[marker.category] ?? MARKER_COLORS.unknown;
    const radius = 8;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isSelected ? 3 : 2;
    if (isSelected) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
    }
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(marker.px) + 0.5, marker.py);
    ctx.lineTo(Math.round(marker.px) + 0.5, plotRect.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    drawMarkerShape(ctx, marker.category, marker.px, marker.py, radius);
    if (marker.category === "end-of-fiber") {
      ctx.stroke();
    } else {
      ctx.fill();
      ctx.stroke();
    }
    const label = `${marker.index + 1}`;
    ctx.font = "11px sans-serif";
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = "#111827";
    ctx.fillText(label, marker.px - labelWidth / 2, marker.py - 12);
    ctx.restore();
  }
}
function hitTestEventMarkers(markers, px, py, hitRadius = 12) {
  const radiusSq = hitRadius * hitRadius;
  for (const marker of markers) {
    const dx = marker.px - px;
    const dy = marker.py - py;
    if (dx * dx + dy * dy <= radiusSq) {
      return marker.index;
    }
  }
  return null;
}
function formatEventTooltip(marker, unit) {
  return [
    `Event #${marker.index + 1} \u2014 ${marker.category}`,
    `Distance: ${formatDistance(marker.distance, unit)}`,
    `Power: ${formatPower(marker.power, 2)}`,
    `Splice Loss: ${marker.event.spliceLoss} dB`,
    `Refl. Loss: ${marker.event.reflLoss} dB`
  ].join("\n");
}

// src/components/TraceChart.tsx
var import_react = require("react");

// src/components/TraceChart.module.css
var TraceChart_default = {};

// src/components/TraceChart.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function getCanvasRect(canvas) {
  return {
    width: canvas.clientWidth || Math.max(1, canvas.width),
    height: canvas.clientHeight || Math.max(1, canvas.height)
  };
}
function readCssVariable(style, key, fallback) {
  const value = style.getPropertyValue(key).trim();
  return value.length > 0 ? value : fallback;
}
function computeMinSpanX(trace) {
  if (trace.length < 2) return 1e-3;
  const lastIndex = Math.min(trace.length - 1, 10);
  const first = trace[0];
  const last = trace[lastIndex];
  if (!first || !last) return 1e-3;
  return Math.max(1e-3, last.distance - first.distance);
}
function parseDistance2(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function TraceChart({
  trace,
  events = [],
  overlays = [],
  viewport: controlledViewport,
  width = "auto",
  height = 360,
  xUnit = "km",
  selectedEvent = null,
  className,
  onPointHover,
  onEventClick,
  onZoomChange
}) {
  const containerRef = (0, import_react.useRef)(null);
  const canvasHandleRef = (0, import_react.useRef)(null);
  const schedulerRef = (0, import_react.useRef)(null);
  const traceRef = (0, import_react.useRef)(trace);
  const eventsRef = (0, import_react.useRef)(events);
  const overlaysRef = (0, import_react.useRef)(overlays);
  const xUnitRef = (0, import_react.useRef)(xUnit);
  const selectedEventRef = (0, import_react.useRef)(selectedEvent);
  const onPointHoverRef = (0, import_react.useRef)(onPointHover);
  const onEventClickRef = (0, import_react.useRef)(onEventClick);
  const onZoomChangeRef = (0, import_react.useRef)(onZoomChange);
  traceRef.current = trace;
  eventsRef.current = events;
  overlaysRef.current = overlays;
  xUnitRef.current = xUnit;
  selectedEventRef.current = selectedEvent;
  onPointHoverRef.current = onPointHover;
  onEventClickRef.current = onEventClick;
  onZoomChangeRef.current = onZoomChange;
  const baseViewport = (0, import_react.useMemo)(() => computeViewport(trace), [trace]);
  const [viewport, setViewportState] = (0, import_react.useState)(baseViewport);
  const viewportRef = (0, import_react.useRef)(viewport);
  const boundsRef = (0, import_react.useRef)(computeViewport(trace, 0));
  const crosshairRef = (0, import_react.useRef)(null);
  const markersRef = (0, import_react.useRef)([]);
  const dragRef = (0, import_react.useRef)({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0
  });
  const renderRef = (0, import_react.useRef)(() => void 0);
  const [tooltip, setTooltip] = (0, import_react.useState)(null);
  const [liveLabel, setLiveLabel] = (0, import_react.useState)("");
  const keyboardMarkerIndexRef = (0, import_react.useRef)(-1);
  const setViewport = (next, notify = true) => {
    viewportRef.current = next;
    setViewportState(next);
    if (notify) {
      onZoomChangeRef.current?.(next);
    }
    schedulerRef.current?.scheduleRender();
  };
  (0, import_react.useEffect)(() => {
    boundsRef.current = computeViewport(trace, 0);
    crosshairRef.current = null;
    setTooltip(null);
    if (!controlledViewport) {
      setViewport(computeViewport(trace), false);
    }
  }, [trace]);
  (0, import_react.useEffect)(() => {
    if (!controlledViewport) return;
    setViewport(controlledViewport, false);
  }, [controlledViewport]);
  (0, import_react.useEffect)(() => {
    if (selectedEvent === null || selectedEvent < 0) return;
    const event = events[selectedEvent];
    if (!event) return;
    const centerX = parseDistance2(event.distance);
    if (!Number.isFinite(centerX)) return;
    const current = viewportRef.current;
    const currentSpan = Math.max(computeMinSpanX(traceRef.current), current.xMax - current.xMin);
    const nextSpan = Math.max(computeMinSpanX(traceRef.current), currentSpan * 0.5);
    const next = {
      ...current,
      xMin: centerX - nextSpan / 2,
      xMax: centerX + nextSpan / 2
    };
    setViewport(next, false);
  }, [events, selectedEvent]);
  renderRef.current = () => {
    const handle = canvasHandleRef.current;
    if (!handle) return;
    const canvasRect = getCanvasRect(handle.canvas);
    const computed = getComputedStyle(handle.canvas);
    const traceColor = readCssVariable(computed, "--otdr-trace-primary", "#0f766e");
    const chartBackground = readCssVariable(computed, "--otdr-chart-bg", "#ffffff");
    const axisColor = readCssVariable(computed, "--otdr-axis-color", "#334155");
    const axisLabelColor = readCssVariable(computed, "--otdr-axis-label", "#0f172a");
    const gridColor = readCssVariable(computed, "--otdr-grid-color", "#cbd5e1");
    const crosshairColor = readCssVariable(computed, "--otdr-crosshair-color", "#64748b");
    const panelColor = readCssVariable(computed, "--otdr-panel", "#ffffff");
    const composedOverlays = [
      { trace: traceRef.current, label: "Primary", color: traceColor },
      ...overlaysRef.current
    ];
    const markers = computeEventMarkers(eventsRef.current, traceRef.current, viewportRef.current, canvasRect);
    markersRef.current = markers;
    renderFrame({
      ctx: handle.ctx,
      canvasRect,
      viewport: viewportRef.current,
      overlays: composedOverlays,
      unit: xUnitRef.current,
      clearColor: chartBackground,
      drawEventMarkers: () => {
        drawEventMarkers(handle.ctx, markers, canvasRect, selectedEventRef.current);
      },
      crosshair: crosshairRef.current,
      axisStyle: {
        axisColor,
        gridColor,
        labelColor: axisLabelColor
      },
      crosshairStyle: {
        lineColor: crosshairColor,
        labelBackground: panelColor
      }
    });
  };
  const zoomFromCenter = (zoomFactor, axis = "both") => {
    const handle = canvasHandleRef.current;
    if (!handle) return;
    const canvasRect = getCanvasRect(handle.canvas);
    const next = zoomViewportAtPixel(
      viewportRef.current,
      boundsRef.current,
      canvasRect.width / 2,
      canvasRect.height / 2,
      canvasRect,
      zoomFactor,
      axis,
      { minSpanX: computeMinSpanX(traceRef.current) }
    );
    setViewport(next);
  };
  const panFromKeyboard = (deltaX, deltaY) => {
    const handle = canvasHandleRef.current;
    if (!handle) return;
    const canvasRect = getCanvasRect(handle.canvas);
    const next = panViewportByPixels(viewportRef.current, boundsRef.current, deltaX, deltaY, canvasRect);
    setViewport(next);
  };
  (0, import_react.useEffect)(() => {
    const container = containerRef.current;
    if (!container) return void 0;
    const initialWidth = width === "auto" ? Math.max(320, container.clientWidth || 0) : width;
    const handle = createCanvas(container, initialWidth, height, { autoResize: width === "auto" });
    handle.canvas.className = TraceChart_default.canvas ?? "";
    canvasHandleRef.current = handle;
    const scheduler = createRenderScheduler(() => renderRef.current());
    schedulerRef.current = scheduler;
    const onWheel = (event) => {
      event.preventDefault();
      const canvasRect = getCanvasRect(handle.canvas);
      const axis = getZoomAxisFromModifiers(event);
      const factor = event.deltaY < 0 ? 1.15 : 1 / 1.15;
      const next = zoomViewportAtPixel(
        viewportRef.current,
        boundsRef.current,
        event.offsetX,
        event.offsetY,
        canvasRect,
        factor,
        axis,
        { minSpanX: computeMinSpanX(traceRef.current) }
      );
      setViewport(next);
    };
    const onPointerDown = (event) => {
      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        lastX: event.offsetX,
        lastY: event.offsetY
      };
      handle.canvas.setPointerCapture(event.pointerId);
      handle.canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (event) => {
      const drag = dragRef.current;
      const canvasRect = getCanvasRect(handle.canvas);
      if (drag.active && drag.pointerId === event.pointerId) {
        const deltaX = event.offsetX - drag.lastX;
        const deltaY = event.offsetY - drag.lastY;
        dragRef.current = {
          ...drag,
          lastX: event.offsetX,
          lastY: event.offsetY
        };
        const next = panViewportByPixels(viewportRef.current, boundsRef.current, deltaX, deltaY, canvasRect);
        setViewport(next);
        return;
      }
      const crosshair = resolveCrosshairState(
        traceRef.current,
        event.offsetX,
        event.offsetY,
        viewportRef.current,
        canvasRect,
        xUnitRef.current
      );
      crosshairRef.current = crosshair;
      if (crosshair) {
        onPointHoverRef.current?.(crosshair.point, crosshair.index);
        setLiveLabel(crosshair.label);
      }
      const hit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (hit === null) {
        setTooltip(null);
      } else {
        const marker = markersRef.current.find((candidate) => candidate.index === hit);
        if (marker) {
          setTooltip({
            left: event.offsetX + 12,
            top: event.offsetY + 12,
            text: formatEventTooltip(marker, xUnitRef.current)
          });
        }
      }
      scheduler.scheduleRender();
    };
    const onPointerUp = (event) => {
      if (dragRef.current.pointerId !== event.pointerId) return;
      dragRef.current = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0
      };
      handle.canvas.releasePointerCapture(event.pointerId);
      handle.canvas.style.cursor = "crosshair";
    };
    const onPointerLeave = () => {
      if (!dragRef.current.active) {
        crosshairRef.current = null;
        setTooltip(null);
        scheduler.scheduleRender();
      }
    };
    const onClick = (event) => {
      const hit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (hit === null) return;
      const selected = eventsRef.current[hit];
      if (!selected) return;
      onEventClickRef.current?.(selected, hit);
    };
    const onDoubleClick = () => {
      setViewport(computeViewport(traceRef.current));
    };
    handle.canvas.addEventListener("wheel", onWheel, { passive: false });
    handle.canvas.addEventListener("pointerdown", onPointerDown);
    handle.canvas.addEventListener("pointermove", onPointerMove);
    handle.canvas.addEventListener("pointerup", onPointerUp);
    handle.canvas.addEventListener("pointercancel", onPointerUp);
    handle.canvas.addEventListener("pointerleave", onPointerLeave);
    handle.canvas.addEventListener("click", onClick);
    handle.canvas.addEventListener("dblclick", onDoubleClick);
    scheduler.scheduleRender();
    return () => {
      handle.canvas.removeEventListener("wheel", onWheel);
      handle.canvas.removeEventListener("pointerdown", onPointerDown);
      handle.canvas.removeEventListener("pointermove", onPointerMove);
      handle.canvas.removeEventListener("pointerup", onPointerUp);
      handle.canvas.removeEventListener("pointercancel", onPointerUp);
      handle.canvas.removeEventListener("pointerleave", onPointerLeave);
      handle.canvas.removeEventListener("click", onClick);
      handle.canvas.removeEventListener("dblclick", onDoubleClick);
      scheduler.cancel();
      schedulerRef.current = null;
      canvasHandleRef.current = null;
      handle.dispose();
    };
  }, [height, width]);
  (0, import_react.useEffect)(() => {
    schedulerRef.current?.scheduleRender();
  }, [viewport, events, overlays, xUnit, selectedEvent]);
  const rootStyle = width === "auto" ? { height: `${height}px` } : { width: `${width}px`, height: `${height}px` };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    "div",
    {
      ref: containerRef,
      className: className ? `${TraceChart_default.root} ${className}` : TraceChart_default.root,
      style: rootStyle,
      role: "img",
      "aria-label": `OTDR trace chart with ${trace.length} data points and ${events.length} events`,
      tabIndex: 0,
      onKeyDown: (event) => {
        const panPixels = 24;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          panFromKeyboard(-panPixels, 0);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          panFromKeyboard(panPixels, 0);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          panFromKeyboard(0, -panPixels);
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          panFromKeyboard(0, panPixels);
          return;
        }
        if (event.key === "+" || event.key === "=") {
          event.preventDefault();
          zoomFromCenter(1.15);
          return;
        }
        if (event.key === "-") {
          event.preventDefault();
          zoomFromCenter(1 / 1.15);
          return;
        }
        if (event.key === "Home") {
          event.preventDefault();
          setViewport(computeViewport(traceRef.current));
          return;
        }
        if (event.key === "Tab" && markersRef.current.length > 0) {
          event.preventDefault();
          const direction = event.shiftKey ? -1 : 1;
          keyboardMarkerIndexRef.current = (keyboardMarkerIndexRef.current + direction + markersRef.current.length) % markersRef.current.length;
          const marker = markersRef.current[keyboardMarkerIndexRef.current];
          if (!marker) return;
          const handle = canvasHandleRef.current;
          if (!handle) return;
          const canvasRect = getCanvasRect(handle.canvas);
          const state = resolveCrosshairState(
            traceRef.current,
            marker.px,
            marker.py,
            viewportRef.current,
            canvasRect,
            xUnitRef.current
          );
          crosshairRef.current = state;
          setLiveLabel(state?.label ?? `Event ${marker.index + 1}`);
          onEventClickRef.current?.(marker.event, marker.index);
          schedulerRef.current?.scheduleRender();
          return;
        }
        if (event.key === "Enter" && keyboardMarkerIndexRef.current >= 0) {
          const marker = markersRef.current[keyboardMarkerIndexRef.current];
          if (marker) {
            onEventClickRef.current?.(marker.event, marker.index);
          }
        }
      },
      children: [
        tooltip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.tooltip, style: { left: tooltip.left, top: tooltip.top }, children: tooltip.text }) : null,
        trace.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.empty, children: "No trace points available" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.liveRegion, "aria-live": "polite", children: liveLabel })
      ]
    }
  );
}

// src/components/TraceSummary.tsx
var import_react2 = require("react");

// src/components/primitives/StatusBadge.module.css
var StatusBadge_default = {};

// src/components/primitives/StatusBadge.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var DEFAULT_LABELS = {
  pass: "Pass",
  warn: "Warning",
  fail: "Fail",
  neutral: "Neutral"
};
function StatusBadge({ status, label }) {
  const resolvedLabel = label ?? DEFAULT_LABELS[status];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: `${StatusBadge_default.badge} ${StatusBadge_default[status] ?? ""}`, role: "status", "aria-label": `Status: ${resolvedLabel}`, children: resolvedLabel });
}

// src/components/TraceSummary.module.css
var TraceSummary_default = {};

// src/components/TraceSummary.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function parseDistance3(distance) {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : 0;
}
function TraceSummary({ result, thresholds = {}, xUnit = "km" }) {
  const normalized = (0, import_react2.useMemo)(() => normalizeSorResult(result), [result]);
  const { cards, status } = (0, import_react2.useMemo)(() => {
    const summary = normalized.keyEvents.summary;
    const lastEvent = normalized.keyEvents.events[normalized.keyEvents.events.length - 1];
    const fiberLength = lastEvent ? parseDistance3(lastEvent.distance) : normalized.fxdParams.range;
    const avgLossPerKm = fiberLength > 0 ? summary.totalLoss / fiberLength : 0;
    const computedStatus = assessSummary(summary, thresholds);
    const metricCards = [
      {
        key: "fiberLength",
        label: "Fiber Length",
        value: formatDistance(fiberLength, xUnit)
      },
      {
        key: "totalLoss",
        label: "Total Loss",
        value: formatPower(summary.totalLoss, 3)
      },
      {
        key: "orl",
        label: "ORL",
        value: formatPower(summary.orl, 3)
      },
      {
        key: "avgLoss",
        label: "Avg Loss/km",
        value: `${avgLossPerKm.toFixed(3)} dB/km`
      },
      {
        key: "wavelength",
        label: "Wavelength",
        value: formatWavelength(normalized.genParams.wavelength)
      },
      {
        key: "eventCount",
        label: "Events",
        value: `${normalized.keyEvents.events.length}`
      }
    ];
    return {
      cards: metricCards,
      status: computedStatus
    };
  }, [normalized, thresholds, xUnit]);
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: TraceSummary_default.root, "aria-label": "Trace summary", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TraceSummary_default.badge, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StatusBadge, { status }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TraceSummary_default.grid, children: cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("article", { className: TraceSummary_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TraceSummary_default.value, children: card.value }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: TraceSummary_default.label, children: card.label })
    ] }, card.key)) })
  ] });
}

// src/components/EventTable.tsx
var import_react3 = require("react");

// src/components/EventTable.module.css
var EventTable_default = {};

// src/components/EventTable.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function parseNumber2(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function cycleSortState(current, key) {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}
function renderType(category) {
  if (category === "end-of-fiber") return "End of Fiber";
  return category.charAt(0).toUpperCase() + category.slice(1);
}
function ariaSortValue(sortState, key) {
  if (!sortState || sortState.key !== key) return "none";
  return sortState.direction === "asc" ? "ascending" : "descending";
}
function EventTable({
  result,
  compact = false,
  xUnit = "km",
  thresholds = {},
  selectedEvent = null,
  onEventSelect
}) {
  const normalized = (0, import_react3.useMemo)(() => normalizeSorResult(result), [result]);
  const [sortState, setSortState] = (0, import_react3.useState)(null);
  const rowRefs = (0, import_react3.useRef)([]);
  const rows = (0, import_react3.useMemo)(() => {
    const prepared = normalized.keyEvents.events.map((event, index) => {
      const category = classifyEvent(event);
      const status = assessEvent(event, thresholds);
      return {
        index,
        event,
        distance: parseNumber2(event.distance),
        type: category,
        spliceLoss: parseNumber2(event.spliceLoss),
        reflLoss: parseNumber2(event.reflLoss),
        slope: parseNumber2(event.slope),
        status
      };
    });
    if (!sortState) return prepared;
    const { key, direction } = sortState;
    const sorted = prepared.slice().sort((a, b) => {
      const multiplier = direction === "asc" ? 1 : -1;
      if (key === "type") {
        return a.type.localeCompare(b.type) * multiplier;
      }
      if (key === "index") {
        return (a.index - b.index) * multiplier;
      }
      return (a[key] - b[key]) * multiplier;
    });
    return sorted;
  }, [normalized, sortState, thresholds]);
  (0, import_react3.useEffect)(() => {
    if (selectedEvent === null || selectedEvent < 0) return;
    const row = rowRefs.current[selectedEvent];
    if (!row) return;
    if (typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [selectedEvent]);
  const summary = normalized.keyEvents.summary;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { className: EventTable_default.wrapper, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("table", { className: EventTable_default.table, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("thead", { className: EventTable_default.head, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "index"), onClick: () => setSortState((current) => cycleSortState(current, "index")), children: "#" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "distance"), onClick: () => setSortState((current) => cycleSortState(current, "distance")), children: "Distance" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "type"), onClick: () => setSortState((current) => cycleSortState(current, "type")), children: "Type" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "spliceLoss"), onClick: () => setSortState((current) => cycleSortState(current, "spliceLoss")), children: "Splice Loss" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "reflLoss"), onClick: () => setSortState((current) => cycleSortState(current, "reflLoss")), children: "Refl. Loss" }),
      !compact ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "slope"), onClick: () => setSortState((current) => cycleSortState(current, "slope")), children: "Slope" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("th", { scope: "col", children: "Status" })
      ] }) : null
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("tbody", { className: EventTable_default.body, children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "tr",
      {
        ref: (node) => {
          rowRefs.current[row.index] = node;
        },
        className: selectedEvent === row.index ? EventTable_default.selected : void 0,
        onClick: () => onEventSelect?.(row.event, row.index),
        tabIndex: 0,
        onKeyDown: (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onEventSelect?.(row.event, row.index);
            return;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            onEventSelect?.(null, null);
            return;
          }
          if (event.key === "ArrowDown") {
            event.preventDefault();
            rowRefs.current[row.index + 1]?.focus();
            return;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            rowRefs.current[Math.max(0, row.index - 1)]?.focus();
          }
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { children: row.index + 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { children: formatDistance(row.distance, xUnit) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: EventTable_default.typeCell, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { className: EventTable_default.icon }),
            renderType(row.type)
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { children: [
            row.spliceLoss.toFixed(3),
            " dB"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { children: [
            row.reflLoss.toFixed(3),
            " dB"
          ] }),
          !compact ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(import_jsx_runtime4.Fragment, { children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { children: [
              row.slope.toFixed(3),
              " dB/km"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(StatusBadge, { status: row.status }) })
          ] }) : null
        ]
      },
      `${row.index}-${row.event.distance}-${row.event.type}`
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("tfoot", { className: EventTable_default.footer, children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("tr", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("td", { colSpan: compact ? 3 : 5, children: "Summary" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { colSpan: compact ? 2 : 1, children: [
        "Total Loss: ",
        summary.totalLoss.toFixed(3),
        " dB"
      ] }),
      !compact ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("td", { children: [
        "ORL: ",
        summary.orl.toFixed(3),
        " dB"
      ] }) : null
    ] }) })
  ] }) });
}

// src/components/LossBudgetChart.tsx
var import_react4 = require("react");

// src/components/LossBudgetChart.module.css
var LossBudgetChart_default = {};

// src/components/LossBudgetChart.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function parseNumber3(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function LossBudgetChart({
  events,
  thresholds = {},
  selectedEvent = null,
  onBarClick,
  vertical = false
}) {
  const rows = (0, import_react4.useMemo)(() => {
    const withLoss = events.map((event, index) => ({
      event,
      index,
      spliceLoss: parseNumber3(event.spliceLoss)
    })).filter((row) => row.spliceLoss !== 0);
    const maxLoss = Math.max(
      0,
      ...withLoss.map((row) => Math.abs(row.spliceLoss)),
      thresholds.spliceLoss?.fail ?? 0,
      thresholds.spliceLoss?.warn ?? 0
    );
    return {
      maxLoss,
      rows: withLoss.map((row) => {
        const status = assessEvent(row.event, thresholds);
        const widthPct = maxLoss > 0 ? Math.abs(row.spliceLoss) / maxLoss * 100 : 0;
        return {
          ...row,
          status,
          widthPct
        };
      })
    };
  }, [events, thresholds]);
  const warnPct = rows.maxLoss > 0 && thresholds.spliceLoss?.warn ? thresholds.spliceLoss.warn / rows.maxLoss * 100 : null;
  const failPct = rows.maxLoss > 0 && thresholds.spliceLoss?.fail ? thresholds.spliceLoss.fail / rows.maxLoss * 100 : null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("section", { className: `${LossBudgetChart_default.root} ${vertical ? LossBudgetChart_default.vertical : ""}`, "aria-label": "Loss budget chart", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: LossBudgetChart_default.chart, children: rows.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    "button",
    {
      className: `${LossBudgetChart_default.row} ${selectedEvent === row.index ? LossBudgetChart_default.selected : ""}`,
      onClick: () => onBarClick?.(row.event, row.index),
      type: "button",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: LossBudgetChart_default.label, children: [
          "#",
          row.index + 1
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: `${LossBudgetChart_default.track} ${vertical ? LossBudgetChart_default.trackVertical : ""}`, children: [
          warnPct !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `${LossBudgetChart_default.threshold} ${vertical ? LossBudgetChart_default.thresholdVertical : ""}`, style: vertical ? { bottom: `${warnPct}%` } : { left: `${warnPct}%` } }) : null,
          failPct !== null ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: `${LossBudgetChart_default.threshold} ${vertical ? LossBudgetChart_default.thresholdVertical : ""}`, style: vertical ? { bottom: `${failPct}%` } : { left: `${failPct}%` } }) : null,
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "span",
            {
              className: `${LossBudgetChart_default.bar} ${vertical ? LossBudgetChart_default.barVertical : ""} ${LossBudgetChart_default[row.status] ?? LossBudgetChart_default.pass}`,
              style: vertical ? { height: `${row.widthPct}%` } : { width: `${row.widthPct}%` }
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { className: LossBudgetChart_default.value, children: [
          row.spliceLoss.toFixed(3),
          " dB"
        ] })
      ]
    },
    `loss-${row.index}`
  )) }) });
}

// src/components/FiberMap.tsx
var import_react5 = require("react");

// src/components/FiberMap.module.css
var FiberMap_default = {};

// src/components/FiberMap.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function parseDistance4(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function markerColor(type) {
  if (type === "reflection") return "#b91c1c";
  if (type === "end-of-fiber") return "#111827";
  if (type === "connector") return "#1d4ed8";
  if (type === "manual") return "#a16207";
  if (type === "loss") return "#0f766e";
  return "#64748b";
}
function FiberMap({
  events,
  locationA = "A",
  locationB = "B",
  selectedEvent = null,
  orientation = "horizontal",
  onEventClick
}) {
  const markerRefs = (0, import_react5.useRef)([]);
  const prepared = (0, import_react5.useMemo)(() => {
    const parsed = events.map((event, index) => ({
      event,
      index,
      distance: parseDistance4(event.distance),
      type: classifyEvent(event)
    }));
    const maxDistance = Math.max(1, ...parsed.map((item) => item.distance));
    return parsed.map((item) => ({
      ...item,
      ratio: item.distance / maxDistance
    }));
  }, [events]);
  const isVertical = orientation === "vertical";
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("section", { className: FiberMap_default.root, "aria-label": "Fiber map", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("svg", { viewBox: isVertical ? "0 0 180 420" : "0 0 1000 180", className: FiberMap_default.svg, children: [
    isVertical ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: "90", y1: "24", x2: "90", y2: "390", stroke: "#334155", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: "90", y: "16", textAnchor: "middle", className: FiberMap_default.label, children: locationA }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: "90", y: "412", textAnchor: "middle", className: FiberMap_default.label, children: locationB })
    ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("line", { x1: "30", y1: "90", x2: "970", y2: "90", stroke: "#334155", strokeWidth: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: "30", y: "74", textAnchor: "start", className: FiberMap_default.label, children: locationA }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("text", { x: "970", y: "74", textAnchor: "end", className: FiberMap_default.label, children: locationB })
    ] }),
    prepared.map((item) => {
      const x = isVertical ? 90 : 30 + item.ratio * 940;
      const y = isVertical ? 24 + item.ratio * 366 : 90;
      const selected = selectedEvent === item.index;
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "g",
        {
          ref: (node) => {
            markerRefs.current[item.index] = node;
          },
          className: FiberMap_default.event,
          onClick: () => onEventClick?.(item.event, item.index),
          "aria-label": `Event ${item.index + 1}`,
          tabIndex: 0,
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onEventClick?.(item.event, item.index);
              return;
            }
            if (event.key === "ArrowRight" || event.key === "ArrowDown") {
              event.preventDefault();
              markerRefs.current[item.index + 1]?.focus();
              return;
            }
            if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
              event.preventDefault();
              markerRefs.current[Math.max(0, item.index - 1)]?.focus();
            }
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
              "circle",
              {
                cx: x,
                cy: y,
                r: "8",
                fill: markerColor(item.type),
                className: selected ? FiberMap_default.selected : void 0
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("text", { x: isVertical ? x + 14 : x, y: isVertical ? y + 4 : y - 14, textAnchor: isVertical ? "start" : "middle", className: FiberMap_default.label, children: [
              "#",
              item.index + 1
            ] })
          ]
        },
        `map-event-${item.index}`
      );
    })
  ] }) });
}

// src/components/SorDropZone.tsx
var import_react6 = require("react");
var import_browser = require("sor-reader/browser");

// src/components/SorDropZone.module.css
var SorDropZone_default = {};

// src/components/SorDropZone.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
async function parseFile(file, parseOptions) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return (0, import_browser.parseSor)(bytes, file.name, parseOptions);
}
function SorDropZone({ multiple = false, parseOptions, children, onResult, onError }) {
  const inputRef = (0, import_react6.useRef)(null);
  const [dragHover, setDragHover] = (0, import_react6.useState)(false);
  const [loading, setLoading] = (0, import_react6.useState)(false);
  const [error, setError] = (0, import_react6.useState)(null);
  const className = [
    SorDropZone_default.root,
    dragHover ? SorDropZone_default.hover : "",
    loading ? SorDropZone_default.loading : "",
    error ? SorDropZone_default.error : ""
  ].filter(Boolean).join(" ");
  const processFiles = async (files) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const selectedFiles = multiple ? Array.from(files) : [files[0]].filter((file) => Boolean(file));
      for (const file of selectedFiles) {
        const result = await parseFile(file, parseOptions);
        onResult?.(result);
      }
    } catch (cause) {
      const resolved = cause instanceof Error ? cause : new Error("Failed to parse SOR file");
      setError(resolved.message);
      onError?.(resolved);
    } finally {
      setLoading(false);
    }
  };
  const onKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    "label",
    {
      className,
      onDragEnter: (event) => {
        event.preventDefault();
        setDragHover(true);
      },
      onDragOver: (event) => {
        event.preventDefault();
        setDragHover(true);
      },
      onDragLeave: (event) => {
        event.preventDefault();
        setDragHover(false);
      },
      onDrop: (event) => {
        event.preventDefault();
        setDragHover(false);
        void processFiles(event.dataTransfer.files);
      },
      tabIndex: 0,
      onKeyDown,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            ref: inputRef,
            type: "file",
            accept: ".sor",
            multiple,
            className: SorDropZone_default.input,
            onChange: (event) => {
              if (!event.currentTarget.files) return;
              void processFiles(event.currentTarget.files);
            }
          }
        ),
        children ?? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { children: loading ? "Parsing..." : "Drop .sor file here or click to select" }),
        error ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: error }) : null
      ]
    }
  );
}

// src/components/TraceViewer/TraceViewer.tsx
var import_react12 = require("react");

// src/hooks/useEventSelection.tsx
var import_react7 = require("react");
var import_jsx_runtime8 = require("react/jsx-runtime");
var EventSelectionContext = (0, import_react7.createContext)(null);
function EventSelectionProvider({ children }) {
  const [selectedIndex, setSelectedIndex] = (0, import_react7.useState)(null);
  const value = (0, import_react7.useMemo)(
    () => ({
      selectedIndex,
      select: setSelectedIndex
    }),
    [selectedIndex]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(EventSelectionContext.Provider, { value, children });
}
function useEventSelection() {
  const context = (0, import_react7.useContext)(EventSelectionContext);
  if (!context) {
    return {
      selectedIndex: null,
      select: () => void 0
    };
  }
  return context;
}

// src/components/PrintButton.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function PrintButton({ label = "Print" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", onClick: () => window.print(), children: label });
}

// src/components/info/EquipmentInfoPanel.tsx
var import_react9 = require("react");

// src/components/info/InfoPanel.tsx
var import_react8 = require("react");

// src/components/info/InfoPanel.module.css
var InfoPanel_default = {};

// src/components/info/InfoPanel.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function Entries({ entries }) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dl", { className: InfoPanel_default.list, children: entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_react8.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dt", { className: InfoPanel_default.term, children: entry.label }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dd", { className: InfoPanel_default.value, children: entry.value })
  ] }, entry.label)) });
}
function InfoPanel({ title, entries, collapsible = true, defaultExpanded = true }) {
  if (!collapsible) {
    return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("section", { className: InfoPanel_default.root, "aria-label": title, children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("header", { className: InfoPanel_default.header, children: title }),
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: InfoPanel_default.body, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Entries, { entries }) })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("details", { className: InfoPanel_default.root, open: defaultExpanded, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("summary", { className: InfoPanel_default.summary, children: title }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("div", { className: InfoPanel_default.body, children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(Entries, { entries }) })
  ] });
}

// src/components/info/EquipmentInfoPanel.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
function EquipmentInfoPanel({ supParams }) {
  const entries = (0, import_react9.useMemo)(
    () => [
      { label: "Supplier", value: supParams.supplier },
      { label: "OTDR", value: supParams.otdr },
      { label: "OTDR S/N", value: supParams.otdrSerialNumber },
      { label: "Module", value: supParams.module },
      { label: "Module S/N", value: supParams.moduleSerialNumber },
      { label: "Software", value: supParams.software },
      { label: "Other", value: supParams.other }
    ].filter((entry) => entry.value.trim().length > 0),
    [supParams]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(InfoPanel, { title: "Equipment", entries });
}

// src/components/info/FiberInfoPanel.tsx
var import_react10 = require("react");
var import_jsx_runtime12 = require("react/jsx-runtime");
function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function FiberInfoPanel({ genParams }) {
  const entries = (0, import_react10.useMemo)(() => {
    const candidates = [
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
      "userOffsetDistance" in genParams ? { label: "User Offset Dist.", value: genParams.userOffsetDistance } : null
    ];
    return candidates.filter((entry) => Boolean(entry && present(entry.value)));
  }, [genParams]);
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(InfoPanel, { title: "Fiber Info", entries });
}

// src/components/info/MeasurementInfoPanel.tsx
var import_react11 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
function MeasurementInfoPanel({ fxdParams }) {
  const entries = (0, import_react11.useMemo)(() => {
    const base = [
      { label: "Date/Time", value: fxdParams.dateTime },
      { label: "Pulse Width", value: fxdParams.pulseWidth },
      { label: "Samples", value: `${fxdParams.numDataPoints}` },
      { label: "Range", value: formatDistance(fxdParams.range, "km") },
      { label: "Resolution", value: `${fxdParams.resolution.toFixed(3)} m` },
      { label: "Index", value: fxdParams.indexOfRefraction.toFixed(6) },
      { label: "Backscatter", value: fxdParams.backscatterCoeff },
      { label: "Loss Thr.", value: fxdParams.lossThreshold },
      { label: "Refl Thr.", value: fxdParams.reflThreshold },
      { label: "EOT Thr.", value: fxdParams.eotThreshold }
    ];
    if ("averagingTime" in fxdParams) {
      base.push(
        { label: "Averaging", value: fxdParams.averagingTime },
        { label: "Trace Type", value: fxdParams.traceType }
      );
    }
    return base;
  }, [fxdParams]);
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsx)(InfoPanel, { title: "Measurement", entries });
}

// src/components/TraceViewer/TraceViewer.module.css
var TraceViewer_default = {};

// src/components/TraceViewer/TraceViewer.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function useCompactLayout(layout, hostRef) {
  const [compact, setCompact] = (0, import_react12.useState)(layout === "compact");
  (0, import_react12.useEffect)(() => {
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
function TraceViewerInner({
  result,
  thresholds,
  xUnit = "km",
  layout = "full",
  sections,
  onEventSelect,
  showPrintButton = false,
  onExposeApi
}) {
  const normalized = (0, import_react12.useMemo)(() => normalizeSorResult(result), [result]);
  const hostRef = (0, import_react12.useRef)(null);
  const { selectedIndex, select } = useEventSelection();
  const compact = useCompactLayout(layout, hostRef);
  (0, import_react12.useEffect)(() => {
    onExposeApi({
      select,
      resetZoom: () => select(null)
    });
  }, [onExposeApi, select]);
  (0, import_react12.useEffect)(() => {
    onEventSelect?.(selectedIndex);
  }, [onEventSelect, selectedIndex]);
  const visible = new Set(
    sections ?? ["summary", "chart", "fiberMap", "eventTable", "lossBudget", "fiberInfo", "equipment", "measurement"]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { ref: hostRef, className: `${TraceViewer_default.root} ${compact ? TraceViewer_default.compact : TraceViewer_default.full}`, children: [
    visible.has("summary") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.summary, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(TraceSummary, { result: normalized, thresholds: thresholds?.summary, xUnit }) }) : null,
    visible.has("chart") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("div", { className: TraceViewer_default.chart, children: [
      showPrintButton ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(PrintButton, {}) : null,
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        TraceChart,
        {
          trace: normalized.trace,
          events: normalized.keyEvents.events,
          xUnit,
          selectedEvent: selectedIndex,
          onEventClick: (_, index) => select(index)
        }
      )
    ] }) : null,
    visible.has("fiberMap") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.fibermap, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      FiberMap,
      {
        events: normalized.keyEvents.events,
        locationA: normalized.genParams.locationA,
        locationB: normalized.genParams.locationB,
        selectedEvent: selectedIndex,
        onEventClick: (_, index) => select(index)
      }
    ) }) : null,
    visible.has("eventTable") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.table, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      EventTable,
      {
        result: normalized,
        xUnit,
        thresholds: thresholds?.event,
        selectedEvent: selectedIndex,
        onEventSelect: (_, index) => select(index)
      }
    ) }) : null,
    visible.has("lossBudget") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.losschart, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
      LossBudgetChart,
      {
        events: normalized.keyEvents.events,
        thresholds: thresholds?.event,
        selectedEvent: selectedIndex,
        onBarClick: (_, index) => select(index)
      }
    ) }) : null,
    visible.has("fiberInfo") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.fiber, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(FiberInfoPanel, { genParams: normalized.genParams }) }) : null,
    visible.has("equipment") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.equip, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EquipmentInfoPanel, { supParams: normalized.supParams }) }) : null,
    visible.has("measurement") ? /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { className: TraceViewer_default.measure, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(MeasurementInfoPanel, { fxdParams: normalized.fxdParams }) }) : null
  ] });
}
var TraceViewer = (0, import_react12.forwardRef)(function TraceViewer2(props, ref) {
  const hostRef = (0, import_react12.useRef)(null);
  const apiRef = (0, import_react12.useRef)({
    select: () => void 0,
    resetZoom: () => void 0
  });
  (0, import_react12.useImperativeHandle)(
    ref,
    () => ({
      zoomToEvent: (index) => {
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
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
        if (!blob) {
          throw new Error("Failed to export chart image");
        }
        return blob;
      }
    }),
    []
  );
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("div", { ref: hostRef, children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(EventSelectionProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
    TraceViewerInner,
    {
      ...props,
      onExposeApi: (api) => {
        apiRef.current = api;
      }
    }
  ) }) });
});

// src/components/TraceComparison.tsx
var import_react13 = require("react");

// src/components/TraceComparison.module.css
var TraceComparison_default = {};

// src/components/TraceComparison.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
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
  const normalized = (0, import_react13.useMemo)(
    () => traces.map((item, index) => ({
      ...item,
      data: normalizeSorResult(item.result),
      color: item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length] ?? "#0f766e"
    })),
    [traces]
  );
  const [sharedSelection, setSharedSelection] = (0, import_react13.useState)(null);
  const [sharedViewport, setSharedViewport] = (0, import_react13.useState)(void 0);
  if (mode === "side-by-side") {
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("section", { className: TraceComparison_default.root, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: TraceComparison_default.sideBySide, children: normalized.map((item) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("article", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("h3", { children: item.label }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(TraceSummary, { result: item.data }),
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
    return /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("section", { className: TraceComparison_default.root, children: /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(TraceChart, { trace: difference, events: [] }) });
  }
  const primary = normalized[0];
  const overlays = normalized.slice(1).map((item) => ({ trace: item.data.trace, label: item.label, color: item.color }));
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("section", { className: TraceComparison_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("div", { className: TraceComparison_default.legend, children: normalized.map((item) => /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("span", { className: TraceComparison_default.legendItem, children: [
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { className: TraceComparison_default.swatch, style: { background: item.color } }),
      item.label
    ] }, `legend-${item.label}`)) }),
    primary ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(TraceChart, { trace: primary.data.trace, events: primary.data.keyEvents.events, overlays }) : null
  ] });
}

// src/components/TraceReport/TraceReport.tsx
var import_react14 = require("react");

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
var import_jsx_runtime16 = require("react/jsx-runtime");
function TraceReport({
  result,
  companyName = "Fiber Services",
  companyLogo,
  technician = "",
  notes = ""
}) {
  const normalized = (0, import_react14.useMemo)(() => normalizeSorResult(result), [result]);
  const [traceUrl, setTraceUrl] = (0, import_react14.useState)(null);
  (0, import_react14.useEffect)(() => {
    let active = true;
    void traceToImageURL(normalized.trace).then((url) => {
      if (!active) return;
      setTraceUrl(url);
    });
    return () => {
      active = false;
    };
  }, [normalized.trace]);
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("article", { className: TraceReport_default.root, children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("header", { className: TraceReport_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h1", { children: companyName }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "OTDR Trace Report" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("div", { children: companyLogo ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("img", { src: companyLogo, alt: `${companyName} logo`, height: 40 }) : null })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { children: "Fiber Info" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("table", { className: TraceReport_default.table, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tbody", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Cable ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.genParams.cableId }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Fiber ID" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.genParams.fiberId })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Location A" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.genParams.locationA }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Location B" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.genParams.locationB })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { children: "Equipment" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("table", { className: TraceReport_default.table, children: /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "OTDR" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.supParams.otdr }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Software" }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: normalized.supParams.software })
      ] }) }) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { children: "Trace Plot" }),
      traceUrl ? /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("img", { src: traceUrl, alt: "Trace plot", className: TraceReport_default.trace }) : /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "Rendering trace..." })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("section", { className: TraceReport_default.section, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("h2", { children: "Event Table" }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("table", { className: TraceReport_default.table, children: [
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "#" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Distance" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Type" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Splice Loss" }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("th", { children: "Refl. Loss" })
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("tbody", { children: normalized.keyEvents.events.map((event, index) => /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("tr", { className: TraceReport_default.noSplitRow, children: [
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: index + 1 }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: event.distance }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: event.type }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: event.spliceLoss }),
          /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("td", { children: event.reflLoss })
        ] }, `report-event-${index}`)) })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("footer", { className: TraceReport_default.footer, children: [
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
        "Technician: ",
        technician || "-"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
        "Notes: ",
        notes || "-"
      ] })
    ] })
  ] });
}

// src/hooks/useZoomPan.ts
var import_react15 = require("react");
function useZoomPan(canvasRef, dataBounds) {
  void canvasRef;
  const [viewport, setViewportState] = (0, import_react15.useState)(dataBounds);
  (0, import_react15.useEffect)(() => {
    setViewportState(dataBounds);
  }, [dataBounds.xMin, dataBounds.xMax, dataBounds.yMin, dataBounds.yMax]);
  const setViewport = (0, import_react15.useCallback)(
    (next) => {
      setViewportState(clampViewport(next, dataBounds));
    },
    [dataBounds]
  );
  const resetViewport = (0, import_react15.useCallback)(() => {
    setViewportState(dataBounds);
  }, [dataBounds]);
  const zoomTo = (0, import_react15.useCallback)(
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
var import_react16 = require("react");
var import_browser2 = require("sor-reader/browser");
function useTraceData(source, options) {
  const [result, setResult] = (0, import_react16.useState)(null);
  const [loading, setLoading] = (0, import_react16.useState)(false);
  const [error, setError] = (0, import_react16.useState)(null);
  const lastSourceRef = (0, import_react16.useRef)(null);
  const lastResultRef = (0, import_react16.useRef)(null);
  (0, import_react16.useEffect)(() => {
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
        const parsed = (0, import_browser2.parseSor)(bytes, filename, options);
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
var import_react17 = require("react");
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
  const base = (0, import_react17.useMemo)(() => mergeThresholds(DEFAULT_THRESHOLDS, defaults ?? {}), [defaults]);
  const [thresholds, setThresholds] = (0, import_react17.useState)(base);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
  TraceReport,
  TraceSummary,
  TraceViewer,
  assessEvent,
  assessSummary,
  clampViewport,
  classifyEvent,
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
  lttb,
  normalizeSorResult,
  panViewportByPixels,
  pixelToData,
  renderFrame,
  resolveCrosshairState,
  traceToImageBlob,
  traceToImageURL,
  useEventSelection,
  useThresholds,
  useTraceData,
  useZoomPan,
  zoomViewportAtPixel
});
//# sourceMappingURL=index.cjs.map