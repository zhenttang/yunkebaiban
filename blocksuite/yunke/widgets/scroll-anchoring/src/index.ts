import { WidgetViewExtension } from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { YUNKE_SCROLL_ANCHORING_WIDGET } from './scroll-anchoring.js';

export * from './scroll-anchoring.js';

export const scrollAnchoringWidget = WidgetViewExtension(
  'yunke:page',
  YUNKE_SCROLL_ANCHORING_WIDGET,
  literal`${unsafeStatic(YUNKE_SCROLL_ANCHORING_WIDGET)}`
);
