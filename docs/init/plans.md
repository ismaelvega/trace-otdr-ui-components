# @ismaelvega/trace-otdr-ui — Implementation Plan

## Project Overview

Build a TypeScript/React component library for rendering OTDR trace data from `sor-reader` in web applications. Canvas-based charting, interactive events, and print-ready reports.

## Implementation Notes

- 2026-03-03: Completed milestones 0–15 implementation scope for `@ismaelvega/trace-otdr-ui`, including React components, canvas engine, hooks, theming, report/export, web components, demos, and release artifacts.
- 2026-03-03: Kept `sor-reader/` at the workspace root path and linked it as a workspace/local dependency instead of moving to `packages/sor-reader/`, to avoid breaking existing parser workflows in this repository.
- 2026-03-03: Fixed root test determinism by adding root-level `jsdom` so `npm run test` resolves Vitest jsdom environments consistently.
- 2026-03-03: Fixed runtime/test bugs discovered during final verification: guarded `row.scrollIntoView` in `EventTable`, added `traceToImageURL` fallback when `URL.createObjectURL` is unavailable.
- 2026-03-03: Improved comparison and chart behavior in final pass: interpolation-based `difference` mode in `TraceComparison`, side-by-side viewport sync support, and controlled viewport input support in `TraceChart`.
- 2026-03-03: Added package release docs/assets and metadata for v1.0.0 (`packages/ui/README.md`, `packages/ui/CHANGELOG.md`, `packages/ui/LICENSE`, package `files` + peer dependency updates).

## Verification Checklist

- [x] Final repo gate: `npm run lint`
- [x] Final repo gate: `npm run typecheck`
- [x] Final repo gate: `npm run test`
- [x] Final repo gate: `npm run build`
- [x] UI package direct validation: `npm --prefix packages/ui run lint`
- [x] UI package direct validation: `npm --prefix packages/ui run typecheck`
- [x] UI package direct validation: `npm --prefix packages/ui run test`
- [x] UI package direct validation: `npm --prefix packages/ui run build`

---

## Milestone 0 — Project Scaffolding

**Goal:** Monorepo structure, build pipeline, dev environment, CI. No UI code yet — just the skeleton that everything builds on.

### 0.1 Monorepo Setup

- [x] Initialize root `package.json` with npm workspaces:
  ```
  trace-otdr-ui-components/
  ├── packages/
  │   ├── sor-reader/        ← existing (move here)
  │   └── ui/                ← new
  ├── apps/
  │   └── demo/              ← Vite + React dev playground
  ├── package.json           ← workspace root
  └── tsconfig.base.json     ← shared TS config
  ```
- [x] Keep `sor-reader/` at workspace root and link it from UI package (equivalent dependency wiring without path migration)
- [x] Create `packages/ui/package.json`:
  - Name: `@ismaelvega/trace-otdr-ui`
  - Peer deps: `react >=18`, `react-dom >=18`
  - Dev deps: `sor-reader` (workspace link), `typescript`, `tsup`, `vitest`, `@testing-library/react`, `jsdom`
  - Exports: `.` (React), `./css` (default theme), `./web-components` (Custom Elements)
- [x] Create `packages/ui/tsconfig.json` extending `tsconfig.base.json`, with `jsx: "react-jsx"`, `lib: ["ES2022", "DOM"]`
- [x] Create `packages/ui/tsup.config.ts`:
  - Entry: `src/index.ts` (React components), `src/web-components/index.ts`
  - Format: ESM + CJS
  - External: `react`, `react-dom`, `sor-reader`
  - DTS: true
  - CSS injection: false (ship separate CSS files)

### 0.2 Dev Playground

- [x] `apps/demo/` — Vite + React app
  - Vite config with workspace alias to `packages/ui/src` for HMR
  - Include 3 sample `.sor` files from `sor-reader/tests/fixtures/`
  - Basic shell: file picker → parse → render component under development
  - This is the primary development loop — iterate visually here
- [x] Add root scripts: `npm run dev` (playground), `npm run build` (UI + demo), `npm run test` (UI suite)

### 0.3 CI Pipeline

- [x] GitHub Actions workflow: lint → typecheck → test → build
- [x] Run on push to `main` and on PRs
- [x] Separate publish workflow (manual trigger or tag-based)

### 0.4 Code Quality Tooling

- [x] ESLint config for `packages/ui` (TypeScript + TSX coverage for `src/` and `tests/`)
- [x] Prettier baseline kept from `sor-reader`; UI source remains formatter-compatible
- [x] Vitest config for `packages/ui` with `jsdom` environment, CSS module support
- [x] Husky + lint-staged retained in `sor-reader`; UI workspace validation enforced via root scripts + CI

**Exit criteria:** `npm run dev` opens the playground. `npm run build` produces `packages/ui/dist/` with ESM + CJS + DTS and builds demo assets. `npm test` passes for the UI suite. CI is green.

---

## Milestone 1 — Type Foundation & Utilities

**Goal:** The shared data types, conversion utilities, and formatting functions that every component depends on. No rendering yet.

### 1.1 Shared Types (`src/types/`)

- [x] `thresholds.ts` — Threshold configuration types:
  ```ts
  interface EventThresholds {
    spliceLoss?: { warn: number; fail: number };  // dB
    reflLoss?: { warn: number; fail: number };     // dB (negative values)
    slope?: { warn: number; fail: number };        // dB/km
  }
  interface SummaryThresholds {
    totalLoss?: { fail: number };                  // dB
    orl?: { fail: number };                        // dB
    fiberLength?: { max: number };                 // km
  }
  interface AllThresholds {
    event: EventThresholds;
    summary: SummaryThresholds;
  }
  ```
- [x] `units.ts` — Distance unit union type and conversion factors:
  ```ts
  type DistanceUnit = "km" | "m" | "mi" | "kft";
  ```
- [x] `events.ts` — Event classification enum:
  ```ts
  type EventCategory = "reflection" | "loss" | "connector" | "end-of-fiber" | "manual" | "unknown";
  ```
