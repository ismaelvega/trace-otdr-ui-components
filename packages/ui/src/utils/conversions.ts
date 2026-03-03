import { DISTANCE_CONVERSION_FACTORS, type DistanceUnit } from "../types/units.js";

const DISTANCE_LABELS: Record<DistanceUnit, string> = {
  km: "km",
  m: "m",
  mi: "miles",
  kft: "kft",
};

export function convertDistance(km: number, to: DistanceUnit): number {
  return km * DISTANCE_CONVERSION_FACTORS[to];
}

export function convertDistanceLabel(unit: DistanceUnit): string {
  return DISTANCE_LABELS[unit];
}
