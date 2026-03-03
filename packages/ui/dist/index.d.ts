import { TracePoint, KeyEvent, KeyEventsSummary, KeyEvents, SorResult, SorData, ParseOptions, GenParams, SupParams, FxdParams } from 'sor-reader';
export * from 'sor-reader';
import * as react from 'react';
import { ReactElement, ReactNode, RefObject } from 'react';

interface EventThresholds {
    spliceLoss?: {
        warn: number;
        fail: number;
    };
    reflLoss?: {
        warn: number;
        fail: number;
    };
    slope?: {
        warn: number;
        fail: number;
    };
}
interface SummaryThresholds {
    totalLoss?: {
        fail: number;
    };
    orl?: {
        fail: number;
    };
    fiberLength?: {
        max: number;
    };
}
interface AllThresholds {
    event: EventThresholds;
    summary: SummaryThresholds;
}

type DistanceUnit = "km" | "m" | "mi" | "kft";
declare const DISTANCE_CONVERSION_FACTORS: Record<DistanceUnit, number>;

type EventCategory = "reflection" | "loss" | "connector" | "end-of-fiber" | "manual" | "unknown";

interface ViewportRange {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
}
interface TraceOverlay {
    trace: TracePoint[];
    label: string;
    color: string;
}

declare function convertDistance(km: number, to: DistanceUnit): number;
declare function convertDistanceLabel(unit: DistanceUnit): string;

declare function formatDistance(valueKm: number, unit: DistanceUnit, precision?: number): string;
declare function formatPower(dB: number, precision?: number): string;
declare function formatSlope(dBkm: number, precision?: number): string;
declare function formatWavelength(nm: string): string;
declare function formatDateTime(raw: string): string;

type AssessmentStatus = "pass" | "warn" | "fail";
declare function classifyEvent(event: KeyEvent): EventCategory;
declare function assessEvent(event: KeyEvent, thresholds: EventThresholds): AssessmentStatus;
declare function assessSummary(summary: KeyEventsSummary, thresholds: SummaryThresholds): AssessmentStatus;

interface LossBudget {
    totalSpliceLoss: number;
    totalReflLoss: number;
    avgSpliceLoss: number;
    maxSpliceLoss: number;
    eventCount: number;
    spanLengths: number[];
}
declare function computeLossBudget(events: KeyEvents): LossBudget;

declare function lttb(data: TracePoint[], targetCount: number): TracePoint[];

declare function normalizeSorResult(result: SorResult | SorData): SorData;

interface CanvasHandle {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    resize: (width: number, height: number) => void;
    dispose: () => void;
}
interface CreateCanvasOptions {
    autoResize?: boolean;
}
declare function getDevicePixelRatio(): number;
declare function configureHiDpiCanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, width: number, height: number, dpr?: number): {
    dpr: number;
    pixelWidth: number;
    pixelHeight: number;
};
declare function createCanvas(container: HTMLElement, width: number, height: number, options?: CreateCanvasOptions): CanvasHandle;

interface CanvasRect {
    width: number;
    height: number;
}
interface PlotRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
}
declare const MARGIN: {
    readonly top: 20;
    readonly right: 20;
    readonly bottom: 50;
    readonly left: 70;
};
declare function getPlotRect(canvasRect: CanvasRect): PlotRect;
declare function dataToPixel(dataX: number, dataY: number, viewport: ViewportRange, canvasRect: CanvasRect): {
    px: number;
    py: number;
};
declare function pixelToData(px: number, py: number, viewport: ViewportRange, canvasRect: CanvasRect): {
    dataX: number;
    dataY: number;
};
declare function computeViewport(trace: TracePoint[], padding?: number): ViewportRange;
declare function clampViewport(viewport: ViewportRange, dataBounds: ViewportRange): ViewportRange;

interface AxisStyle {
    axisColor?: string;
    gridColor?: string;
    labelColor?: string;
    font?: string;
}
declare function drawXAxis(ctx: CanvasRenderingContext2D, viewport: ViewportRange, canvasRect: CanvasRect, unit: DistanceUnit, style?: AxisStyle): void;
declare function drawYAxis(ctx: CanvasRenderingContext2D, viewport: ViewportRange, canvasRect: CanvasRect, style?: AxisStyle): void;

