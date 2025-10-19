import { createTextActions } from '@blocksuite/yunke-gfx-text';
import { EdgelessTextBlockModel } from '@blocksuite/yunke-model';
import {
  type ToolbarModuleConfig,
  ToolbarModuleExtension,
} from '@blocksuite/yunke-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';

export const edgelessTextToolbarConfig = {
  // No need to adjust element bounds, which updates itself using ResizeObserver
  actions: createTextActions(EdgelessTextBlockModel, 'edgeless-text'),

  when: ctx => ctx.getSurfaceModelsByType(EdgelessTextBlockModel).length > 0,
} as const satisfies ToolbarModuleConfig;

export const edgelessTextToolbarExtension = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('yunke:surface:edgeless-text'),
  config: edgelessTextToolbarConfig,
});
