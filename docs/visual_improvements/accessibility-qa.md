# Accessibility QA - Visual Refresh

Date: 2026-03-03
Scope: `TraceViewer`, `TraceChart`, `FiberMap`, `EventTable`, `LossBudgetChart`, `SorDropZone`, demo shell

## Focus Visibility

Verified visible focus treatment on:

- `TraceChart` root (`tabIndex=0`) with tokenized focus ring
- `EventTable` sortable header buttons
- `EventTable` keyboard-focusable rows
- `FiberMap` keyboard-focusable event markers (`<g tabIndex={0}>`)
- `LossBudgetChart` bar buttons
- `SorDropZone` focusable label
- `InfoPanel` collapsible summary

Implementation notes:

- Focus ring tokens standardized via `--otdr-interactive-focus-ring` and `--otdr-interactive-focus-shadow`
- Focus styles applied with `:focus-visible` across components

## Motion and Reduced Motion

Verified reduced-motion handling:

- Tooltip transition disabled in `TraceChart` under `prefers-reduced-motion: reduce`
- Row/bar/marker transitions disabled under reduced-motion media query in updated components

## Keyboard Interaction Smoke

Confirmed no keyboard regression for core flows:

- Event row Enter/Escape behavior retained
- Arrow navigation in table and map retained
- Chart keyboard pan/zoom and marker tab-cycle retained

## Contrast and Theming

Visual review across `light`, `dark`, and `telecom` token maps:

- Text on panel/surface remains high-contrast
- Status badges keep differentiated foreground/background/border states
- Selected and hover states remain distinguishable in all themes

## Automated Validation

- Existing keyboard/a11y unit tests pass (`tests/a11y-keyboard.test.tsx`)
- Full UI suite passes with updated visuals

## Result

No new critical accessibility regressions detected for this visual refresh.