interface TraceStyle {
    color: string;
    lineWidth?: number;
    opacity?: number;
}
declare function drawTrace(ctx: CanvasRenderingContext2D, trace: TracePoint[], viewport: ViewportRange, canvasRect: CanvasRect, style: TraceStyle): void;
declare function drawTraceOverlays(ctx: CanvasRenderingContext2D, overlays: TraceOverlay[], viewport: ViewportRange, canvasRect: CanvasRect): void;

interface CrosshairState {
    point: TracePoint;
    index: number;
    px: number;
    py: number;
    label: string;
}
declare function findNearestTracePointIndex(trace: TracePoint[], distanceKm: number): number;
declare function resolveCrosshairState(trace: TracePoint[], pointerPx: number, pointerPy: number, viewport: ViewportRange, canvasRect: CanvasRect, unit: DistanceUnit): CrosshairState | null;
declare function drawCrosshair(ctx: CanvasRenderingContext2D, state: CrosshairState, canvasRect: CanvasRect, style?: {
    lineColor?: string;
    textColor?: string;
    labelBackground?: string;
}): void;

interface RenderContext {
    ctx: CanvasRenderingContext2D;
    canvasRect: CanvasRect;
    viewport: ViewportRange;
    overlays: TraceOverlay[];
    unit: DistanceUnit;
    hoverPoint?: TracePoint | null;
    crosshair?: CrosshairState | null;
    clearColor?: string;
    drawEventMarkers?: () => void;
    drawCrosshair?: () => void;
    axisStyle?: {
        axisColor?: string;
        gridColor?: string;
        labelColor?: string;
        font?: string;
    };
    crosshairStyle?: {
        lineColor?: string;
        textColor?: string;
        labelBackground?: string;
    };
}
interface RenderScheduler {
    scheduleRender: () => void;
    markDirty: () => void;
    isDirty: () => boolean;
    cancel: () => void;
}
declare function renderFrame(context: RenderContext): void;
declare function createRenderScheduler(render: () => void): RenderScheduler;

type ZoomAxis = "both" | "x" | "y";
interface ZoomOptions {
    minSpanX?: number;
    minSpanY?: number;
}
declare function getZoomAxisFromModifiers(modifiers: {
    shiftKey?: boolean;
    ctrlKey?: boolean;
}): ZoomAxis;
declare function zoomViewportAtPixel(viewport: ViewportRange, dataBounds: ViewportRange, cursorPx: number, cursorPy: number, canvasRect: CanvasRect, zoomFactor: number, axis?: ZoomAxis, options?: ZoomOptions): ViewportRange;
declare function panViewportByPixels(viewport: ViewportRange, dataBounds: ViewportRange, deltaPx: number, deltaPy: number, canvasRect: CanvasRect): ViewportRange;

interface EventMarker {
    index: number;
    event: KeyEvent;
    category: EventCategory;
    distance: number;
    power: number;
    px: number;
    py: number;
}
declare function computeEventMarkers(events: KeyEvent[], trace: TracePoint[], viewport: ViewportRange, canvasRect: CanvasRect): EventMarker[];
declare function drawEventMarkers(ctx: CanvasRenderingContext2D, markers: EventMarker[], canvasRect: CanvasRect, selectedIndex?: number | null): void;
declare function hitTestEventMarkers(markers: EventMarker[], px: number, py: number, hitRadius?: number): number | null;
declare function formatEventTooltip(marker: EventMarker, unit: DistanceUnit): string;

interface TraceChartProps {
    trace: TracePoint[];
    events?: KeyEvent[];
    overlays?: TraceOverlay[];
    viewport?: ViewportRange;
    width?: number | "auto";
    height?: number;
    xUnit?: DistanceUnit;
    selectedEvent?: number | null;
    className?: string;
    onPointHover?: (point: TracePoint, index: number) => void;
    onEventClick?: (event: KeyEvent, index: number) => void;
    onZoomChange?: (viewport: ViewportRange) => void;
}
declare function TraceChart({ trace, events, overlays, viewport: controlledViewport, width, height, xUnit, selectedEvent, className, onPointHover, onEventClick, onZoomChange, }: TraceChartProps): ReactElement;

