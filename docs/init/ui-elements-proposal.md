# OTDR Trace UI Components Library — Proposal

**Package name:** `@ismaelvega/trace-otdr-ui`
**Data source:** `sor-reader` (zero-dependency SOR parser)
**Target frameworks:** React (primary), vanilla HTML/JS (secondary via web components)
**Date:** 2026-03-03

---

## 1. Vision

A focused, production-ready component library for rendering OTDR (Optical Time Domain Reflectometer) measurement data in web applications. The library consumes `SorResult` objects produced by `sor-reader` and renders them as interactive, accessible, and visually polished UI elements.

The library targets two audiences:
- **Fiber optic technicians** who need clear, fast trace visualization in the field
- **Telecom engineers/managers** who need reporting-quality dashboards and comparison tools

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     @ismaelvega/trace-otdr-ui                       │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Composite Components                   │ │
│  │  TraceViewer · TraceComparison · TraceReport        │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │ composes                       │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Core Components                        │ │
│  │  TraceChart · EventTable · FiberMap                 │ │
│  │  TraceSummary · EventMarkers · LossBudgetChart      │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │ uses                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Primitives & Utilities                 │ │
│  │  InfoPanel · MetricCard · StatusBadge               │ │
│  │  useTraceData · useZoomPan · formatters             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Theming & Tokens                       │ │
│  │  CSS custom properties · light/dark · telecom       │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
         │
         ▼ consumes
   ┌─────────────┐
   │ sor-reader   │  SorResult, TracePoint[], KeyEvents, etc.
   └─────────────┘
```

### Tech Stack

| Concern          | Choice                  | Rationale                                              |
|------------------|-------------------------|--------------------------------------------------------|
| Charting         | **Canvas 2D** (custom)  | 16,000+ data points need GPU-efficient rendering; no SVG DOM bloat |
| Interactions     | **Pointer Events API**  | Unified mouse/touch; needed for zoom, pan, crosshair   |
| Styling          | **CSS custom properties** + CSS Modules | Themeable, zero-runtime CSS-in-JS overhead           |
| Build            | **tsup** (ESM + CJS)   | Matches sor-reader; tree-shakeable                     |
| Types            | **TypeScript**          | Full type safety; re-exports sor-reader types          |
| Testing          | **Vitest + Testing Library** | Matches sor-reader; component + visual tests      |

### Browser/Vanilla HTML Support

All React components will also be exported as **Web Components** (Custom Elements) via a thin wrapper, enabling usage in plain HTML pages with `<otdr-trace-chart>` style elements and attribute-based configuration.

---

## 3. Component Catalog

### 3.1 `<TraceChart>` — Primary Trace Visualization

The centerpiece of the library. Renders the OTDR backscatter trace as a distance-vs-power plot on an HTML Canvas.

```
Power (dB)
  │
  │\
  │ \___
  │     \          ╱spike (reflection)
  │      \___     ╱
  │          \___╱\
  │               \__
  │                  \___________  ← noise floor
  │
  └──────────────────────────────── Distance (km)
  0    10    20    30    40    50
       ▲          ▲         ▲
     splice    connector  end-of-fiber
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `trace`           | `TracePoint[]`          | Array of `{ distance, power }` from sor-reader  |
| `events`          | `KeyEvents`             | Key events to overlay as markers                |
| `fxdParams`       | `FxdParams`             | For thresholds, range, resolution display        |
| `width`           | `number \| "auto"`      | Canvas width in px (default: container width)    |
| `height`          | `number`                | Canvas height in px (default: 400)               |
| `showGrid`        | `boolean`               | Show background grid lines (default: true)       |
| `showEvents`      | `boolean`               | Overlay event markers (default: true)            |
| `showCrosshair`   | `boolean`               | Show crosshair cursor with readout (default: true)|
| `showLegend`      | `boolean`               | Show trace legend (default: false)               |
| `xUnit`           | `"km" \| "m" \| "mi" \| "kft"` | Distance unit for X axis               |
| `yRange`          | `[number, number]`      | Manual Y-axis range override `[min, max]` in dB  |
| `xRange`          | `[number, number]`      | Manual X-axis range override `[min, max]`         |
| `traceColor`      | `string`                | Trace line color (default: theme primary)        |
| `traceWidth`      | `number`                | Trace line width in px (default: 1.5)            |
| `overlays`        | `TraceOverlay[]`        | Additional traces for comparison overlay          |
| `onPointHover`    | `(point, index) => void`| Callback when cursor moves over trace            |
| `onEventClick`    | `(event, index) => void`| Callback when an event marker is clicked         |
| `onZoomChange`    | `(xRange, yRange) => void` | Callback when zoom/pan changes              |
| `className`       | `string`                | Custom CSS class                                 |

