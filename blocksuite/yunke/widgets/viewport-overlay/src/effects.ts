import {
  YUNKE_VIEWPORT_OVERLAY_WIDGET,
  YunkeViewportOverlayWidget,
} from './index';

export function effects() {
  customElements.define(
    YUNKE_VIEWPORT_OVERLAY_WIDGET,
    YunkeViewportOverlayWidget
  );
}
