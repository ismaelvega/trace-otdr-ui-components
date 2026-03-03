# trace-otdr-ui-components

Monorepo for OTDR UI rendering and demos.

## Workspace Layout

- `packages/ui` — `@trace-otdr/ui` component library
- `sor-reader` — SOR parsing package used by UI
- `apps/demo` — React playground/demo app
- `apps/demo-vanilla` — Custom Elements demo

## Commands

- `npm run dev` — run demo app
- `npm run lint` — lint UI package
- `npm run typecheck` — typecheck UI package
- `npm run test` — run UI test suite
- `npm run build` — build UI package + demo app

## Release Package

The publishable package is `packages/ui` (`@trace-otdr/ui`).
