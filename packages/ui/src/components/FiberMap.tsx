import { useMemo, useRef, useState, type ReactElement } from "react";
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

interface PositionedEvent {
  event: KeyEvent;
  index: number;
  distance: number;
  type: string;
  ratio: number;
  x: number;
  y: number;
  labelVisible: boolean;
  labelLane: 0 | 1;
  clusterCount: number;
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isVertical = orientation === "vertical";

  const prepared = useMemo(() => {
    const parsed = events.map((event, index) => ({
      event,
      index,
      distance: parseDistance(event.distance),
      type: classifyEvent(event),
    }));

    const maxDistance = Math.max(1, ...parsed.map((item) => item.distance));

    const positioned = parsed.map((item, order): PositionedEvent => {
      const ratio = item.distance / maxDistance;
      const x = isVertical ? 90 : 30 + ratio * 940;
      const y = isVertical ? 24 + ratio * 366 : 90;
      return {
        ...item,
        ratio,
        x,
        y,
        labelVisible: false,
        labelLane: (order % 2 === 0 ? 0 : 1) as 0 | 1,
        clusterCount: 0,
      };
    });

    const clusterCounts = new Map<number, number>();
    let lastVisiblePos = Number.NEGATIVE_INFINITY;
    let lastVisibleIndex: number | null = null;
    const baseGap = isVertical ? 24 : 20;
    const densityBoost = positioned.length > 36 ? 8 : positioned.length > 20 ? 4 : 0;
    const minGap = baseGap + densityBoost;

    positioned.forEach((item, order) => {
      const isPriority = item.index === selectedEvent || item.index === hoveredIndex;
      const position = isVertical ? item.y : item.x;
      const enoughSpace = position - lastVisiblePos >= minGap;
      const labelVisible = isPriority || enoughSpace;

      item.labelVisible = labelVisible;
      item.labelLane = (order % 2 === 0 ? 0 : 1) as 0 | 1;

      if (labelVisible) {
        lastVisiblePos = position;
        lastVisibleIndex = item.index;
      } else if (lastVisibleIndex !== null) {
        clusterCounts.set(lastVisibleIndex, (clusterCounts.get(lastVisibleIndex) ?? 0) + 1);
      }
    });

    positioned.forEach((item) => {
      item.clusterCount = clusterCounts.get(item.index) ?? 0;
    });

    return positioned;
  }, [events, hoveredIndex, isVertical, selectedEvent]);

  return (
    <section className={`${styles.root} ${isVertical ? styles.vertical : ""}`} aria-label="Fiber map">
      <svg viewBox={isVertical ? "0 0 180 420" : "0 0 1000 180"} className={styles.svg}>
        {isVertical ? (
          <>
            <line x1="90" y1="24" x2="90" y2="390" className={styles.path} />
            <text x="90" y="16" textAnchor="middle" className={styles.label}>
              {locationA}
            </text>
            <text x="90" y="412" textAnchor="middle" className={styles.label}>
              {locationB}
            </text>
          </>
        ) : (
          <>
            <line x1="30" y1="90" x2="970" y2="90" className={styles.path} />
            <text x="30" y="74" textAnchor="start" className={styles.label}>
              {locationA}
            </text>
            <text x="970" y="74" textAnchor="end" className={styles.label}>
              {locationB}
            </text>
          </>
        )}

        {prepared.map((item) => {
          const x = item.x;
          const y = item.y;
          const selected = selectedEvent === item.index;
          const hovered = hoveredIndex === item.index;
          const labelX = isVertical ? x + (item.labelLane === 0 ? 14 : -14) : x;
          const labelY = isVertical ? y + 4 : y + (item.labelLane === 0 ? -16 : 22);
          const labelAnchor = isVertical ? (item.labelLane === 0 ? "start" : "end") : "middle";
          const connectorX = isVertical ? x + (item.labelLane === 0 ? 10 : -10) : x;
          const connectorY = isVertical ? y : y + (item.labelLane === 0 ? -12 : 12);
          const markerClass = [
            styles.marker,
            styles[item.type] ?? styles.unknown,
            selected ? styles.selected : "",
            hovered ? styles.hovered : "",
          ]
            .filter(Boolean)
            .join(" ");

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
              onMouseEnter={() => setHoveredIndex(item.index)}
              onMouseLeave={() => setHoveredIndex((current) => (current === item.index ? null : current))}
              onFocus={() => setHoveredIndex(item.index)}
              onBlur={() => setHoveredIndex((current) => (current === item.index ? null : current))}
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
              <circle cx={x} cy={y} r="7.5" className={markerClass} />
              {item.labelVisible ? <line x1={x} y1={y} x2={connectorX} y2={connectorY} className={styles.labelConnector} /> : null}
              {item.labelVisible ? (
                <text x={labelX} y={labelY} textAnchor={labelAnchor} className={`${styles.label} ${styles.eventLabel}`}>
                  #{item.index + 1}
                </text>
              ) : null}
              {item.clusterCount > 0 ? (
                <g className={styles.cluster}>
                  <rect
                    x={isVertical ? labelX + (item.labelLane === 0 ? 4 : -30) : x + 8}
                    y={isVertical ? labelY - 9 : labelY - (item.labelLane === 0 ? 20 : 6)}
                    width="22"
                    height="12"
                    rx="6"
                    ry="6"
                  />
                  <text
                    x={isVertical ? labelX + (item.labelLane === 0 ? 15 : -19) : x + 19}
                    y={isVertical ? labelY : labelY - (item.labelLane === 0 ? 10 : -4)}
                    textAnchor="middle"
                    className={styles.clusterText}
                  >
                    +{item.clusterCount}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </section>
  );
}
