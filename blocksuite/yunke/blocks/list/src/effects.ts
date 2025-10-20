import { ListBlockComponent } from './list-block.js';

export function effects() {
  customElements.define('yunke-list', ListBlockComponent);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-list': ListBlockComponent;
  }
}