interface TraceSummaryProps {
    result: SorResult | SorData;
    thresholds?: SummaryThresholds | undefined;
    xUnit?: "km" | "m" | "mi" | "kft";
}
declare function TraceSummary({ result, thresholds, xUnit }: TraceSummaryProps): ReactElement;

interface EventTableProps {
    result: SorResult | SorData;
    compact?: boolean;
    xUnit?: DistanceUnit;
    thresholds?: EventThresholds | undefined;
    selectedEvent?: number | null;
    onEventSelect?: (event: KeyEvent | null, index: number | null) => void;
}
declare function EventTable({ result, compact, xUnit, thresholds, selectedEvent, onEventSelect, }: EventTableProps): ReactElement;

interface LossBudgetChartProps {
    events: KeyEvent[];
    thresholds?: EventThresholds | undefined;
    selectedEvent?: number | null;
    onBarClick?: (event: KeyEvent, index: number) => void;
    vertical?: boolean;
}
declare function LossBudgetChart({ events, thresholds, selectedEvent, onBarClick, vertical, }: LossBudgetChartProps): ReactElement;

interface FiberMapProps {
    events: KeyEvent[];
    locationA?: string | undefined;
    locationB?: string | undefined;
    selectedEvent?: number | null;
    orientation?: "horizontal" | "vertical";
    onEventClick?: (event: KeyEvent, index: number) => void;
}
declare function FiberMap({ events, locationA, locationB, selectedEvent, orientation, onEventClick, }: FiberMapProps): ReactElement;

interface SorDropZoneProps {
    multiple?: boolean;
    parseOptions?: ParseOptions;
    children?: ReactNode;
    onResult?: (result: SorResult) => void;
    onError?: (error: Error) => void;
}
declare function SorDropZone({ multiple, parseOptions, children, onResult, onError }: SorDropZoneProps): ReactElement;

interface TraceViewerHandle {
    zoomToEvent: (index: number) => void;
    resetZoom: () => void;
    exportImage: () => Promise<Blob>;
}
type SectionName = "summary" | "chart" | "fiberMap" | "eventTable" | "lossBudget" | "fiberInfo" | "equipment" | "measurement";
interface TraceViewerProps {
    result: SorResult | SorData;
    thresholds?: AllThresholds | undefined;
    xUnit?: DistanceUnit;
    layout?: "full" | "compact";
    sections?: SectionName[];
    onEventSelect?: (index: number | null) => void;
    showPrintButton?: boolean;
}
declare const TraceViewer: react.ForwardRefExoticComponent<TraceViewerProps & react.RefAttributes<TraceViewerHandle>>;

interface TraceComparisonItem {
    label: string;
    result: SorResult | SorData;
    color?: string;
}
interface TraceComparisonProps {
    traces: TraceComparisonItem[];
    mode?: "overlay" | "side-by-side" | "difference";
    syncZoom?: boolean;
}
declare function TraceComparison({ traces, mode, syncZoom }: TraceComparisonProps): ReactElement;

interface TraceReportProps {
    result: SorResult | SorData;
    companyName?: string;
    companyLogo?: string;
    technician?: string;
    notes?: string;
}
declare function TraceReport({ result, companyName, companyLogo, technician, notes, }: TraceReportProps): ReactElement;

interface PrintButtonProps {
    label?: string;
}
declare function PrintButton({ label }: PrintButtonProps): ReactElement;

type StatusBadgeState = "pass" | "warn" | "fail" | "neutral";
interface StatusBadgeProps {
    status: StatusBadgeState;
    label?: string;
}
declare function StatusBadge({ status, label }: StatusBadgeProps): ReactElement;

