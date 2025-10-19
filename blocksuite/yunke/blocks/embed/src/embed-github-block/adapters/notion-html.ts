import { EmbedGithubBlockSchema } from '@blocksuite/yunke-model';
import { BlockNotionHtmlAdapterExtension } from '@blocksuite/yunke-shared/adapters';

import { createEmbedBlockNotionHtmlAdapterMatcher } from '../../common/adapters/notion-html.js';
import { githubUrlRegex } from '../embed-github-model.js';

export const embedGithubBlockNotionHtmlAdapterMatcher =
  createEmbedBlockNotionHtmlAdapterMatcher(
    EmbedGithubBlockSchema.model.flavour,
    githubUrlRegex
  );

export const EmbedGithubBlockNotionHtmlAdapterExtension =
  BlockNotionHtmlAdapterExtension(embedGithubBlockNotionHtmlAdapterMatcher);
