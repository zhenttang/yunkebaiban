import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { WithDisposable } from '@blocksuite/yunke/global/lit';
import type { EditorHost } from '@blocksuite/yunke/std';
import { ShadowlessElement } from '@blocksuite/yunke/std';
import type { ExtensionType } from '@blocksuite/yunke/store';
import { html } from 'lit';
import { property } from 'lit/decorators.js';

import { createTextRenderer } from '../../components/text-renderer';

export class ChatContentRichText extends WithDisposable(ShadowlessElement) {
  @property({ attribute: false })
  accessor host!: EditorHost;

  @property({ attribute: false })
  accessor text!: string;

  @property({ attribute: false })
  accessor state: 'finished' | 'generating' = 'finished';

  @property({ attribute: false })
  accessor extensions!: ExtensionType[];

  @property({ attribute: false })
  accessor yunkeFeatureFlagService!: FeatureFlagService;

  protected override render() {
    const { text, host } = this;
    return html`${createTextRenderer(host, {
      customHeading: true,
      extensions: this.extensions,
      yunkeFeatureFlagService: this.yunkeFeatureFlagService,
    })(text, this.state)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'chat-content-rich-text': ChatContentRichText;
  }
}
