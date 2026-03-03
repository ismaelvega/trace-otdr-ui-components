/** @vitest-environment jsdom */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";
import { parseSor } from "sor-reader";

import "../src/web-components/index.js";

function loadFixture(name: string) {
  const bytes = new Uint8Array(readFileSync(resolve(process.cwd(), "../../sor-reader/tests/fixtures", name)));
  return parseSor(bytes, name);
}

describe("web components", () => {
  it("mounts custom element and accepts data property", async () => {
    const el = document.createElement("otdr-trace-summary") as HTMLElement & { data?: unknown };
    document.body.appendChild(el);

    el.data = loadFixture("demo_ab.sor");
    await new Promise((resolveWait) => setTimeout(resolveWait, 0));

    expect(el.shadowRoot).not.toBeNull();
    expect(el.shadowRoot?.textContent).toContain("Fiber Length");

    document.body.removeChild(el);
  });
});
