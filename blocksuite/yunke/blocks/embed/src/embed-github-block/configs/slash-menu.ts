import { DefaultTool } from '@blocksuite/yunke-block-surface';
import { toggleEmbedCardCreateModal } from '@blocksuite/yunke-components/embed-card-modal';
import type { SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { GithubDuotoneIcon } from '@blocksuite/icons/lit';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

import { GithubRepoTooltip } from './tooltips';

export const embedGithubSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'GitHub',
      description: '链接到GitHub仓库。',
      icon: GithubDuotoneIcon(),
      tooltip: {
        figure: GithubRepoTooltip,
        caption: 'GitHub Repo',
      },
      group: '4_Content & Media@7',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:embed-github'),
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
            'GitHub',
            '添加的GitHub问题或拉取请求链接将显示为卡片视图。',
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
