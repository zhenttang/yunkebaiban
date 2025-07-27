import { SlashMenuConfigExtension } from '@blocksuite/affine-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { mermaidSlashMenuConfig } from './configs/slash-menu.js';
import { MermaidBlockSchema } from './mermaid-model.js';

const flavour = MermaidBlockSchema.model.flavour;

export const MermaidBlockSpec: ExtensionType[] = [
  FlavourExtension(flavour),
  BlockViewExtension(flavour, model => {
    return literal`affine-mermaid`;
  }),
  SlashMenuConfigExtension(flavour, mermaidSlashMenuConfig),
].flat();