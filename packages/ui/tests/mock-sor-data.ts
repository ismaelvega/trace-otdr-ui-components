import type { KeyEvent, SorData, SorResult, TracePoint } from "sor-reader";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildTrace(multiplier = 1, bias = 0): TracePoint[] {
  return Array.from({ length: 182 }, (_, index) => {
    const distance = index * 0.4;
    const ripple = Math.sin(index / 8) * 0.35;
    return {
      distance,
      power: 47 - distance * 0.34 * multiplier + ripple + bias,
    };
  });
}

function createBaseEvents(): KeyEvent[] {
  return [
    {
      type: "0A9999LS {manual} loss",
      distance: "0.000",
      slope: "0.000",
      spliceLoss: "1.025",
      reflLoss: "-39.630",
      comments: "Launch",
    },
    {
      type: "0F9999LS {auto} loss",
      distance: "2.953",
      slope: "0.162",
      spliceLoss: "0.091",
      reflLoss: "0.000",
      comments: "Splice",
    },
    {
      type: "0F9999LS {auto} loss",
      distance: "8.448",
      slope: "0.198",
      spliceLoss: "0.154",
      reflLoss: "0.000",
      comments: "Splice",
    },
    {
      type: "0F9999LS {auto} loss",
      distance: "65.119",
      slope: "0.196",
      spliceLoss: "0.190",
      reflLoss: "0.000",
      comments: "Loss",
    },
    {
      type: "1F9999LE {auto} reflection",
      distance: "71.814",
      slope: "0.202",
      spliceLoss: "0.000",
      reflLoss: "-13.120",
      comments: "End",
    },
  ];
}

function createVariantEvents(): KeyEvent[] {
  return [
    {
      type: "0A9999LS {manual} loss",
      distance: "0.000",
      slope: "0.000",
      spliceLoss: "0.500",
      reflLoss: "-35.120",
      comments: "Launch",
      endOfPrev: "0.000",
      startOfCurr: "0.000",
      endOfCurr: "0.000",
      startOfNext: "0.000",
      peak: "0.000",
    },
    {
      type: "0F9999LS {auto} loss",
      distance: "2.020",
      slope: "0.121",
      spliceLoss: "0.210",
      reflLoss: "0.000",
      comments: "Splice",
      endOfPrev: "2.000",
      startOfCurr: "2.010",
      endOfCurr: "2.020",
      startOfNext: "2.030",
      peak: "2.020",
    },
    {
      type: "1F9999LE {auto} reflection",
      distance: "17.065",
      slope: "0.205",
      spliceLoss: "0.890",
      reflLoss: "-20.500",
      comments: "End",
      endOfPrev: "17.040",
      startOfCurr: "17.050",
      endOfCurr: "17.060",
      startOfNext: "17.065",
      peak: "17.065",
    },
  ];
}

