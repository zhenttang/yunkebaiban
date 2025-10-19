import { CalloutBlockModel } from '@blocksuite/yunke-model';
import { focusBlockEnd } from '@blocksuite/yunke-shared/commands';
import { FeatureFlagService } from '@blocksuite/yunke-shared/services';
import {
  findAncestorModel,
  isInsideBlockByFlavour,
  matchModels,
} from '@blocksuite/yunke-shared/utils';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { FontIcon } from '@blocksuite/icons/lit';

import { calloutTooltip } from './tooltips';

export const calloutSlashMenuConfig: SlashMenuConfig = {
  disableWhen: ({ model }) => {
    return (
      findAncestorModel(model, ancestor =>
        matchModels(ancestor, [CalloutBlockModel])
      ) !== null
    );
  },
  items: [
    {
      name: '标注',
      description: '让您的文字更加醒目。',
      icon: FontIcon(),
      tooltip: {
        figure: calloutTooltip,
        caption: 'Callout',
      },
      searchAlias: ['callout'],
      group: '0_Basic@9',
      when: ({ std, model }) => {
        return (
          std.get(FeatureFlagService).getFlag('enable_callout') &&
          !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text')
        );
      },
      action: ({ model, std }) => {
        const { store } = model;
        const parent = store.getParent(model);
        if (!parent) return;

        const index = parent.children.indexOf(model);
        if (index === -1) return;
        const calloutId = store.addBlock(
          'yunke:callout',
          {},
          parent,
          index + 1
        );
        if (!calloutId) return;
        const paragraphId = store.addBlock('yunke:paragraph', {}, calloutId);
        if (!paragraphId) return;
        std.host.updateComplete
          .then(() => {
            const paragraph = std.view.getBlock(paragraphId);
            if (!paragraph) return;
            std.command.exec(focusBlockEnd, {
              focusBlock: paragraph,
            });
          })
          .catch(console.error);
      },
    },
  ],
};
