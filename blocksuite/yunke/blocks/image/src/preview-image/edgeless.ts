import { toGfxBlockComponent } from '@blocksuite/std';
import { css } from 'lit';

import { ImagePlaceholderBlockComponent } from './page.js';

export class ImageEdgelessPlaceholderBlockComponent extends toGfxBlockComponent(
  ImagePlaceholderBlockComponent
) {
  static override styles = css`
    yunke-edgeless-placeholder-preview-image
      .yunke-placeholder-preview-container {
      border: 1px solid var(--yunke-background-tertiary-color);
    }
  `;

  override renderGfxBlock(): unknown {
    return super.renderGfxBlock();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-edgeless-placeholder-preview-image': ImageEdgelessPlaceholderBlockComponent;
  }
}