const BASE_DATA: SorData = {
  filename: "demo_ab.sor",
  format: 2,
  version: "2.00",
  mapBlock: {
    nbytes: 4096,
    nblocks: 6,
  },
  blocks: {
    block0: { name: "Map", version: "2.00", size: 128, pos: 0, order: 0 },
    block1: { name: "GenParams", version: "2.00", size: 256, pos: 128, order: 1 },
    block2: { name: "SupParams", version: "2.00", size: 128, pos: 384, order: 2 },
    block3: { name: "FxdParams", version: "2.00", size: 256, pos: 512, order: 3 },
    block4: { name: "KeyEvents", version: "2.00", size: 512, pos: 768, order: 4 },
    block5: { name: "DataPts", version: "2.00", size: 2048, pos: 1280, order: 5 },
  },
  genParams: {
    language: "EN",
    cableId: "Cable",
    fiberId: "Fiber",
    wavelength: "1550 nm",
    locationA: "Loc A",
    locationB: "Loc B",
    cableCode: "CC (as-current)",
    buildCondition: "CC (as-current)",
    userOffset: "0",
    operator: "Demo User",
    comments: "Generated test data",
    fiberType: "G.652 (standard SMF)",
    userOffsetDistance: "0",
  },
  supParams: {
    supplier: "Viavi",
    otdr: "OTU 8000E",
    otdrSerialNumber: "12861",
    module: "8115 C",
    moduleSerialNumber: "11531",
    software: "21.74",
    other: "",
  },
  fxdParams: {
    dateTime: "2026-03-03T11:23:15.000Z",
    dateTimeRaw: 1772536995,
    unit: "mt (meters)",
    wavelength: "1550.0 nm",
    acquisitionOffset: 0,
    acquisitionOffsetDistance: 0,
    pulseWidthEntries: 1,
    pulseWidth: "3000 ns",
    sampleSpacing: 0.2,
    numDataPoints: 31896,
    indexOfRefraction: 1.4682,
    backscatterCoeff: "-81.00 dB",
    numAverages: 1,
    averagingTime: "20 sec",
    range: 81.411,
    acquisitionRangeDistance: 81.411,
    resolution: 2.552,
    frontPanelOffset: 0,
    noiseFloorLevel: 0,
    noiseFloorScalingFactor: 0,
    powerOffsetFirstPoint: 0,
    lossThreshold: "0.000 dB",
    reflThreshold: "-65.535 dB",
    eotThreshold: "6.000 dB",
    traceType: "ST[standard trace]",
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  },
  keyEvents: {
    numEvents: 5,
    events: createBaseEvents(),
    summary: {
      totalLoss: 22.07,
      orl: 0,
      lossStart: 0,
      lossEnd: 71.814,
      orlStart: 0,
      orlFinish: 71.814,
    },
  },
  dataPts: {
    numDataPoints: 31896,
    numTraces: 1,
    scalingFactor: 1000,
    maxBeforeOffset: 64000,
    minBeforeOffset: 0,
  },
  checksum: {
    stored: 43856,
    calculated: 43856,
    valid: true,
  },
  trace: buildTrace(1, 0),
};

const VARIANT_DATA: SorData = {
  ...BASE_DATA,
  filename: "sample1310_lowDR.sor",
  genParams: {
    ...BASE_DATA.genParams,
    wavelength: "1310 nm",
    locationA: "Site A",
    locationB: "Site B",
  },
  supParams: {
    ...BASE_DATA.supParams,
    software: "21.80",
  },
  fxdParams: {
    ...BASE_DATA.fxdParams,
    wavelength: "1310.0 nm",
    pulseWidth: "1000 ns",
    range: 20.0,
    acquisitionRangeDistance: 20.0,
  },
  keyEvents: {
    numEvents: 3,
    events: createVariantEvents(),
    summary: {
      totalLoss: 12.4,
      orl: 18.3,
      lossStart: 0,
      lossEnd: 17.065,
      orlStart: 0,
      orlFinish: 17.065,
    },
  },
  dataPts: {
    ...BASE_DATA.dataPts,
    numDataPoints: 12000,
  },
  trace: buildTrace(1.1, -1.2),
};

export function createMockSorData(): SorData {
  return clone(BASE_DATA);
}

export function createMockSorDataVariant(): SorData {
  return clone(VARIANT_DATA);
}

