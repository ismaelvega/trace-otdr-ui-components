# Visual Improvements Plan

## Overview

This plan defines a full visual refresh for the OTDR UI while preserving current functional behavior and data correctness.

Goals:

- Improve clarity and hierarchy for dense technical data
- Reduce chart/table visual noise
- Strengthen consistency across components
- Preserve accessibility and performance

Non-goals:

- No data model changes
- No parser behavior changes
- No breaking API changes in component props (unless explicitly versioned)

## Milestone Status

- [x] Milestone 0 — Baseline Audit
- [x] Milestone 1 — Design Tokens 2.0
- [x] Milestone 2 — Layout Hierarchy & Spacing
- [x] Milestone 3 — Typography & Numeric Readability
- [x] Milestone 4 — TraceChart Visual Clarity
- [x] Milestone 5 — FiberMap Legibility
- [x] Milestone 6 — EventTable Scanability
- [x] Milestone 7 — LossBudget Visual Balance
- [x] Milestone 8 — Interaction Polish
- [x] Milestone 9 — Responsive Optimization
- [x] Milestone 10 — Accessibility & Contrast QA
- [x] Milestone 11 — Demo/Docs Visual Update
- [x] Milestone 12 — Final QA, Regression, and Sign-Off

---

## Milestone 0 — Baseline Audit

### Objectives

- Establish measurable baseline before visual changes
- Capture visual, accessibility, and responsiveness references

### Deliverables

- Baseline screenshots (desktop + mobile, light/dark/telecom)
- Current token inventory and component style map
- List of current UI pain points and severity

### Tasks

- Capture screenshots for `TraceViewer`, `TraceComparison`, `TraceReport`
- Document spacing, typography, contrast, and density issues
- Create before/after checklist for each major component

### Exit Criteria

- Baseline report committed in `docs/visual_improvements`
- Clear list of prioritized issues for execution

---

## Milestone 1 — Design Tokens 2.0

### Objectives

- Normalize visual language through stronger token system
- Separate surface, border, emphasis, and state semantics

### Deliverables

- Updated token set in `packages/ui/src/themes/tokens.css`
- Refined palettes for default, dark, and telecom themes

### Tasks

- Add semantic tokens for:
  - Panel elevations
  - Section header contrast
  - Interactive highlights
  - Numeric text emphasis
- Standardize radius and border intensity scales
- Verify all themes with same semantic map

### Exit Criteria

- All themes pass contrast checks for core text and controls
- No hardcoded color usage remains in primary components

---

## Milestone 2 — Layout Hierarchy & Spacing

### Objectives

- Improve section separation and scanability
- Create clearer visual rhythm across dashboard blocks

### Deliverables

- Updated layout CSS for `TraceViewer` sections
- Consistent card spacing, padding, and header styles

### Tasks

- Introduce section-level spacing tokens
- Strengthen container hierarchy (page, panel, subsection)
- Tune card padding and row gaps for dense areas

### Exit Criteria

- Faster section scanning in visual QA
- No crowding/merging effect between adjacent panels

---

## Milestone 3 — Typography & Numeric Readability

### Objectives

- Improve readability of dense values and measurement labels
- Make numeric comparison faster in tables and summaries

### Deliverables

- Typography scale adjustments for labels, values, and headers
- Numeric rendering improvements across metric/table/chart readouts

### Tasks

- Apply `font-variant-numeric: tabular-nums` to numeric-heavy areas
- Right-align numeric table columns
- Rebalance size/weight for value vs label text

### Exit Criteria

- Numeric columns align cleanly across rows
- Summary cards and table values are easier to compare at a glance

---

## Milestone 4 — TraceChart Visual Clarity

### Objectives

- Reduce chart clutter while preserving detail
- Strengthen selected/hovered state legibility

### Deliverables

- Updated chart styling for grid, markers, overlays, and tooltip
- Better marker emphasis model

### Tasks

- Soften non-critical marker stems/labels
- Increase distinction between marker types beyond color only
- Improve selected/hover marker emphasis (stroke/halo)
- Improve tooltip edge handling and visual contrast

### Exit Criteria

- Dense traces remain readable without visual overload
- Selected event is immediately identifiable

---

## Milestone 5 — FiberMap Legibility

### Objectives

- Fix crowding in high-event-density maps
- Preserve proportional placement with cleaner labels

### Deliverables

- Updated `FiberMap` collision-aware label strategy
- Improved marker and connector readability

### Tasks

- Add label collision suppression/alternation
- Prioritize selected/hovered event labels
- Improve cluster indicator appearance for close events

### Exit Criteria

- No unreadable label stacks in high-density inputs
- Event path remains understandable at all widths

---

