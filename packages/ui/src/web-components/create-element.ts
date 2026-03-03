import { createRoot, type Root } from "react-dom/client";
import { createElement, type ComponentType, type ReactElement } from "react";

const BASE_STYLES = `
:host { display: block; font-family: var(--otdr-font-family, "IBM Plex Sans", "Segoe UI", sans-serif); }
`;

export function defineOtdrElement<P extends object>(
  tagName: string,
  Component: ComponentType<P>,
  observedAttributes: string[],
  propTransformers: Record<string, (attr: string) => unknown>,
): void {
  if (customElements.get(tagName)) {
    return;
  }

  class OtdrElement extends HTMLElement {
    public static get observedAttributes(): string[] {
      return observedAttributes;
    }

    private root: Root | null = null;

    private props: Record<string, unknown> = {};

    public set data(value: unknown) {
      this.props.data = value;
      this.renderComponent();
    }

    public connectedCallback(): void {
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

    public disconnectedCallback(): void {
      this.root?.unmount();
      this.root = null;
    }

    public attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
      if (newValue === null) {
        delete this.props[name];
      } else {
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(newValue) : newValue;
      }

      this.renderComponent();
    }

    private syncAttributeProps(): void {
      for (const name of observedAttributes) {
        const value = this.getAttribute(name);
        if (value === null) continue;
        const transform = propTransformers[name];
        this.props[name] = transform ? transform(value) : value;
      }
    }

    private renderComponent(): void {
      if (!this.root) return;

      const props = { ...(this.props as P), host: this } as P;
      this.root.render(createElement(Component, props) as ReactElement);
    }
  }

  customElements.define(tagName, OtdrElement);
}
