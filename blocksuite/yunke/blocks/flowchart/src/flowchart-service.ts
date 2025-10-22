import { BlockService } from '@blocksuite/std';

import type { FlowchartBlockModel } from './flowchart-model.js';

export class FlowchartBlockService extends BlockService<FlowchartBlockModel> {
  override mounted(): void {
    super.mounted();
  }
}

