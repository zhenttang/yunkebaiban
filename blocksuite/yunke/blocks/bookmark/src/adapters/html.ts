import { createEmbedBlockHtmlAdapterMatcher } from '@blocksuite/yunke-block-embed';
import { BookmarkBlockSchema } from '@blocksuite/yunke-model';
import { BlockHtmlAdapterExtension } from '@blocksuite/yunke-shared/adapters';

export const bookmarkBlockHtmlAdapterMatcher =
  createEmbedBlockHtmlAdapterMatcher(BookmarkBlockSchema.model.flavour);

export const BookmarkBlockHtmlAdapterExtension = BlockHtmlAdapterExtension(
  bookmarkBlockHtmlAdapterMatcher
);
