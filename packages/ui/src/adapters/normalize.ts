import type {
  ChecksumInfo,
  DataPtsInfo,
  FxdParams,
  FxdParamsV1,
  FxdParamsV2,
  GenParams,
  KeyEvent,
  KeyEventV1,
  KeyEventV2,
  KeyEvents,
  SorData,
  SorResult,
  SupParams,
} from "sor-reader";

interface KeyEventRawLike {
  type: string;
  distance: string;
  slope: string;
  "splice loss": string;
  "refl loss": string;
  comments: string;
  "end of prev"?: string;
  "start of curr"?: string;
  "end of curr"?: string;
  "start of next"?: string;
  peak?: string;
}

function parseNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTimestamp(dateTime: string): number {
  const match = dateTime.match(/\((\d+)\s+sec\)/);
  if (!match) return 0;
  const secondsPart = match[1];
  if (!secondsPart) return 0;

  const timestamp = Number.parseInt(secondsPart, 10);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function parseNumberWithUnit(value: string): number {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  if (!match) return 0;
  const numericPart = match[0];
  if (!numericPart) return 0;
  return parseNumber(numericPart);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function isKeyEventRawLike(input: unknown): input is KeyEventRawLike {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  const event = input as Record<string, unknown>;
  return (
    typeof event.type === "string" &&
    typeof event.distance === "string" &&
    typeof event.slope === "string" &&
    typeof event["splice loss"] === "string" &&
    typeof event["refl loss"] === "string" &&
    typeof event.comments === "string"
  );
}

function toGenParams(input: SorResult["GenParams"]): GenParams {
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
    comments: input.comments,
  };

  if (input["fiber type"] !== undefined || input["user offset distance"] !== undefined) {
    return {
      ...base,
      fiberType: input["fiber type"] ?? "",
      userOffsetDistance: input["user offset distance"] ?? "",
    };
  }

  return base;
}

function toSupParams(input: SorResult["SupParams"]): SupParams {
  return {
    supplier: input.supplier,
    otdr: input.OTDR,
    otdrSerialNumber: input["OTDR S/N"],
    module: input.module,
    moduleSerialNumber: input["module S/N"],
    software: input.software,
    other: input.other,
  };
}

function toFxdParams(input: SorResult["FxdParams"]): FxdParams {
  const base: FxdParamsV1 = {
    dateTime: new Date(parseTimestamp(input["date/time"]) * 1000).toISOString(),
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
    eotThreshold: input["EOT thr"],
  };

  const hasV2Fields =
    input["acquisition offset distance"] !== undefined ||
    input["averaging time"] !== undefined ||
    input["acquisition range distance"] !== undefined ||
    input["trace type"] !== undefined ||
    input.X1 !== undefined ||
    input.Y1 !== undefined ||
    input.X2 !== undefined ||
    input.Y2 !== undefined;

  if (!hasV2Fields) return base;

  const v2: FxdParamsV2 = {
    ...base,
    acquisitionOffsetDistance: input["acquisition offset distance"] ?? 0,
    averagingTime: input["averaging time"] ?? "",
    acquisitionRangeDistance: input["acquisition range distance"] ?? 0,
    traceType: input["trace type"] ?? "",
    x1: input.X1 ?? 0,
    y1: input.Y1 ?? 0,
    x2: input.X2 ?? 0,
    y2: input.Y2 ?? 0,
  };

  return v2;
}

function toKeyEvent(input: unknown): KeyEvent {
  if (!isKeyEventRawLike(input)) {
    throw new TypeError("Invalid key event entry");
  }

  const event = input;
  const base: KeyEventV1 = {
    type: event.type,
    distance: event.distance,
    slope: event.slope,
    spliceLoss: event["splice loss"],
    reflLoss: event["refl loss"],
    comments: event.comments,
  };

  const hasV2 =
    typeof event["end of prev"] === "string" ||
    typeof event["start of curr"] === "string" ||
    typeof event["end of curr"] === "string" ||
    typeof event["start of next"] === "string" ||
    typeof event.peak === "string";

  if (!hasV2) return base;

  const v2: KeyEventV2 = {
    ...base,
    endOfPrev: asString(event["end of prev"], "0"),
    startOfCurr: asString(event["start of curr"], "0"),
    endOfCurr: asString(event["end of curr"], "0"),
    startOfNext: asString(event["start of next"], "0"),
    peak: asString(event.peak, "0"),
  };

  return v2;
}

function toKeyEvents(input: SorResult["KeyEvents"]): KeyEvents {
  const eventKeys = Object.keys(input)
    .filter((key) => /^event \d+$/.test(key))
    .sort((a, b) => Number.parseInt(a.slice(6), 10) - Number.parseInt(b.slice(6), 10));

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
      orlFinish: input.Summary["ORL finish"],
    },
  };
}

function toDataPts(input: SorResult["DataPts"]): DataPtsInfo {
  return {
    numDataPoints: input["num data points"],
    numTraces: input["num traces"],
    scalingFactor: input["scaling factor"],
    maxBeforeOffset: input["max before offset"],
    minBeforeOffset: input["min before offset"],
  };
}

function toChecksum(input: SorResult["Cksum"]): ChecksumInfo {
  return {
    stored: input.checksum,
    calculated: input.checksum_ours,
    valid: input.match,
  };
}

function isSorData(input: SorResult | SorData): input is SorData {
  return "genParams" in input;
}

export function normalizeSorResult(result: SorResult | SorData): SorData {
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
    trace: result.trace,
  };
}
