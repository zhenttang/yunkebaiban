import * as icons from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { uniMap } from './uni-component/operation.js';
import { createUniComponentFromWebComponent } from './uni-component/uni-component.js';

export class YunkeLitIcon extends ShadowlessElement {
  static override styles = css`
    yunke-lit-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    yunke-lit-icon svg {
      fill: var(--yunke-icon-color);
    }
  `;

  protected override render(): unknown {
    const createIcon = icons[this.name] as () => TemplateResult;
    return html`${createIcon?.()}`;
  }

  @property({ attribute: false })
  accessor name!: keyof typeof icons;
}

const litIcon = createUniComponentFromWebComponent<{ name: string }>(
  YunkeLitIcon
);
export const createIcon = (name: keyof typeof icons) => {
  return uniMap(litIcon, () => ({ name }));
};
