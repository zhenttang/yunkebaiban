import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import { literal } from 'lit/static-html.js';

import { CalloutKeymapExtension } from './callout-keymap';
import { calloutSlashMenuConfig } from './configs/slash-menu';
import { effects } from './effects';

export class CalloutViewExtension extends ViewExtensionProvider {
  override name = 'affine-callout-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('yunke:callout'),
      BlockViewExtension('yunke:callout', literal`affine-callout`),
      CalloutKeymapExtension,
      SlashMenuConfigExtension('yunke:callout', calloutSlashMenuConfig),
    ]);
  }
}