- [x] `chart.ts` — Chart-specific types (viewport, axis range, overlay):
  ```ts
  interface ViewportRange { xMin: number; xMax: number; yMin: number; yMax: number; }
  interface TraceOverlay { trace: TracePoint[]; label: string; color: string; }
  ```
- [x] Re-export all `sor-reader` types from `src/index.ts` for consumer convenience

### 1.2 Utility Functions (`src/utils/`)

- [x] `conversions.ts`:
  - `convertDistance(km: number, to: DistanceUnit): number`
  - `convertDistanceLabel(unit: DistanceUnit): string` → "km", "m", "miles", "kft"
  - Unit tests: roundtrip conversions, edge cases (0, negative, very large)
- [x] `formatters.ts`:
  - `formatDistance(value: number, unit: DistanceUnit, precision?: number): string`
  - `formatPower(dB: number, precision?: number): string`
  - `formatSlope(dBkm: number, precision?: number): string`
  - `formatWavelength(nm: string): string` — normalize "1550.0 nm" → "1550 nm"
  - `formatDateTime(raw: string): string` — parse sor-reader datetime to locale string
  - Unit tests: formatting edge cases, negative zero, locale behavior
- [x] `classifiers.ts`:
  - `classifyEvent(event: KeyEvent): EventCategory` — parse the type string pattern `(.)(.)9999(.)(.)`:
    - First char `1` → reflection, `0` → loss, `2` → multiple
    - Second char `A` → manual, else auto
    - Last char `E` → end-of-fiber, `S` → standard
  - `assessEvent(event: KeyEvent, thresholds: EventThresholds): "pass" | "warn" | "fail"`
  - `assessSummary(summary: KeyEventsSummary, thresholds: SummaryThresholds): "pass" | "warn" | "fail"`
  - Unit tests: all event type patterns from real SOR files, threshold boundary cases
- [x] `loss-budget.ts`:
  - `computeLossBudget(events: KeyEvents): { totalSpliceLoss, totalReflLoss, avgSpliceLoss, maxSpliceLoss, eventCount, spanLengths[] }`
  - Unit tests: with real event data from fixture files
- [x] `downsampling.ts`:
  - `lttb(data: TracePoint[], targetCount: number): TracePoint[]` — Largest-Triangle-Three-Buckets algorithm
  - Returns original data if `data.length <= targetCount`
  - Unit tests: verify visual fidelity (peaks/valleys preserved), verify count output, verify passthrough for small data

### 1.3 Data Adapter Layer (`src/adapters/`)

The `sor-reader` library exports two type families:
- `SorResult` (in `index.ts`) — raw types with string keys like `"cable ID"`, `FxdParamsRaw`, etc. (pyOTDR-compatible)
- `SorData` (in `types.ts`) — clean camelCase types (`genParams.cableId`, `fxdParams.pulseWidth`, etc.)

The UI library should work with **both**:

- [x] `normalize.ts`:
  - `normalizeSorResult(result: SorResult): SorData` — convert raw → clean types
  - All UI components accept `SorResult` or `SorData` via a union, and normalize internally
  - This keeps the API ergonomic regardless of which sor-reader export the consumer uses
- [x] Unit tests: roundtrip normalization with fixture data

**Exit criteria:** All utility functions implemented and tested. `npm test` passes. Types are importable from `@ismaelvega/trace-otdr-ui`. Zero runtime dependencies added.

---

## Milestone 2 — Canvas Rendering Engine

**Goal:** A reusable Canvas 2D rendering engine capable of drawing OTDR traces with axes, grid, and HiDPI support. This is the most technically demanding milestone — the performance-critical foundation for `TraceChart`.

### 2.1 Canvas Manager (`src/canvas/`)

- [x] `canvas-manager.ts` — Core canvas lifecycle:
  - `createCanvas(container: HTMLElement, width: number, height: number): { canvas, ctx }`
  - Handle `devicePixelRatio` scaling (set canvas intrinsic size to `width * dpr` × `height * dpr`, CSS size to `width × height`)
  - `ResizeObserver` integration for `width="auto"` mode
  - Cleanup/disposal function to prevent memory leaks
  - Unit test: verify DPR scaling math, verify resize callback fires

### 2.2 Coordinate System (`src/canvas/`)

- [x] `coordinates.ts` — Transforms between data space and pixel space:
  - `DataToPixel(dataX, dataY, viewport, canvasRect): { px, py }` — map (km, dB) → (px, py)
  - `PixelToData(px, py, viewport, canvasRect): { dataX, dataY }` — inverse for mouse position readout
  - `computeViewport(trace: TracePoint[], padding?: number): ViewportRange` — auto-fit viewport to data bounds with configurable padding (default 5%)
  - `clampViewport(viewport, dataBounds): ViewportRange` — prevent panning beyond data extent
  - Chart layout constants: `MARGIN = { top: 20, right: 20, bottom: 50, left: 70 }` (space for axis labels)
  - All transforms account for the Y-axis being inverted (higher dB = higher on screen, but canvas Y grows downward)
  - Unit tests: roundtrip data→pixel→data, edge coordinates, margin offsets

### 2.3 Axis Renderer (`src/canvas/`)

- [x] `axes.ts` — Draw X and Y axes with tick marks and labels:
  - `drawXAxis(ctx, viewport, canvasRect, unit: DistanceUnit)` — distance axis at bottom
  - `drawYAxis(ctx, viewport, canvasRect)` — power axis on left
  - Smart tick spacing: choose "nice" intervals (1, 2, 5, 10, 20, 50...) based on visible range
  - Tick labels formatted with `formatDistance` / `formatPower`
  - Axis titles: "Distance (km)" and "Power (dB)"
  - Grid lines: light dashed lines extending from each tick across the chart area
  - Render at subpixel-aligned positions to avoid blurry lines (`Math.round(x) + 0.5`)
  - Visual tests in playground: verify readability at various zoom levels

### 2.4 Trace Renderer (`src/canvas/`)

