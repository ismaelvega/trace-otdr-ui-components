"use strict";

// src/web-components/index.ts
var import_react14 = require("react");

// src/components/TraceChart.tsx
var import_react = require("react");

// src/canvas/coordinates.ts
var MARGIN = {
  top: 20,
  right: 20,
  bottom: 50,
  left: 88
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

// src/canvas/measurement-cursors.ts
var DEFAULT_STYLE = {
  cursorAColor: "#7c3aed",
  cursorBColor: "#ea580c",
  cursorSpanColor: "rgba(124, 58, 237, 0.12)",
  labelBackground: "rgba(248, 250, 252, 0.94)",
  labelTextColor: "#0f172a",
  labelBorder: "rgba(15, 23, 42, 0.2)"
};
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function toCursorPoints(cursors, viewport, canvasRect) {
  const points = [];
  if (cursors.a) {
    const position = dataToPixel(cursors.a.distance, cursors.a.power, viewport, canvasRect);
    points.push({ key: "a", px: position.px, py: position.py });
  }
  if (cursors.b) {
    const position = dataToPixel(cursors.b.distance, cursors.b.power, viewport, canvasRect);
    points.push({ key: "b", px: position.px, py: position.py });
  }
  return points;
}
function hitTestMeasurementCursors(cursors, viewport, canvasRect, px, py, radius = 12) {
  const points = toCursorPoints(cursors, viewport, canvasRect);
  if (points.length === 0) return null;
  const radiusSq = radius * radius;
  let nearest = null;
  for (const point of points) {
    const dx = point.px - px;
    const dy = point.py - py;
    const distanceSq = dx * dx + dy * dy;
    if (distanceSq > radiusSq) continue;
    if (!nearest || distanceSq < nearest.distanceSq) {
      nearest = { key: point.key, distanceSq };
    }
  }
  return nearest?.key ?? null;
}
function drawCursor(ctx, point, plotRect, color, style) {
  const x = Math.round(point.px) + 0.5;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(x, plotRect.top);
  ctx.lineTo(x, plotRect.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.24;
  ctx.arc(point.px, point.py, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.arc(point.px, point.py, 5.5, 0, Math.PI * 2);
  ctx.fill();
  const label = point.key.toUpperCase();
  ctx.font = "700 11px sans-serif";
  const labelWidth = ctx.measureText(label).width + 12;
  const labelHeight = 18;
  const baselineOffset = point.key === "a" ? 7 : 29;
  const labelX = clamp(point.px - labelWidth / 2, plotRect.left + 4, plotRect.right - labelWidth - 4);
  const labelY = plotRect.top + baselineOffset;
  ctx.fillStyle = style.labelBackground;
  ctx.strokeStyle = style.labelBorder;
  ctx.lineWidth = 1;
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  ctx.fillStyle = style.labelTextColor;
  ctx.fillText(label, labelX + (labelWidth - ctx.measureText(label).width) / 2, labelY + 12.5);
  ctx.restore();
}
function drawMeasurementCursors(ctx, cursors, viewport, canvasRect, style = {}) {
  const points = toCursorPoints(cursors, viewport, canvasRect);
  if (points.length === 0) return;
  const plotRect = getPlotRect(canvasRect);
  const mergedStyle = {
    ...DEFAULT_STYLE,
    ...style
  };
  const pointA = points.find((point) => point.key === "a");
  const pointB = points.find((point) => point.key === "b");
  if (pointA && pointB) {
    const left = Math.min(pointA.px, pointB.px);
    const width = Math.abs(pointA.px - pointB.px);
    ctx.save();
    ctx.fillStyle = mergedStyle.cursorSpanColor;
    ctx.fillRect(left, plotRect.top, width, plotRect.height);
    ctx.restore();
  }
  for (const point of points) {
    drawCursor(
      ctx,
      point,
      plotRect,
      point.key === "a" ? mergedStyle.cursorAColor : mergedStyle.cursorBColor,
      mergedStyle
    );
  }
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
  const labelBorder = style.labelBorder ?? "rgba(15, 23, 42, 0.15)";
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
  ctx.strokeStyle = labelBorder;
  ctx.strokeRect(x, y, labelWidth + paddingX * 2, labelHeight);
  ctx.fillStyle = textColor;
  ctx.fillText(state.label, x + paddingX, y + labelHeight - paddingY);
  ctx.restore();
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

// src/canvas/event-markers.ts
var DEFAULT_MARKER_STYLE = {
  colors: {
    reflection: "#c3342f",
    loss: "#0f766e",
    connector: "#2563eb",
    "end-of-fiber": "#111827",
    manual: "#a16207",
    unknown: "#64748b"
  },
  stemColor: "rgba(49, 82, 116, 0.36)",
  selectedStemColor: "rgba(37, 99, 235, 0.66)",
  labelColor: "#334e68",
  mutedLabelColor: "#6f859e",
  selectedRingColor: "#2563eb",
  selectedHaloColor: "rgba(37, 99, 235, 0.28)",
  hoverRingColor: "#0891b2",
  hoverHaloColor: "rgba(8, 145, 178, 0.24)"
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
  const plotRect = getPlotRect(canvasRect);
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
    if (position.px < plotRect.left || position.px > plotRect.right || position.py < plotRect.top || position.py > plotRect.bottom) {
      continue;
    }
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
function drawEventMarkers(ctx, markers, canvasRect, selectedIndex = null, hoveredIndex = null, style = {}) {
  if (markers.length === 0) return;
  const plotRect = getPlotRect(canvasRect);
  const mergedStyle = {
    ...DEFAULT_MARKER_STYLE,
    ...style,
    colors: {
      ...DEFAULT_MARKER_STYLE.colors,
      ...style.colors ?? {}
    }
  };
  const dense = markers.length > 20;
  ctx.save();
  ctx.beginPath();
  ctx.rect(plotRect.left, plotRect.top, plotRect.width, plotRect.height);
  ctx.clip();
  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const isHovered = hoveredIndex === marker.index;
    const isPriority = isSelected || isHovered;
    const color = mergedStyle.colors[marker.category] ?? mergedStyle.colors.unknown;
    const radius = isSelected ? 8 : isHovered ? 7.5 : 7;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = isPriority ? 2.4 : 1.6;
    ctx.globalAlpha = isPriority ? 1 : 0.86;
    ctx.setLineDash(isPriority ? [4, 3] : [2, 4]);
    ctx.beginPath();
    ctx.moveTo(Math.round(marker.px) + 0.5, marker.py);
    ctx.lineTo(Math.round(marker.px) + 0.5, plotRect.bottom);
    ctx.strokeStyle = isPriority ? mergedStyle.selectedStemColor : mergedStyle.stemColor;
    ctx.lineWidth = isPriority ? 1.4 : 1;
    ctx.stroke();
    ctx.setLineDash([]);
    if (isSelected || isHovered) {
      const haloColor = isSelected ? mergedStyle.selectedHaloColor : mergedStyle.hoverHaloColor;
      const ringColor = isSelected ? mergedStyle.selectedRingColor : mergedStyle.hoverRingColor;
      ctx.beginPath();
      ctx.fillStyle = haloColor;
      ctx.arc(marker.px, marker.py, radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 1.2;
      ctx.arc(marker.px, marker.py, radius + 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
    }
    drawMarkerShape(ctx, marker.category, marker.px, marker.py, radius);
    if (marker.category === "end-of-fiber") {
      ctx.stroke();
    } else {
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  for (const marker of markers) {
    const isSelected = selectedIndex === marker.index;
    const isHovered = hoveredIndex === marker.index;
    const isPriority = isSelected || isHovered;
    const shouldShowLabel = !dense || isPriority || marker.index % 2 === 0;
    if (!shouldShowLabel) continue;
    const label = `${marker.index + 1}`;
    ctx.font = isPriority ? "600 11px sans-serif" : "10px sans-serif";
    const labelWidth = ctx.measureText(label).width;
    ctx.fillStyle = isPriority ? mergedStyle.labelColor : mergedStyle.mutedLabelColor;
    ctx.fillText(label, marker.px - labelWidth / 2, marker.py - 12);
  }
  ctx.restore();
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
  ctx.translate(16, plotRect.top + plotRect.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const title = "Power (dB)";
  ctx.fillText(title, 0, 0);
  ctx.restore();
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

// src/utils/cursor-measurement.ts
function parseDistance2(distance) {
  const parsed = Number.parseFloat(distance);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function parseValue(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function normalizeCursors(cursors) {
  if (!cursors.a || !cursors.b) return null;
  return {
    a: cursors.a,
    b: cursors.b
  };
}
function countEventsBetween(events, minDistance, maxDistance) {
  let eventCountBetween = 0;
  let reflectiveEventCountBetween = 0;
  let spliceLossSumBetween = 0;
  for (const event of events) {
    const distance = parseDistance2(event.distance);
    if (!Number.isFinite(distance)) continue;
    if (distance < minDistance || distance > maxDistance) continue;
    eventCountBetween += 1;
    const category = classifyEvent(event);
    if (category === "reflection" || category === "end-of-fiber") {
      reflectiveEventCountBetween += 1;
    }
    spliceLossSumBetween += parseValue(event.spliceLoss);
  }
  return {
    eventCountBetween,
    reflectiveEventCountBetween,
    spliceLossSumBetween
  };
}
function computeCursorMeasurement(trace, events, cursors) {
  if (trace.length === 0) return null;
  const normalized = normalizeCursors(cursors);
  if (!normalized) return null;
  const { a, b } = normalized;
  const start = a.distance <= b.distance ? a : b;
  const end = a.distance <= b.distance ? b : a;
  const deltaDistance = Math.abs(b.distance - a.distance);
  const deltaPower = b.power - a.power;
  const avgAttenuationDbPerKm = deltaDistance > 0 ? deltaPower / deltaDistance : null;
  const counts = countEventsBetween(events, start.distance, end.distance);
  return {
    a,
    b,
    start,
    end,
    distanceA: a.distance,
    distanceB: b.distance,
    deltaDistance,
    powerA: a.power,
    powerB: b.power,
    deltaPower,
    avgAttenuationDbPerKm,
    eventCountBetween: counts.eventCountBetween,
    reflectiveEventCountBetween: counts.reflectiveEventCountBetween,
    spliceLossSumBetween: counts.spliceLossSumBetween
  };
}

// src/utils/export.ts
var EVENT_TABLE_HEADERS = ["#", "Distance", "Type", "Splice Loss", "Refl. Loss", "Slope", "Status"];
function escapeCsvCell(value) {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }
  return `"${value.replaceAll('"', '""')}"`;
}
function stringifyCell(value) {
  return String(value);
}
function serializeEventRows(rows, delimiter) {
  const serializeCell = delimiter === "," ? escapeCsvCell : (value) => value;
  const lines = [];
  lines.push(EVENT_TABLE_HEADERS.join(delimiter));
  for (const row of rows) {
    const values = [
      row.index,
      row.distance,
      row.type,
      row.spliceLoss,
      row.reflLoss,
      row.slope,
      row.status
    ].map((value) => serializeCell(stringifyCell(value)));
    lines.push(values.join(delimiter));
  }
  return `${lines.join("\n")}
`;
}
function serializeEventsAsTsv(rows) {
  return serializeEventRows(rows, "	");
}
function serializeEventsAsCsv(rows) {
  return serializeEventRows(rows, ",");
}
function downloadBlob(blob, filename) {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error("downloadBlob requires DOM + URL.createObjectURL support");
  }
  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
function downloadTextFile(content, filename, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}
function sanitizeBaseName(baseName) {
  const normalized = baseName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return normalized.length > 0 ? normalized : "export";
}
function pad2(value) {
  return value.toString().padStart(2, "0");
}
function buildTimestampedFilename(baseName, extension, date = /* @__PURE__ */ new Date()) {
  const safeBase = sanitizeBaseName(baseName);
  const safeExtension = extension.replace(/^\./, "");
  const stamp = [
    date.getFullYear().toString(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate())
  ].join("");
  const time = [pad2(date.getHours()), pad2(date.getMinutes()), pad2(date.getSeconds())].join("");
  return `${safeBase}-${stamp}-${time}.${safeExtension}`;
}

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
function parseDistance3(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
function clamp2(value, min, max) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}
function estimateTooltipSize(text) {
  const lines = text.split("\n");
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const width = clamp2(24 + longest * 7, 160, 320);
  const height = 12 + lines.length * 18;
  return { width, height };
}
function createEmptyMeasurementCursors() {
  return {
    a: null,
    b: null
  };
}
function normalizeMeasurementCursors(value) {
  if (!value) return createEmptyMeasurementCursors();
  return {
    a: value.a ?? null,
    b: value.b ?? null
  };
}
function isSameCursor(a, b) {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.distance === b.distance && a.power === b.power && a.traceIndex === b.traceIndex;
}
function areMeasurementCursorsEqual(a, b) {
  return isSameCursor(a.a, b.a) && isSameCursor(a.b, b.b);
}
function buildMeasurementCursor(state) {
  return {
    distance: state.point.distance,
    power: state.point.power,
    traceIndex: state.index
  };
}
function toPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }
      reject(new Error("Failed to render chart PNG"));
    }, "image/png");
  });
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
  measurementCursors: controlledMeasurementCursors,
  defaultMeasurementCursors,
  showExportActions = false,
  exportFileBaseName = "otdr-trace",
  className,
  onPointHover,
  onEventClick,
  onMeasurementCursorsChange,
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
  const onMeasurementCursorsChangeRef = (0, import_react.useRef)(onMeasurementCursorsChange);
  const onZoomChangeRef = (0, import_react.useRef)(onZoomChange);
  traceRef.current = trace;
  eventsRef.current = events;
  overlaysRef.current = overlays;
  xUnitRef.current = xUnit;
  selectedEventRef.current = selectedEvent;
  onPointHoverRef.current = onPointHover;
  onEventClickRef.current = onEventClick;
  onMeasurementCursorsChangeRef.current = onMeasurementCursorsChange;
  onZoomChangeRef.current = onZoomChange;
  const isMeasurementControlled = controlledMeasurementCursors !== void 0;
  const normalizedControlledMeasurementCursors = (0, import_react.useMemo)(
    () => normalizeMeasurementCursors(controlledMeasurementCursors),
    [controlledMeasurementCursors]
  );
  const [uncontrolledMeasurementCursors, setUncontrolledMeasurementCursors] = (0, import_react.useState)(
    () => normalizeMeasurementCursors(defaultMeasurementCursors)
  );
  const resolvedMeasurementCursors = isMeasurementControlled ? normalizedControlledMeasurementCursors : uncontrolledMeasurementCursors;
  const baseViewport = (0, import_react.useMemo)(() => computeViewport(trace), [trace]);
  const [viewport, setViewportState] = (0, import_react.useState)(baseViewport);
  const viewportRef = (0, import_react.useRef)(viewport);
  const boundsRef = (0, import_react.useRef)(computeViewport(trace, 0));
  const crosshairRef = (0, import_react.useRef)(null);
  const markersRef = (0, import_react.useRef)([]);
  const measurementCursorsRef = (0, import_react.useRef)(resolvedMeasurementCursors);
  const dragRef = (0, import_react.useRef)({
    active: false,
    pointerId: null,
    lastX: 0,
    lastY: 0,
    moved: false
  });
  const cursorDragRef = (0, import_react.useRef)({
    active: false,
    pointerId: null,
    key: null,
    moved: false
  });
  const suppressClickRef = (0, import_react.useRef)(false);
  const renderRef = (0, import_react.useRef)(() => void 0);
  const [tooltip, setTooltip] = (0, import_react.useState)(null);
  const [liveLabel, setLiveLabel] = (0, import_react.useState)("");
  const [exportLiveLabel, setExportLiveLabel] = (0, import_react.useState)("");
  const [isCopyingChart, setIsCopyingChart] = (0, import_react.useState)(false);
  const [isDownloadingChart, setIsDownloadingChart] = (0, import_react.useState)(false);
  const keyboardMarkerIndexRef = (0, import_react.useRef)(-1);
  const hoveredMarkerIndexRef = (0, import_react.useRef)(null);
  measurementCursorsRef.current = resolvedMeasurementCursors;
  const measurement = (0, import_react.useMemo)(
    () => computeCursorMeasurement(trace, events, resolvedMeasurementCursors),
    [events, resolvedMeasurementCursors, trace]
  );
  const setViewport = (next, notify = true) => {
    viewportRef.current = next;
    setViewportState(next);
    if (notify) {
      onZoomChangeRef.current?.(next);
    }
    schedulerRef.current?.scheduleRender();
  };
  const setMeasurementCursors = (next, notify = true) => {
    const normalized = normalizeMeasurementCursors(next);
    if (areMeasurementCursorsEqual(measurementCursorsRef.current, normalized)) return;
    measurementCursorsRef.current = normalized;
    if (!isMeasurementControlled) {
      setUncontrolledMeasurementCursors(normalized);
    }
    if (notify) {
      onMeasurementCursorsChangeRef.current?.(normalized);
    }
    schedulerRef.current?.scheduleRender();
  };
  const resolveMeasurementCursorAtPointer = (pointerX, pointerY, canvasRect) => {
    const crosshair = resolveCrosshairState(
      traceRef.current,
      pointerX,
      pointerY,
      viewportRef.current,
      canvasRect,
      xUnitRef.current
    );
    if (!crosshair) return null;
    return buildMeasurementCursor(crosshair);
  };
  (0, import_react.useEffect)(() => {
    boundsRef.current = computeViewport(trace, 0);
    crosshairRef.current = null;
    hoveredMarkerIndexRef.current = null;
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
    const centerX = parseDistance3(event.distance);
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
    const crosshairTextColor = readCssVariable(computed, "--otdr-crosshair-label-fg", "#0f172a");
    const crosshairLabelBackground = readCssVariable(computed, "--otdr-crosshair-label-bg", panelColor);
    const tooltipBackground = readCssVariable(computed, "--otdr-tooltip-bg", "rgba(7, 26, 45, 0.96)");
    const tooltipForeground = readCssVariable(computed, "--otdr-tooltip-fg", "#eff6ff");
    const tooltipBorder = readCssVariable(computed, "--otdr-tooltip-border", "#1f3b5b");
    const markerStemColor = readCssVariable(computed, "--otdr-marker-stem", "rgba(49, 82, 116, 0.36)");
    const markerSelectedStemColor = readCssVariable(computed, "--otdr-marker-stem-selected", "rgba(37, 99, 235, 0.66)");
    const markerLabelColor = readCssVariable(computed, "--otdr-marker-label", "#334e68");
    const markerLabelMuted = readCssVariable(computed, "--otdr-marker-label-muted", "#6f859e");
    const markerSelectedRing = readCssVariable(computed, "--otdr-marker-selected-ring", "#2563eb");
    const markerSelectedHalo = readCssVariable(computed, "--otdr-marker-selected-halo", "rgba(37, 99, 235, 0.28)");
    const markerHoverRing = readCssVariable(computed, "--otdr-marker-hover-ring", "#0891b2");
    const markerHoverHalo = readCssVariable(computed, "--otdr-marker-hover-halo", "rgba(8, 145, 178, 0.24)");
    const markerReflection = readCssVariable(computed, "--otdr-marker-reflection", "#c3342f");
    const markerLoss = readCssVariable(computed, "--otdr-marker-loss", "#0f766e");
    const markerConnector = readCssVariable(computed, "--otdr-marker-connector", "#2563eb");
    const markerEnd = readCssVariable(computed, "--otdr-marker-end", "#111827");
    const markerManual = readCssVariable(computed, "--otdr-marker-manual", "#a16207");
    const markerUnknown = readCssVariable(computed, "--otdr-marker-unknown", "#64748b");
    const cursorAColor = readCssVariable(computed, "--otdr-cursor-a", "#7c3aed");
    const cursorBColor = readCssVariable(computed, "--otdr-cursor-b", "#ea580c");
    const cursorSpanColor = readCssVariable(computed, "--otdr-cursor-span", "rgba(124, 58, 237, 0.12)");
    if (containerRef.current) {
      containerRef.current.style.setProperty("--otdr-tooltip-bg-runtime", tooltipBackground);
      containerRef.current.style.setProperty("--otdr-tooltip-fg-runtime", tooltipForeground);
      containerRef.current.style.setProperty("--otdr-tooltip-border-runtime", tooltipBorder);
    }
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
        drawEventMarkers(handle.ctx, markers, canvasRect, selectedEventRef.current, hoveredMarkerIndexRef.current, {
          colors: {
            reflection: markerReflection,
            loss: markerLoss,
            connector: markerConnector,
            "end-of-fiber": markerEnd,
            manual: markerManual,
            unknown: markerUnknown
          },
          stemColor: markerStemColor,
          selectedStemColor: markerSelectedStemColor,
          labelColor: markerLabelColor,
          mutedLabelColor: markerLabelMuted,
          selectedRingColor: markerSelectedRing,
          selectedHaloColor: markerSelectedHalo,
          hoverRingColor: markerHoverRing,
          hoverHaloColor: markerHoverHalo
        });
      },
      drawCrosshair: () => {
        drawMeasurementCursors(handle.ctx, measurementCursorsRef.current, viewportRef.current, canvasRect, {
          cursorAColor,
          cursorBColor,
          cursorSpanColor,
          labelBackground: crosshairLabelBackground,
          labelTextColor: crosshairTextColor,
          labelBorder: tooltipBorder
        });
      },
      crosshair: crosshairRef.current,
      axisStyle: {
        axisColor,
        gridColor,
        labelColor: axisLabelColor
      },
      crosshairStyle: {
        lineColor: crosshairColor,
        labelBackground: crosshairLabelBackground,
        textColor: crosshairTextColor,
        labelBorder: tooltipBorder
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
  const copyChart = async () => {
    if (isCopyingChart) return;
    const canvas = canvasHandleRef.current?.canvas;
    if (!canvas) {
      setExportLiveLabel("Chart is not ready for copy.");
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
      setExportLiveLabel("PNG clipboard copy is not supported in this browser.");
      return;
    }
    setIsCopyingChart(true);
    try {
      const blob = await toPngBlob(canvas);
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      setExportLiveLabel("Chart copied as PNG.");
    } catch {
      setExportLiveLabel("Failed to copy chart image.");
    } finally {
      setIsCopyingChart(false);
    }
  };
  const downloadChart = async () => {
    if (isDownloadingChart) return;
    const canvas = canvasHandleRef.current?.canvas;
    if (!canvas) {
      setExportLiveLabel("Chart is not ready for download.");
      return;
    }
    setIsDownloadingChart(true);
    try {
      const blob = await toPngBlob(canvas);
      const filename = buildTimestampedFilename(exportFileBaseName, "png");
      downloadBlob(blob, filename);
      setExportLiveLabel(`Downloaded ${filename}.`);
    } catch {
      setExportLiveLabel("Failed to download chart PNG.");
    } finally {
      setIsDownloadingChart(false);
    }
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
      if (event.button !== 0) return;
      const canvasRect = getCanvasRect(handle.canvas);
      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY
      );
      if (cursorHit) {
        cursorDragRef.current = {
          active: true,
          pointerId: event.pointerId,
          key: cursorHit,
          moved: false
        };
        handle.canvas.setPointerCapture(event.pointerId);
        handle.canvas.style.cursor = "ew-resize";
        return;
      }
      dragRef.current = {
        active: true,
        pointerId: event.pointerId,
        lastX: event.offsetX,
        lastY: event.offsetY,
        moved: false
      };
      handle.canvas.setPointerCapture(event.pointerId);
      handle.canvas.style.cursor = "grabbing";
    };
    const onPointerMove = (event) => {
      const canvasRect = getCanvasRect(handle.canvas);
      const cursorDrag = cursorDragRef.current;
      if (cursorDrag.active && cursorDrag.pointerId === event.pointerId && cursorDrag.key) {
        const cursor = resolveMeasurementCursorAtPointer(event.offsetX, event.offsetY, canvasRect);
        if (cursor) {
          const current = measurementCursorsRef.current;
          const next = cursorDrag.key === "a" ? { ...current, a: cursor } : { ...current, b: cursor };
          setMeasurementCursors(next);
          setLiveLabel(
            `Cursor ${cursorDrag.key.toUpperCase()}: ${formatDistance(cursor.distance, xUnitRef.current)}, ${formatPower(cursor.power, 2)}`
          );
        }
        cursorDragRef.current = {
          ...cursorDrag,
          moved: true
        };
        scheduler.scheduleRender();
        return;
      }
      const drag = dragRef.current;
      if (drag.active && drag.pointerId === event.pointerId) {
        const deltaX = event.offsetX - drag.lastX;
        const deltaY = event.offsetY - drag.lastY;
        dragRef.current = {
          ...drag,
          lastX: event.offsetX,
          lastY: event.offsetY,
          moved: drag.moved || Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0
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
      const markerHit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (markerHit === null) {
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
      } else {
        hoveredMarkerIndexRef.current = markerHit;
        const marker = markersRef.current.find((candidate) => candidate.index === markerHit);
        if (marker) {
          const text = formatEventTooltip(marker, xUnitRef.current);
          const { width: tooltipWidth, height: tooltipHeight } = estimateTooltipSize(text);
          const viewportWidth = handle.canvas.clientWidth || canvasRect.width;
          const viewportHeight = handle.canvas.clientHeight || canvasRect.height;
          setTooltip({
            left: clamp2(event.offsetX + 12, 8, viewportWidth - tooltipWidth - 8),
            top: clamp2(event.offsetY + 12, 8, viewportHeight - tooltipHeight - 8),
            text
          });
        }
      }
      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY
      );
      handle.canvas.style.cursor = cursorHit ? "ew-resize" : "crosshair";
      scheduler.scheduleRender();
    };
    const onPointerUp = (event) => {
      const cursorDrag = cursorDragRef.current;
      if (cursorDrag.active && cursorDrag.pointerId === event.pointerId) {
        cursorDragRef.current = {
          active: false,
          pointerId: null,
          key: null,
          moved: false
        };
        suppressClickRef.current = cursorDrag.moved;
        handle.canvas.releasePointerCapture(event.pointerId);
        handle.canvas.style.cursor = "crosshair";
        return;
      }
      if (dragRef.current.pointerId !== event.pointerId) return;
      suppressClickRef.current = dragRef.current.moved;
      dragRef.current = {
        active: false,
        pointerId: null,
        lastX: 0,
        lastY: 0,
        moved: false
      };
      handle.canvas.releasePointerCapture(event.pointerId);
      handle.canvas.style.cursor = "crosshair";
    };
    const onPointerLeave = () => {
      if (!dragRef.current.active && !cursorDragRef.current.active) {
        crosshairRef.current = null;
        hoveredMarkerIndexRef.current = null;
        setTooltip(null);
        scheduler.scheduleRender();
      }
    };
    const onClick = (event) => {
      if (suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }
      const canvasRect = getCanvasRect(handle.canvas);
      const cursorHit = hitTestMeasurementCursors(
        measurementCursorsRef.current,
        viewportRef.current,
        canvasRect,
        event.offsetX,
        event.offsetY
      );
      if (cursorHit) return;
      const markerHit = hitTestEventMarkers(markersRef.current, event.offsetX, event.offsetY);
      if (markerHit !== null) {
        const selected = eventsRef.current[markerHit];
        if (!selected) return;
        onEventClickRef.current?.(selected, markerHit);
        return;
      }
      const cursor = resolveMeasurementCursorAtPointer(event.offsetX, event.offsetY, canvasRect);
      if (!cursor) return;
      const current = measurementCursorsRef.current;
      const next = !current.a ? { a: cursor, b: null } : !current.b ? { ...current, b: cursor } : { a: cursor, b: null };
      setMeasurementCursors(next);
      setLiveLabel(`Cursor ${!current.a || current.b ? "A" : "B"}: ${formatDistance(cursor.distance, xUnitRef.current)}`);
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
  }, [height, isMeasurementControlled, width]);
  (0, import_react.useEffect)(() => {
    schedulerRef.current?.scheduleRender();
  }, [normalizedControlledMeasurementCursors, resolvedMeasurementCursors]);
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
        if (event.key === "Escape") {
          event.preventDefault();
          const current = measurementCursorsRef.current;
          if (current.b) {
            setMeasurementCursors({ ...current, b: null });
            return;
          }
          if (current.a) {
            setMeasurementCursors(createEmptyMeasurementCursors());
          }
          return;
        }
        if ((event.key === "a" || event.key === "A" || event.key === "b" || event.key === "B") && crosshairRef.current) {
          event.preventDefault();
          const key = event.key.toLowerCase();
          const cursor = buildMeasurementCursor(crosshairRef.current);
          const next = key === "a" ? { ...measurementCursorsRef.current, a: cursor } : { ...measurementCursorsRef.current, b: cursor };
          setMeasurementCursors(next);
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
          hoveredMarkerIndexRef.current = marker.index;
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
        showExportActions ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TraceChart_default.actions, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: TraceChart_default.actionButton,
              onClick: () => void copyChart(),
              disabled: isCopyingChart,
              children: isCopyingChart ? "Copying..." : "Copy Chart"
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "button",
            {
              type: "button",
              className: TraceChart_default.actionButton,
              onClick: () => void downloadChart(),
              disabled: isDownloadingChart,
              children: isDownloadingChart ? "Downloading..." : "Download PNG"
            }
          )
        ] }) : null,
        tooltip ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.tooltip, style: { left: tooltip.left, top: tooltip.top }, children: tooltip.text }) : null,
        measurement ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TraceChart_default.measurementHud, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TraceChart_default.measurementRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: TraceChart_default.measurementLabel, children: "A" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: `${formatDistance(measurement.distanceA, xUnit)} \xB7 ${formatPower(measurement.powerA, 2)}` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: TraceChart_default.measurementRow, children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: TraceChart_default.measurementLabel, children: "B" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: `${formatDistance(measurement.distanceB, xUnit)} \xB7 ${formatPower(measurement.powerB, 2)}` })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.measurementDelta, children: `\u0394 ${formatDistance(measurement.deltaDistance, xUnit)} | ${formatPower(measurement.deltaPower, 3)} | Avg ${measurement.avgAttenuationDbPerKm === null ? "N/A" : formatSlope(measurement.avgAttenuationDbPerKm, 3)}` }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.measurementMeta, children: `Events ${measurement.eventCountBetween} \xB7 Reflective ${measurement.reflectiveEventCountBetween} \xB7 Splice \u03A3 ${formatPower(measurement.spliceLossSumBetween, 3)}` })
        ] }) : null,
        trace.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.empty, children: "No trace points available" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.liveRegion, "aria-live": "polite", children: liveLabel }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: TraceChart_default.liveRegion, "aria-live": "polite", children: exportLiveLabel })
      ]
    }
  );
}

