export interface EventTableExportRow {
  index: number;
  distance: string;
  type: string;
  spliceLoss: string;
  reflLoss: string;
  slope: string;
  status: string;
}

const EVENT_TABLE_HEADERS = ["#", "Distance", "Type", "Splice Loss", "Refl. Loss", "Slope", "Status"] as const;

type Delimiter = "," | "\t";

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) {
    return value;
  }

  return `"${value.replaceAll('"', '""')}"`;
}

function stringifyCell(value: string | number): string {
  return String(value);
}

function serializeEventRows(rows: EventTableExportRow[], delimiter: Delimiter): string {
  const serializeCell = delimiter === "," ? escapeCsvCell : (value: string) => value;
  const lines: string[] = [];

  lines.push(EVENT_TABLE_HEADERS.join(delimiter));

  for (const row of rows) {
    const values = [
      row.index,
      row.distance,
      row.type,
      row.spliceLoss,
      row.reflLoss,
      row.slope,
      row.status,
    ].map((value) => serializeCell(stringifyCell(value)));
    lines.push(values.join(delimiter));
  }

  return `${lines.join("\n")}\n`;
}

export function serializeEventsAsTsv(rows: EventTableExportRow[]): string {
  return serializeEventRows(rows, "\t");
}

export function serializeEventsAsCsv(rows: EventTableExportRow[]): string {
  return serializeEventRows(rows, ",");
}

export function downloadBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") {
    throw new Error("downloadBlob requires DOM + URL.createObjectURL support");
  }

  const anchor = document.createElement("a");
  const url = URL.createObjectURL(blob);

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function downloadTextFile(
  content: string,
  filename: string,
  mimeType = "text/plain;charset=utf-8",
): void {
  const blob = new Blob([content], { type: mimeType });
  downloadBlob(blob, filename);
}

function sanitizeBaseName(baseName: string): string {
  const normalized = baseName.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  return normalized.length > 0 ? normalized : "export";
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function buildTimestampedFilename(baseName: string, extension: string, date = new Date()): string {
  const safeBase = sanitizeBaseName(baseName);
  const safeExtension = extension.replace(/^\./, "");
  const stamp = [
    date.getFullYear().toString(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("");
  const time = [pad2(date.getHours()), pad2(date.getMinutes()), pad2(date.getSeconds())].join("");

  return `${safeBase}-${stamp}-${time}.${safeExtension}`;
}
