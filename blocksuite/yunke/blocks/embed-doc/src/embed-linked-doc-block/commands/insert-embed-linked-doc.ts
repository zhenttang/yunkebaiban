import { insertEmbedCard } from '@blocksuite/yunke-block-embed';
import type { EmbedCardStyle, ReferenceParams } from '@blocksuite/yunke-model';
import type { Command } from '@blocksuite/std';

export type LinkableFlavour =
  | 'yunke:bookmark'
  | 'yunke:embed-linked-doc'
  | 'yunke:embed-synced-doc'
  | 'yunke:embed-iframe'
  | 'yunke:embed-figma'
  | 'yunke:embed-github'
  | 'yunke:embed-loom'
  | 'yunke:embed-youtube';

export type InsertedLinkType = {
  flavour: LinkableFlavour;
} | null;

export const insertEmbedLinkedDocCommand: Command<
  {
    docId: string;
    params?: ReferenceParams;
  },
  { blockId: string }
> = (ctx, next) => {
  const { docId, params, std } = ctx;
  const flavour = 'yunke:embed-linked-doc';
  const targetStyle: EmbedCardStyle = 'vertical';
  const props: Record<string, unknown> = { pageId: docId };
  if (params) props.params = params;
  const blockId = insertEmbedCard(std, { flavour, targetStyle, props });
  if (!blockId) return;
  next({ blockId });
};