**Interactions:**
- **Scroll wheel** — Zoom in/out centered on cursor position
- **Click + drag** — Pan the trace
- **Double-click** — Reset to full view (fit-to-data)
- **Pinch** — Touch zoom on mobile
- **Hover** — Crosshair snaps to nearest data point with `(distance, power)` readout
- **Click on event marker** — Fires `onEventClick`, shows event detail tooltip

**Rendering strategy:**
- Use `requestAnimationFrame` for smooth 60fps interactions
- Downsample for display when zoomed out (LTTB algorithm) to maintain visual fidelity with fewer draw calls
- Full-resolution data used when zoomed in
- Canvas is sized at `devicePixelRatio` for crisp rendering on Retina/HiDPI displays

---

### 3.2 `<EventMarkers>` — Event Overlay Layer

Renders event indicators directly on the `TraceChart` canvas. Internally used by `TraceChart` when `showEvents={true}`, but also exported for custom compositions.

**Event type visual encoding:**

| Event Type       | Icon/Shape               | Color            |
|------------------|--------------------------|------------------|
| Reflection       | `▲` triangle up          | amber/yellow     |
| Loss/drop/gain   | `●` filled circle        | blue             |
| Connector        | `■` square               | green            |
| End-of-fiber     | `✕` cross                | red              |
| Manual event     | `◆` diamond              | purple           |

Each marker sits at the event's `(distance, power)` coordinate on the trace. A vertical dashed line extends from the marker to the X axis to clearly mark the position.

**Tooltip on hover/click:**
```
┌───────────────────────────────┐
│  Event #8 — Reflection        │
│  ─────────────────────────── │
│  Distance:    29.567 km       │
│  Splice Loss:  0.572 dB      │
│  Refl. Loss:  -40.110 dB     │
│  Slope:        —              │
│  Comment:                     │
└───────────────────────────────┘
```

---

### 3.3 `<EventTable>` — Tabular Event Listing

A sortable, filterable data table showing all key events from the measurement.

```
┌────┬─────────┬──────────────┬───────────┬────────────┬────────────┬─────────┐
│ #  │ Dist.   │ Type         │ Splice dB │ Refl. dB   │ Slope dB/km│ Status  │
├────┼─────────┼──────────────┼───────────┼────────────┼────────────┼─────────┤
│  1 │  0.000  │ ▲ Reflection │   0.000   │   0.000    │   0.000    │  —      │
│  2 │  5.227  │ ● Loss       │   0.153   │   —        │   —        │  PASS   │
│  3 │  9.148  │ ● Loss       │   0.094   │   —        │   0.189    │  PASS   │
│  8 │ 29.567  │ ▲ Reflection │   0.572   │ -40.110    │   —        │  WARN   │
│ 25 │121.698  │ ● Loss       │   0.926   │   —        │   0.228    │  FAIL   │
│ 26 │166.783  │ ● End-of-fib │   0.000   │   —        │   0.172    │  —      │
└────┴─────────┴──────────────┴───────────┴────────────┴────────────┴─────────┘
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `events`          | `KeyEvents`             | Key events from sor-reader                       |
| `thresholds`      | `EventThresholds`       | Pass/warn/fail thresholds for splice and refl loss|
| `xUnit`           | `"km" \| "m" \| ...`   | Distance unit for display                        |
| `onEventSelect`   | `(event, index) => void`| Fires when a row is clicked                     |
| `selectedEvent`   | `number`                | Highlighted event index                          |
| `compact`         | `boolean`               | Reduced column set for narrow viewports          |
| `className`       | `string`                | Custom CSS class                                 |

**Features:**
- Click a row to highlight the corresponding marker on `TraceChart` (bidirectional linking)
- Sortable by any column
- Configurable pass/warn/fail thresholds (e.g., splice loss > 0.5 dB = WARN, > 1.0 dB = FAIL)
- Summary row at bottom showing totals (total loss, ORL)
- Export selection to clipboard

---

### 3.4 `<FiberMap>` — Linear Schematic Diagram

A horizontal "fiber diagram" that represents the fiber span as a straight line with events placed along it. Common in OTDR software and field reports.

```
 Loc A                                                          Loc B
  ┃                                                              ┃
  ┣━━━━━┫──────┫──────┫───────┫════┫──────┫──────────────────────┫
  0     5.2   9.1   13.6   17.5  21.4  26.6                   166.8 km
        ●      ●      ●      ●    ■      ●                      ✕
      0.15   0.09   0.09   0.10  0.25   0.24                  EOT
       dB     dB     dB     dB    dB     dB

  ━━━ fiber span    ┫ splice/loss    ═══ connector    ● event    ✕ end
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `events`          | `KeyEvents`             | Key events from sor-reader                       |
| `genParams`       | `GenParams`             | For location A/B labels                          |
| `totalLength`     | `number`                | Fiber length (auto-computed from last event if omitted)|
| `xUnit`           | `"km" \| "m"`          | Distance unit                                    |
| `onEventClick`    | `(event, index) => void`| Callback when event icon is clicked             |
| `selectedEvent`   | `number`                | Highlighted event                                |
| `showLabels`      | `boolean`               | Show distance + loss labels (default: true)      |
| `orientation`     | `"horizontal" \| "vertical"` | Layout direction (default: horizontal)    |
| `className`       | `string`                | Custom CSS class                                 |

