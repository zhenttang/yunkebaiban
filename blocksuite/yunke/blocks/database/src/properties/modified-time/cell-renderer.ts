import {
  BaseCellRenderer,
  createFromBaseCellRenderer,
  createIcon,
} from '@blocksuite/data-view';
import { css } from '@emotion/css';
import { format } from 'date-fns/format';
import { html } from 'lit';

import { modifiedTimePropertyModelConfig } from './define.js';

const modifiedTimeCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
});

const textStyle = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
  color: 'var(--yunke-text-secondary-color)',
  fontSize: '14px',
});

export class ModifiedTimeCell extends BaseCellRenderer<number, number> {
  renderContent() {
    const formattedDate = this.value
      ? format(this.value, 'yyyy-MM-dd HH:mm:ss')
      : '';
    return html`<div class="${textStyle}">${formattedDate}</div>`;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(modifiedTimeCellStyle);
  }

  override beforeEnterEditMode() {
    return false; // 不允许编辑
  }

  override render() {
    return html`<div class="date-container">${this.renderContent()}</div>`;
  }
}

export const modifiedTimeColumnConfig =
  modifiedTimePropertyModelConfig.createPropertyMeta({
    icon: createIcon('DateTimeIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(ModifiedTimeCell),
    },
  });