// src/components/EventTable.tsx
var import_react2 = require("react");

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

// src/components/EventTable.module.css
var EventTable_default = {};

// src/components/EventTable.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
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
function renderStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
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
  showExportActions = false,
  exportFileBaseName = "otdr-events",
  onEventSelect
}) {
  const normalized = (0, import_react2.useMemo)(() => normalizeSorResult(result), [result]);
  const [sortState, setSortState] = (0, import_react2.useState)(null);
  const rowRefs = (0, import_react2.useRef)([]);
  const [exportMessage, setExportMessage] = (0, import_react2.useState)("");
  const rows = (0, import_react2.useMemo)(() => {
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
  (0, import_react2.useEffect)(() => {
    if (selectedEvent === null || selectedEvent < 0) return;
    const row = rowRefs.current[selectedEvent];
    if (!row) return;
    if (typeof row.scrollIntoView === "function") {
      row.scrollIntoView({ block: "nearest" });
    }
  }, [selectedEvent]);
  const exportRows = (0, import_react2.useMemo)(
    () => rows.map((row) => ({
      index: row.index + 1,
      distance: formatDistance(row.distance, xUnit),
      type: renderType(row.type),
      spliceLoss: `${row.spliceLoss.toFixed(3)} dB`,
      reflLoss: `${row.reflLoss.toFixed(3)} dB`,
      slope: `${row.slope.toFixed(3)} dB/km`,
      status: renderStatus(row.status)
    })),
    [rows, xUnit]
  );
  const copyTable = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setExportMessage("Clipboard text copy is not supported in this browser.");
      return;
    }
    try {
      await navigator.clipboard.writeText(serializeEventsAsTsv(exportRows));
      setExportMessage(`Copied ${exportRows.length} rows.`);
    } catch {
      setExportMessage("Failed to copy table.");
    }
  };
  const downloadTable = () => {
    try {
      const filename = buildTimestampedFilename(exportFileBaseName, "csv");
      const csv = serializeEventsAsCsv(exportRows);
      downloadTextFile(csv, filename, "text/csv;charset=utf-8");
      setExportMessage(`Downloaded ${filename}.`);
    } catch {
      setExportMessage("Failed to download CSV.");
    }
  };
  const summary = normalized.keyEvents.summary;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: EventTable_default.wrapper, children: [
    showExportActions ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: EventTable_default.actions, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.actionButton, onClick: () => void copyTable(), children: "Copy Table" }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.actionButton, onClick: downloadTable, children: "Download CSV" })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: EventTable_default.tableScroll, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("table", { className: EventTable_default.table, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("thead", { className: EventTable_default.head, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: `${EventTable_default.numeric} ${EventTable_default.indexCol}`, "aria-sort": ariaSortValue(sortState, "index"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "index")), children: "#" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: `${EventTable_default.numeric} ${EventTable_default.distanceCol}`, "aria-sort": ariaSortValue(sortState, "distance"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "distance")), children: "Distance" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", "aria-sort": ariaSortValue(sortState, "type"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "type")), children: "Type" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: EventTable_default.numeric, "aria-sort": ariaSortValue(sortState, "spliceLoss"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "spliceLoss")), children: "Splice Loss" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: EventTable_default.numeric, "aria-sort": ariaSortValue(sortState, "reflLoss"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "reflLoss")), children: "Refl. Loss" }) }),
        !compact ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: EventTable_default.numeric, "aria-sort": ariaSortValue(sortState, "slope"), children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: EventTable_default.sortButton, onClick: () => setSortState((current) => cycleSortState(current, "slope")), children: "Slope" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("th", { scope: "col", className: EventTable_default.statusCol, children: "Status" })
        ] }) : null
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tbody", { className: EventTable_default.body, children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "tr",
        {
          ref: (node) => {
            rowRefs.current[row.index] = node;
          },
          className: `${EventTable_default.row} ${selectedEvent === row.index ? EventTable_default.selected : ""}`,
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
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: `${EventTable_default.numeric} ${EventTable_default.indexCol}`, children: row.index + 1 }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: `${EventTable_default.numeric} ${EventTable_default.distanceCol}`, children: formatDistance(row.distance, xUnit) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { className: EventTable_default.typeCell, children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { className: EventTable_default.icon }),
              renderType(row.type)
            ] }) }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: EventTable_default.numeric, children: [
              row.spliceLoss.toFixed(3),
              " dB"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: EventTable_default.numeric, children: [
              row.reflLoss.toFixed(3),
              " dB"
            ] }),
            !compact ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(import_jsx_runtime3.Fragment, { children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: EventTable_default.numeric, children: [
                row.slope.toFixed(3),
                " dB/km"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { className: EventTable_default.statusCol, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(StatusBadge, { status: row.status }) })
            ] }) : null
          ]
        },
        `${row.index}-${row.event.distance}-${row.event.type}`
      )) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("tfoot", { className: EventTable_default.footer, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("tr", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("td", { colSpan: compact ? 3 : 5, children: "Summary" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: EventTable_default.numeric, colSpan: compact ? 2 : 1, children: [
          "Total Loss: ",
          summary.totalLoss.toFixed(3),
          " dB"
        ] }),
        !compact ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("td", { className: EventTable_default.numeric, children: [
          "ORL: ",
          summary.orl.toFixed(3),
          " dB"
        ] }) : null
      ] }) })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: EventTable_default.liveRegion, "aria-live": "polite", children: exportMessage })
  ] });
}

