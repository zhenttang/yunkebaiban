import { YUNKE_DOC_REMOTE_SELECTION_WIDGET } from './doc';
import { YunkeDocRemoteSelectionWidget } from './doc/doc-remote-selection';
import {
  YUNKE_EDGELESS_REMOTE_SELECTION_WIDGET,
  EdgelessRemoteSelectionWidget,
} from './edgeless';

export function effects() {
  customElements.define(
    YUNKE_DOC_REMOTE_SELECTION_WIDGET,
    YunkeDocRemoteSelectionWidget
  );
  customElements.define(
    YUNKE_EDGELESS_REMOTE_SELECTION_WIDGET,
    EdgelessRemoteSelectionWidget
  );
}
