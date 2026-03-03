import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type WheelEvent,
} from "react";
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
}

const HORIZONTAL_MARGIN_START = 30;
const HORIZONTAL_MARGIN_END = 30;
const HORIZONTAL_MIN_WIDTH = 680;
const HORIZONTAL_DEFAULT_WIDTH = 1000;
const HORIZONTAL_HEIGHT = 180;
const HORIZONTAL_BASELINE = 90;
const VERTICAL_START = 24;
const VERTICAL_LENGTH = 366;
const VERTICAL_BASELINE = 90;
const VERTICAL_VIEWBOX_WIDTH = 180;
const VERTICAL_VIEWBOX_HEIGHT = 420;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_FACTOR = 1.15;
const ROOT_HORIZONTAL_PADDING = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getHorizontalMapWidth(baseWidth: number, zoom: number): number {
  return Math.max(HORIZONTAL_MIN_WIDTH, Math.round(baseWidth * zoom));
}

function getHoverTagMetrics(
  item: PositionedEvent,
  isVertical: boolean,
  horizontalMapWidth: number,
): { x: number; y: number; width: number; textX: number; textY: number } {
  const label = `#${item.index + 1}`;
  const width = Math.max(34, label.length * 7 + 12);
  const height = 18;

  if (isVertical) {
    const x = clamp(item.x + 10, 8, VERTICAL_VIEWBOX_WIDTH - width - 8);
    const y = clamp(item.y - height - 6, 8, VERTICAL_VIEWBOX_HEIGHT - height - 8);
    return {
      x,
      y,
      width,
      textX: x + width / 2,
      textY: y + 12,
    };
  }

  const x = clamp(item.x - width / 2, 8, horizontalMapWidth - width - 8);
  const y = clamp(item.y - height - 8, 8, HORIZONTAL_HEIGHT - height - 8);
  return {
    x,
    y,
    width,
    textX: x + width / 2,
    textY: y + 12,
  };
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
  const containerRef = useRef<HTMLElement | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(MIN_ZOOM);
  const [baseHorizontalWidth, setBaseHorizontalWidth] = useState<number>(HORIZONTAL_DEFAULT_WIDTH);
  const isVertical = orientation === "vertical";

  useEffect(() => {
    setHoveredIndex(null);
    setZoomLevel(MIN_ZOOM);
    if (containerRef.current) {
      containerRef.current.scrollLeft = 0;
    }
  }, [events.length, isVertical]);

  useEffect(() => {
    if (isVertical) return;
    const node = containerRef.current;
    if (!node) return;

    const update = (): void => {
      const measured = Math.round(node.clientWidth - ROOT_HORIZONTAL_PADDING);
      if (!Number.isFinite(measured)) return;
      setBaseHorizontalWidth((current) => {
        const next = Math.max(HORIZONTAL_MIN_WIDTH, measured || HORIZONTAL_DEFAULT_WIDTH);
        return current === next ? current : next;
      });
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => update());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [isVertical]);

  const horizontalMapWidth = useMemo(
    () => getHorizontalMapWidth(baseHorizontalWidth, zoomLevel),
    [baseHorizontalWidth, zoomLevel],
  );

  const horizontalTrackLength = useMemo(
    () => Math.max(1, horizontalMapWidth - HORIZONTAL_MARGIN_START - HORIZONTAL_MARGIN_END),
    [horizontalMapWidth],
  );

  const prepared = useMemo(() => {
    const parsed = events.map((event, index) => ({
      event,
      index,
      distance: parseDistance(event.distance),
      type: classifyEvent(event),
    }));

    const maxDistance = Math.max(1, ...parsed.map((item) => item.distance));

    return parsed.map((item): PositionedEvent => {
      const ratio = item.distance / maxDistance;
      const x = isVertical
        ? VERTICAL_BASELINE
        : HORIZONTAL_MARGIN_START + ratio * horizontalTrackLength;
      const y = isVertical ? VERTICAL_START + ratio * VERTICAL_LENGTH : HORIZONTAL_BASELINE;
      return {
        ...item,
        ratio,
        x,
        y,
      };
    });
  }, [events, horizontalTrackLength, isVertical]);

  const hoveredEvent = useMemo(
    () => prepared.find((item) => item.index === hoveredIndex) ?? null,
    [hoveredIndex, prepared],
  );

  const updateZoom = useCallback(
    (zoomIn: boolean, viewportPointerX: number): void => {
      const container = containerRef.current;
      if (!container || isVertical) return;

      setZoomLevel((current) => {
        const next = clamp(current * (zoomIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR), MIN_ZOOM, MAX_ZOOM);
        if (next === current) return current;

        const oldWidth = getHorizontalMapWidth(baseHorizontalWidth, current);
        const newWidth = getHorizontalMapWidth(baseHorizontalWidth, next);
        const normalized = oldWidth > 0 ? (container.scrollLeft + viewportPointerX) / oldWidth : 0;
        const nextScroll = clamp(
          normalized * newWidth - viewportPointerX,
          0,
          Math.max(0, newWidth - container.clientWidth),
        );

        requestAnimationFrame(() => {
          const latestContainer = containerRef.current;
          if (!latestContainer) return;
          latestContainer.scrollLeft = nextScroll;
        });

        return next;
      });
    },
    [baseHorizontalWidth, isVertical],
  );

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLElement>): void => {
      if (isVertical || events.length === 0 || event.deltaY === 0) return;
      event.preventDefault();

      const node = containerRef.current;
      const rect = node?.getBoundingClientRect();
      const viewportPointerX = rect ? event.clientX - rect.left : 0;
      updateZoom(event.deltaY < 0, viewportPointerX);
    },
    [events.length, isVertical, updateZoom],
  );

  const hoverTagMetrics = hoveredEvent
    ? getHoverTagMetrics(hoveredEvent, isVertical, horizontalMapWidth)
    : null;

  const rootClassName = `${styles.root} ${isVertical ? styles.vertical : styles.horizontal}`;

  return (
    <section
      ref={containerRef}
      className={rootClassName}
      aria-label="Fiber map"
      onWheel={handleWheel}
    >
      {isVertical ? (
        <svg
          viewBox={`0 0 ${VERTICAL_VIEWBOX_WIDTH} ${VERTICAL_VIEWBOX_HEIGHT}`}
          className={styles.svg}
        >
          <line
            x1={VERTICAL_BASELINE}
            y1={VERTICAL_START}
            x2={VERTICAL_BASELINE}
            y2={VERTICAL_START + VERTICAL_LENGTH}
            className={styles.path}
          />
          <text x="90" y="16" textAnchor="middle" className={styles.label}>
            {locationA}
          </text>
          <text x="90" y="412" textAnchor="middle" className={styles.label}>
            {locationB}
          </text>

          {prepared.map((item) => {
            const selected = selectedEvent === item.index;
            const hovered = hoveredIndex === item.index;
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
                    markerRefs.current[Math.min(events.length - 1, item.index + 1)]?.focus();
                    return;
                  }

                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    markerRefs.current[Math.max(0, item.index - 1)]?.focus();
                  }
                }}
              >
                <circle cx={item.x} cy={item.y} r="7.5" className={markerClass} />
                <title>{`Event #${item.index + 1}`}</title>
              </g>
            );
          })}

          {hoveredEvent && hoverTagMetrics ? (
            <g className={styles.hoverTag} pointerEvents="none">
              <rect
                x={hoverTagMetrics.x}
                y={hoverTagMetrics.y}
                width={hoverTagMetrics.width}
                height="18"
                rx="8"
                ry="8"
              />
              <text
                x={hoverTagMetrics.textX}
                y={hoverTagMetrics.textY}
                textAnchor="middle"
                className={styles.hoverTagText}
              >
                #{hoveredEvent.index + 1}
              </text>
            </g>
          ) : null}
        </svg>
      ) : (
        <svg
          width={horizontalMapWidth}
          height={HORIZONTAL_HEIGHT}
          className={styles.svg}
          role="img"
          aria-label="Fiber map trace"
        >
          <line
            x1={HORIZONTAL_MARGIN_START}
            y1={HORIZONTAL_BASELINE}
            x2={HORIZONTAL_MARGIN_START + horizontalTrackLength}
            y2={HORIZONTAL_BASELINE}
            className={styles.path}
          />
          <text x={HORIZONTAL_MARGIN_START} y="74" textAnchor="start" className={styles.label}>
            {locationA}
          </text>
          <text
            x={HORIZONTAL_MARGIN_START + horizontalTrackLength}
            y="74"
            textAnchor="end"
            className={styles.label}
          >
            {locationB}
          </text>

          {prepared.map((item) => {
            const selected = selectedEvent === item.index;
            const hovered = hoveredIndex === item.index;
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
                    markerRefs.current[Math.min(events.length - 1, item.index + 1)]?.focus();
                    return;
                  }

                  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                    event.preventDefault();
                    markerRefs.current[Math.max(0, item.index - 1)]?.focus();
                  }
                }}
              >
                <circle cx={item.x} cy={item.y} r="7.5" className={markerClass} />
                <title>{`Event #${item.index + 1}`}</title>
              </g>
            );
          })}

          {hoveredEvent && hoverTagMetrics ? (
            <g className={styles.hoverTag} pointerEvents="none">
              <rect
                x={hoverTagMetrics.x}
                y={hoverTagMetrics.y}
                width={hoverTagMetrics.width}
                height="18"
                rx="8"
                ry="8"
              />
              <text
                x={hoverTagMetrics.textX}
                y={hoverTagMetrics.textY}
                textAnchor="middle"
                className={styles.hoverTagText}
              >
                #{hoveredEvent.index + 1}
              </text>
            </g>
          ) : null}
        </svg>
      )}
    </section>
  );
}
