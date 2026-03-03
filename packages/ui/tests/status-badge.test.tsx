/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatusBadge } from "../src/components/primitives/StatusBadge.js";

describe("StatusBadge", () => {
  it("renders default status label with role", () => {
    render(<StatusBadge status="warn" />);

    const status = screen.getByRole("status");
    expect(status.textContent).toContain("Warning");
    expect(status.getAttribute("aria-label")).toContain("Warning");
  });
});
