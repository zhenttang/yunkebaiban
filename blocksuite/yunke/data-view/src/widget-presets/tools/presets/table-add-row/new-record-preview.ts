import { PlusIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { cssVarV2 } from '@toeverything/theme/v2';
import { html, unsafeCSS } from 'lit';

export class NewRecordPreview extends ShadowlessElement {
  override render() {
    return html`
      <style>
        yunke-database-new-record-preview {
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          height: 32px;
          width: 32px;
          border: 1px solid ${unsafeCSS(cssVarV2.layer.insideBorder.border)};
          border-radius: 50%;
          background: var(--yunke-blue-100);
          box-shadow:
            0px 0px 10px rgba(0, 0, 0, 0.05),
            0px 0px 0px 0.5px var(--yunke-black-10);
          cursor: none;
          user-select: none;
          pointer-events: none;
          caret-color: transparent;
          z-index: 99999;
        }

        yunke-database-new-record-preview svg {
          width: 16px;
          height: 16px;
        }

        yunke-database-new-record-preview path {
          fill: var(--yunke-brand-color);
        }
      </style>
      ${PlusIcon()}
    `;
  }
}