**Features:**
- Proportional spacing (distance between events reflects actual fiber distance)
- Event icons match the same visual encoding as `EventMarkers`
- Loss value label below each event
- Hover tooltip with full event details
- Segment labels showing span distance between consecutive events
- Responsive — collapses labels on narrow widths

---

### 3.5 `<TraceSummary>` — Key Metrics Overview Card

A compact summary card showing the most important measurement results at a glance.

```
┌──────────────────────────────────────────────────────────────────┐
│  Fiber Trace Summary                              PASS ✓       │
│  ────────────────────────────────────────────────────────────── │
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  166.8 km  │  │  44.75 dB  │  │ 0.268 dB/km│  │  26 events ││
│  │  Length    │  │  Total Loss│  │  Avg. Loss  │  │  Detected  ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
│                                                                  │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐│
│  │  0.00 dB   │  │  1550 nm   │  │  20 µs     │  │  30 sec    ││
│  │  ORL       │  │  Wavelength│  │  Pulse W.  │  │  Avg. Time ││
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘│
└──────────────────────────────────────────────────────────────────┘
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `result`          | `SorResult`             | Complete parsed result from sor-reader           |
| `thresholds`      | `SummaryThresholds`     | Pass/fail criteria for overall assessment        |
| `compact`         | `boolean`               | Single-row layout (default: false)               |
| `className`       | `string`                | Custom CSS class                                 |

**Computed metrics displayed:**
- Fiber length (from last event distance or trace range)
- Total loss (from `KeyEvents.Summary.total_loss`)
- Average loss per km (total loss / length)
- ORL (from `KeyEvents.Summary.ORL`)
- Event count
- Wavelength (from `GenParams.wavelength`)
- Pulse width (from `FxdParams["pulse width"]`)
- Averaging time (from `FxdParams["averaging time"]`)
- Overall pass/fail badge based on configurable thresholds

---

### 3.6 `<LossBudgetChart>` — Per-Event Loss Bar Chart

A horizontal bar chart showing the individual splice/connector loss at each event, making it easy to spot outliers.

```
Power Loss per Event

  #1  ▓                              0.00 dB
  #2  ▓▓▓                            0.15 dB
  #3  ▓▓                             0.09 dB
  #8  ▓▓▓▓▓▓▓▓▓▓▓▓ ← WARN           0.57 dB
 #12  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ← FAIL    0.69 dB
 #25  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ FAIL  0.93 dB
      ├───┼───┼───┼───┼───┼───┤
      0  0.2 0.4 0.6 0.8 1.0   dB
                  ▲         ▲
               warn thr  fail thr
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `events`          | `KeyEvents`             | Key events from sor-reader                       |
| `thresholds`      | `LossThresholds`        | `{ warn: number, fail: number }` in dB          |
| `metric`          | `"splice" \| "refl"`    | Which loss to plot (default: splice)             |
| `orientation`     | `"horizontal" \| "vertical"` | Bar direction (default: horizontal)        |
| `onBarClick`      | `(event, index) => void`| Callback when a bar is clicked                  |
| `className`       | `string`                | Custom CSS class                                 |

