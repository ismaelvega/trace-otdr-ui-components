import { useMemo, useRef, type ReactElement } from "react";
import type { KeyEvent } from "sor-reader";

import { classifyEvent } from "../utils/classifiers.js";
import styles from "./FiberMap.module.css";

export interface FiberMapProps {
  events: KeyEvent[];
  locationA?: string | undefined;
  locationB?: string | undefined;
  selectedEvent?: number | null;
  orientation?: "horizontal" | "vertical";
  onEventClick?: (event: KeyEvent, index: number) => void;
}

function parseDistance(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function markerColor(type: string): string {
  if (type === "reflection") return "#b91c1c";
  if (type === "end-of-fiber") return "#111827";
  if (type === "connector") return "#1d4ed8";
  if (type === "manual") return "#a16207";
  if (type === "loss") return "#0f766e";
  return "#64748b";
}

export function FiberMap({
  events,
  locationA = "A",
  locationB = "B",
  selectedEvent = null,
  orientation = "horizontal",
  onEventClick,
}: FiberMapProps): ReactElement {
  const markerRefs = useRef<Array<SVGGElement | null>>([]);

  const prepared = useMemo(() => {
    const parsed = events.map((event, index) => ({
      event,
      index,
      distance: parseDistance(event.distance),
      type: classifyEvent(event),
    }));

    const maxDistance = Math.max(1, ...parsed.map((item) => item.distance));

    return parsed.map((item) => ({
      ...item,
      ratio: item.distance / maxDistance,
    }));
  }, [events]);

  const isVertical = orientation === "vertical";

  return (
    <section className={styles.root} aria-label="Fiber map">
      <svg viewBox={isVertical ? "0 0 180 420" : "0 0 1000 180"} className={styles.svg}>
        {isVertical ? (
          <>
            <line x1="90" y1="24" x2="90" y2="390" stroke="#334155" strokeWidth="2" />
            <text x="90" y="16" textAnchor="middle" className={styles.label}>
              {locationA}
            </text>
            <text x="90" y="412" textAnchor="middle" className={styles.label}>
              {locationB}
            </text>
          </>
        ) : (
          <>
            <line x1="30" y1="90" x2="970" y2="90" stroke="#334155" strokeWidth="2" />
            <text x="30" y="74" textAnchor="start" className={styles.label}>
              {locationA}
            </text>
            <text x="970" y="74" textAnchor="end" className={styles.label}>
              {locationB}
            </text>
          </>
        )}

        {prepared.map((item) => {
          const x = isVertical ? 90 : 30 + item.ratio * 940;
          const y = isVertical ? 24 + item.ratio * 366 : 90;
          const selected = selectedEvent === item.index;

          return (
            <g
              key={`map-event-${item.index}`}
              ref={(node) => {
                markerRefs.current[item.index] = node;
              }}
              className={styles.event}
              onClick={() => onEventClick?.(item.event, item.index)}
              aria-label={`Event ${item.index + 1}`}
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onEventClick?.(item.event, item.index);
                  return;
                }

                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  markerRefs.current[item.index + 1]?.focus();
                  return;
                }

                if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  markerRefs.current[Math.max(0, item.index - 1)]?.focus();
                }
              }}
            >
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={markerColor(item.type)}
                className={selected ? styles.selected : undefined}
              />
              <text x={isVertical ? x + 14 : x} y={isVertical ? y + 4 : y - 14} textAnchor={isVertical ? "start" : "middle"} className={styles.label}>
                #{item.index + 1}
              </text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}
