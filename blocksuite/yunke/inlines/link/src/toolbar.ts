import { ToolbarModuleExtension } from '@blocksuite/yunke-shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/std';

import { builtinInlineLinkToolbarConfig } from './link-node/configs/toolbar.js';

export const linkToolbar = ToolbarModuleExtension({
  id: BlockFlavourIdentifier('yunke:link'),
  config: builtinInlineLinkToolbarConfig,
});