## Milestone 6 — EventTable Scanability

### Objectives

- Improve rapid row scanning and row-state visibility

### Deliverables

- Refined table row styles, separators, hover, and selected states

### Tasks

- Tune zebra contrast and separator subtlety
- Strengthen selected row persistence
- Improve sticky header distinction from body
- Ensure compact mode remains visually clean

### Exit Criteria

- Better scan performance and clearer selection context
- No regression in keyboard navigation behavior

---

## Milestone 7 — LossBudget Visual Balance

### Objectives

- Improve interpretability when one bar dominates the scale

### Deliverables

- Updated scale strategy and threshold rendering
- Better selected state and value labeling

### Tasks

- Add dominant-bar mitigation (optional cap/overflow cue)
- Improve zero and threshold marker contrast
- Balance horizontal and vertical mode visual density

### Exit Criteria

- Small and large events remain comparable
- Threshold relationships are obvious

---

## Milestone 8 — Interaction Polish

### Objectives

- Add subtle, purposeful motion feedback
- Keep interactions responsive and non-distracting

### Deliverables

- Refined transitions for hover/focus/selection states
- Reduced-motion compliant behavior across components

### Tasks

- Add short transitions to row, bar, and marker emphasis
- Keep motion disabled under `prefers-reduced-motion: reduce`
- Prevent transition stacking on rapid state changes

### Exit Criteria

- UI feels smoother without adding latency
- Reduced-motion users receive static equivalent behavior

---

## Milestone 9 — Responsive Optimization

### Objectives

- Improve usability at tablet and mobile widths

### Deliverables

- Refined breakpoints and section behavior under narrow layouts
- Better compression strategy for dense panels

### Tasks

- Prioritize chart + selected-event context on small screens
- Collapse lower-priority labels sooner
- Tune map/table overflow behavior for touch readability

### Exit Criteria

- No cramped or overlapping content at 1024/768/480/375 widths
- Primary analysis flow remains usable on mobile

---

## Milestone 10 — Accessibility & Contrast QA

### Objectives

- Ensure visual updates do not reduce accessibility quality

### Deliverables

- Updated accessibility QA report (contrast + keyboard + SR checks)

### Tasks

- Run contrast checks for all status and body text combinations
- Validate keyboard focus visibility across components
- Re-run automated accessibility checks and manual smoke test

### Exit Criteria

- No new critical accessibility regressions
- Contrast and focus states meet expected standards

---

## Milestone 11 — Demo/Docs Visual Update

### Objectives

- Keep public demo and docs aligned with final visual system

### Deliverables

- Updated demo visuals and section descriptions
- Updated docs screenshots and design rationale notes

### Tasks

- Refresh demo themes and page examples
- Replace stale screenshots
- Add short visual design guidelines in docs

### Exit Criteria

- Demo reflects final visual language
- Docs match shipping UI

---

## Milestone 12 — Final QA, Regression, and Sign-Off

### Objectives

- Validate visual refresh end-to-end for release readiness

### Deliverables

- Final sign-off checklist
- Snapshot updates (if applicable)
- Release note entry for visual refresh

### Tasks

- Run full verification:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
- Perform manual visual regression pass on target browsers
- Confirm no interaction or data-display regressions

### Exit Criteria

- All checks pass
- Visual changes approved for release

---

## Implementation Notes

- Introduced semantic tokens for elevation, section headers, interactive states, and numeric emphasis in `tokens.css`, then mapped them across `dark.css` and `telecom.css`.
- Removed dependency on external SOR fixture files in UI tests by introducing deterministic local mock datasets in `packages/ui/tests/mock-sor-data.ts`.
- Updated chart marker rendering to use theme-driven marker semantics and stronger selected/hovered emphasis with reduced clutter in dense traces.
- Added collision-aware labeling and cluster indicators in `FiberMap` while preserving proportional event placement.
- Improved `LossBudgetChart` readability with dominant-bar mitigation and overflow cueing; actual values remain fully visible in labels.
- Added reduced-motion compliance and explicit focus visibility across interactive components.
- Refreshed demo shell (`apps/demo`) to align public preview with the final visual system.

---

## Cross-Cutting Rules

- Preserve existing functional behavior while adjusting visuals
- Prefer token-based styling over hardcoded values
- Keep component APIs backward compatible
- Validate each milestone with screenshot comparisons
- Record any design tradeoffs in this document

---

## Suggested Execution Order

1. Milestone 0
2. Milestone 1
3. Milestone 2
4. Milestone 3
5. Milestone 4
6. Milestone 5
7. Milestone 6
8. Milestone 7
9. Milestone 8
10. Milestone 9
11. Milestone 10
12. Milestone 11
13. Milestone 12
