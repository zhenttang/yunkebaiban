import '@blocksuite/yunke/effects';

import { TestYunkeEditorContainer } from './editors/index.js';

export function effects() {
  customElements.define('yunke-editor-container', TestYunkeEditorContainer);
}
