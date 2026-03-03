# @trace-otdr/ui

TypeScript + React OTDR component library for visualizing `sor-reader` results.

## Install

```bash
npm install @trace-otdr/ui sor-reader react react-dom
```

## Quick Start

```tsx
import { TraceViewer } from "@trace-otdr/ui";
import "@trace-otdr/ui/css";

function App({ result }) {
  return <TraceViewer result={result} />;
}
```

## CSS Themes

- `@trace-otdr/ui/css` — default light theme
- `@trace-otdr/ui/css/dark` — dark tokens
- `@trace-otdr/ui/css/telecom` — telecom preset

Set the theme with `data-theme`:

```html
<div data-theme="dark"></div>
```

## Major Exports

- `TraceViewer`, `TraceChart`, `TraceSummary`, `EventTable`, `FiberMap`, `LossBudgetChart`
- `TraceComparison`, `TraceReport`, `SorDropZone`, `PrintButton`
- Hooks: `useZoomPan`, `useEventSelection`, `useTraceData`, `useThresholds`
- Utilities: formatters, conversions, classifiers, loss budget, downsampling, image export
- Web components entry: `@trace-otdr/ui/web-components`

## Web Components

```js
import "@trace-otdr/ui/web-components";

const viewer = document.querySelector("otdr-trace-viewer");
viewer.data = result;
```

## Browser Support

Modern evergreen browsers with Canvas2D and Custom Elements support.