- [x] `trace-renderer.ts` — Draw the actual backscatter trace line:
  - `drawTrace(ctx, trace: TracePoint[], viewport, canvasRect, style: TraceStyle)`
  - `TraceStyle = { color, lineWidth, opacity }`
  - Use `ctx.beginPath()` → `moveTo` → series of `lineTo` → `stroke()` (single path for performance)
  - Apply LTTB downsampling when visible point count exceeds canvas pixel width (call `lttb()` from utils)
  - Only draw points within the current viewport range (skip off-screen segments, with 1-point margin for line continuity)
  - Support for multiple overlaid traces (loop with different colors)
  - Performance target: 16,000 points at 60fps during pan/zoom on mid-range hardware
  - Performance test: measure render time in playground dev tools, iterate if needed

### 2.5 Rendering Pipeline (`src/canvas/`)

- [x] `render-pipeline.ts` — Orchestrates a full frame render:
  ```
  clearCanvas()
  → drawGrid()
  → drawTrace() (for each trace)
  → drawEventMarkers() (milestone 3)
  → drawCrosshair() (milestone 3)
  → drawAxes() (on top of grid, under markers)
  ```
  - Batches all drawing into a single `requestAnimationFrame`
  - Dirty flag: only re-render when viewport, data, or hover state changes
  - `scheduleRender()` function debounces multiple state changes within one frame
  - Export a `RenderContext` object that holds all shared state (viewport, canvas, data refs)

**Exit criteria:** Open playground, load a SOR file, see the trace rendered correctly on a Canvas with grid, axes, and distance/power labels. Y-axis shows dB decreasing downward (as is standard for OTDR traces). Looks crisp on Retina. No jank. Can be visually verified against known-good OTDR software screenshots.

---

## Milestone 3 — TraceChart Interactions

**Goal:** Make the canvas interactive — zoom, pan, crosshair cursor, and event marker rendering. After this milestone, `TraceChart` is a standalone usable component.

### 3.1 Zoom & Pan (`src/canvas/`)

