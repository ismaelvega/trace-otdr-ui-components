import type { DistanceUnit } from "../types/units.js";
import { convertDistance, convertDistanceLabel } from "./conversions.js";

const DISTANCE_PRECISION: Record<DistanceUnit, number> = {
  km: 3,
  m: 1,
  mi: 3,
  kft: 3,
};

function normalizeNegativeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function formatFixed(value: number, precision: number): string {
  const normalized = normalizeNegativeZero(value);
  return normalized.toFixed(precision);
}

export function formatDistance(valueKm: number, unit: DistanceUnit, precision?: number): string {
  const converted = convertDistance(valueKm, unit);
  const decimals = precision ?? DISTANCE_PRECISION[unit];
  return `${formatFixed(converted, decimals)} ${convertDistanceLabel(unit)}`;
}

export function formatPower(dB: number, precision = 3): string {
  return `${formatFixed(dB, precision)} dB`;
}

export function formatSlope(dBkm: number, precision = 3): string {
  return `${formatFixed(dBkm, precision)} dB/km`;
}

export function formatWavelength(nm: string): string {
  const trimmed = nm.trim();
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)\s*nm$/i);
  if (!match) return trimmed;
  const numericPart = match[1];
  if (!numericPart) return trimmed;

  const value = Number.parseFloat(numericPart);
  if (!Number.isFinite(value)) return trimmed;

  return `${value % 1 === 0 ? value.toFixed(0) : value.toString()} nm`;
}

export function formatDateTime(raw: string): string {
  const timestampMatch = raw.match(/\((\d+)\s+sec\)/);
  const secondsPart = timestampMatch?.[1];
  const unixSeconds = secondsPart ? Number.parseInt(secondsPart, 10) : Number.NaN;

  if (Number.isFinite(unixSeconds)) {
    return new Date(unixSeconds * 1000).toLocaleString(undefined, { timeZone: "UTC" });
  }

  const parsed = Date.parse(raw);
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toLocaleString();
  }

  return raw.trim();
}
