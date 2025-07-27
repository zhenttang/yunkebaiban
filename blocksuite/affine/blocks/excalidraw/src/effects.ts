import { ExcalidrawBlockComponent } from './excalidraw-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'affine-excalidraw': ExcalidrawBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('affine-excalidraw', ExcalidrawBlockComponent);
}