interface InfoEntry {
    label: string;
    value: string;
}
interface InfoPanelProps {
    title: string;
    entries: InfoEntry[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
}
declare function InfoPanel({ title, entries, collapsible, defaultExpanded }: InfoPanelProps): ReactElement;

interface FiberInfoPanelProps {
    genParams: GenParams;
}
declare function FiberInfoPanel({ genParams }: FiberInfoPanelProps): ReactElement;

interface EquipmentInfoPanelProps {
    supParams: SupParams;
}
declare function EquipmentInfoPanel({ supParams }: EquipmentInfoPanelProps): ReactElement;

interface MeasurementInfoPanelProps {
    fxdParams: FxdParams;
}
declare function MeasurementInfoPanel({ fxdParams }: MeasurementInfoPanelProps): ReactElement;

declare function useZoomPan(canvasRef: RefObject<HTMLCanvasElement>, dataBounds: ViewportRange): {
    viewport: ViewportRange;
    setViewport: (next: ViewportRange) => void;
    resetViewport: () => void;
    zoomTo: (xRange: [number, number], yRange?: [number, number]) => void;
};

interface EventSelectionState {
    selectedIndex: number | null;
    select: (index: number | null) => void;
}
declare function EventSelectionProvider({ children }: {
    children: ReactNode;
}): ReactElement;
declare function useEventSelection(): EventSelectionState;

declare function useTraceData(source: File | Uint8Array | null, options?: ParseOptions): {
    result: SorResult | null;
    loading: boolean;
    error: Error | null;
};

declare function useThresholds(defaults?: Partial<AllThresholds>): {
    thresholds: AllThresholds;
    updateThresholds: (partial: Partial<AllThresholds>) => void;
    resetThresholds: () => void;
};

interface TraceImageOptions {
    width?: number;
    height?: number;
    mimeType?: string;
}
declare function traceToImageBlob(trace: TracePoint[], options?: TraceImageOptions): Promise<Blob>;
declare function traceToImageURL(trace: TracePoint[], options?: TraceImageOptions): Promise<string>;

export { type AllThresholds, type AssessmentStatus, type CanvasHandle, type CanvasRect, type CreateCanvasOptions, type CrosshairState, DISTANCE_CONVERSION_FACTORS, type DistanceUnit, EquipmentInfoPanel, type EquipmentInfoPanelProps, type EventCategory, type EventMarker, EventSelectionProvider, EventTable, type EventTableProps, type EventThresholds, FiberInfoPanel, type FiberInfoPanelProps, FiberMap, type FiberMapProps, type InfoEntry, InfoPanel, type InfoPanelProps, type LossBudget, LossBudgetChart, type LossBudgetChartProps, MARGIN, MeasurementInfoPanel, type MeasurementInfoPanelProps, type PlotRect, PrintButton, type PrintButtonProps, type RenderContext, type RenderScheduler, SorDropZone, type SorDropZoneProps, StatusBadge, type StatusBadgeProps, type StatusBadgeState, type SummaryThresholds, TraceChart, type TraceChartProps, TraceComparison, type TraceComparisonItem, type TraceComparisonProps, type TraceImageOptions, type TraceOverlay, TraceReport, type TraceReportProps, type TraceStyle, TraceSummary, type TraceSummaryProps, TraceViewer, type TraceViewerHandle, type TraceViewerProps, type ViewportRange, type ZoomAxis, type ZoomOptions, assessEvent, assessSummary, clampViewport, classifyEvent, computeEventMarkers, computeLossBudget, computeViewport, configureHiDpiCanvas, convertDistance, convertDistanceLabel, createCanvas, createRenderScheduler, dataToPixel, drawCrosshair, drawEventMarkers, drawTrace, drawTraceOverlays, drawXAxis, drawYAxis, findNearestTracePointIndex, formatDateTime, formatDistance, formatEventTooltip, formatPower, formatSlope, formatWavelength, getDevicePixelRatio, getPlotRect, getZoomAxisFromModifiers, hitTestEventMarkers, lttb, normalizeSorResult, panViewportByPixels, pixelToData, renderFrame, resolveCrosshairState, traceToImageBlob, traceToImageURL, useEventSelection, useThresholds, useTraceData, useZoomPan, zoomViewportAtPixel };
