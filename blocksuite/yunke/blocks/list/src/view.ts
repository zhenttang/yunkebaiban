import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { BlockViewExtension, FlavourExtension } from '@blocksuite/std';
import { literal } from 'lit/static-html.js';

import { effects } from './effects.js';
import { ListKeymapExtension, ListTextKeymapExtension } from './list-keymap.js';

export class ListViewExtension extends ViewExtensionProvider {
  override name = 'yunke-list-block';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('yunke:list'),
      BlockViewExtension('yunke:list', literal`yunke-list`),
      ListKeymapExtension,
      ListTextKeymapExtension,
    ]);
  }
}
