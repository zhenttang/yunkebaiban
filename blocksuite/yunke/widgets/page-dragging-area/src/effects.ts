import {
  YUNKE_PAGE_DRAGGING_AREA_WIDGET,
  YunkePageDraggingAreaWidget,
} from './index';

export function effects() {
  customElements.define(
    YUNKE_PAGE_DRAGGING_AREA_WIDGET,
    YunkePageDraggingAreaWidget
  );
}
