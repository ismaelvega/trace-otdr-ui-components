import { describe, expect, it } from "vitest";

import { assessEvent, assessSummary, classifyEvent } from "../src/utils/classifiers.js";

describe("classifyEvent", () => {
  it("classifies real fixture-style type codes", () => {
    expect(
      classifyEvent({
        type: "1F9999LS {auto} reflection",
        distance: "0.000",
        slope: "0.000",
        spliceLoss: "0.000",
        reflLoss: "-50.000",
        comments: "",
      }),
    ).toBe("reflection");

    expect(
      classifyEvent({
        type: "0F9999LS {auto} loss/drop/gain",
        distance: "12.711",
        slope: "0.344",
        spliceLoss: "0.209",
        reflLoss: "0.000",
        comments: "",
      }),
    ).toBe("loss");

    expect(
      classifyEvent({
        type: "0F99992P [unknown type 0F99992P]",
        distance: "0",
        slope: "0",
        spliceLoss: "0",
        reflLoss: "0",
        comments: "",
      }),
    ).toBe("unknown");
  });

  it("supports manual and end-of-fiber variants", () => {
    expect(
      classifyEvent({
        type: "1A9999LS",
        distance: "0",
        slope: "0",
        spliceLoss: "0",
        reflLoss: "0",
        comments: "",
      }),
    ).toBe("manual");

    expect(
      classifyEvent({
        type: "1F9999LE",
        distance: "0",
        slope: "0",
        spliceLoss: "0",
        reflLoss: "0",
        comments: "",
      }),
    ).toBe("end-of-fiber");
  });
});

describe("assessEvent", () => {
  const thresholds = {
    spliceLoss: { warn: 0.3, fail: 0.5 },
    reflLoss: { warn: -50, fail: -40 },
    slope: { warn: 0.3, fail: 0.5 },
  };

  it("returns pass/warn/fail on threshold boundaries", () => {
    expect(
      assessEvent(
        {
          type: "0F9999LS",
          distance: "0",
          slope: "0.299",
          spliceLoss: "0.299",
          reflLoss: "-50.001",
          comments: "",
        },
        thresholds,
      ),
    ).toBe("pass");

    expect(
      assessEvent(
        {
          type: "0F9999LS",
          distance: "0",
          slope: "0.300",
          spliceLoss: "0.300",
          reflLoss: "-50.000",
          comments: "",
        },
        thresholds,
      ),
    ).toBe("warn");

    expect(
      assessEvent(
        {
          type: "0F9999LS",
          distance: "0",
          slope: "0.500",
          spliceLoss: "0.500",
          reflLoss: "-40.000",
          comments: "",
        },
        thresholds,
      ),
    ).toBe("fail");
  });
});

describe("assessSummary", () => {
  it("evaluates pass/warn/fail from summary thresholds", () => {
    const thresholds = {
      totalLoss: { fail: 6.5 },
      orl: { fail: 30 },
      fiberLength: { max: 18 },
    };

    expect(
      assessSummary(
        {
          totalLoss: 6.4,
          orl: 32,
          lossStart: 0,
          lossEnd: 17,
          orlStart: 0,
          orlFinish: 17,
        },
        thresholds,
      ),
    ).toBe("warn");

    expect(
      assessSummary(
        {
          totalLoss: 6.6,
          orl: 32,
          lossStart: 0,
          lossEnd: 17,
          orlStart: 0,
          orlFinish: 17,
        },
        thresholds,
      ),
    ).toBe("fail");

    expect(
      assessSummary(
        {
          totalLoss: 4,
          orl: 35,
          lossStart: 0,
          lossEnd: 10,
          orlStart: 0,
          orlFinish: 10,
        },
        thresholds,
      ),
    ).toBe("pass");
  });
});
