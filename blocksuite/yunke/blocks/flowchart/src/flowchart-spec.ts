import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { flowchartSlashMenuConfig } from './configs/slash-menu.js';
import { FlowchartBlockSchema } from './flowchart-model.js';

const flavour = FlowchartBlockSchema.model.flavour;

export const FlowchartBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, () => {
    return literal`yunke-flowchart`;
  }),
  SlashMenuConfigExtension(flavour, flowchartSlashMenuConfig),
].flat();

