import { useMemo, useState, type ChangeEvent } from "react";
import { createRoot } from "react-dom/client";
import { parseSor } from "sor-reader/browser";
import type { SorResult } from "sor-reader";
import {
  FiberMap,
  LossBudgetChart,
  SorDropZone,
  TraceChart,
  TraceComparison,
  TraceReport,
  TraceSummary,
  TraceViewer,
  normalizeSorResult,
} from "@ismaelvega/trace-otdr-ui";
import "../../../packages/ui/src/themes/default.css";
import "../../../packages/ui/src/themes/dark.css";
import "../../../packages/ui/src/themes/telecom.css";
import "./main.css";

type PageName = "quick-start" | "components" | "comparison" | "report" | "theming" | "vanilla";

const PAGE_DESCRIPTIONS: Record<PageName, string> = {
  "quick-start": "Full TraceViewer layout with synchronized chart, map, table, and info panels.",
  components: "Individual components for visual QA and isolated behavior checks.",
  comparison: "Overlay, side-by-side, and difference-ready comparison workflows for multiple traces.",
  report: "Print-oriented report view for technician handoff and archival output.",
  theming: "Theme preview in compact layout to validate token consistency.",
  vanilla: "Web Components embed from the vanilla demo page.",
};

function App() {
  const [result, setResult] = useState<SorResult | null>(null);
  const [results, setResults] = useState<SorResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<PageName>("quick-start");
  const [theme, setTheme] = useState<"light" | "dark" | "telecom">("light");

  const normalized = useMemo(() => (result ? normalizeSorResult(result) : null), [result]);

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const list = event.target.files;
    if (!list || list.length === 0) return;

    try {
      setError(null);
      const parsedResults: SorResult[] = [];
      for (const file of Array.from(list)) {
        const bytes = new Uint8Array(await file.arrayBuffer());
        parsedResults.push(parseSor(bytes, file.name));
      }

      setResults(parsedResults);
      setResult(parsedResults[0] ?? null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to parse SOR file";
      setError(message);
    }
  };

  return (
    <main data-theme={theme} className="demoShell">
      <header className="demoHeader">
        <h1 className="demoTitle">Trace OTDR UI Demo</h1>
        <p className="demoSubtitle">{PAGE_DESCRIPTIONS[page]}</p>
      </header>

      <section className="demoControls" aria-label="Demo controls">
        <label className="demoField">
          <span>Load traces</span>
          <input type="file" accept=".sor" multiple onChange={onFileChange} />
        </label>
        <label className="demoField">
          <span>Page</span>
          <select value={page} onChange={(event) => setPage(event.target.value as PageName)}>
            <option value="quick-start">Quick Start</option>
            <option value="components">Components</option>
            <option value="comparison">Comparison</option>
            <option value="report">Report</option>
            <option value="theming">Theming</option>
            <option value="vanilla">Vanilla HTML</option>
          </select>
        </label>
        <label className="demoField">
          <span>Theme</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "telecom")}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="telecom">Telecom</option>
          </select>
        </label>
      </section>

      {error ? <p className="demoError">{error}</p> : null}

      {!normalized ? (
        <section className="demoPanel">
          <SorDropZone
            onResult={(parsed) => {
              setResult(parsed);
              setResults([parsed]);
            }}
            onError={(cause) => setError(cause.message)}
          />
        </section>
      ) : null}

      {normalized && page === "quick-start" ? (
        <section className="demoPanel">
          <TraceViewer result={normalized} />
        </section>
      ) : null}

      {normalized && page === "components" ? (
        <section className="demoPanel demoGrid">
          <TraceSummary result={normalized} />
          <TraceChart
            trace={normalized.trace}
            events={normalized.keyEvents.events}
            showExportActions
            exportFileBaseName={`${(normalized.filename ?? "demo-trace").replace(/\.[^.]+$/u, "")}-chart`}
          />
          <FiberMap events={normalized.keyEvents.events} locationA={normalized.genParams.locationA} locationB={normalized.genParams.locationB} />
          <LossBudgetChart events={normalized.keyEvents.events} />
        </section>
      ) : null}

      {results.length >= 2 && page === "comparison" ? (
        <section className="demoPanel">
          <TraceComparison
            traces={results.slice(0, 2).map((item, index) => ({
              label: item.filename || `Trace ${index + 1}`,
              result: item,
            }))}
            mode="overlay"
          />
        </section>
      ) : null}
      {page === "comparison" && results.length < 2 ? <p className="demoHint">Load at least two SOR files to preview comparison mode.</p> : null}

      {normalized && page === "report" ? (
        <section className="demoPanel">
          <TraceReport result={normalized} companyName="Acme Fiber" technician="Demo User" />
        </section>
      ) : null}

      {normalized && page === "theming" ? (
        <section className="demoPanel">
          <p className="demoHint">Theme preview is controlled by the selector above.</p>
          <TraceViewer result={normalized} layout="compact" />
        </section>
      ) : null}

      {page === "vanilla" ? (
        <section className="demoPanel">
          <iframe title="Vanilla HTML demo" src="../../demo-vanilla/index.html" className="demoIframe" />
        </section>
      ) : null}
    </main>
  );
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing root container");
}

createRoot(container).render(<App />);
