import { EmbedFigmaBlockSchema } from '@blocksuite/yunke-model';
import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { createBuiltinToolbarConfigExtension } from '../configs/toolbar';
import { embedFigmaSlashMenuConfig } from './configs/slash-menu';
import { EmbedFigmaBlockInteraction } from './embed-edgeless-figma-block';
import { EmbedFigmaBlockComponent } from './embed-figma-block';
import { EmbedFigmaBlockOptionConfig } from './embed-figma-service';

const flavour = EmbedFigmaBlockSchema.model.flavour;

export const EmbedFigmaViewExtensions: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return model.parent?.flavour === 'yunke:surface'
      ? literal`yunke-embed-edgeless-figma-block`
      : literal`yunke-embed-figma-block`;
  }),
  EmbedFigmaBlockOptionConfig,
  createBuiltinToolbarConfigExtension(flavour, EmbedFigmaBlockComponent),
  SlashMenuConfigExtension(flavour, embedFigmaSlashMenuConfig),
  EmbedFigmaBlockInteraction,
].flat();
