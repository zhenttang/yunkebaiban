import { YUNKE_LINKED_DOC_WIDGET } from './config.js';
import { ImportDoc } from './import-doc/import-doc.js';
import { Loader } from './import-doc/loader.js';
import { YunkeLinkedDocWidget } from './index.js';
import { LinkedDocPopover } from './linked-doc-popover.js';
import { YunkeMobileLinkedDocMenu } from './mobile-linked-doc-menu.js';

export function effects() {
  customElements.define('yunke-linked-doc-popover', LinkedDocPopover);
  customElements.define(YUNKE_LINKED_DOC_WIDGET, YunkeLinkedDocWidget);
  customElements.define('import-doc', ImportDoc);
  customElements.define(
    'yunke-mobile-linked-doc-menu',
    YunkeMobileLinkedDocMenu
  );
  customElements.define('loader-element', Loader);
}
