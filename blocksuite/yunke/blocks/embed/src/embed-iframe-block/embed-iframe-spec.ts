import { EmbedIframeBlockSchema } from '@blocksuite/yunke-model';
import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { embedIframeSlashMenuConfig } from './configs/slash-menu/slash-menu';
import { createBuiltinToolbarConfigExtension } from './configs/toolbar';
import { EmbedIframeInteraction } from './embed-edgeless-iframe-block';

const flavour = EmbedIframeBlockSchema.model.flavour;

export const EmbedIframeViewExtensions: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return model.parent?.flavour === 'yunke:surface'
      ? literal`affine-embed-edgeless-iframe-block`
      : literal`affine-embed-iframe-block`;
  }),
  createBuiltinToolbarConfigExtension(flavour),
  SlashMenuConfigExtension(flavour, embedIframeSlashMenuConfig),
  EmbedIframeInteraction,
].flat();
