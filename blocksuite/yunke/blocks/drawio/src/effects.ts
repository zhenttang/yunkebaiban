import { DrawioBlockComponent } from './drawio-block.js';

declare global {
  namespace BlockSuite {
    interface CustomElements {
      'yunke-drawio': DrawioBlockComponent;
    }
  }
}

export function effects() {
  customElements.define('yunke-drawio', DrawioBlockComponent);
}