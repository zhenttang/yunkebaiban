import {
  YUNKE_FRAME_TITLE_WIDGET,
  YunkeFrameTitleWidget,
} from './yunke-frame-title-widget.js';
import { EdgelessFrameTitleEditor } from './edgeless-frame-title-editor.js';
import { YUNKE_FRAME_TITLE, YunkeFrameTitle } from './frame-title.js';

export function effects() {
  customElements.define(YUNKE_FRAME_TITLE_WIDGET, YunkeFrameTitleWidget);
  customElements.define(YUNKE_FRAME_TITLE, YunkeFrameTitle);
  customElements.define(
    'edgeless-frame-title-editor',
    EdgelessFrameTitleEditor
  );
}
