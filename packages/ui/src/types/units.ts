export type DistanceUnit = "km" | "m" | "mi" | "kft";

export const DISTANCE_CONVERSION_FACTORS: Record<DistanceUnit, number> = {
  km: 1,
  m: 1000,
  mi: 0.621371192237334,
  kft: 3.280839895013123,
};
