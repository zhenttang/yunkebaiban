import {
  YUNKE_SCROLL_ANCHORING_WIDGET,
  YunkeScrollAnchoringWidget,
} from './scroll-anchoring.js';

export function effects() {
  customElements.define(
    YUNKE_SCROLL_ANCHORING_WIDGET,
    YunkeScrollAnchoringWidget
  );
}

declare global {
  interface HTMLElementTagNameMap {
    [YUNKE_SCROLL_ANCHORING_WIDGET]: YunkeScrollAnchoringWidget;
  }
}