**Features:**
- Color-coded bars: green (pass), amber (warn), red (fail)
- Threshold reference lines drawn across the chart
- Negative values (gains) shown as bars extending left
- Hover tooltip with full event details

---

### 3.7 `<InfoPanel>` — Metadata Display Panels

A reusable panel primitive for displaying labeled key-value pairs in organized sections. Three pre-configured variants are provided:

#### `<FiberInfoPanel>`
Displays cable/fiber identification from `GenParams`.

```
┌─ Fiber Information ──────────────────────┐
│  Cable ID        M200_DEMO_D             │
│  Fiber ID        005                     │
│  Fiber Type      G.652 (standard SMF)    │
│  Wavelength      1550 nm                 │
│  Location A      Loc A                   │
│  Location B      Loc B                   │
│  Build Cond.     CC (as-current)         │
│  Operator        —                       │
└──────────────────────────────────────────┘
```

#### `<EquipmentInfoPanel>`
Displays OTDR equipment details from `SupParams`.

```
┌─ Equipment ──────────────────────────────┐
│  Supplier        Viavi                   │
│  OTDR Model      OTU 8000E               │
│  Serial No.      12861                   │
│  Module          8115 C                  │
│  Module S/N      11531                   │
│  Software        21.74                   │
└──────────────────────────────────────────┘
```

#### `<MeasurementInfoPanel>`
Displays test configuration from `FxdParams`.

```
┌─ Measurement Config ────────────────────┐
│  Date/Time       2026-02-12 15:07:52    │
│  Pulse Width     20,000 ns              │
│  Range           326.4 km               │
│  Resolution      163.4 m/sample         │
│  Sample Spacing  0.80 µs                │
│  Num Averages    587,520                 │
│  Avg. Time       30 sec                 │
│  IOR             1.468200               │
│  Backscatter     -81.00 dB              │
│  Loss Thr.       0.000 dB               │
│  Refl. Thr.      -65.535 dB             │
│  EOT Thr.        6.000 dB               │
└──────────────────────────────────────────┘
```

**Common Props (all panels):**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `data`            | Respective params type  | GenParams, SupParams, or FxdParams               |
| `collapsible`     | `boolean`               | Allow collapsing the panel (default: false)      |
| `defaultExpanded` | `boolean`               | Initial expand state (default: true)             |
| `className`       | `string`                | Custom CSS class                                 |

---

### 3.8 `<SorDropZone>` — File Input Component

A drag-and-drop zone that accepts `.sor` files, parses them using `sor-reader/browser`, and emits the parsed `SorResult`.

