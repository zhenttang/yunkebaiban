import {
  EdgelessRootBlockComponent,
  EdgelessRootPreviewBlockComponent,
  PageRootBlockComponent,
  PreviewRootBlockComponent,
} from './index.js';
import { EdgelessSearchPanel } from './edgeless/toolbar/search-panel';
import { EdgelessSearchToolButton } from './edgeless/toolbar/search-tool-button';

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
  customElements.define('edgeless-search-panel', EdgelessSearchPanel);
  customElements.define('edgeless-search-tool-button', EdgelessSearchToolButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-edgeless-root': EdgelessRootBlockComponent;
    'yunke-page-root': PageRootBlockComponent;
    'edgeless-search-panel': EdgelessSearchPanel;
    'edgeless-search-tool-button': EdgelessSearchToolButton;
  }
}
