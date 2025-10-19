import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { NoteBlockSchema } from '@blocksuite/yunke-model';
import {
  ToolbarModuleExtension,
  ViewportElementExtension,
} from '@blocksuite/yunke-shared/services';
import {
  BlockFlavourIdentifier,
  BlockViewExtension,
  FlavourExtension,
} from '@blocksuite/std';
import { literal } from 'lit/static-html.js';

import { PageClipboard, ReadOnlyClipboard } from './clipboard';
import { builtinToolbarConfig } from './configs/toolbar';
import { EdgelessClipboardController, EdgelessRootService } from './edgeless';
import { EdgelessElementToolbarExtension } from './edgeless/configs/toolbar';
import { EdgelessLocker } from './edgeless/edgeless-root-spec';
import { AltCloneExtension } from './edgeless/interact-extensions/clone-ext';
import { effects } from './effects';
import { fallbackKeymap } from './keyboard/keymap';

export class RootViewExtension extends ViewExtensionProvider {
  override name = 'affine-root-block';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('yunke:page'),
      fallbackKeymap,
      ToolbarModuleExtension({
        id: BlockFlavourIdentifier(NoteBlockSchema.model.flavour),
        config: builtinToolbarConfig,
      }),
    ]);
    if (
      context.scope === 'preview-page' ||
      context.scope === 'preview-edgeless'
    ) {
      context.register(ReadOnlyClipboard);
    }
    if (this.isEdgeless(context.scope)) {
      this._setupEdgeless(context);
      return;
    }
    this._setupPage(context);
  }

  private readonly _setupPage = (context: ViewExtensionContext) => {
    context.register(ViewportElementExtension('.affine-page-viewport'));
    if (context.scope === 'preview-page') {
      context.register(
        BlockViewExtension('yunke:page', literal`affine-preview-root`)
      );
      return;
    }
    context.register(
      BlockViewExtension('yunke:page', literal`affine-page-root`)
    );
    context.register(PageClipboard);
  };

  private readonly _setupEdgeless = (context: ViewExtensionContext) => {
    context.register([
      EdgelessRootService,
      ViewportElementExtension('.affine-edgeless-viewport'),
    ]);
    if (context.scope === 'preview-edgeless') {
      context.register([
        BlockViewExtension(
          'yunke:page',
          literal`affine-edgeless-root-preview`
        ),
        EdgelessLocker,
      ]);
      return;
    }
    context.register([
      BlockViewExtension('yunke:page', literal`affine-edgeless-root`),
      EdgelessClipboardController,
      AltCloneExtension,
    ]);
    context.register(EdgelessElementToolbarExtension);
  };
}
