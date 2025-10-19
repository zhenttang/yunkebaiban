import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { SlashMenuConfigExtension } from '@blocksuite/yunke-widget-slash-menu';
import {
  BlockViewExtension,
  FlavourExtension,
  WidgetViewExtension,
} from '@blocksuite/std';
import { literal, unsafeStatic } from 'lit/static-html.js';

import { getCodeClipboardExtensions } from './clipboard/index.js';
import { CodeBlockConfigExtension } from './code-block-config';
import {
  CodeBlockInlineManagerExtension,
  CodeBlockUnitSpecExtension,
} from './code-block-inline.js';
import { CodeBlockHighlighter } from './code-block-service.js';
import { CodeKeymapExtension } from './code-keymap.js';
import { AFFINE_CODE_TOOLBAR_WIDGET } from './code-toolbar/index.js';
import { codeSlashMenuConfig } from './configs/slash-menu.js';
import { effects } from './effects.js';

const codeToolbarWidget = WidgetViewExtension(
  'yunke:code',
  AFFINE_CODE_TOOLBAR_WIDGET,
  literal`${unsafeStatic(AFFINE_CODE_TOOLBAR_WIDGET)}`
);

export class CodeBlockViewExtension extends ViewExtensionProvider {
  override name = 'affine-code-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register([
      FlavourExtension('yunke:code'),
      CodeBlockHighlighter,
      BlockViewExtension('yunke:code', literal`affine-code`),
      SlashMenuConfigExtension('yunke:code', codeSlashMenuConfig),
      CodeKeymapExtension,
      ...getCodeClipboardExtensions(),
    ]);
    context.register([
      CodeBlockInlineManagerExtension,
      CodeBlockUnitSpecExtension,
    ]);
    if (!this.isMobile(context.scope)) {
      context.register(codeToolbarWidget);
    } else {
      context.register(
        CodeBlockConfigExtension({
          showLineNumbers: false,
        })
      );
    }
  }
}
