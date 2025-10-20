import { YUNKE_TOOLBAR_WIDGET, YunkeToolbarWidget } from './toolbar';

export function effects() {
  customElements.define(YUNKE_TOOLBAR_WIDGET, YunkeToolbarWidget);
}

declare global {
  interface HTMLElementTagNameMap {
    [YUNKE_TOOLBAR_WIDGET]: YunkeToolbarWidget;
  }
}
