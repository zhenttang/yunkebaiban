import { YunkeLink } from './link-node/yunke-link';
import { LinkPopup } from './link-node/link-popup/link-popup';

export function effects() {
  customElements.define('link-popup', LinkPopup);
  customElements.define('yunke-link', YunkeLink);
}
