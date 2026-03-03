import type { TracePoint } from "sor-reader";

export function lttb(data: TracePoint[], targetCount: number): TracePoint[] {
  if (targetCount <= 0) return [];
  if (data.length <= targetCount) return data;
  const firstPoint = data[0];
  const lastPoint = data[data.length - 1];
  if (!firstPoint || !lastPoint) return [];
  if (targetCount === 1) return [firstPoint];
  if (targetCount === 2) return [firstPoint, lastPoint];

  const sampled: TracePoint[] = [firstPoint];
  const every = (data.length - 2) / (targetCount - 2);
  let a = 0;

  for (let i = 0; i < targetCount - 2; i += 1) {
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, data.length);

    let avgX = 0;
    let avgY = 0;
    let avgRangeLength = 0;

    for (let j = avgRangeStart; j < avgRangeEnd; j += 1) {
      const point = data[j];
      if (!point) continue;
      avgX += point.distance;
      avgY += point.power;
      avgRangeLength += 1;
    }

    if (avgRangeLength === 0) avgRangeLength = 1;
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeOffs = Math.floor(i * every) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * every) + 1, data.length - 1);

    const pointA = data[a];
    let maxArea = Number.NEGATIVE_INFINITY;
    let maxAreaIndex = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j += 1) {
      const point = data[j];
      if (!point || !pointA) continue;
      const area = Math.abs(
        (pointA.distance - avgX) * (point.power - pointA.power) -
          (pointA.distance - point.distance) * (avgY - pointA.power),
      );

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    const selectedPoint = data[maxAreaIndex];
    if (selectedPoint) {
      sampled.push(selectedPoint);
      a = maxAreaIndex;
    }
  }

  sampled.push(lastPoint);
  return sampled;
}
