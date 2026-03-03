/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";

import "../src/web-components/index.js";
import { createMockSorData } from "./mock-sor-data.js";

describe("web components", () => {
  it("mounts custom element and accepts data property", async () => {
    const el = document.createElement("otdr-trace-summary") as HTMLElement & { data?: unknown };
    document.body.appendChild(el);

    el.data = createMockSorData();
    await new Promise((resolveWait) => setTimeout(resolveWait, 0));

    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot?.textContent).toContain("Fiber Length");

    document.body.removeChild(el);
  });
});
