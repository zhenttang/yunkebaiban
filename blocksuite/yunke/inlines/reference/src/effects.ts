import { YunkeReference, ReferencePopup } from './reference-node';

export function effects() {
  customElements.define('reference-popup', ReferencePopup);
  customElements.define('yunke-reference', YunkeReference);
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-reference': YunkeReference;
    'reference-popup': ReferencePopup;
  }
}
