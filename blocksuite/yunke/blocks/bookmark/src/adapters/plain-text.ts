import { createEmbedBlockPlainTextAdapterMatcher } from '@blocksuite/yunke-block-embed';
import { BookmarkBlockSchema } from '@blocksuite/yunke-model';
import { BlockPlainTextAdapterExtension } from '@blocksuite/yunke-shared/adapters';

export const bookmarkBlockPlainTextAdapterMatcher =
  createEmbedBlockPlainTextAdapterMatcher(BookmarkBlockSchema.model.flavour);

export const BookmarkBlockPlainTextAdapterExtension =
  BlockPlainTextAdapterExtension(bookmarkBlockPlainTextAdapterMatcher);
