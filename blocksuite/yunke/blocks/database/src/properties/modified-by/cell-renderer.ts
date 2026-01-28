import {
  BaseCellRenderer,
  createFromBaseCellRenderer,
  createIcon,
} from '@blocksuite/data-view';
import { css } from '@emotion/css';
import { html } from 'lit';

import { modifiedByPropertyModelConfig } from './define.js';

interface UserValue {
  userId: string;
  name: string;
  email?: string;
  avatar?: string;
}

const modifiedByCellStyle = css({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  padding: '0 4px',
});

const userContainerStyle = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const avatarStyle = css({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  backgroundColor: 'var(--yunke-primary-color)',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: '500',
  flexShrink: 0,
});

const avatarImgStyle = css({
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  objectFit: 'cover',
});

const nameStyle = css({
  fontSize: '14px',
  color: 'var(--yunke-text-primary-color)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

export class ModifiedByCell extends BaseCellRenderer<UserValue, UserValue> {
  private _getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  renderContent() {
    const user = this.value;
    if (!user) {
      return html`<span style="color: var(--yunke-placeholder-color)">-</span>`;
    }

    const avatar = user.avatar
      ? html`<img class="${avatarImgStyle}" src="${user.avatar}" alt="${user.name}" />`
      : html`<div class="${avatarStyle}">${this._getInitials(user.name)}</div>`;

    return html`
      <div class="${userContainerStyle}">
        ${avatar}
        <span class="${nameStyle}">${user.name}</span>
      </div>
    `;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.classList.add(modifiedByCellStyle);
  }

  override beforeEnterEditMode() {
    return false; // 不允许编辑
  }

  override render() {
    return this.renderContent();
  }
}

export const modifiedByColumnConfig =
  modifiedByPropertyModelConfig.createPropertyMeta({
    icon: createIcon('SinglePersonIcon'),
    cellRenderer: {
      view: createFromBaseCellRenderer(ModifiedByCell),
    },
  });
