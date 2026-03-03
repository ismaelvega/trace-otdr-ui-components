import { useEffect, useRef, useState } from "react";
import type { ParseOptions, SorResult } from "sor-reader";
import { parseSor } from "sor-reader/browser";

export function useTraceData(
  source: File | Uint8Array | null,
  options?: ParseOptions,
): {
  result: SorResult | null;
  loading: boolean;
  error: Error | null;
} {
  const [result, setResult] = useState<SorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastSourceRef = useRef<File | Uint8Array | null>(null);
  const lastResultRef = useRef<SorResult | null>(null);

  useEffect(() => {
    let active = true;

    if (!source) {
      setResult(null);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    if (lastSourceRef.current === source && lastResultRef.current) {
      setResult(lastResultRef.current);
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        let bytes: Uint8Array;
        let filename = "input.sor";

        if (source instanceof Uint8Array) {
          bytes = source;
        } else {
          filename = source.name;
          bytes = new Uint8Array(await source.arrayBuffer());
        }

        const parsed = parseSor(bytes, filename, options);
        if (!active) return;

        lastSourceRef.current = source;
        lastResultRef.current = parsed;
        setResult(parsed);
      } catch (cause) {
        if (!active) return;
        const resolved = cause instanceof Error ? cause : new Error("Failed to parse SOR source");
        setError(resolved);
        setResult(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [source, options]);

  return { result, loading, error };
}
