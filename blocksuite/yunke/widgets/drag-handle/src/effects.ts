import {
  EDGELESS_DND_PREVIEW_ELEMENT,
  EdgelessDndPreviewElement,
} from './components/edgeless-preview/preview';
import { YUNKE_DRAG_HANDLE_WIDGET } from './consts';
import { YunkeDragHandleWidget } from './drag-handle';

export function effects() {
  customElements.define(YUNKE_DRAG_HANDLE_WIDGET, YunkeDragHandleWidget);
  customElements.define(
    EDGELESS_DND_PREVIEW_ELEMENT,
    EdgelessDndPreviewElement
  );
}
