import { ToolbarModuleExtension } from '@blocksuite/yunke-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';

import { builtinInlineReferenceToolbarConfig } from './reference-node/configs/toolbar';

export const referenceNodeToolbar = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('yunke:reference'),
  config: builtinInlineReferenceToolbarConfig,
});
