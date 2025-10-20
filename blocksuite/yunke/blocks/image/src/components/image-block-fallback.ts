import type { ResolvedStateInfo } from '@blocksuite/yunke-components/resource';
import { unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

export const SURFACE_IMAGE_CARD_WIDTH = 220;
export const SURFACE_IMAGE_CARD_HEIGHT = 122;
export const NOTE_IMAGE_CARD_WIDTH = 752;
export const NOTE_IMAGE_CARD_HEIGHT = 78;

export class ImageBlockFallbackCard extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    yunke-image-fallback-card {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }

    .yunke-image-fallback-card {
      display: flex;
      flex: 1;
      gap: 8px;
      align-self: stretch;
      flex-direction: column;
      justify-content: space-between;
      border-radius: 8px;
      border: 1px solid ${unsafeCSSVarV2('layer/background/tertiary')};
      background: ${unsafeCSSVarV2('layer/background/secondary')};
      padding: 12px;
    }

    .truncate {
      align-self: stretch;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }

    .yunke-image-fallback-card-title {
      display: flex;
      flex-direction: row;
      gap: 8px;
      align-items: center;
      align-self: stretch;
    }

    .yunke-image-fallback-card-title-icon {
      display: flex;
      width: 16px;
      height: 16px;
      align-items: center;
      justify-content: center;
      color: var(--yunke-text-primary-color);
    }

    .yunke-image-fallback-card-title-text {
      color: var(--yunke-placeholder-color);
      font-family: var(--yunke-font-family);
      font-size: var(--yunke-font-sm);
      font-style: normal;
      font-weight: 600;
      line-height: 22px;
    }

    .yunke-image-fallback-card-description {
      color: var(--yunke-text-secondary-color);
      font-family: var(--yunke-font-family);
      font-size: var(--yunke-font-xs);
      font-style: normal;
      font-weight: 400;
      line-height: 20px;
    }

    .yunke-image-fallback-card.loading {
      .yunke-image-fallback-card-title {
        color: var(--yunke-placeholder-color);
      }
    }

    .yunke-image-fallback-card.error {
      .yunke-image-fallback-card-title-icon {
        color: ${unsafeCSSVarV2('status/error')};
      }
    }
  `;

  override render() {
    const { icon, title, description, loading, error } = this.state;

    const classInfo = {
      'yunke-image-fallback-card': true,
      'drag-target': true,
      loading,
      error,
    };

    return html`
      <div class=${classMap(classInfo)}>
        <div class="yunke-image-fallback-card-title">
          <div class="yunke-image-fallback-card-title-icon">${icon}</div>
          <div class="yunke-image-fallback-card-title-text truncate">
            ${title}
          </div>
        </div>
        <div class="yunke-image-fallback-card-description truncate">
          ${description}
        </div>
      </div>
    `;
  }

  @property({ attribute: false })
  accessor state!: ResolvedStateInfo;
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-image-fallback-card': ImageBlockFallbackCard;
  }
}
