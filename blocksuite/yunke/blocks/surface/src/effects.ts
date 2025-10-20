import { SurfaceBlockComponent } from './surface-block.js';
import { SurfaceBlockVoidComponent } from './surface-block-void.js';

export function effects() {
  customElements.define('yunke-surface-void', SurfaceBlockVoidComponent);
  customElements.define('yunke-surface', SurfaceBlockComponent);
}
