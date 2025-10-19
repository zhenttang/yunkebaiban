import { insertEmbedCard } from '@blocksuite/yunke-block-embed';
import type { EmbedCardStyle } from '@blocksuite/yunke-model';
import { EmbedOptionProvider } from '@blocksuite/yunke-shared/services';
import type { Command } from '@blocksuite/std';

export const insertBookmarkCommand: Command<
  { url: string },
  { blockId: string; flavour: string }
> = (ctx, next) => {
  const { url, std } = ctx;
  const embedOptions = std.get(EmbedOptionProvider).getEmbedBlockOptions(url);

  let flavour = 'yunke:bookmark';
  let targetStyle: EmbedCardStyle = 'vertical';
  const props: Record<string, unknown> = { url };
  if (embedOptions) {
    flavour = embedOptions.flavour;
    targetStyle = embedOptions.styles[0];
  }
  const blockId = insertEmbedCard(std, { flavour, targetStyle, props });
  if (!blockId) return;
  next({ blockId, flavour });
};
