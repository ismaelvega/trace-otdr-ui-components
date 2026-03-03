# @ismaelvega/trace-otdr-ui Documentation

## Project Status

`@ismaelvega/trace-otdr-ui` is implemented end-to-end for the planned milestones in this repository scope.

Completed areas:

- Core types, adapters, utilities, and normalization (`SorResult` + `SorData` support)
- Canvas rendering engine (HiDPI canvas manager, coordinates, axes, trace renderer, render scheduler)
- Interactive charting (`TraceChart` with zoom/pan, crosshair, event markers, keyboard support, controlled viewport)
- Data components (`TraceSummary`, `EventTable`, `FiberMap`, `LossBudgetChart`, info panels, status badges)
- Composite view (`TraceViewer`) with shared event selection context
- Advanced features (`TraceComparison`, `TraceReport`, trace image export, print button)
- File input/hooks (`SorDropZone`, `useTraceData`, `useThresholds`, `useZoomPan`, `useEventSelection`)
- Theming (`default`, `dark`, `telecom`) via CSS custom properties
- Web Components (`otdr-*`) wrappers for vanilla usage
- Demo apps (`apps/demo` and `apps/demo-vanilla`)
- CI workflows (validate + publish dry-run workflow)

## Package Entry Points

From `@ismaelvega/trace-otdr-ui`:

- Main API: `@ismaelvega/trace-otdr-ui`
- CSS: `@ismaelvega/trace-otdr-ui/css`, `@ismaelvega/trace-otdr-ui/css/dark`, `@ismaelvega/trace-otdr-ui/css/telecom`
- Web Components: `@ismaelvega/trace-otdr-ui/web-components`

## Release Metadata

- Package version: `1.0.0`
- Package docs/assets included in publish files:
  - `packages/ui/README.md`
  - `packages/ui/CHANGELOG.md`
  - `packages/ui/LICENSE`

## Verified Commands (Repository Root)

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

All commands above pass with the current code.

## Notes

- Workspace layout intentionally keeps `sor-reader/` at repository root and links it into `packages/ui` for local development.
- Root `npm run test` validates the UI workspace suite.
