import {
  EventTable,
  FiberMap,
  SorDropZone,
  TraceChart,
  TraceSummary,
  TraceViewer,
  normalizeSorResult
} from "../chunk-7DEMIZ3T.js";

// src/web-components/index.ts
import { createElement as createElement2 } from "react";

// src/web-components/create-element.ts
import { createRoot } from "react-dom/client";
import { createElement } from "react";
var BASE_STYLES = `
:host { display: block; font-family: var(--otdr-font-family, "IBM Plex Sans", "Segoe UI", sans-serif); }
`;
function defineOtdrElement(tagName, Component, observedAttributes, propTransformers) {
  if (customElements.get(tagName)) {
    return;
  }
  class OtdrElement extends HTMLElement {
    static get observedAttributes() {
      return observedAttributes;
    }
    root = null;
    props = {};
    set data(value) {
      this.props.data = value;
      this.renderComponent();
    }
    connectedCallback() {
      if (!this.shadowRoot) {
        const shadowRoot = this.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent = BASE_STYLES;
        shadowRoot.appendChild(style);
        const container = document.createElement("div");
        shadowRoot.appendChild(container);
        this.root = createRoot(container);
      }
      this.syncAttributeProps();
      this.renderComponent();
    }
    disconnectedCallback() {
      this.root?.unmount();
      this.root = null;
    }
    attributeChangedCallback(name, _oldValue, newValue) {
      if (newValue === null) {
        delete this.props[name];
      } else {
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(newValue) : newValue;
      }
      this.renderComponent();
    }
    syncAttributeProps() {
      for (const name of observedAttributes) {
        const value = this.getAttribute(name);
        if (value === null) continue;
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(value) : value;
      }
    }
    renderComponent() {
      if (!this.root) return;
      const props = { ...this.props, host: this };
      this.root.render(createElement(Component, props));
    }
  }
  customElements.define(tagName, OtdrElement);
}

// src/web-components/index.ts
function asNumber(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function TraceChartElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return createElement2(TraceChart, {
    trace: normalized?.trace ?? [],
    events: normalized?.keyEvents.events ?? [],
    width: props.width ?? "auto",
    height: props.height ?? 360
  });
}
function EventTableElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return createElement2(EventTable, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: ""
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function FiberMapElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return createElement2(FiberMap, {
    events: normalized?.keyEvents.events ?? [],
    locationA: normalized?.genParams.locationA,
    locationB: normalized?.genParams.locationB
  });
}
function TraceSummaryElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return createElement2(TraceSummary, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: ""
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function TraceViewerElement(props) {
  const normalized = props.data ? normalizeSorResult(props.data) : null;
  return createElement2(TraceViewer, {
    result: normalized ?? {
      filename: "",
      format: 2,
      version: "",
      mapBlock: { nbytes: 0, nblocks: 0 },
      blocks: {},
      genParams: {
        language: "",
        cableId: "",
        fiberId: "",
        wavelength: "",
        locationA: "",
        locationB: "",
        cableCode: "",
        buildCondition: "",
        userOffset: "",
        operator: "",
        comments: ""
      },
      supParams: {
        supplier: "",
        otdr: "",
        otdrSerialNumber: "",
        module: "",
        moduleSerialNumber: "",
        software: "",
        other: ""
      },
      fxdParams: {
        dateTime: "",
        dateTimeRaw: 0,
        unit: "",
        wavelength: "",
        acquisitionOffset: 0,
        pulseWidthEntries: 0,
        pulseWidth: "",
        sampleSpacing: 0,
        numDataPoints: 0,
        indexOfRefraction: 0,
        backscatterCoeff: "",
        numAverages: 0,
        range: 0,
        resolution: 0,
        frontPanelOffset: 0,
        noiseFloorLevel: 0,
        noiseFloorScalingFactor: 0,
        powerOffsetFirstPoint: 0,
        lossThreshold: "",
        reflThreshold: "",
        eotThreshold: ""
      },
      keyEvents: {
        numEvents: 0,
        events: [],
        summary: {
          totalLoss: 0,
          orl: 0,
          lossStart: 0,
          lossEnd: 0,
          orlStart: 0,
          orlFinish: 0
        }
      },
      dataPts: {
        numDataPoints: 0,
        numTraces: 0,
        scalingFactor: 0,
        maxBeforeOffset: 0,
        minBeforeOffset: 0
      },
      checksum: {
        stored: 0,
        calculated: 0,
        valid: true
      },
      trace: []
    }
  });
}
function DropZoneElement(props) {
  void props.data;
  return createElement2(SorDropZone, {
    onResult: (result) => {
      props.host?.dispatchEvent(new CustomEvent("result", { detail: result }));
    },
    onError: (error) => {
      props.host?.dispatchEvent(new CustomEvent("error", { detail: error }));
    }
  });
}
defineOtdrElement("otdr-trace-chart", TraceChartElement, ["width", "height"], {
  width: (attr) => attr === "auto" ? "auto" : asNumber(attr),
  height: (attr) => asNumber(attr)
});
defineOtdrElement("otdr-event-table", EventTableElement, [], {});
defineOtdrElement("otdr-fiber-map", FiberMapElement, [], {});
defineOtdrElement("otdr-trace-summary", TraceSummaryElement, [], {});
defineOtdrElement("otdr-trace-viewer", TraceViewerElement, [], {});
defineOtdrElement("otdr-drop-zone", DropZoneElement, [], {});
//# sourceMappingURL=index.js.map