// src/components/FiberMap.tsx
var import_react3 = require("react");

// src/components/FiberMap.module.css
var FiberMap_default = {};

// src/components/FiberMap.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function parseDistance4(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
var HORIZONTAL_MARGIN_START = 30;
var HORIZONTAL_MARGIN_END = 30;
var HORIZONTAL_MIN_WIDTH = 680;
var HORIZONTAL_DEFAULT_WIDTH = 1e3;
var HORIZONTAL_HEIGHT = 180;
var HORIZONTAL_BASELINE = 90;
var VERTICAL_START = 24;
var VERTICAL_LENGTH = 366;
var VERTICAL_BASELINE = 90;
var VERTICAL_VIEWBOX_WIDTH = 180;
var VERTICAL_VIEWBOX_HEIGHT = 420;
var MIN_ZOOM = 1;
var MAX_ZOOM = 8;
var ZOOM_FACTOR = 1.15;
var ROOT_HORIZONTAL_PADDING = 24;
function clamp3(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
function getHorizontalMapWidth(baseWidth, zoom) {
  return Math.max(HORIZONTAL_MIN_WIDTH, Math.round(baseWidth * zoom));
}
function getHoverTagMetrics(item, isVertical, horizontalMapWidth) {
  const label = `#${item.index + 1}`;
  const width = Math.max(34, label.length * 7 + 12);
  const height = 18;
  if (isVertical) {
    const x2 = clamp3(item.x + 10, 8, VERTICAL_VIEWBOX_WIDTH - width - 8);
    const y2 = clamp3(item.y - height - 6, 8, VERTICAL_VIEWBOX_HEIGHT - height - 8);
    return {
      x: x2,
      y: y2,
      width,
      textX: x2 + width / 2,
      textY: y2 + 12
    };
  }
  const x = clamp3(item.x - width / 2, 8, horizontalMapWidth - width - 8);
  const y = clamp3(item.y - height - 8, 8, HORIZONTAL_HEIGHT - height - 8);
  return {
    x,
    y,
    width,
    textX: x + width / 2,
    textY: y + 12
  };
}
function FiberMap({
  events,
  locationA = "A",
  locationB = "B",
  selectedEvent = null,
  orientation = "horizontal",
  onEventClick
}) {
  const markerRefs = (0, import_react3.useRef)([]);
  const containerRef = (0, import_react3.useRef)(null);
  const [hoveredIndex, setHoveredIndex] = (0, import_react3.useState)(null);
  const [zoomLevel, setZoomLevel] = (0, import_react3.useState)(MIN_ZOOM);
  const [baseHorizontalWidth, setBaseHorizontalWidth] = (0, import_react3.useState)(HORIZONTAL_DEFAULT_WIDTH);
  const isVertical = orientation === "vertical";
  (0, import_react3.useEffect)(() => {
    setHoveredIndex(null);
    setZoomLevel(MIN_ZOOM);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [events.length, isVertical]);
  (0, import_react3.useEffect)(() => {
    if (isVertical) return;
    const node = containerRef.current;
    if (!node) return;
    const update = () => {
      const measured = Math.round(node.clientWidth - ROOT_HORIZONTAL_PADDING);
      if (!Number.isFinite(measured)) return;
      setBaseHorizontalWidth((current) => {
        const next = Math.max(HORIZONTAL_MIN_WIDTH, measured || HORIZONTAL_DEFAULT_WIDTH);
        return current === next ? current : next;
      });
    };
    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => update());
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isVertical]);
  const horizontalMapWidth = (0, import_react3.useMemo)(
    () => getHorizontalMapWidth(baseHorizontalWidth, zoomLevel),
    [baseHorizontalWidth, zoomLevel]
  );
  const horizontalTrackLength = (0, import_react3.useMemo)(
    () => Math.max(1, horizontalMapWidth - HORIZONTAL_MARGIN_START - HORIZONTAL_MARGIN_END),
    [horizontalMapWidth]
  );
  const prepared = (0, import_react3.useMemo)(() => {
    const parsed = events.map((event, index) => ({
      event,
      index,
      distance: parseDistance4(event.distance),
      type: classifyEvent(event)
    }));
    const maxDistance = Math.max(1, ...parsed.map((item) => item.distance));
    return parsed.map((item) => {
      const ratio = item.distance / maxDistance;
      const x = isVertical ? VERTICAL_BASELINE : HORIZONTAL_MARGIN_START + ratio * horizontalTrackLength;
      const y = isVertical ? VERTICAL_START + ratio * VERTICAL_LENGTH : HORIZONTAL_BASELINE;
      return {
        ...item,
        ratio,
        x,
        y
      };
    });
  }, [events, horizontalTrackLength, isVertical]);
  const hoveredEvent = (0, import_react3.useMemo)(
    () => prepared.find((item) => item.index === hoveredIndex) ?? null,
    [hoveredIndex, prepared]
  );
  const updateZoom = (0, import_react3.useCallback)(
    (zoomIn, viewportPointerX) => {
      const container = containerRef.current;
      if (!container || isVertical) return;
      setZoomLevel((current) => {
        const next = clamp3(current * (zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR), MIN_ZOOM, MAX_ZOOM);
        if (next === current) return current;
        const oldWidth = getHorizontalMapWidth(baseHorizontalWidth, current);
        const newWidth = getHorizontalMapWidth(baseHorizontalWidth, next);
        const normalized = oldWidth > 0 ? (container.scrollLeft + viewportPointerX) / oldWidth : 0;
        const nextScroll = clamp3(
          normalized * newWidth - viewportPointerX,
          0,
          Math.max(0, newWidth - container.clientWidth)
        );
        requestAnimationFrame(() => {
          const latestContainer = containerRef.current;
          if (!latestContainer) return;
          latestContainer.scrollLeft = nextScroll;
        });
        return next;
      });
    },
    [baseHorizontalWidth, isVertical]
  );
  const handleWheel = (0, import_react3.useCallback)(
    (event) => {
      if (isVertical || events.length === 0 || event.deltaY === 0) return;
      event.preventDefault();
      const node = containerRef.current;
      const rect = node?.getBoundingClientRect();
      const viewportPointerX = rect ? event.clientX - rect.left : 0;
      updateZoom(event.deltaY < 0, viewportPointerX);
    },
    [events.length, isVertical, updateZoom]
  );
  const hoverTagMetrics = hoveredEvent ? getHoverTagMetrics(hoveredEvent, isVertical, horizontalMapWidth) : null;
  const rootClassName = `${FiberMap_default.root} ${isVertical ? FiberMap_default.vertical : FiberMap_default.horizontal}`;
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    "section",
    {
      ref: containerRef,
      className: rootClassName,
      "aria-label": "Fiber map",
      onWheel: handleWheel,
      children: isVertical ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "svg",
        {
          viewBox: `0 0 ${VERTICAL_VIEWBOX_WIDTH} ${VERTICAL_VIEWBOX_HEIGHT}`,
          className: FiberMap_default.svg,
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "line",
              {
                x1: VERTICAL_BASELINE,
                y1: VERTICAL_START,
                x2: VERTICAL_BASELINE,
                y2: VERTICAL_START + VERTICAL_LENGTH,
                className: FiberMap_default.path
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("text", { x: "90", y: "16", textAnchor: "middle", className: FiberMap_default.label, children: locationA }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("text", { x: "90", y: "412", textAnchor: "middle", className: FiberMap_default.label, children: locationB }),
            prepared.map((item) => {
              const selected = selectedEvent === item.index;
              const hovered = hoveredIndex === item.index;
              const markerClass = [
                FiberMap_default.marker,
                FiberMap_default[item.type] ?? FiberMap_default.unknown,
                selected ? FiberMap_default.selected : "",
                hovered ? FiberMap_default.hovered : ""
              ].filter(Boolean).join(" ");
              return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "g",
                {
                  ref: (node) => {
                    markerRefs.current[item.index] = node;
                  },
                  className: FiberMap_default.event,
                  onClick: () => onEventClick?.(item.event, item.index),
                  "aria-label": `Event ${item.index + 1}`,
                  tabIndex: 0,
                  onMouseEnter: () => setHoveredIndex(item.index),
                  onMouseLeave: () => setHoveredIndex((current) => current === item.index ? null : current),
                  onFocus: () => setHoveredIndex(item.index),
                  onBlur: () => setHoveredIndex((current) => current === item.index ? null : current),
                  onKeyDown: (event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onEventClick?.(item.event, item.index);
                      return;
                    }
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      markerRefs.current[Math.min(events.length - 1, item.index + 1)]?.focus();
                      return;
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      markerRefs.current[Math.max(0, item.index - 1)]?.focus();
                    }
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: item.x, cy: item.y, r: "7.5", className: markerClass }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("title", { children: `Event #${item.index + 1}` })
                  ]
                },
                `map-event-${item.index}`
              );
            }),
            hoveredEvent && hoverTagMetrics ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("g", { className: FiberMap_default.hoverTag, pointerEvents: "none", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "rect",
                {
                  x: hoverTagMetrics.x,
                  y: hoverTagMetrics.y,
                  width: hoverTagMetrics.width,
                  height: "18",
                  rx: "8",
                  ry: "8"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "text",
                {
                  x: hoverTagMetrics.textX,
                  y: hoverTagMetrics.textY,
                  textAnchor: "middle",
                  className: FiberMap_default.hoverTagText,
                  children: [
                    "#",
                    hoveredEvent.index + 1
                  ]
                }
              )
            ] }) : null
          ]
        }
      ) : /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
        "svg",
        {
          width: horizontalMapWidth,
          height: HORIZONTAL_HEIGHT,
          className: FiberMap_default.svg,
          role: "img",
          "aria-label": "Fiber map trace",
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "line",
              {
                x1: HORIZONTAL_MARGIN_START,
                y1: HORIZONTAL_BASELINE,
                x2: HORIZONTAL_MARGIN_START + horizontalTrackLength,
                y2: HORIZONTAL_BASELINE,
                className: FiberMap_default.path
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("text", { x: HORIZONTAL_MARGIN_START, y: "74", textAnchor: "start", className: FiberMap_default.label, children: locationA }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
              "text",
              {
                x: HORIZONTAL_MARGIN_START + horizontalTrackLength,
                y: "74",
                textAnchor: "end",
                className: FiberMap_default.label,
                children: locationB
              }
            ),
            prepared.map((item) => {
              const selected = selectedEvent === item.index;
              const hovered = hoveredIndex === item.index;
              const markerClass = [
                FiberMap_default.marker,
                FiberMap_default[item.type] ?? FiberMap_default.unknown,
                selected ? FiberMap_default.selected : "",
                hovered ? FiberMap_default.hovered : ""
              ].filter(Boolean).join(" ");
              return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "g",
                {
                  ref: (node) => {
                    markerRefs.current[item.index] = node;
                  },
                  className: FiberMap_default.event,
                  onClick: () => onEventClick?.(item.event, item.index),
                  "aria-label": `Event ${item.index + 1}`,
                  tabIndex: 0,
                  onMouseEnter: () => setHoveredIndex(item.index),
                  onMouseLeave: () => setHoveredIndex((current) => current === item.index ? null : current),
                  onFocus: () => setHoveredIndex(item.index),
                  onBlur: () => setHoveredIndex((current) => current === item.index ? null : current),
                  onKeyDown: (event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      onEventClick?.(item.event, item.index);
                      return;
                    }
                    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                      event.preventDefault();
                      markerRefs.current[Math.min(events.length - 1, item.index + 1)]?.focus();
                      return;
                    }
                    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                      event.preventDefault();
                      markerRefs.current[Math.max(0, item.index - 1)]?.focus();
                    }
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("circle", { cx: item.x, cy: item.y, r: "7.5", className: markerClass }),
                    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("title", { children: `Event #${item.index + 1}` })
                  ]
                },
                `map-event-${item.index}`
              );
            }),
            hoveredEvent && hoverTagMetrics ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("g", { className: FiberMap_default.hoverTag, pointerEvents: "none", children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
                "rect",
                {
                  x: hoverTagMetrics.x,
                  y: hoverTagMetrics.y,
                  width: hoverTagMetrics.width,
                  height: "18",
                  rx: "8",
                  ry: "8"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
                "text",
                {
                  x: hoverTagMetrics.textX,
                  y: hoverTagMetrics.textY,
                  textAnchor: "middle",
                  className: FiberMap_default.hoverTagText,
                  children: [
                    "#",
                    hoveredEvent.index + 1
                  ]
                }
              )
            ] }) : null
          ]
        }
      )
    }
  );
}

