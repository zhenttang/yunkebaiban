import { WidgetViewExtension } from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { YUNKE_DRAG_HANDLE_WIDGET } from './consts';

export * from './consts';
export * from './drag-handle';
export * from './utils';
export type { DragBlockPayload } from './watchers/drag-event-watcher';

export const dragHandleWidget = WidgetViewExtension(
  'yunke:page',
  YUNKE_DRAG_HANDLE_WIDGET,
  literal`${unsafeStatic(YUNKE_DRAG_HANDLE_WIDGET)}`
);
