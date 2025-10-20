import { ImageBlockFallbackCard } from './components/image-block-fallback.js';
import { ImageBlockPageComponent } from './components/page-image-block.js';
import { ImageBlockComponent } from './image-block.js';
import { ImageEdgelessBlockComponent } from './image-edgeless-block.js';
import { ImageEdgelessPlaceholderBlockComponent } from './preview-image/edgeless.js';
import { ImagePlaceholderBlockComponent } from './preview-image/page.js';

export function effects() {
  customElements.define('yunke-image', ImageBlockComponent);
  customElements.define('yunke-edgeless-image', ImageEdgelessBlockComponent);
  customElements.define('yunke-page-image', ImageBlockPageComponent);
  customElements.define('yunke-image-fallback-card', ImageBlockFallbackCard);
  customElements.define(
    'yunke-placeholder-preview-image',
    ImagePlaceholderBlockComponent
  );
  customElements.define(
    'yunke-edgeless-placeholder-preview-image',
    ImageEdgelessPlaceholderBlockComponent
  );
}