```
┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
│                                         │
│         Drop .sor file here             │
│         or click to browse              │
│                                         │
│            ┌──────────┐                 │
│            │  Browse  │                 │
│            └──────────┘                 │
└─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `onResult`        | `(result: SorResult) => void` | Fires with parsed data                    |
| `onError`         | `(error: Error) => void`| Fires on parse failure                           |
| `multiple`        | `boolean`               | Accept multiple files (default: false)           |
| `accept`          | `string`                | File filter (default: `.sor`)                    |
| `parseOptions`    | `ParseOptions`          | Options forwarded to `parseSor()`                |
| `children`        | `ReactNode`             | Custom drop zone content                         |
| `className`       | `string`                | Custom CSS class                                 |

---

## 4. Composite (Full-Page) Components

### 4.1 `<TraceViewer>` — Complete Single-Trace View

The all-in-one component that assembles the full analysis view for a single SOR file. This is the "just give me everything" component.

```
┌────────────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                     TraceSummary                             │  │
│  │  166.8 km │ 44.75 dB │ 0.268 dB/km │ 26 events │ PASS ✓   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                                                              │  │
│  │                      TraceChart                              │  │
│  │   (interactive canvas with event markers)                    │  │
│  │                                                              │  │
│  │                                                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                       FiberMap                               │  │
│  │  Loc A ━━━┫──┫──┫──┫══┫──┫──────────────────────┫ Loc B    │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌───────────────────────────────┐ ┌──────────────────────────┐   │
│  │         EventTable            │ │    LossBudgetChart       │   │
│  │  # │ Dist │ Type │ Loss │ ...│ │    ▓▓▓  0.15 dB          │   │
│  │  1 │ 0.00 │ Refl │ 0.00 │   │ │    ▓▓   0.09 dB          │   │
│  │  2 │ 5.23 │ Loss │ 0.15 │   │ │    ▓▓▓▓▓▓▓▓  0.57 dB     │   │
│  │  ...                         │ │    ...                    │   │
│  └───────────────────────────────┘ └──────────────────────────┘   │
│                                                                    │
│  ┌──────────────┐ ┌───────────────┐ ┌────────────────────────┐   │
│  │ FiberInfo    │ │ Equipment     │ │ MeasurementConfig      │   │
│  │ Cable: ...   │ │ OTDR: ...     │ │ Pulse: 20µs            │   │
│  │ Fiber: ...   │ │ S/N: ...      │ │ Range: 326 km          │   │
│  └──────────────┘ └───────────────┘ └────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `result`          | `SorResult`             | Complete parsed result from sor-reader           |
| `thresholds`      | `AllThresholds`         | Pass/fail thresholds for all assessments         |
| `layout`          | `"full" \| "compact"`   | Layout mode (default: full)                      |
| `sections`        | `string[]`              | Which sections to show (default: all)            |
| `xUnit`           | `"km" \| "m" \| ...`   | Distance unit across all sub-components          |
| `onEventSelect`   | `(event, index) => void`| Unified event selection across all components    |
| `className`       | `string`                | Custom CSS class                                 |

**Bidirectional linking:** Clicking an event in the `EventTable`, `FiberMap`, or `TraceChart` highlights it in all three simultaneously.

---

### 4.2 `<TraceComparison>` — Multi-Trace Comparison

Compare two or more SOR measurements side by side or overlaid. Common use cases: before/after repair, wavelength comparison (1310 vs 1550), or historical trending.

**Modes:**

1. **Overlay** — Multiple traces on the same chart with different colors
2. **Side-by-side** — Two `TraceChart` instances with synchronized zoom/pan
3. **Difference** — Computed trace showing `power_A[i] - power_B[i]`

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `results`         | `SorResult[]`           | Array of parsed results to compare               |
| `mode`            | `"overlay" \| "side-by-side" \| "difference"` | Comparison mode    |
| `syncZoom`        | `boolean`               | Synchronized zoom/pan in side-by-side mode       |
| `labels`          | `string[]`              | Display labels for each trace                    |
| `colors`          | `string[]`              | Colors for each trace                            |
| `className`       | `string`                | Custom CSS class                                 |

---

### 4.3 `<TraceReport>` — Print-Ready Report

A static, print-optimized layout designed for PDF generation or `window.print()`. Matches the style of traditional OTDR test reports.

```
┌──────────────────────────────────────────┐
│  OTDR Test Report                        │
│  ════════════════                        │
│  Cable: M200_DEMO_D  Fiber: 005         │
│  Loc A → Loc B  │  1550 nm  │  Viavi    │
│  2026-02-12 15:07                        │
│                                          │
│  [Static trace chart image]              │
│                                          │
│  [Fiber map diagram]                     │
│                                          │
│  [Event table - full]                    │
│                                          │
│  [Summary metrics]                       │
│                                          │
│  Result: PASS / FAIL                     │
│  Technician: ___________                 │
└──────────────────────────────────────────┘
```

**Props:**

| Prop              | Type                    | Description                                     |
|-------------------|-------------------------|-------------------------------------------------|
| `result`          | `SorResult`             | Complete parsed result                           |
| `thresholds`      | `AllThresholds`         | Assessment thresholds                            |
| `companyName`     | `string`                | Header branding                                  |
| `companyLogo`     | `string`                | Logo URL for header                              |
| `technician`      | `string`                | Technician name for report footer                |
| `notes`           | `string`                | Additional notes section                         |
| `className`       | `string`                | Custom CSS class                                 |

