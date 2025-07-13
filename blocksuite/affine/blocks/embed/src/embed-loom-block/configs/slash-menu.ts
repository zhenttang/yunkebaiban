import { DefaultTool } from '@blocksuite/affine-block-surface';
import { toggleEmbedCardCreateModal } from '@blocksuite/affine-components/embed-card-modal';
import type { SlashMenuConfig } from '@blocksuite/affine-widget-slash-menu';
import { LoomLogoDuotoneIcon } from '@blocksuite/icons/lit';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

import { LoomTooltip } from './tooltips';

export const embedLoomSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Loom',
      icon: LoomLogoDuotoneIcon(),
      description: '嵌入Loom视频。',
      tooltip: {
        figure: LoomTooltip,
        caption: 'loom',
      },
      group: '4_Content & Media@9',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('affine:embed-loom'),
      action: ({ std, model }) => {
        (async () => {
          const { host } = std;
          const parentModel = host.store.getParent(model);
          if (!parentModel) {
            return;
          }
          const index = parentModel.children.indexOf(model) + 1;
          await toggleEmbedCardCreateModal(
            host,
            'Loom',
            '添加的Loom视频链接将显示为嵌入视图。',
            { mode: 'page', parentModel, index },
            ({ mode }) => {
              if (mode === 'edgeless') {
                const gfx = std.get(GfxControllerIdentifier);
                gfx.tool.setTool(DefaultTool);
              }
            }
          );
          if (model.text?.length === 0) std.store.deleteBlock(model);
        })().catch(console.error);
      },
    },
  ],
};
