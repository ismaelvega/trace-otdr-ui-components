import { useRef, useState, type KeyboardEvent, type ReactElement, type ReactNode } from "react";
import { parseSor } from "sor-reader/browser";
import type { ParseOptions, SorResult } from "sor-reader";

import styles from "./SorDropZone.module.css";

export interface SorDropZoneProps {
  multiple?: boolean;
  parseOptions?: ParseOptions;
  children?: ReactNode;
  onResult?: (result: SorResult) => void;
  onError?: (error: Error) => void;
}

async function parseFile(file: File, parseOptions?: ParseOptions): Promise<SorResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  return parseSor(bytes, file.name, parseOptions);
}

export function SorDropZone({ multiple = false, parseOptions, children, onResult, onError }: SorDropZoneProps): ReactElement {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragHover, setDragHover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const className = [
    styles.root,
    dragHover ? styles.hover : "",
    loading ? styles.loading : "",
    error ? styles.error : "",
  ]
    .filter(Boolean)
    .join(" ");

  const processFiles = async (files: FileList | File[]): Promise<void> => {
    if (!files || files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const selectedFiles = multiple ? Array.from(files) : [files[0]].filter((file): file is File => Boolean(file));
      for (const file of selectedFiles) {
        const result = await parseFile(file, parseOptions);
        onResult?.(result);
      }
    } catch (cause) {
      const resolved = cause instanceof Error ? cause : new Error("Failed to parse SOR file");
      setError(resolved.message);
      onError?.(resolved);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLLabelElement>): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <label
      className={className}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragHover(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setDragHover(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setDragHover(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragHover(false);
        void processFiles(event.dataTransfer.files);
      }}
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".sor"
        multiple={multiple}
        className={styles.input}
        onChange={(event) => {
          if (!event.currentTarget.files) return;
          void processFiles(event.currentTarget.files);
        }}
      />
      {children ?? <span>{loading ? "Parsing..." : "Drop .sor file here or click to select"}</span>}
      {error ? <p>{error}</p> : null}
    </label>
  );
}
