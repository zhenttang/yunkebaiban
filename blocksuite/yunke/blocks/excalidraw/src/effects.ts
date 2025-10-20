import { ExcalidrawBlockComponent } from './excalidraw-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'yunke-excalidraw': ExcalidrawBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('yunke-excalidraw', ExcalidrawBlockComponent);
}