---

## 5. Hooks & Utilities

### React Hooks

| Hook              | Purpose                                                      |
|-------------------|--------------------------------------------------------------|
| `useTraceData(file \| Uint8Array)` | Parses SOR data, returns `{ result, loading, error }` |
| `useZoomPan(ref)` | Manages zoom/pan state for canvas-based charts                |
| `useEventSelection()` | Shared selection state for linking chart ↔ table ↔ map  |
| `useTraceDownsampling(trace, viewportWidth)` | LTTB downsampling for rendering |
| `useThresholds(defaults?)` | Manages pass/warn/fail threshold configuration      |

### Utility Functions

| Function                | Purpose                                                |
|-------------------------|--------------------------------------------------------|
| `convertDistance(km, unit)` | Convert km to m, mi, kft                           |
| `formatDistance(value, unit, precision?)` | Locale-aware distance formatting        |
| `formatPower(dB, precision?)` | Power formatting with unit                       |
| `classifyEvent(event)` | Returns `"reflection" \| "loss" \| "connector" \| "end-of-fiber" \| "manual"` |
| `assessEvent(event, thresholds)` | Returns `"pass" \| "warn" \| "fail"`        |
| `computeLossBudget(events)` | Aggregated loss budget calculations               |
| `traceToImageURL(trace, options)` | Render trace to a data URL (for reports/export) |

---

## 6. Theming

All components are styled via CSS custom properties, making them fully themeable without runtime CSS-in-JS.

### Default Tokens

```css
:root {
  /* Layout */
  --otdr-font-family: 'Inter', system-ui, sans-serif;
  --otdr-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  --otdr-border-radius: 8px;
  --otdr-spacing-unit: 4px;

  /* Colors — Light Theme */
  --otdr-bg-primary: #ffffff;
  --otdr-bg-secondary: #f8f9fa;
  --otdr-bg-chart: #1a1a2e;          /* Dark chart background for contrast */
  --otdr-text-primary: #1a1a2e;
  --otdr-text-secondary: #6c757d;
  --otdr-border-color: #dee2e6;

  /* Trace colors */
  --otdr-trace-primary: #00d4ff;      /* Cyan — high contrast on dark bg */
  --otdr-trace-secondary: #ff6b6b;
  --otdr-trace-tertiary: #51cf66;
  --otdr-grid-color: rgba(255, 255, 255, 0.08);
  --otdr-crosshair-color: rgba(255, 255, 255, 0.4);

  /* Event colors */
  --otdr-event-reflection: #ffd43b;   /* Amber */
  --otdr-event-loss: #339af0;         /* Blue */
  --otdr-event-connector: #51cf66;    /* Green */
  --otdr-event-end: #ff6b6b;          /* Red */
  --otdr-event-manual: #cc5de8;       /* Purple */

  /* Status colors */
  --otdr-status-pass: #51cf66;
  --otdr-status-warn: #ffd43b;
  --otdr-status-fail: #ff6b6b;
}
```

### Dark Theme

Applied via `[data-theme="dark"]` or `@media (prefers-color-scheme: dark)`. The chart canvas already uses a dark background by default; dark mode inverts the surrounding UI to match.

### Telecom Theme (Optional)

A professional theme with muted colors matching traditional OTDR test equipment UIs (blue-gray palette, high-contrast trace lines).

---

## 7. Package Exports

```
@ismaelvega/trace-otdr-ui
├── components/
│   ├── TraceChart
│   ├── EventMarkers
│   ├── EventTable
│   ├── FiberMap
│   ├── TraceSummary
│   ├── LossBudgetChart
│   ├── FiberInfoPanel
│   ├── EquipmentInfoPanel
│   ├── MeasurementInfoPanel
│   ├── SorDropZone
│   ├── TraceViewer         (composite)
│   ├── TraceComparison     (composite)
│   └── TraceReport         (composite)
├── hooks/
│   ├── useTraceData
│   ├── useZoomPan
│   ├── useEventSelection
│   ├── useTraceDownsampling
│   └── useThresholds
├── utils/
│   ├── formatters
│   ├── classifiers
│   ├── conversions
│   └── lossBudget
├── themes/
│   ├── default.css
│   ├── dark.css
│   └── telecom.css
└── web-components/         (vanilla HTML wrappers)
    ├── otdr-trace-chart
    ├── otdr-event-table
    ├── otdr-fiber-map
    ├── otdr-trace-viewer
    └── ...
```

