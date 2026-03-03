# Dual Cursor A/B Feature Plan

## Overview

Add a two-cursor measurement workflow to `TraceChart`:

- User sets `Cursor A` and `Cursor B` on the trace.
- UI displays computed details between both points.
- Behavior works with zoom/pan, keyboard, and existing event selection.

## Product Goals

- Make point-to-point measurements fast and precise.
- Keep chart interaction simple (no mode confusion).
- Keep performance and accessibility at current quality level.

## Non-Goals

- No parser (`sor-reader`) changes.
- No breaking changes to existing chart consumers.
- No server-side storage in this phase.

## Milestone Status

- [ ] Milestone 0 — UX Contract and Interaction Spec
- [ ] Milestone 1 — Cursor State Model and Public API
- [ ] Milestone 2 — Rendering Layer for Cursor A/B
- [ ] Milestone 3 — Pointer and Keyboard Interactions
- [ ] Milestone 4 — Measurement Computation Engine
- [ ] Milestone 5 — Measurement UI Panel
- [ ] Milestone 6 — Integration in `TraceViewer` and Demo
- [ ] Milestone 7 — Accessibility and Usability Hardening
- [ ] Milestone 8 — Unit and Integration Test Coverage
- [ ] Milestone 9 — Documentation, QA, and Final Sign-Off

---

## Milestone 0 — UX Contract and Interaction Spec

### Objectives

- Freeze expected user behavior before coding.

### Deliverables

- Written interaction map for mouse/touch/keyboard.
- Conflict resolution rules with existing hover/event interactions.

### Tasks

- Define primary flow:
  1. First click places `A`.
  2. Second click places `B`.
  3. Third click resets `A` and clears `B` (start new measurement).
- Define adjustment flow:
  - Drag `A` or `B` marker to fine-tune.
- Define reset shortcuts:
  - `Esc`: clear `B` first, then clear all.
  - Optional clear action button in panel.
- Define visual language:
  - Distinct color + label badge for `A` and `B`.
  - Connector/region highlight between cursors.

### Exit Criteria

- No ambiguous behavior left for implementation.

---

## Milestone 1 — Cursor State Model and Public API

### Objectives

- Introduce stable internal/external state model without breaking current API.

### Deliverables

- New chart types for measurement cursors.
- Optional controlled/uncontrolled cursor support.

### Tasks

- Add types:
  - `MeasurementCursor = { distance: number; power: number; traceIndex: number }`
  - `MeasurementCursors = { a: MeasurementCursor | null; b: MeasurementCursor | null }`
- Extend `TraceChartProps` with:
  - `measurementCursors?: MeasurementCursors` (controlled)
  - `defaultMeasurementCursors?: MeasurementCursors` (uncontrolled)
  - `onMeasurementCursorsChange?: (value: MeasurementCursors) => void`
- Keep all new props optional with safe defaults.

### Exit Criteria

- Existing consumers compile with zero changes.

---

## Milestone 2 — Rendering Layer for Cursor A/B

### Objectives

- Draw both cursors clearly and consistently on canvas.

### Deliverables

- Cursor A/B lines, handles, and labels on `TraceChart`.

### Tasks

- Add canvas renderer module (or extend crosshair renderer):
  - Vertical line for `A` and `B`.
  - Marker dot pinned to nearest trace point.
  - Label chips (`A`, `B`) with value readout.
- Add optional between-cursors region highlight.
- Add z-order rules:
  - trace -> event markers -> cursor region -> cursor handles/labels -> hover tooltip.
- Add color tokens:
  - `--otdr-cursor-a`, `--otdr-cursor-b`, `--otdr-cursor-span`.

### Exit Criteria

- Cursors remain readable at dense zoom levels and don’t conflict with axis/tooltip.

---

## Milestone 3 — Pointer and Keyboard Interactions

### Objectives

- Make cursor placement/editing precise and predictable.

### Deliverables

- Full mouse/touch/keyboard interaction support.

### Tasks

- Implement click placement state machine (`A`, then `B`, then restart).
- Implement hit-testing for cursor handles and drag behavior.
- Respect existing pan/zoom gestures:
  - Drag handle moves cursor.
  - Drag empty plot pans chart.
