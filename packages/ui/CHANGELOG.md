# Changelog

All notable changes to this project are documented in this file.

## [1.1.0] - 2026-03-03

### Added

- Dual measurement cursors (`A`/`B`) on the trace chart with delta metrics panel and keyboard controls.
- Copy/download actions:
  - `TraceChart`: copy PNG to clipboard and download PNG.
  - `EventTable`: copy TSV and download CSV.
- Shared export utilities for CSV/TSV serialization, blob download, and timestamped filenames.

### Changed

- `FiberMap` UX improvements:
  - Hover labels on markers.
  - Wheel zoom and horizontal scroll behavior for zoomed navigation.
  - Stable marker hover behavior (no position jump).
- Visual polish updates across chart/table surfaces and axis label overlap fixes.
- `LossBudgetChart` now includes interactive sorting controls (`#`, `Distance`, `Splice`, `Status`).
- `TraceReport` event table now supports sortable columns.

### Fixed

- Chart marker clipping issue near Y-axis boundary.
- Overlap between Y-axis label and chart content.
- Workspace demo import/runtime integration issues around SOR parser usage.

## [1.0.0] - 2026-03-03

### Added

- Full OTDR UI component set: `TraceViewer`, `TraceChart`, `TraceSummary`, `EventTable`, `FiberMap`, `LossBudgetChart`.
- Comparison and reporting: `TraceComparison`, `TraceReport`, image export, print button.
- File input and hooks: `SorDropZone`, `useTraceData`, `useThresholds`, `useZoomPan`, selection context.
- Canvas rendering engine with axes, crosshair, event markers, and zoom/pan interactions.
- Theme tokens with default/dark/telecom CSS entry points.
- Custom Elements wrappers for vanilla HTML usage.
- Demo applications (`apps/demo`, `apps/demo-vanilla`) and CI workflows.

### Changed

- Package exports map expanded for CSS and web-components subpath entry points.
- Build pipeline now emits ESM, CJS, CSS assets, and DTS for all public entries.

### Fixed

- Root workspace test reliability by ensuring `jsdom` is available for Vitest jsdom environments.
- Event table selection scroll now guards unsupported `scrollIntoView` in test DOMs.
- Trace image URL export now falls back when `URL.createObjectURL` is unavailable.
