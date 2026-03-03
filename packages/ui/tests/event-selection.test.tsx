/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventSelectionProvider, useEventSelection } from "../src/hooks/useEventSelection.js";

function SelectorButton() {
  const { select } = useEventSelection();
  return (
    <button type="button" onClick={() => select(2)}>
      Select 3rd
    </button>
  );
}

function SelectedLabel() {
  const { selectedIndex } = useEventSelection();
  return <p>Selected: {selectedIndex ?? "none"}</p>;
}

describe("EventSelectionProvider", () => {
  it("propagates selected index across consumers", () => {
    render(
      <EventSelectionProvider>
        <SelectorButton />
        <SelectedLabel />
      </EventSelectionProvider>,
    );

    fireEvent.click(screen.getByText("Select 3rd"));
    expect(screen.getByText("Selected: 2")).toBeTruthy();
  });
});
