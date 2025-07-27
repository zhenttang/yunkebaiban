import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects.js';
import { MermaidBlockSpec } from './mermaid-spec.js';

export class MermaidViewExtension extends ViewExtensionProvider {
  override name = 'affine-mermaid-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(MermaidBlockSpec);
  }
}