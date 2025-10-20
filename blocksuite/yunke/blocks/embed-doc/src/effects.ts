import { EmbedLinkedDocBlockComponent } from './embed-linked-doc-block';
import { EmbedEdgelessLinkedDocBlockComponent } from './embed-linked-doc-block/embed-edgeless-linked-doc-block';
import { EmbedSyncedDocBlockComponent } from './embed-synced-doc-block';
import { EmbedSyncedDocCard } from './embed-synced-doc-block/components/embed-synced-doc-card';
import { EmbedEdgelessSyncedDocBlockComponent } from './embed-synced-doc-block/embed-edgeless-synced-doc-block';

export function effects() {
  customElements.define('yunke-embed-synced-doc-card', EmbedSyncedDocCard);

  customElements.define(
    'yunke-embed-edgeless-linked-doc-block',
    EmbedEdgelessLinkedDocBlockComponent
  );
  customElements.define(
    'yunke-embed-linked-doc-block',
    EmbedLinkedDocBlockComponent
  );

  customElements.define(
    'yunke-embed-edgeless-synced-doc-block',
    EmbedEdgelessSyncedDocBlockComponent
  );
  customElements.define(
    'yunke-embed-synced-doc-block',
    EmbedSyncedDocBlockComponent
  );
}

declare global {
  interface HTMLElementTagNameMap {
    'yunke-embed-synced-doc-card': EmbedSyncedDocCard;
    'yunke-embed-synced-doc-block': EmbedSyncedDocBlockComponent;
    'yunke-embed-edgeless-synced-doc-block': EmbedEdgelessSyncedDocBlockComponent;
    'yunke-embed-linked-doc-block': EmbedLinkedDocBlockComponent;
    'yunke-embed-edgeless-linked-doc-block': EmbedEdgelessLinkedDocBlockComponent;
  }
}
