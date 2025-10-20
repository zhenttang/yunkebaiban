import { LinkPreview } from './link';

export * from './link';

export function effects() {
  customElements.define('yunke-link-preview', LinkPreview);
}