---

## 8. Implementation Priority

### Phase 1 — Core (MVP)
1. `TraceChart` with Canvas rendering, zoom/pan, crosshair
2. `EventMarkers` overlay on TraceChart
3. `EventTable` with sorting and click-to-highlight
4. `TraceSummary` metrics card
5. `SorDropZone` file input
6. `useTraceData` hook
7. Default + dark themes
8. Basic CSS custom property theming

### Phase 2 — Complete Viewer
9. `FiberMap` schematic diagram
10. `LossBudgetChart` bar chart
11. `FiberInfoPanel`, `EquipmentInfoPanel`, `MeasurementInfoPanel`
12. `TraceViewer` composite component
13. Bidirectional event selection linking
14. `useEventSelection` hook
15. Configurable thresholds with `useThresholds`

### Phase 3 — Advanced Features
16. `TraceComparison` (overlay + side-by-side + difference modes)
17. `TraceReport` print-ready layout
18. Web Components wrappers for vanilla HTML usage
19. LTTB downsampling for large traces (`useTraceDownsampling`)
20. Telecom theme
21. `traceToImageURL` for export/sharing
22. Keyboard accessibility (arrow-key event navigation, focus management)

---

## 9. Design Principles

1. **Data-driven** — Every component accepts `sor-reader` types directly. No intermediate data transformations required by the consumer.

2. **Composable** — Use individual components (just a chart, just a table) or the full `TraceViewer`. Each component works standalone.

3. **Performant** — Canvas-based rendering for traces (not SVG). LTTB downsampling for 16k+ point traces. `requestAnimationFrame` for smooth interactions.

4. **Accessible** — ARIA labels on interactive elements, keyboard navigation for event table and chart markers, sufficient color contrast ratios, screen-reader announcements for pass/fail status.

5. **Themeable** — CSS custom properties for full visual customization without JavaScript. Ship with light, dark, and telecom themes.

6. **Zero lock-in** — Minimal dependencies. Canvas rendering is custom (no charting library dependency). Components are individually importable for tree-shaking.

7. **Print-ready** — `TraceReport` component is designed for `@media print` with proper page breaks, static rendering, and professional layout.

---

## 10. Example Usage

### Minimal: Drop a file, see the trace

```tsx
import { SorDropZone, TraceChart } from '@ismaelvega/trace-otdr-ui';
import { useState } from 'react';

function App() {
  const [result, setResult] = useState(null);

  return (
    <div>
      {!result ? (
        <SorDropZone onResult={setResult} />
      ) : (
        <TraceChart
          trace={result.trace}
          events={result.KeyEvents}
          fxdParams={result.FxdParams}
        />
      )}
    </div>
  );
}
```

### Full viewer from a file

```tsx
import { TraceViewer, useTraceData } from '@ismaelvega/trace-otdr-ui';
import '@ismaelvega/trace-otdr-ui/themes/default.css';

function App({ sorFile }: { sorFile: Uint8Array }) {
  const { result, loading, error } = useTraceData(sorFile);

  if (loading) return <p>Parsing...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <TraceViewer
      result={result}
      thresholds={{
        spliceLoss: { warn: 0.3, fail: 0.5 },
        reflLoss: { warn: -50, fail: -40 },
        totalLoss: { fail: 30 },
      }}
    />
  );
}
```

### Vanilla HTML (Web Component)

```html
<script type="module" src="@ismaelvega/trace-otdr-ui/web-components/otdr-trace-viewer.js"></script>
<link rel="stylesheet" href="@ismaelvega/trace-otdr-ui/themes/default.css">

<otdr-trace-viewer id="viewer"></otdr-trace-viewer>

<script type="module">
  import { parseSor } from 'sor-reader/browser';

  const input = document.querySelector('input[type="file"]');
  input.addEventListener('change', async (e) => {
    const buf = new Uint8Array(await e.target.files[0].arrayBuffer());
    const result = parseSor(buf);
    document.getElementById('viewer').data = result;
  });
</script>
```
