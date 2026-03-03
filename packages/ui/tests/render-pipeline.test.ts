import { describe, expect, it, vi } from "vitest";

import { createRenderScheduler } from "../src/canvas/render-pipeline.js";

describe("createRenderScheduler", () => {
  it("coalesces multiple schedule calls into one frame render", () => {
    vi.useFakeTimers();
    const render = vi.fn();
    const scheduler = createRenderScheduler(render);

    scheduler.scheduleRender();
    scheduler.scheduleRender();
    scheduler.scheduleRender();

    expect(scheduler.isDirty()).toBe(true);
    vi.runAllTimers();

    expect(render).toHaveBeenCalledTimes(1);
    expect(scheduler.isDirty()).toBe(false);
    vi.useRealTimers();
  });
});
