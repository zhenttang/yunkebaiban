import { WidgetViewExtension } from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { YUNKE_DOC_REMOTE_SELECTION_WIDGET } from './doc';
import { YUNKE_EDGELESS_REMOTE_SELECTION_WIDGET } from './edgeless';

export * from './doc';
export * from './edgeless';

export const docRemoteSelectionWidget = WidgetViewExtension(
  'yunke:page',
  YUNKE_DOC_REMOTE_SELECTION_WIDGET,
  literal`${unsafeStatic(YUNKE_DOC_REMOTE_SELECTION_WIDGET)}`
);

export const edgelessRemoteSelectionWidget = WidgetViewExtension(
  'yunke:page',
  YUNKE_EDGELESS_REMOTE_SELECTION_WIDGET,
  literal`${unsafeStatic(YUNKE_EDGELESS_REMOTE_SELECTION_WIDGET)}`
);