// src/components/TraceSummary.tsx
var import_react4 = require("react");

// src/components/TraceSummary.module.css
var TraceSummary_default = {};

// src/components/TraceSummary.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function parseDistance5(distance) {
  const value = Number.parseFloat(distance);
  return Number.isFinite(value) ? value : 0;
}
function TraceSummary({ result, thresholds = {}, xUnit = "km" }) {
  const normalized = (0, import_react4.useMemo)(() => normalizeSorResult(result), [result]);
  const { cards, status } = (0, import_react4.useMemo)(() => {
    const summary = normalized.keyEvents.summary;
    const lastEvent = normalized.keyEvents.events[normalized.keyEvents.events.length - 1];
    const fiberLength = lastEvent ? parseDistance5(lastEvent.distance) : normalized.fxdParams.range;
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
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: TraceSummary_default.root, "aria-label": "Trace summary", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TraceSummary_default.badge, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(StatusBadge, { status }) }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TraceSummary_default.grid, children: cards.map((card) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("article", { className: TraceSummary_default.card, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TraceSummary_default.value, children: card.value }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: TraceSummary_default.label, children: card.label })
    ] }, card.key)) })
  ] });
}

// src/components/TraceViewer/TraceViewer.tsx
var import_react11 = require("react");

// src/hooks/useEventSelection.tsx
var import_react5 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var EventSelectionContext = (0, import_react5.createContext)(null);
function EventSelectionProvider({ children }) {
  const [selectedIndex, setSelectedIndex] = (0, import_react5.useState)(null);
  const value = (0, import_react5.useMemo)(
    () => ({
      selectedIndex,
      select: setSelectedIndex
    }),
    [selectedIndex]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(EventSelectionContext.Provider, { value, children });
}
function useEventSelection() {
  const context = (0, import_react5.useContext)(EventSelectionContext);
  if (!context) {
    return {
      selectedIndex: null,
      select: () => void 0
    };
  }
  return context;
}

// src/components/LossBudgetChart.tsx
var import_react6 = require("react");

// src/components/LossBudgetChart.module.css
var LossBudgetChart_default = {};

// src/components/LossBudgetChart.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function parseNumber3(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function cycleSortState2(current, key) {
  if (!current || current.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}
function sortIndicator(sortState, key) {
  if (!sortState || sortState.key !== key) return "\u2195";
  return sortState.direction === "asc" ? "\u2191" : "\u2193";
}
function statusRank(status) {
  if (status === "fail") return 2;
  if (status === "warn") return 1;
  return 0;
}
function clampPercent(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}
function resolveDisplayMax(losses, thresholdMax) {
  const maxLoss = Math.max(0, ...losses, thresholdMax);
  if (maxLoss <= 0) {
    return { displayMax: 0, dominantScaleActive: false };
  }
  if (losses.length <= 1) {
    return { displayMax: maxLoss, dominantScaleActive: false };
  }
  const sorted = losses.slice().sort((a, b) => a - b);
  const q3Index = Math.max(0, Math.floor(sorted.length * 0.75) - 1);
  const reference = sorted[q3Index] ?? sorted[sorted.length - 1] ?? maxLoss;
  if (reference <= 0) {
    return { displayMax: maxLoss, dominantScaleActive: false };
  }
  const ratio = maxLoss / reference;
  const dominantScaleActive = ratio >= 2.5;
  if (!dominantScaleActive) {
    return { displayMax: maxLoss, dominantScaleActive };
  }
  const softenedMax = Math.max(reference * 1.75, thresholdMax, 1e-3);
  return {
    displayMax: Math.min(maxLoss, softenedMax),
    dominantScaleActive
  };
}
function LossBudgetChart({
  events,
  thresholds = {},
  selectedEvent = null,
  onBarClick,
  vertical = false
}) {
  const [sortState, setSortState] = (0, import_react6.useState)(null);
  const rows = (0, import_react6.useMemo)(() => {
    const withLoss = events.map((event, index) => ({
      event,
      index,
      distance: parseNumber3(event.distance),
      spliceLoss: parseNumber3(event.spliceLoss),
      absLoss: Math.abs(parseNumber3(event.spliceLoss))
    })).filter((row) => row.spliceLoss !== 0);
    const thresholdMax = Math.max(
      0,
      thresholds.spliceLoss?.fail ?? 0,
      thresholds.spliceLoss?.warn ?? 0
    );
    const { displayMax, dominantScaleActive } = resolveDisplayMax(
      withLoss.map((row) => row.absLoss),
      thresholdMax
    );
    return {
      maxLoss: displayMax,
      dominantScaleActive,
      rows: withLoss.map((row) => {
        const status = assessEvent(row.event, thresholds);
        const rawPct = displayMax > 0 ? row.absLoss / displayMax * 100 : 0;
        return {
          ...row,
          status,
          widthPct: clampPercent(rawPct),
          overflow: rawPct > 100
        };
      }).sort((a, b) => {
        if (!sortState) return a.index - b.index;
        const multiplier = sortState.direction === "asc" ? 1 : -1;
        if (sortState.key === "index") {
          return (a.index - b.index) * multiplier;
        }
        if (sortState.key === "distance") {
          return (a.distance - b.distance) * multiplier;
        }
        if (sortState.key === "spliceLoss") {
          return (a.absLoss - b.absLoss) * multiplier;
        }
        const statusDiff = (statusRank(a.status) - statusRank(b.status)) * multiplier;
        if (statusDiff !== 0) return statusDiff;
        return (a.index - b.index) * multiplier;
      })
    };
  }, [events, sortState, thresholds]);
  const warnPct = rows.maxLoss > 0 && thresholds.spliceLoss?.warn ? clampPercent(thresholds.spliceLoss.warn / rows.maxLoss * 100) : null;
  const failPct = rows.maxLoss > 0 && thresholds.spliceLoss?.fail ? clampPercent(thresholds.spliceLoss.fail / rows.maxLoss * 100) : null;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("section", { className: `${LossBudgetChart_default.root} ${vertical ? LossBudgetChart_default.vertical : ""}`, "aria-label": "Loss budget chart", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: LossBudgetChart_default.toolbar, role: "group", "aria-label": "Sort loss budget bars", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: LossBudgetChart_default.toolbarLabel, children: "Sort" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: LossBudgetChart_default.sortButton, onClick: () => setSortState((current) => cycleSortState2(current, "index")), children: `# ${sortIndicator(sortState, "index")}` }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: LossBudgetChart_default.sortButton, onClick: () => setSortState((current) => cycleSortState2(current, "distance")), children: `Distance ${sortIndicator(sortState, "distance")}` }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: LossBudgetChart_default.sortButton, onClick: () => setSortState((current) => cycleSortState2(current, "spliceLoss")), children: `Splice ${sortIndicator(sortState, "spliceLoss")}` }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: LossBudgetChart_default.sortButton, onClick: () => setSortState((current) => cycleSortState2(current, "status")), children: `Status ${sortIndicator(sortState, "status")}` })
    ] }),
    rows.dominantScaleActive ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { className: LossBudgetChart_default.scaleHint, children: "Scaled for readability. Bars with an overflow marker exceed display scale." }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: LossBudgetChart_default.chart, children: rows.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
      "button",
      {
        className: `${LossBudgetChart_default.row} ${selectedEvent === row.index ? LossBudgetChart_default.selected : ""}`,
        onClick: () => onBarClick?.(row.event, row.index),
        type: "button",
        "aria-label": `Event ${row.index + 1}, splice loss ${row.spliceLoss.toFixed(3)} dB${row.overflow ? ", exceeds chart scale" : ""}`,
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: LossBudgetChart_default.label, children: [
            "#",
            row.index + 1
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: `${LossBudgetChart_default.track} ${vertical ? LossBudgetChart_default.trackVertical : ""}`, children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${LossBudgetChart_default.zero} ${vertical ? LossBudgetChart_default.zeroVertical : ""}` }),
            warnPct !== null ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${LossBudgetChart_default.threshold} ${LossBudgetChart_default.warnThreshold} ${vertical ? LossBudgetChart_default.thresholdVertical : ""}`, style: vertical ? { bottom: `${warnPct}%` } : { left: `${warnPct}%` } }) : null,
            failPct !== null ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${LossBudgetChart_default.threshold} ${LossBudgetChart_default.failThreshold} ${vertical ? LossBudgetChart_default.thresholdVertical : ""}`, style: vertical ? { bottom: `${failPct}%` } : { left: `${failPct}%` } }) : null,
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
              "span",
              {
                className: `${LossBudgetChart_default.bar} ${vertical ? LossBudgetChart_default.barVertical : ""} ${LossBudgetChart_default[row.status] ?? LossBudgetChart_default.pass}`,
                style: vertical ? { height: `${row.widthPct}%` } : { width: `${row.widthPct}%` }
              }
            ),
            row.overflow ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: `${LossBudgetChart_default.overflowCue} ${vertical ? LossBudgetChart_default.overflowCueVertical : ""}` }) : null
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { className: LossBudgetChart_default.value, children: [
            row.spliceLoss.toFixed(3),
            " dB"
          ] })
        ]
      },
      `loss-${row.index}`
    )) })
  ] });
}

// src/components/PrintButton.module.css
var PrintButton_default = {};

// src/components/PrintButton.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
function PrintButton({ label = "Print" }) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: PrintButton_default.button, onClick: () => window.print(), children: label });
}

// src/components/TraceMeasurementPanel.module.css
var TraceMeasurementPanel_default = {};

// src/components/TraceMeasurementPanel.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function TraceMeasurementPanel({
  cursors,
  measurement,
  xUnit = "km",
  onSwap,
  onClear
}) {
  const hasA = Boolean(cursors.a);
  const hasB = Boolean(cursors.b);
  const ready = Boolean(measurement);
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("section", { className: TraceMeasurementPanel_default.root, "aria-label": "Trace measurement", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("header", { className: TraceMeasurementPanel_default.header, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("h3", { className: TraceMeasurementPanel_default.title, children: "Cursor Measurement" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: TraceMeasurementPanel_default.actions, children: [
        onSwap ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: TraceMeasurementPanel_default.button, onClick: onSwap, disabled: !ready, children: "Swap A/B" }) : null,
        onClear ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", className: TraceMeasurementPanel_default.button, onClick: onClear, disabled: !hasA && !hasB, children: "Clear" }) : null
      ] })
    ] }),
    !hasA && !hasB ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { className: TraceMeasurementPanel_default.hint, children: "Click on the trace to place Cursor A, then place Cursor B." }) : null,
    hasA && !hasB ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { className: TraceMeasurementPanel_default.hint, children: [
      "Cursor A at ",
      formatDistance(cursors.a?.distance ?? 0, xUnit),
      ". Click again to place Cursor B."
    ] }) : null,
    measurement ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: TraceMeasurementPanel_default.grid, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("article", { className: TraceMeasurementPanel_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.cardTitle, children: "Cursor A" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.value, children: formatDistance(measurement.distanceA, xUnit) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.meta, children: formatPower(measurement.powerA, 3) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("article", { className: TraceMeasurementPanel_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.cardTitle, children: "Cursor B" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.value, children: formatDistance(measurement.distanceB, xUnit) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.meta, children: formatPower(measurement.powerB, 3) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("article", { className: TraceMeasurementPanel_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.cardTitle, children: "Delta" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.value, children: formatDistance(measurement.deltaDistance, xUnit) }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.meta, children: formatPower(measurement.deltaPower, 3) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("article", { className: TraceMeasurementPanel_default.card, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.cardTitle, children: "Interval Stats" }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.metaStrong, children: `Avg: ${measurement.avgAttenuationDbPerKm === null ? "N/A" : formatSlope(measurement.avgAttenuationDbPerKm, 3)}` }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.meta, children: `Events: ${measurement.eventCountBetween} \xB7 Reflective: ${measurement.reflectiveEventCountBetween}` }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: TraceMeasurementPanel_default.meta, children: `Splice \u03A3: ${formatPower(measurement.spliceLossSumBetween, 3)}` })
      ] })
    ] }) : null
  ] });
}

// src/components/info/EquipmentInfoPanel.tsx
var import_react8 = require("react");

// src/components/info/InfoPanel.tsx
var import_react7 = require("react");

// src/components/info/InfoPanel.module.css
var InfoPanel_default = {};

// src/components/info/InfoPanel.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function Entries({ entries }) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("dl", { className: InfoPanel_default.list, children: entries.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_react7.Fragment, { children: [
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
  const entries = (0, import_react8.useMemo)(
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
var import_react9 = require("react");
var import_jsx_runtime12 = require("react/jsx-runtime");
function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}
function FiberInfoPanel({ genParams }) {
  const entries = (0, import_react9.useMemo)(() => {
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
var import_react10 = require("react");
var import_jsx_runtime13 = require("react/jsx-runtime");
function MeasurementInfoPanel({ fxdParams }) {
  const entries = (0, import_react10.useMemo)(() => {
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
  const [compact, setCompact] = (0, import_react11.useState)(layout === "compact");
  (0, import_react11.useEffect)(() => {
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
  const normalized = (0, import_react11.useMemo)(() => normalizeSorResult(result), [result]);
  const hostRef = (0, import_react11.useRef)(null);
  const { selectedIndex, select } = useEventSelection();
  const [measurementCursors, setMeasurementCursors] = (0, import_react11.useState)({
    a: null,
    b: null
  });
  const compact = useCompactLayout(layout, hostRef);
  const measurement = (0, import_react11.useMemo)(
    () => computeCursorMeasurement(normalized.trace, normalized.keyEvents.events, measurementCursors),
    [measurementCursors, normalized.keyEvents.events, normalized.trace]
  );
  const exportBaseName = normalized.filename ? normalized.filename.replace(/\.[^.]+$/u, "") : "otdr-trace";
  (0, import_react11.useEffect)(() => {
    onExposeApi({
      select,
      resetZoom: () => {
        select(null);
        setMeasurementCursors({ a: null, b: null });
      }
    });
  }, [onExposeApi, select]);
  (0, import_react11.useEffect)(() => {
    onEventSelect?.(selectedIndex);
  }, [onEventSelect, selectedIndex]);
  (0, import_react11.useEffect)(() => {
    setMeasurementCursors({ a: null, b: null });
  }, [normalized]);
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
          measurementCursors,
          showExportActions: true,
          exportFileBaseName: `${exportBaseName}-chart`,
          onEventClick: (_, index) => select(index),
          onMeasurementCursorsChange: setMeasurementCursors
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)(
        TraceMeasurementPanel,
        {
          cursors: measurementCursors,
          measurement,
          xUnit,
          onClear: () => setMeasurementCursors({ a: null, b: null }),
          ...measurement ? {
            onSwap: () => setMeasurementCursors((current) => ({
              a: current.b,
              b: current.a
            }))
          } : {}
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
        showExportActions: true,
        exportFileBaseName: `${exportBaseName}-events`,
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
var TraceViewer = (0, import_react11.forwardRef)(function TraceViewer2(props, ref) {
  const hostRef = (0, import_react11.useRef)(null);
  const apiRef = (0, import_react11.useRef)({
    select: () => void 0,
    resetZoom: () => void 0
  });
  (0, import_react11.useImperativeHandle)(
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

// src/components/SorDropZone.tsx
var import_react12 = require("react");
var import_browser = require("sor-reader/browser");

// src/components/SorDropZone.module.css
var SorDropZone_default = {};

// src/components/SorDropZone.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
async function parseFile(file, parseOptions) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return (0, import_browser.parseSor)(bytes, file.name, parseOptions);
}
function SorDropZone({ multiple = false, parseOptions, children, onResult, onError }) {
  const inputRef = (0, import_react12.useRef)(null);
  const [dragHover, setDragHover] = (0, import_react12.useState)(false);
  const [loading, setLoading] = (0, import_react12.useState)(false);
  const [error, setError] = (0, import_react12.useState)(null);
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
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(
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
        /* @__PURE__ */ (0, import_jsx_runtime15.jsx)(
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
        children ?? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("span", { children: loading ? "Parsing..." : "Drop .sor file here or click to select" }),
        error ? /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("p", { children: error }) : null
      ]
    }
  );
}

// src/web-components/create-element.ts
var import_client = require("react-dom/client");
var import_react13 = require("react");
var BASE_STYLES = `
:host { display: block; font-family: var(--otdr-font-family, "IBM Plex Sans", "Segoe UI", sans-serif); }
`;
function defineOtdrElement(tagName, Component, observedAttributes, propTransformers) {
  if (customElements.get(tagName)) {
    return;
  }
  class OtdrElement extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }
    root = null;
    props = {};
    set data(value) {
      this.props.data = value;
      this.renderComponent();
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = BASE_STYLES;
        shadowRoot.appendChild(style);
        const container = document.createElement("div");
        shadowRoot.appendChild(container);
        this.root = (0, import_client.createRoot)(container);
      }
      this.syncAttributeProps();
      this.renderComponent();
    }
    disconnectedCallback() {
      this.root?.unmount();
      this.root = null;
    }
    attributeChangedCallback(name, _oldValue, newValue) {
      if (newValue === null) {
        delete this.props[name];
      } else {
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(newValue) : newValue;
      }
      this.renderComponent();
    }
    syncAttributeProps() {
      for (const name of observedAttributes) {
        const value = this.getAttribute(name);
        if (value === null) continue;
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(value) : value;
      }
    }
    renderComponent() {
      if (!this.root) return;
      const props = { ...this.props, host: this };
      this.root.render((0, import_react13.createElement)(Component, props));
    }
  }
  customElements.define(tagName, OtdrElement);
}

// src/web-components/index.ts
function asNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function TraceChartElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return (0, import_react14.createElement)(TraceChart, {
    trace: normalized?.trace ?? [],
    events: normalized?.keyEvents.events ?? [],
    width: props.width ?? "auto",
    height: props.height ?? 360
  });
}
function EventTableElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return (0, import_react14.createElement)(EventTable, {
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
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
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
        eotThreshold: ""
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
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function FiberMapElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return (0, import_react14.createElement)(FiberMap, {
    events: normalized?.keyEvents.events ?? [],
    locationA: normalized?.genParams.locationA,
    locationB: normalized?.genParams.locationB
  });
}
function TraceSummaryElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return (0, import_react14.createElement)(TraceSummary, {
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
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
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
        eotThreshold: ""
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
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function TraceViewerElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return (0, import_react14.createElement)(TraceViewer, {
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
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
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
        eotThreshold: ""
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
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function DropZoneElement(props) {
  void props.data;
  return (0, import_react14.createElement)(SorDropZone, {
    onResult: (result) => {
      props.host?.dispatchEvent(new CustomEvent("result", { detail: result }));
    },
    onError: (error) => {
      props.host?.dispatchEvent(new CustomEvent("error", { detail: error }));
    }
  });
}
defineOtdrElement("otdr-trace-chart", TraceChartElement, ["width", "height"], {
  width: (attr) => attr === "auto" ? "auto" : asNumber(attr),
  height: (attr) => asNumber(attr)
});
defineOtdrElement("otdr-event-table", EventTableElement, [], {});
defineOtdrElement("otdr-fiber-map", FiberMapElement, [], {});
defineOtdrElement("otdr-trace-summary", TraceSummaryElement, [], {});
defineOtdrElement("otdr-trace-viewer", TraceViewerElement, [], {});
defineOtdrElement("otdr-drop-zone", DropZoneElement, [], {});
//# sourceMappingURL=index.cjs.map