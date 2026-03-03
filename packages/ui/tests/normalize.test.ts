import { describe, expect, it } from "vitest";

import type { SorData } from "sor-reader";
import { normalizeSorResult } from "../src/adapters/normalize.js";
import { createMockSorResultRawV1, createMockSorResultRawV2 } from "./mock-sor-data.js";

describe("normalizeSorResult", () => {
  it("normalizes v1 fixture output into SorData", () => {
    const raw = createMockSorResultRawV1();
    const normalized = normalizeSorResult(raw);

    expect(normalized.filename).toBe(raw.filename);
    expect(normalized.mapBlock.nblocks).toBe(raw.mapblock.nblocks);
    expect(normalized.genParams.cableId).toBe(raw.GenParams["cable ID"]);
    expect(normalized.supParams.otdr).toBe(raw.SupParams.OTDR);
    expect(normalized.fxdParams.numDataPoints).toBe(raw.FxdParams["num data points"]);
    expect(normalized.keyEvents.numEvents).toBe(raw.KeyEvents["num events"]);
    expect(normalized.dataPts.numTraces).toBe(raw.DataPts["num traces"]);
    expect(normalized.checksum.valid).toBe(raw.Cksum.match);
  });

  it("normalizes v2 fixture output and carries v2-only fields", () => {
    const raw = createMockSorResultRawV2();
    const normalized = normalizeSorResult(raw);

    expect(normalized.fxdParams).toMatchObject({
      acquisitionOffsetDistance: raw.FxdParams["acquisition offset distance"],
      acquisitionRangeDistance: raw.FxdParams["acquisition range distance"],
      traceType: raw.FxdParams["trace type"],
    });

    const firstEvent = normalized.keyEvents.events[0];
    expect(firstEvent).toHaveProperty("endOfPrev");
    expect(firstEvent).toHaveProperty("startOfCurr");
  });

  it("is idempotent for already-normalized data", () => {
    const normalized = normalizeSorResult(createMockSorResultRawV1());
    const secondPass = normalizeSorResult(normalized as SorData);

    expect(secondPass).toBe(normalized);
  });
});
