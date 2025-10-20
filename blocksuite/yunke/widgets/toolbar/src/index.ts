import { WidgetViewExtension } from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { YUNKE_TOOLBAR_WIDGET } from './toolbar';

export * from './toolbar';

export const toolbarWidget = WidgetViewExtension(
  'yunke:page',
  YUNKE_TOOLBAR_WIDGET,
  literal`${unsafeStatic(YUNKE_TOOLBAR_WIDGET)}`
);
