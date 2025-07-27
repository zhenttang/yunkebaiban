import { SlashMenuConfigExtension } from '@blocksuite/affine-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { excalidrawSlashMenuConfig } from './configs/slash-menu.js';
import { ExcalidrawBlockSchema } from './excalidraw-model.js';

const flavour = ExcalidrawBlockSchema.model.flavour;

export const ExcalidrawBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return literal`affine-excalidraw`;
  }),
  SlashMenuConfigExtension(flavour, excalidrawSlashMenuConfig),
].flat();