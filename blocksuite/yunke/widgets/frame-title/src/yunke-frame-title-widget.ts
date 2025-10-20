import { type FrameBlockModel } from '@blocksuite/yunke-model';
import { WidgetComponent, WidgetViewExtension } from '@blocksuite/std';
import { html } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

export const YUNKE_FRAME_TITLE_WIDGET = 'yunke-frame-title-widget';

export class YunkeFrameTitleWidget extends WidgetComponent<FrameBlockModel> {
  override render() {
    return html`<yunke-frame-title
      .model=${this.model}
      data-id=${this.model.id}
    ></yunke-frame-title>`;
  }
}

export const frameTitleWidget = WidgetViewExtension(
  'yunke:frame',
  YUNKE_FRAME_TITLE_WIDGET,
  literal`${unsafeStatic(YUNKE_FRAME_TITLE_WIDGET)}`
);
