import {
  EdgelessRootBlockComponent,
  EdgelessRootPreviewBlockComponent,
  PageRootBlockComponent,
  PreviewRootBlockComponent,
} from './index.js';

export function effects() {
  // Register components by category
  registerRootComponents();
}

function registerRootComponents() {
  customElements.define('yunke-page-root', PageRootBlockComponent);
  customElements.define('yunke-preview-root', PreviewRootBlockComponent);
  customElements.define('yunke-edgeless-root', EdgelessRootBlockComponent);
  customElements.define(
    'yunke-edgeless-root-preview',
    EdgelessRootPreviewBlockComponent
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-edgeless-root': EdgelessRootBlockComponent;
    'yunke-page-root': PageRootBlockComponent;
  }
}
