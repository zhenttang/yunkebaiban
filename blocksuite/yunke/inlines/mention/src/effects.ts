import { YunkeMention } from './yunke-mention';

export function effects() {
  customElements.define('yunke-mention', YunkeMention);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-mention': YunkeMention;
  }
}
