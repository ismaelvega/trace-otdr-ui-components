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
} from "@trace-otdr/ui";
import "../../../packages/ui/src/themes/default.css";
import "../../../packages/ui/src/themes/dark.css";
import "../../../packages/ui/src/themes/telecom.css";

type PageName = "quick-start" | "components" | "comparison" | "report" | "theming" | "vanilla";

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
    <main data-theme={theme} style={{ fontFamily: "IBM Plex Sans, Segoe UI, sans-serif", padding: 16 }}>
      <h1 style={{ marginTop: 0 }}>Trace OTDR UI Demo</h1>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input type="file" accept=".sor" multiple onChange={onFileChange} />
        <select value={page} onChange={(event) => setPage(event.target.value as PageName)}>
          <option value="quick-start">Quick Start</option>
          <option value="components">Components</option>
          <option value="comparison">Comparison</option>
          <option value="report">Report</option>
          <option value="theming">Theming</option>
          <option value="vanilla">Vanilla HTML</option>
        </select>
        <select value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "telecom")}>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="telecom">Telecom</option>
        </select>
      </div>

      {error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}

      {!normalized ? (
        <SorDropZone
          onResult={(parsed) => {
            setResult(parsed);
            setResults([parsed]);
          }}
          onError={(cause) => setError(cause.message)}
        />
      ) : null}

      {normalized && page === "quick-start" ? <TraceViewer result={normalized} /> : null}

      {normalized && page === "components" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <TraceSummary result={normalized} />
          <TraceChart trace={normalized.trace} events={normalized.keyEvents.events} />
          <FiberMap events={normalized.keyEvents.events} locationA={normalized.genParams.locationA} locationB={normalized.genParams.locationB} />
          <LossBudgetChart events={normalized.keyEvents.events} />
        </div>
      ) : null}

      {results.length >= 2 && page === "comparison" ? (
        <TraceComparison
          traces={results.slice(0, 2).map((item, index) => ({
            label: item.filename || `Trace ${index + 1}`,
            result: item,
          }))}
          mode="overlay"
        />
      ) : null}

      {normalized && page === "report" ? <TraceReport result={normalized} companyName="Acme Fiber" technician="Demo User" /> : null}

      {normalized && page === "theming" ? (
        <div>
          <p>Theme preview is controlled by the selector above.</p>
          <TraceViewer result={normalized} layout="compact" />
        </div>
      ) : null}

      {page === "vanilla" ? (
        <iframe
          title="Vanilla HTML demo"
          src="../../demo-vanilla/index.html"
          style={{ width: "100%", minHeight: 420, border: "1px solid #cbd5e1" }}
        />
      ) : null}
    </main>
  );
}

const container = document.getElementById("root");
if (!container) {
  throw new Error("Missing root container");
}

createRoot(container).render(<App />);
