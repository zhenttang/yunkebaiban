import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { drawioSlashMenuConfig } from './configs/slash-menu.js';
import { DrawioBlockSchema } from './drawio-model.js';

const flavour = DrawioBlockSchema.model.flavour;

export const DrawioBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return literal`yunke-drawio`;
  }),
  SlashMenuConfigExtension(flavour, drawioSlashMenuConfig),
].flat();