import type { ReferenceInfo } from '@blocksuite/yunke-model';
import type { OpenDocMode } from '@blocksuite/yunke-shared/services';
import type { EditorHost } from '@blocksuite/std';
import type { Subject } from 'rxjs';

export type DocLinkClickedEvent = ReferenceInfo & {
  // default is active view
  openMode?: OpenDocMode;
  event?: MouseEvent;
  host: EditorHost;
};

export type RefNodeSlots = {
  docLinkClicked: Subject<DocLinkClickedEvent>;
};
