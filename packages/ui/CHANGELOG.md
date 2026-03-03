# Changelog

All notable changes to this project are documented in this file.

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