- Add keyboard support when chart focused:
  - `Tab` cycles handles.
  - Arrow keys nudge selected cursor by sample step.
  - `Shift+Arrow` nudge by larger step.

### Exit Criteria

- No interaction conflict between cursor drag, event selection, and chart pan.

---

## Milestone 4 — Measurement Computation Engine

### Objectives

- Compute robust, deterministic metrics between A and B.

### Deliverables

- Pure utility function for all interval metrics.

### Tasks

- Create utility:
  - `computeCursorMeasurement(trace, events, a, b)`
- Return at minimum:
  - `distanceA`, `distanceB`, `deltaDistance`
  - `powerA`, `powerB`, `deltaPower`
  - `avgAttenuationDbPerKm` (guard `deltaDistance <= 0`)
  - `eventCountBetween`
  - `reflectiveEventCountBetween`
  - `spliceLossSumBetween` (when available)
- Deterministic behavior for edge cases:
  - same-point cursors
  - out-of-order `A/B` (normalize internally)
  - sparse/no events

### Exit Criteria

- Computation outputs are stable and unit-tested for edge cases.

---

## Milestone 5 — Measurement UI Panel

### Objectives

- Present interval details clearly and compactly.

### Deliverables

- Reusable `TraceMeasurementPanel` component.

### Tasks

- Show grouped sections:
  - Cursor A
  - Cursor B
  - Delta/Interval summary
- Use tabular numerics and consistent units.
- Add quick actions:
  - `Swap A/B`
  - `Clear`.
- Add empty state (`Set two cursors to measure`).

### Exit Criteria

- User can read all key interval details without inspecting raw chart labels.

---

## Milestone 6 — Integration in `TraceViewer` and Demo

### Objectives

- Wire end-to-end experience in the main composed screens.

### Deliverables

- Dual-cursor feature available in `TraceViewer` and `apps/demo`.

### Tasks

- Integrate panel below `TraceChart` in `TraceViewer`.
- Add demo helper text and sample workflow.
- Ensure no layout regressions in desktop/mobile and telecom theme.

### Exit Criteria

- Feature is discoverable and usable in demo without developer tooling.

---

## Milestone 7 — Accessibility and Usability Hardening

### Objectives

- Ensure inclusive and reliable interactions.

### Deliverables

- Keyboard and screen-reader support for cursor operations.

### Tasks

- Add ARIA/live updates for cursor movement summaries.
- Ensure handle focus rings and contrast pass in all themes.
- Respect `prefers-reduced-motion` for cursor transitions.

### Exit Criteria

- Keyboard-only user can place, move, and clear both cursors.

---

## Milestone 8 — Unit and Integration Test Coverage

### Objectives

- Lock feature behavior and prevent regressions.

### Deliverables

- Tests across utility, renderer logic, and component integration.

### Tasks

- Unit tests:
  - measurement math utility
  - edge cases (`deltaDistance = 0`, reversed order)
- Interaction tests:
  - click-to-place A/B
  - drag cursor
  - keyboard nudge and clear
- Integration tests:
  - panel values update after cursor moves
  - coexists with event click and chart zoom/pan

### Exit Criteria

- New tests pass reliably and are deterministic in CI.

---

## Milestone 9 — Documentation, QA, and Final Sign-Off

### Objectives

- Ship production-ready feature with clear docs.

### Deliverables

- Updated docs and changelog entries.
- QA checklist with visual and behavior verification.

### Tasks

- Update package docs for new props/events.
- Add demo usage snippet for controlled and uncontrolled modes.
- Run full gates:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`

### Exit Criteria

- All milestones checked off and full repo gates green.

---

## Verification Checklist

- [ ] Cursor A/B placement and reset behavior is deterministic.
- [ ] Dragging handles updates both canvas labels and measurement panel in real time.
- [ ] Delta metrics are correct across units and zoom levels.
- [ ] No regression in existing event markers, tooltip, or pan/zoom.
- [ ] Accessibility checks pass for focus order, keyboard controls, and ARIA labels.
- [ ] Full lint/typecheck/test/build pass.
