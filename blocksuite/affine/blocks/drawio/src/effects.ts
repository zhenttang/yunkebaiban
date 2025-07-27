import { DrawioBlockComponent } from './drawio-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'affine-drawio': DrawioBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('affine-drawio', DrawioBlockComponent);
}