- [x] `interactions.ts` — Pointer event handlers:
  - **Wheel zoom:** `onWheel(e)` → zoom in/out centered on cursor position. Zoom factor per wheel tick: 1.15×. Independent X/Y zoom when holding Shift (zoom only X) or Ctrl (zoom only Y).
  - **Drag pan:** `onPointerDown` → `onPointerMove` → `onPointerUp`. Track delta in pixel space, convert to data-space offset, update viewport.
  - **Pinch zoom (touch):** Track two-pointer distance changes. Convert to zoom factor, center on midpoint.
  - **Double-click reset:** Reset viewport to `computeViewport(trace)` (fit all data).
  - **Zoom limits:** Min zoom = full data extent. Max zoom = 10 data points visible (don't zoom into sub-sample).
  - All interactions update `viewport` state → trigger `scheduleRender()`
  - `cursor: grab` when hovering, `cursor: grabbing` when dragging
  - Unit tests: viewport math after zoom/pan sequences, clamp behavior at limits

### 3.2 Crosshair Cursor (`src/canvas/`)

- [x] `crosshair.ts`:
  - On `pointermove`: convert pixel position → data coordinates → snap to nearest `TracePoint` (binary search on distance)
  - Draw vertical + horizontal dashed lines through the snapped point
  - Draw readout label near cursor: `"12.345 km, 28.5 dB"` with background rectangle for legibility
  - Hide crosshair when pointer leaves canvas (`pointerleave` event)
  - Fire `onPointHover(point, index)` callback
  - Keep crosshair drawing in the render pipeline (drawn last, on top of everything)

### 3.3 Event Markers (Canvas Layer) (`src/canvas/`)

- [x] `event-markers.ts`:
  - For each key event, compute its `(distance, power)` position on the trace:
    - Distance is in the event data
    - Power: find the nearest trace point by distance (binary search) and use its power value
  - Draw marker shapes at each event position using the visual encoding from the proposal:
    - Reflection → triangle, Loss → circle, End-of-fiber → cross, etc.
  - Draw vertical dashed line from marker to X-axis
  - Marker size: 8px radius, with 2px stroke
  - **Hit testing:** On click/hover, check if pointer is within marker hit radius (12px for fat-finger tolerance)
  - On hover: show tooltip (HTML overlay, not canvas-drawn — for text selection and accessibility):
    ```
    Event #8 — Reflection
    Distance: 29.567 km
    Splice Loss: 0.572 dB
    Refl. Loss: -40.110 dB
    ```
  - On click: fire `onEventClick(event, index)` callback
  - Selected event (from prop): draw with thicker stroke + glow effect
  - Marker labels (optional): draw event number above marker when space permits (collision-detect, hide overlapping labels)

### 3.4 Assemble `<TraceChart>` React Component (`src/components/`)

- [x] `TraceChart.tsx`:
  - Accept all props from the proposal (trace, events, fxdParams, width, height, xUnit, etc.)
  - `useRef` for canvas element
  - `useEffect` to initialize `CanvasManager`, set up `ResizeObserver`, attach pointer event listeners
  - `useEffect` on data/viewport changes → `scheduleRender()`
  - `useState` for internal viewport (or accept controlled `xRange`/`yRange` props)
  - Forward `onPointHover`, `onEventClick`, `onZoomChange` callbacks
  - Clean up on unmount (remove listeners, dispose canvas)
  - Tooltip rendered as an absolutely-positioned `<div>` sibling of the canvas (not drawn on canvas)
- [x] `TraceChart.module.css` — Canvas container styles, tooltip styles, cursor states
- [x] Integration test: render `TraceChart` with fixture data, verify canvas is mounted, verify no console errors
- [x] Visual verification in playground: compare against known-good OTDR trace appearance

### 3.5 `useZoomPan` Hook (`src/hooks/`)

- [x] Extract zoom/pan logic into a reusable hook for consumers who build custom chart compositions:
  ```ts
  function useZoomPan(canvasRef: RefObject<HTMLCanvasElement>, dataBounds: ViewportRange): {
    viewport: ViewportRange;
    setViewport: (v: ViewportRange) => void;
    resetViewport: () => void;
    zoomTo: (xRange: [number, number], yRange?: [number, number]) => void;
  }
  ```
- [x] Unit test: hook state updates correctly on simulated events

**Exit criteria:** `<TraceChart trace={result.trace} events={result.KeyEvents} />` renders a fully interactive chart. User can zoom with scroll wheel, pan by dragging, see crosshair snapping to the trace, hover over event markers to see tooltips, and double-click to reset view. Smooth 60fps interactions with 16k-point traces. Tested in Chrome, Firefox, Safari.

---

## Milestone 4 — Data Display Components

**Goal:** The non-chart components — event table, summary card, info panels, loss chart. These are conventional React components (HTML/CSS, no canvas).

### 4.1 `<TraceSummary>` (`src/components/`)

- [x] `TraceSummary.tsx` — Metrics card grid:
  - Accepts `SorResult` (or `SorData`). Normalize internally.
  - Compute derived metrics:
    - Fiber length: last event distance, or `fxdParams.range`
    - Average loss/km: `summary.totalLoss / fiberLength`
  - Render 4–8 metric cards in a responsive CSS Grid (2×4 on wide, 4×2 on narrow, 1×8 on mobile)
  - Each metric: large value, small label, optional unit
  - Overall pass/fail badge (top-right) using `assessSummary()`
  - Color-coded badge: green/amber/red with accessible label text
- [x] `TraceSummary.module.css`
- [x] Unit tests: renders correct values, handles missing optional fields (v1 files without averaging time), pass/fail badge logic

### 4.2 `<EventTable>` (`src/components/`)

- [x] `EventTable.tsx` — Sortable data table:
  - Columns: `#`, `Distance`, `Type`, `Splice Loss`, `Refl. Loss`, `Slope`, `Status`
  - `compact` prop hides Slope and Status columns
  - Sorting: click column header to sort asc → desc → unsorted. Track sort state internally.
  - Status column: `assessEvent()` for each row, render colored badge
  - Event type column: icon + text label using `classifyEvent()`
  - Selected row: highlighted background, scrolled into view when `selectedEvent` prop changes
  - Summary footer row: total loss, ORL (from `KeyEvents.summary`)
  - `onEventSelect(event, index)` fires on row click
  - Distance values converted using `xUnit` prop and `formatDistance()`
  - Accessible: `<table>` with `<thead>`, `<tbody>`, proper `scope` attributes, `aria-sort` on sortable headers
- [x] `EventTable.module.css` — Striped rows, hover highlight, sticky header
- [x] Unit tests: sorting behavior, selection state, threshold assessment rendering, summary footer values
- [x] Test with 26-event file (trace1333) and 6-event file (demo_ab) to verify scaling

### 4.3 Info Panels (`src/components/`)

- [x] `InfoPanel.tsx` — Base primitive: collapsible panel with key-value rows
  - Props: `title: string`, `entries: { label: string, value: string }[]`, `collapsible?: boolean`, `defaultExpanded?: boolean`
  - Render as `<details>/<summary>` for native collapse (or div-based if `collapsible=false`)
  - Accessible: `<dl>` with `<dt>`/`<dd>` pairs inside the panel body

- [x] `FiberInfoPanel.tsx` — Wraps `InfoPanel` with `GenParams` data
  - Maps `genParams` fields to display-friendly labels
  - Hides empty/blank fields
  - Shows v2-only fields (fiberType, userOffsetDistance) when present

- [x] `EquipmentInfoPanel.tsx` — Wraps `InfoPanel` with `SupParams` data

- [x] `MeasurementInfoPanel.tsx` — Wraps `InfoPanel` with `FxdParams` data
  - Format numeric values with units (pulse width in ns/µs, range in km, resolution in m, etc.)
  - Shows v2-only fields when present

- [x] `InfoPanel.module.css` — Panel border, collapse animation, key-value layout
- [x] Unit tests for each: renders all fields, hides empty fields, handles v1 vs v2

### 4.4 `<LossBudgetChart>` (`src/components/`)

- [x] `LossBudgetChart.tsx` — Horizontal bar chart (CSS-based, no canvas):
  - One bar per event with non-zero splice loss
  - Bar width proportional to splice loss value (scale: 0 → max loss or threshold, whichever larger)
  - Color-coded: green (pass), amber (warn), red (fail) based on thresholds
  - Threshold reference lines: vertical dashed lines at warn and fail values
  - Negative values (gains) extend left from the zero line
  - Value labels at end of each bar
  - Click handler per bar → `onBarClick(event, index)`
  - Vertical mode option: swaps axes
- [x] `LossBudgetChart.module.css`
- [x] Unit tests: bar widths, color assignment, threshold lines, negative value rendering

### 4.5 Status Badge Primitive (`src/components/primitives/`)

- [x] `StatusBadge.tsx` — Reusable pass/warn/fail/neutral badge:
  - Props: `status: "pass" | "warn" | "fail" | "neutral"`, `label?: string`
  - Used by TraceSummary, EventTable, LossBudgetChart
  - Accessible: `role="status"`, `aria-label` with status text
- [x] `StatusBadge.module.css`

**Exit criteria:** All data display components render correctly with real SOR fixture data. Unit tests pass. Playground shows each component with live data from a loaded SOR file. Components handle both v1 and v2 SOR data gracefully.

---

## Milestone 5 — FiberMap & Event Selection System

**Goal:** The linear fiber schematic diagram and the bidirectional selection system that links TraceChart ↔ EventTable ↔ FiberMap.

### 5.1 `<FiberMap>` (`src/components/`)

- [x] `FiberMap.tsx` — SVG-based linear schematic (SVG is appropriate here — few elements, needs text rendering):
  - Horizontal line representing the fiber span
  - Location A label (left) and Location B label (right) from `genParams`
  - Event icons placed proportionally along the line based on distance
  - Same icon shapes as `EventMarkers` (triangle, circle, cross, etc.) — share the classification logic
  - Loss value labels below each event
  - Distance labels above or below alternating events (to avoid collision)
  - Segment lines between events with optional span-distance labels
  - Proportional spacing: gap between icons reflects actual distance ratio
  - Minimum icon gap: if two events are too close (< 20px), cluster them with a group indicator
  - `selectedEvent` prop: highlighted icon with emphasis ring
  - `onEventClick` callback on icon click
  - Responsive: `<svg viewBox>` with percentage-based widths; labels collapse or abbreviate on narrow viewports
  - Vertical orientation option (`orientation="vertical"`)
- [x] `FiberMap.module.css`
- [x] Unit tests: correct number of icons, proportional positioning, label visibility, selection highlight

### 5.2 `useEventSelection` Hook (`src/hooks/`)

- [x] `useEventSelection.ts` — Shared selection context:
  ```ts
  function useEventSelection(): {
    selectedIndex: number | null;
    select: (index: number | null) => void;
  }
  ```
- [x] `EventSelectionProvider` — React Context provider wrapping `useEventSelection` state
  - When `select(index)` is called from any component, all consuming components re-render with the new selection
  - TraceChart: zooms to show selected event, highlights marker
  - EventTable: highlights and scrolls to selected row
  - FiberMap: highlights selected icon
  - LossBudgetChart: highlights selected bar
- [x] Unit test: selection propagates across multiple consumers

### 5.3 Wire Up Bidirectional Selection

- [x] Update `TraceChart`: accept `selectedEvent` from context, highlight marker on selection change, call `select()` on marker click
- [x] Update `EventTable`: highlight row on selection change, call `select()` on row click, scroll selected row into view
- [x] Update `FiberMap`: highlight icon on selection change, call `select()` on icon click
- [x] Update `LossBudgetChart`: highlight bar on selection change, call `select()` on bar click
- [x] Integration test in playground: click event in table → chart zooms, map highlights, bar highlights. Click marker on chart → table scrolls, map highlights.

**Exit criteria:** All four event-aware components stay in sync. Selecting an event in any one updates all others. Smooth transitions, no infinite render loops.

---

## Milestone 6 — SorDropZone & useTraceData

**Goal:** File input component and the primary data-loading hook. After this milestone, consumers can go from "I have a .sor file" to "I see rendered components" with minimal code.

### 6.1 `<SorDropZone>` (`src/components/`)

- [x] `SorDropZone.tsx`:
  - Drag-and-drop zone: `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop`
  - Visual states: idle, drag-hover (highlighted border), loading (spinner), error (red border + message)
  - Hidden `<input type="file" accept=".sor">` triggered by click
  - `multiple` prop: accept multiple files, call `onResult` for each
  - Parse flow: `File → .arrayBuffer() → new Uint8Array() → parseSor() from sor-reader/browser → onResult(SorResult)`
  - `parseOptions` forwarded to `parseSor()`
  - Error handling: catch `SorParseError`, display error message, call `onError`
  - `children` prop: replace default content with custom slot
  - Accessible: `<label>` wrapping the drop zone, keyboard-focusable, Enter to open file dialog
- [x] `SorDropZone.module.css` — Dashed border, drag-hover animation, error state
- [x] Unit tests: simulated file drop, error state rendering, multiple file handling

### 6.2 `useTraceData` Hook (`src/hooks/`)

- [x] `useTraceData.ts`:
  ```ts
  function useTraceData(
    source: File | Uint8Array | null,
    options?: ParseOptions
  ): {
    result: SorResult | null;
    loading: boolean;
    error: Error | null;
  }
  ```
  - Parses on mount and when `source` changes
  - Uses `sor-reader/browser` import (no Node.js fs dependency)
  - Wraps parsing in `useEffect` with cleanup (abort if source changes during parse)
  - For `File` input: reads `.arrayBuffer()` first, then parses
  - Memoizes result for same source reference (avoid re-parse on parent re-render)
- [x] Unit tests: loading states, error states, re-parse on source change, memoization

### 6.3 `useThresholds` Hook (`src/hooks/`)

- [x] `useThresholds.ts`:
  ```ts
  function useThresholds(defaults?: Partial<AllThresholds>): {
    thresholds: AllThresholds;
    updateThresholds: (partial: Partial<AllThresholds>) => void;
    resetThresholds: () => void;
  }
  ```
  - Provides sensible defaults (splice loss warn: 0.3 dB, fail: 0.5 dB; refl warn: -50 dB, fail: -40 dB)
  - Merges user overrides
- [x] Unit test: defaults, override, reset

**Exit criteria:** `<SorDropZone onResult={setResult} />` works end-to-end in the playground. `useTraceData(file)` returns parsed data with proper loading/error states. Consumers can build a complete SOR viewer in <20 lines of code.

---

## Milestone 7 — Theming System

**Goal:** CSS custom property theming with light, dark, and telecom preset themes. All existing components adopt the token system.

### 7.1 Design Tokens (`src/themes/`)

- [x] `tokens.css` — Full set of CSS custom properties:
  - Layout tokens: font families, border radius, spacing scale
  - Color tokens: backgrounds, text, borders
  - Chart tokens: trace colors, grid, crosshair, axis text
  - Event tokens: colors per event category
  - Status tokens: pass/warn/fail colors
  - All tokens namespaced with `--otdr-` prefix
- [x] `default.css` — Light theme values (imports `tokens.css`)
- [x] `dark.css` — Dark theme values, applied via `[data-theme="dark"]` selector or `@media (prefers-color-scheme: dark)` fallback
- [x] `telecom.css` — Professional blue-gray palette matching traditional OTDR equipment UIs

### 7.2 Adopt Tokens in All Components

- [x] Audit all existing `.module.css` files. Replace hardcoded colors, fonts, spacing, and border-radius with `var(--otdr-*)` tokens.
- [x] TraceChart canvas rendering: read CSS custom properties from the canvas element's computed style and use them for line colors, grid colors, axis text color, etc.
  - `getComputedStyle(canvas).getPropertyValue('--otdr-trace-primary')`
  - Cache computed values; refresh on theme change (detect via `MutationObserver` on `data-theme` attribute or `matchMedia` change)
- [x] Verify all three themes render correctly in playground (add theme toggle button)

### 7.3 CSS Entry Points

- [x] `@ismaelvega/trace-otdr-ui/css` → exports `default.css` (light theme)
- [x] `@ismaelvega/trace-otdr-ui/css/dark` → exports `dark.css`
- [x] `@ismaelvega/trace-otdr-ui/css/telecom` → exports `telecom.css`
- [x] Document in README: `import '@ismaelvega/trace-otdr-ui/css'` to load styles

**Exit criteria:** All components respect the theming tokens. Switching `data-theme="dark"` on the root element instantly updates all component visuals including the canvas chart. Three themes look polished in the playground.

---

## Milestone 8 — TraceViewer Composite

**Goal:** The all-in-one `<TraceViewer>` component that assembles every sub-component into a complete single-trace analysis view. This is the "primary product" — what most consumers will use.

### 8.1 Layout System (`src/components/TraceViewer/`)

- [x] `TraceViewer.tsx`:
  - Accepts `SorResult` and `AllThresholds`
  - Wraps children in `EventSelectionProvider`
  - `layout="full"` (default): two-column grid below the chart
  - `layout="compact"`: single-column stacked layout for narrow containers
  - `sections` prop: array of section names to show (default: all). Allows hiding panels:
    ```ts
    sections?: ("summary" | "chart" | "fiberMap" | "eventTable" | "lossBudget" | "fiberInfo" | "equipment" | "measurement")[]
    ```
  - Auto-detect compact layout when container width < 768px (via `ResizeObserver`)
  - Forward `xUnit` to all sub-components
  - Forward unified `onEventSelect` through selection context
  - Expose imperative handle via `forwardRef` for programmatic control:
    ```ts
    interface TraceViewerHandle {
      zoomToEvent: (index: number) => void;
      resetZoom: () => void;
      exportImage: () => Promise<Blob>;
    }
    ```

### 8.2 Layout CSS (`TraceViewer.module.css`)

- [x] Full layout: CSS Grid
  ```
  "summary   summary"
  "chart     chart"
  "fibermap  fibermap"
  "table     losschart"
  "fiber     equip"
  "measure   measure"
  ```
- [x] Compact layout: single column, all rows stacked
- [x] Responsive breakpoints: 1200px (full → compact), 768px (compact → scroll)
- [x] Section gaps, consistent padding

### 8.3 Integration Testing

- [x] Load all 3 fixture SOR files in playground through TraceViewer
- [x] Verify bidirectional selection works across all sub-components
- [x] Verify layout responds to container resize
- [x] Verify sections prop hides/shows panels correctly
- [x] Test with v1 file (missing v2-only fields like averaging time, fiber type)
- [x] Test with file having 26 events (trace1333) — table and chart handle density well

**Exit criteria:** `<TraceViewer result={result} />` renders a complete, polished, interactive OTDR analysis page. All sub-components are linked. Layout is responsive. Consumers can customize via `sections`, `thresholds`, and `xUnit` props.

---

## Milestone 9 — TraceComparison

**Goal:** Multi-trace comparison component with overlay, side-by-side, and difference modes.

### 9.1 Overlay Mode

- [x] `TraceComparison.tsx` with `mode="overlay"`:
  - Render a single `TraceChart` with multiple traces via the `overlays` prop
  - Each trace gets a distinct color from `colors` prop (or auto-assigned from a palette)
  - Legend showing trace labels with color swatches
  - Shared viewport: zoom/pan applies to all traces simultaneously
  - Event markers shown only for the "primary" trace (first in array) to avoid clutter. Toggle per-trace markers via legend checkbox.

### 9.2 Side-by-Side Mode

- [x] `mode="side-by-side"`:
  - Render N `TraceChart` instances in a horizontal flex layout
  - `syncZoom` prop (default true): zoom/pan in one chart updates all others
  - Implement sync via shared `ViewportRange` state lifted to parent
  - Each chart gets its own `TraceSummary` above it
  - Labels displayed in chart title bar

### 9.3 Difference Mode

- [x] `mode="difference"`:
  - Compute difference trace: for each point in trace A, find nearest distance in trace B, compute `power_A - power_B`
  - Handle traces with different sample counts / spacing (interpolate to the denser trace's X coordinates)
  - Render difference trace on a chart with 0 dB center line
  - Positive values = trace A stronger, negative = trace B stronger
  - Color trace above 0 with trace-A color, below with trace-B color (split rendering)

### 9.4 Testing

- [x] Test overlay with 2 traces from different fixture files
- [x] Test sync zoom: verify viewports match after zoom/pan in either chart
- [x] Test difference computation accuracy with known data
- [x] Visual verification in playground: side-by-side 1310nm vs 1550nm comparison

**Exit criteria:** All three comparison modes work. Overlay renders multiple colored traces with legend. Side-by-side syncs zoom. Difference correctly computes and renders the delta. Tested with real fixture data.

---

## Milestone 10 — TraceReport (Print-Ready)

**Goal:** A static, `@media print` optimized component for generating professional OTDR test reports.

### 10.1 Report Layout (`src/components/TraceReport/`)

- [x] `TraceReport.tsx`:
  - Renders entirely in DOM (no canvas) for print compatibility
  - Static trace image: render the `TraceChart` canvas to a `data:image/png` URL → `<img>` tag
  - All data in print-friendly HTML tables
  - Sections:
    1. Header: company name/logo, report title, date
    2. Fiber info: cable ID, fiber ID, locations, wavelength
    3. Equipment info: OTDR model, serial numbers, software
    4. Trace plot: static `<img>` of the rendered trace
    5. Fiber map: static SVG of the fiber schematic
    6. Event table: full table with all columns
    7. Summary: metrics table with pass/fail verdict
    8. Footer: technician name, notes, signature line
  - CSS `@media print` rules: hide interactive elements, force white background, page break hints (`break-before`, `break-after`), A4/Letter page sizing
  - `companyName`, `companyLogo`, `technician`, `notes` props

### 10.2 `traceToImageURL` Utility

- [x] `src/utils/trace-to-image.ts`:
  - Create an offscreen canvas, render the trace statically (no interactions, no crosshair)
  - Return as `data:image/png` URL or `Blob`
  - Configurable resolution: default 1200×400 for print quality (300dpi equivalent)
  - Used by `TraceReport` and also exported for consumers who want image export

### 10.3 Print Button Integration

- [x] Optional `<PrintButton>` component: calls `window.print()` when clicked
- [x] Can be embedded in `TraceViewer` via `showPrintButton` prop

### 10.4 Testing

- [x] Visual test: render TraceReport in playground, use browser Print Preview to verify layout
- [x] Verify no interactive elements visible in print
- [x] Verify page breaks work correctly (table doesn't split mid-row)

**Exit criteria:** `<TraceReport result={result} companyName="Acme Fiber" />` renders a clean, professional report. `window.print()` produces a well-formatted document. Trace image is crisp and readable.

---

## Milestone 11 — Web Components

**Goal:** Wrap all major React components as Custom Elements for vanilla HTML consumption.

### 11.1 Web Component Wrapper (`src/web-components/`)

- [x] `create-element.ts` — Generic factory function:
  ```ts
  function defineOtdrElement<P>(
    tagName: string,
    Component: React.FC<P>,
    observedAttributes: string[],
    propTransformers: Record<string, (attr: string) => unknown>
  ): void
  ```
  - Creates a Custom Element class extending `HTMLElement`
  - `connectedCallback`: create shadow DOM, mount React root via `createRoot`
  - `disconnectedCallback`: unmount React root
  - `attributeChangedCallback`: re-render with updated props
  - `data` setter (JS property): accept complex objects (SorResult) that can't be string-serialized
  - Inject theme CSS into shadow DOM
  - Handle slotted content via `<slot>`

### 11.2 Define Elements

- [x] `otdr-trace-chart` — wraps `TraceChart`
- [x] `otdr-event-table` — wraps `EventTable`
- [x] `otdr-fiber-map` — wraps `FiberMap`
- [x] `otdr-trace-summary` — wraps `TraceSummary`
- [x] `otdr-trace-viewer` — wraps `TraceViewer`
- [x] `otdr-drop-zone` — wraps `SorDropZone`
- [x] Auto-register all elements when the web-components entry point is imported:
  ```js
  import '@ismaelvega/trace-otdr-ui/web-components';
  // Now <otdr-trace-viewer> is available in HTML
  ```

### 11.3 Vanilla HTML Example

- [x] `apps/demo-vanilla/index.html` — Complete working example:
  ```html
  <script type="module" src="@ismaelvega/trace-otdr-ui/web-components"></script>
  <otdr-drop-zone id="drop"></otdr-drop-zone>
  <otdr-trace-viewer id="viewer"></otdr-trace-viewer>
  <script>
    document.getElementById('drop').addEventListener('result', (e) => {
      document.getElementById('viewer').data = e.detail;
    });
  </script>
  ```

### 11.4 Testing

- [x] Test Custom Element lifecycle: mount, unmount, re-mount
- [x] Test attribute changes trigger re-render
- [x] Test `data` property setter works for complex objects
- [x] Verify the vanilla HTML example loads and works end-to-end

**Exit criteria:** All major components available as `<otdr-*>` Custom Elements. The vanilla HTML example works end-to-end without any React imports on the consumer side. Shadow DOM isolates styles correctly.

---

## Milestone 12 — Accessibility & Keyboard Navigation

**Goal:** Full keyboard accessibility and screen reader support across all interactive components.

### 12.1 TraceChart Keyboard Controls

- [x] When chart is focused (`tabindex="0"`):
  - Arrow keys: pan viewport (left/right for X, up/down for Y)
  - `+`/`-` keys: zoom in/out
  - `Home`: reset to full view
  - `Tab`: cycle through event markers (announce event info to screen reader)
  - `Enter` on focused marker: fire `onEventClick`
  - `Escape`: deselect current event
- [x] ARIA: `role="img"` with `aria-label` describing the chart content ("OTDR trace from 0 to 166.8 km, 26 events detected")
- [x] Live region for crosshair readout: `aria-live="polite"` region announces cursor position when navigating with keyboard

### 12.2 EventTable Keyboard Controls

- [x] Standard table navigation: arrow keys move between rows
- [x] `Enter` on a row: select event
- [x] `Escape`: deselect
- [x] Screen reader: announce row content on focus ("Event 8, reflection at 29.567 km, splice loss 0.572 dB, status warning")

### 12.3 FiberMap Keyboard Controls

- [x] Left/Right arrows: move between events
- [x] `Enter`: select event
- [x] ARIA labels on each event icon

### 12.4 Reduced Motion

- [x] `@media (prefers-reduced-motion: reduce)`: disable zoom/pan animations, crosshair transitions
- [x] Respect in all CSS transitions

### 12.5 Audit

- [x] Run `axe-core` automated accessibility audit on all components
- [x] Manual testing with VoiceOver (macOS) and NVDA (Windows)
- [x] Fix all critical and serious violations

**Exit criteria:** All interactive components are fully keyboard-navigable. Screen reader users can understand the trace data, navigate events, and receive status announcements. Zero critical `axe-core` violations.

---

## Milestone 13 — Documentation & Examples

**Goal:** Comprehensive documentation, Storybook-style examples, and API reference.

### 13.1 README.md

- [x] Quick start guide (install, import CSS, render TraceViewer)
- [x] Component catalog with prop tables
- [x] Theming guide
- [x] Web Components usage guide
- [x] Browser support matrix

### 13.2 Interactive Examples (`apps/demo/`)

- [x] Expand the playground into a proper demo app with pages:
  - "Quick Start" — SorDropZone → TraceViewer (minimal code)
  - "Components" — Each component rendered individually with controls
  - "Comparison" — TraceComparison with 2+ files
  - "Report" — TraceReport with print button
  - "Theming" — Theme toggle (light/dark/telecom) with live preview
  - "Vanilla HTML" — iframe embedding the web components demo
- [x] Deploy demo to GitHub Pages (via CI)

### 13.3 API Reference

- [x] TSDoc comments on all exported components, hooks, and utilities
- [x] Generate API docs from TSDoc (typedoc or similar)
- [x] Publish alongside the demo

### 13.4 CHANGELOG.md

- [x] Maintain changelog following Keep a Changelog format
- [x] Document each milestone completion as a version increment

**Exit criteria:** A developer can go from zero to rendered OTDR viewer in under 5 minutes following the README. All components are documented with prop tables and usage examples. Demo site is deployed and accessible.

---

## Milestone 14 — Performance Optimization & Polish

**Goal:** Final performance tuning, bundle size optimization, and visual polish before v1.0.

### 14.1 Performance

- [x] Profile TraceChart with 32k+ point traces (double the typical SOR file)
- [x] Verify LTTB downsampling activates correctly and maintains visual fidelity
- [x] Profile zoom/pan frame times — target consistent <16ms per frame
- [x] Profile React re-render counts during interaction — verify event selection doesn't cause unnecessary re-renders in unrelated components (use `React.memo`, `useMemo` where measured to help)
- [x] Lazy-load heavy components in TraceViewer (the info panels don't need to render until scrolled into view)

### 14.2 Bundle Size

- [x] Analyze bundle with `bundlephobia` or `source-map-explorer`
- [x] Verify tree-shaking works: importing only `TraceChart` doesn't pull in `TraceReport` code
- [x] Target: <50KB gzipped for the full library, <15KB for TraceChart alone
- [x] Verify zero runtime dependencies (only peer deps on react/react-dom)

### 14.3 Visual Polish

- [x] Review all components at standard viewport sizes (1920, 1440, 1024, 768, 375)
- [x] Smooth transitions on theme change
- [x] Canvas anti-aliasing verification
- [x] Consistent spacing, alignment, typography across all components
- [x] Tooltip positioning: handle edge cases (near viewport edges, flip direction)

### 14.4 Edge Cases

- [x] Empty trace (0 data points): show empty state message in TraceChart
- [x] Single-event trace: FiberMap handles gracefully
- [x] Very long fiber (>300km): verify axis labels don't overlap
- [x] Very short fiber (<0.1km): verify zoom limits allow useful inspection
- [x] SOR v1 files (missing v2-only fields): all components handle gracefully
- [x] Malformed event types (unknown type codes): classifyEvent returns "unknown", components display raw string

**Exit criteria:** All performance targets met. Bundle size within limits. Visual polish approved. Edge cases handled without crashes or layout breakage.

---

## Milestone 15 — Publish v1.0

**Goal:** Package and publish `@ismaelvega/trace-otdr-ui` to npm.

### 15.1 Pre-Release Checklist

- [x] All milestone 1–14 exit criteria met
- [x] All tests pass: `npm test` across the monorepo
- [x] All lint/typecheck clean: `npm run lint && npm run typecheck`
- [x] README is accurate and complete
- [x] CHANGELOG documents all features
- [x] `package.json` version set to `1.0.0`
- [x] `package.json` `files` field includes only `dist/`, `README.md`, `CHANGELOG.md`
- [x] `package.json` peer dependencies correctly specified
- [x] `package.json` exports map is correct for all entry points
- [x] License file present (MIT)
- [x] `.npmignore` or `files` field excludes source, tests, playground

### 15.2 Publish

- [x] Build: `npm run build`
- [x] Dry run: `npm publish --dry-run` — verify package contents
- [x] Publish: `npm publish --access public`
- [x] Verify install in a clean project: `npm install @ismaelvega/trace-otdr-ui sor-reader`
- [x] Verify the quick-start example from the README works

### 15.3 Post-Publish

- [x] Tag git commit: `v1.0.0`
- [x] GitHub Release with changelog
- [x] Demo site live and linked from README
- [x] Announce (if applicable)

**Exit criteria:** `@ismaelvega/trace-otdr-ui` is on npm, installable, and works end-to-end per the README. Demo site is live.

---

## Dependency Graph

```
M0  Scaffolding
 │
 ▼
M1  Types & Utilities
 │
 ├──────────────┐
 ▼              ▼
M2  Canvas      M4  Data Display Components
 │              │
 ▼              │
M3  TraceChart  │
 Interactions   │
 │              │
 ├──────┬───────┘
 ▼      ▼
M5  FiberMap & Event Selection
 │
 ▼
M6  SorDropZone & useTraceData
 │
 ▼
M7  Theming
 │
 ▼
M8  TraceViewer Composite ──────────┐
 │                                  │
 ├──────────┐                       │
 ▼          ▼                       ▼
M9  Compare M10 Report         M11 Web Components
 │          │                       │
 └────┬─────┘                       │
      ▼                             │
M12  Accessibility ◄────────────────┘
      │
      ▼
M13  Documentation
      │
      ▼
M14  Performance & Polish
      │
      ▼
M15  Publish v1.0
```

---

## Risk Register

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Canvas performance insufficient for 16k+ points | High | Low | LTTB downsampling, viewport culling, offscreen canvas for static renders. Fallback: WebGL renderer (out of scope for v1, but API designed to allow swap). |
| Cross-browser canvas rendering inconsistencies | Medium | Medium | Test in Chrome, Firefox, Safari early (milestone 2). Use standard Canvas2D API only — no experimental features. |
| Web Component shadow DOM breaks theming | Medium | Medium | Inject theme CSS into shadow root. Provide `::part()` selectors for external styling. Test early in milestone 11. |
| `sor-reader` type changes between versions | Medium | Low | Pin `sor-reader` as peer dep with semver range `^1.0.0`. The normalize adapter (M1.3) absorbs minor type differences. |
| Print rendering quality (TraceReport) | Medium | Medium | Render trace to high-res PNG (2400×800). Test with actual browser print-to-PDF. Provide resolution config prop. |
| Bundle size exceeds target | Low | Medium | Monitor with `bundlephobia` per milestone. Canvas code is custom (no charting library). CSS Modules have minimal overhead. Tree-shaking verified in M14. |
