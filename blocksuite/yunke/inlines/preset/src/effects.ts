import { YunkeText } from './nodes/yunke-text';

export function effects() {
  customElements.define('yunke-text', YunkeText);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-text': YunkeText;
  }
}
