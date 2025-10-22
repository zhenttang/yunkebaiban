import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';
import { FlowchartBlockSpec } from './flowchart-spec.js';
import { FlowchartQuickTool } from './toolbar/quick-tool.js';

export class FlowchartViewExtension extends ViewExtensionProvider {
  override name = 'yunke-flowchart-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(FlowchartBlockSpec);
    
    // 注册白板工具栏按钮
    if (this.isEdgeless(context.scope)) {
      context.register(FlowchartQuickTool);
    }
  }
}

