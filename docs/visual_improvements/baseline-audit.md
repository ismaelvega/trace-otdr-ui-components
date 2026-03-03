# Milestone 0 - Baseline Audit

Date: 2026-03-03
Scope: `TraceViewer`, `TraceComparison`, `TraceReport`, component-level CSS + canvas rendering styles

## Baseline References

Screenshots captured for baseline comparison:

- `TraceViewer` desktop (provided in thread): `Image #1`
- `TraceViewer` lower sections desktop (provided in thread): `Image #2`
- `TraceViewer` mobile/narrow baseline: verified in responsive pass at 768/480/375 breakpoints
- `TraceComparison` baseline: verified in demo comparison page
- `TraceReport` baseline: verified in demo report page

## Token Inventory (Before Refresh)

Current tokens were mostly foundational and missing semantic depth:

- Surface tokens: `--otdr-bg`, `--otdr-surface`, `--otdr-panel`
- Border tokens: `--otdr-border`, `--otdr-border-subtle`
- Text tokens: `--otdr-text-strong`, `--otdr-text-muted`
- Status tokens: pass/warn/fail/neutral groups
- Chart tokens: `--otdr-chart-bg`, `--otdr-trace-primary`, axis/grid/crosshair

Gaps detected:

- No explicit elevation/section-header semantics
- No numeric-emphasis tokens
- No interactive/focus/selection semantic layer
- Hardcoded color use still present in chart markers, map markers, report, and drop zone

## Prioritized Pain Points

| Severity | Area | Observation |
|---|---|---|
| High | Trace chart markers | Dense marker stems/labels create clutter at high event counts |
| High | Fiber map labels | Label crowding causes unreadable stacks in dense sequences |
| High | Event table scanability | Numeric columns are left-aligned; sticky header and selected state are weak |
| Medium | Loss budget chart | Dominant bars flatten small bars and reduce comparability |
| Medium | Layout hierarchy | Panels visually blend together at dashboard scale |
| Medium | Typography | Dense numeric values do not use tabular figures |
| Medium | Interaction cues | Hover/focus/selection transitions and focus rings are inconsistent |
| Low | Demo page | Heavy inline styling and weak section framing for public preview |

## Before/After Checklist

### TraceViewer

- [ ] Clear panel rhythm between summary/chart/map/table/info blocks
- [ ] Consistent spacing tokens for section gaps and paddings
- [ ] No crowding/merging effect between adjacent blocks

### TraceChart

- [ ] Marker stems de-emphasized
- [ ] Selected/hovered marker prominence improved
- [ ] Tooltip stays within bounds and remains readable

### FiberMap

- [ ] Collision-aware label suppression/alternation
- [ ] Selected/hovered labels always visible
- [ ] Dense-event clusters remain understandable

### EventTable

- [ ] Numeric columns right aligned with tabular digits
- [ ] Sticky header stronger visual separation
- [ ] Selected row state clearly persistent

### LossBudgetChart

- [ ] Dominant-bar mitigation with overflow cue
- [ ] Threshold markers clearer against tracks/bars
- [ ] Horizontal and vertical modes visually balanced

### Accessibility and Responsiveness

- [ ] Visible keyboard focus on all interactive controls
- [ ] Reduced-motion support for transitions
- [ ] No overlap/cramping at 1024/768/480/375 widths

## Execution Notes

- Functional behavior and parser logic remain unchanged by this visual refresh.
- Any behavior changes introduced for readability must be non-breaking and documented in milestone notes.
