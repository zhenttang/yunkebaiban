import {
  EmbedFigmaBlockSchema,
  EmbedFigmaStyles,
} from '@blocksuite/yunke-model';
import { EmbedOptionConfig } from '@blocksuite/yunke-shared/services';

import { figmaUrlRegex } from './embed-figma-model.js';

export const EmbedFigmaBlockOptionConfig = EmbedOptionConfig({
  flavour: EmbedFigmaBlockSchema.model.flavour,
  urlRegex: figmaUrlRegex,
  styles: EmbedFigmaStyles,
  viewType: 'embed',
});
