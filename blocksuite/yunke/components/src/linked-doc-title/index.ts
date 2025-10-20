import { DocTitle } from './doc-title';

export * from './doc-title';

export function effects() {
  customElements.define('yunke-linked-doc-title', DocTitle);
}