export function createMockSorResultRawV1(): SorResult {
  const data = createMockSorData();
  const keyEvents: Record<string, unknown> = {
    "num events": data.keyEvents.events.length,
  };
  data.keyEvents.events.forEach((event, index) => {
    keyEvents[`event ${index + 1}`] = {
      type: event.type,
      distance: event.distance,
      slope: event.slope,
      "splice loss": event.spliceLoss,
      "refl loss": event.reflLoss,
      comments: event.comments,
    };
  });
  keyEvents.Summary = {
    "total loss": data.keyEvents.summary.totalLoss,
    ORL: data.keyEvents.summary.orl,
    "loss start": data.keyEvents.summary.lossStart,
    "loss end": data.keyEvents.summary.lossEnd,
    "ORL start": data.keyEvents.summary.orlStart,
    "ORL finish": data.keyEvents.summary.orlFinish,
  };

  return {
    filename: data.filename,
    format: 1,
    version: "1.00",
    mapblock: {
      nbytes: data.mapBlock.nbytes,
      nblocks: data.mapBlock.nblocks,
    },
    blocks: data.blocks,
    GenParams: {
      language: data.genParams.language,
      "cable ID": data.genParams.cableId,
      "fiber ID": data.genParams.fiberId,
      wavelength: data.genParams.wavelength,
      "location A": data.genParams.locationA,
      "location B": data.genParams.locationB,
      "cable code/fiber type": data.genParams.cableCode,
      "build condition": data.genParams.buildCondition,
      "user offset": data.genParams.userOffset,
      operator: data.genParams.operator,
      comments: data.genParams.comments,
    },
    SupParams: {
      supplier: data.supParams.supplier,
      OTDR: data.supParams.otdr,
      "OTDR S/N": data.supParams.otdrSerialNumber,
      module: data.supParams.module,
      "module S/N": data.supParams.moduleSerialNumber,
      software: data.supParams.software,
      other: data.supParams.other,
    },
    FxdParams: {
      "date/time": data.fxdParams.dateTime,
      unit: data.fxdParams.unit,
      wavelength: data.fxdParams.wavelength,
      "acquisition offset": data.fxdParams.acquisitionOffset,
      "number of pulse width entries": data.fxdParams.pulseWidthEntries,
      "pulse width": data.fxdParams.pulseWidth,
      "sample spacing": String(data.fxdParams.sampleSpacing),
      "num data points": data.fxdParams.numDataPoints,
      index: data.fxdParams.indexOfRefraction.toFixed(6),
      BC: data.fxdParams.backscatterCoeff,
      "num averages": data.fxdParams.numAverages,
      range: data.fxdParams.range,
      "front panel offset": data.fxdParams.frontPanelOffset,
      "noise floor level": data.fxdParams.noiseFloorLevel,
      "noise floor scaling factor": data.fxdParams.noiseFloorScalingFactor,
      "power offset first point": data.fxdParams.powerOffsetFirstPoint,
      "loss thr": data.fxdParams.lossThreshold,
      "refl thr": data.fxdParams.reflThreshold,
      "EOT thr": data.fxdParams.eotThreshold,
      resolution: data.fxdParams.resolution,
    },
    KeyEvents: keyEvents as SorResult["KeyEvents"],
    DataPts: {
      "num data points": data.dataPts.numDataPoints,
      "num traces": data.dataPts.numTraces,
      "num data points 2": data.dataPts.numDataPoints,
      "scaling factor": data.dataPts.scalingFactor,
      "max before offset": data.dataPts.maxBeforeOffset,
      "min before offset": data.dataPts.minBeforeOffset,
      _datapts_params: {
        offset: "STV",
        xscaling: 1,
      },
    },
    Cksum: {
      checksum: data.checksum.stored,
      checksum_ours: data.checksum.calculated,
      match: data.checksum.valid,
    },
    trace: data.trace,
    vendorBlocks: {},
  };
}

