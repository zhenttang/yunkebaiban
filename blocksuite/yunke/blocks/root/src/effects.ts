import {
  EdgelessRootBlockComponent,
  EdgelessRootPreviewBlockComponent,
  PageRootBlockComponent,
  PreviewRootBlockComponent,
} from './index.js';
import {
  EdgelessSearchModal,
  EdgelessSearchPanel,
} from './edgeless/toolbar/search-panel';
import { EdgelessSearchToolButton } from './edgeless/toolbar/search-tool-button';

export function effects() {
  // Register components by category
  registerRootComponents();
}

function safeDefine(name: string, constructor: CustomElementConstructor) {
  if (!customElements.get(name)) {
    customElements.define(name, constructor);
  }
}

function registerRootComponents() {
  safeDefine('yunke-page-root', PageRootBlockComponent);
  safeDefine('yunke-preview-root', PreviewRootBlockComponent);
  safeDefine('yunke-edgeless-root', EdgelessRootBlockComponent);
  safeDefine('yunke-edgeless-root-preview', EdgelessRootPreviewBlockComponent);
  safeDefine('edgeless-search-modal', EdgelessSearchModal);
  safeDefine('edgeless-search-panel', EdgelessSearchPanel);
  safeDefine('edgeless-search-tool-button', EdgelessSearchToolButton);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-edgeless-root': EdgelessRootBlockComponent;
    'yunke-page-root': PageRootBlockComponent;
    'edgeless-search-modal': EdgelessSearchModal;
    'edgeless-search-panel': EdgelessSearchPanel;
    'edgeless-search-tool-button': EdgelessSearchToolButton;
  }
}