export function createMockSorResultRawV2(): SorResult {
  const data = createMockSorDataVariant();
  const keyEvents: Record<string, unknown> = {
    "num events": data.keyEvents.events.length,
  };
  data.keyEvents.events.forEach((event, index) => {
    keyEvents[`event ${index + 1}`] = {
      type: event.type,
      distance: event.distance,
      slope: event.slope,
      "splice loss": event.spliceLoss,
      "refl loss": event.reflLoss,
      comments: event.comments,
      "end of prev": "endOfPrev" in event ? event.endOfPrev : "0.000",
      "start of curr": "startOfCurr" in event ? event.startOfCurr : "0.000",
      "end of curr": "endOfCurr" in event ? event.endOfCurr : "0.000",
      "start of next": "startOfNext" in event ? event.startOfNext : "0.000",
      peak: "peak" in event ? event.peak : "0.000",
    };
  });
  keyEvents.Summary = {
    "total loss": data.keyEvents.summary.totalLoss,
    ORL: data.keyEvents.summary.orl,
    "loss start": data.keyEvents.summary.lossStart,
    "loss end": data.keyEvents.summary.lossEnd,
    "ORL start": data.keyEvents.summary.orlStart,
    "ORL finish": data.keyEvents.summary.orlFinish,
  };

  return {
    filename: data.filename,
    format: 2,
    version: "2.00",
    mapblock: {
      nbytes: data.mapBlock.nbytes,
      nblocks: data.mapBlock.nblocks,
    },
    blocks: data.blocks,
    GenParams: {
      language: data.genParams.language,
      "cable ID": data.genParams.cableId,
      "fiber ID": data.genParams.fiberId,
      "fiber type": "fiberType" in data.genParams ? data.genParams.fiberType : "",
      wavelength: data.genParams.wavelength,
      "location A": data.genParams.locationA,
      "location B": data.genParams.locationB,
      "cable code/fiber type": data.genParams.cableCode,
      "build condition": data.genParams.buildCondition,
      "user offset": data.genParams.userOffset,
      "user offset distance": "userOffsetDistance" in data.genParams ? data.genParams.userOffsetDistance : "0",
      operator: data.genParams.operator,
      comments: data.genParams.comments,
    },
    SupParams: {
      supplier: data.supParams.supplier,
      OTDR: data.supParams.otdr,
      "OTDR S/N": data.supParams.otdrSerialNumber,
      module: data.supParams.module,
      "module S/N": data.supParams.moduleSerialNumber,
      software: data.supParams.software,
      other: data.supParams.other,
    },
    FxdParams: {
      "date/time": data.fxdParams.dateTime,
      unit: data.fxdParams.unit,
      wavelength: data.fxdParams.wavelength,
      "acquisition offset": data.fxdParams.acquisitionOffset,
      "acquisition offset distance": "acquisitionOffsetDistance" in data.fxdParams ? data.fxdParams.acquisitionOffsetDistance : 0,
      "number of pulse width entries": data.fxdParams.pulseWidthEntries,
      "pulse width": data.fxdParams.pulseWidth,
      "sample spacing": String(data.fxdParams.sampleSpacing),
      "num data points": data.fxdParams.numDataPoints,
      index: data.fxdParams.indexOfRefraction.toFixed(6),
      BC: data.fxdParams.backscatterCoeff,
      "num averages": data.fxdParams.numAverages,
      "averaging time": "averagingTime" in data.fxdParams ? data.fxdParams.averagingTime : "0 sec",
      range: data.fxdParams.range,
      "acquisition range distance": "acquisitionRangeDistance" in data.fxdParams ? data.fxdParams.acquisitionRangeDistance : data.fxdParams.range,
      "front panel offset": data.fxdParams.frontPanelOffset,
      "noise floor level": data.fxdParams.noiseFloorLevel,
      "noise floor scaling factor": data.fxdParams.noiseFloorScalingFactor,
      "power offset first point": data.fxdParams.powerOffsetFirstPoint,
      "loss thr": data.fxdParams.lossThreshold,
      "refl thr": data.fxdParams.reflThreshold,
      "EOT thr": data.fxdParams.eotThreshold,
      "trace type": "traceType" in data.fxdParams ? data.fxdParams.traceType : "ST[standard trace]",
      X1: "x1" in data.fxdParams ? data.fxdParams.x1 : 0,
      Y1: "y1" in data.fxdParams ? data.fxdParams.y1 : 0,
      X2: "x2" in data.fxdParams ? data.fxdParams.x2 : 0,
      Y2: "y2" in data.fxdParams ? data.fxdParams.y2 : 0,
      resolution: data.fxdParams.resolution,
    },
    KeyEvents: keyEvents as SorResult["KeyEvents"],
    DataPts: {
      "num data points": data.dataPts.numDataPoints,
      "num traces": data.dataPts.numTraces,
      "num data points 2": data.dataPts.numDataPoints,
      "scaling factor": data.dataPts.scalingFactor,
      "max before offset": data.dataPts.maxBeforeOffset,
      "min before offset": data.dataPts.minBeforeOffset,
      _datapts_params: {
        offset: "STV",
        xscaling: 1,
      },
    },
    Cksum: {
      checksum: data.checksum.stored,
      checksum_ours: data.checksum.calculated,
      match: data.checksum.valid,
    },
    trace: data.trace,
    vendorBlocks: {},
  };
}
