import { getSelectedModelsCommand } from '@blocksuite/yunke-shared/commands';
import type { SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { EmbedIcon } from '@blocksuite/icons/lit';

import { insertEmptyEmbedIframeCommand } from '../../commands/insert-empty-embed-iframe';
import { EmbedIframeTooltip } from './tooltip';

export const embedIframeSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: '嵌入',
      description: '支持Google Drive等。',
      icon: EmbedIcon(),
      tooltip: {
        figure: EmbedIframeTooltip,
        caption: 'Embed',
      },
      group: '4_Content & Media@5',
      when: ({ model }) => {
        return model.store.schema.flavourSchemaMap.has('yunke:embed-iframe');
      },
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertEmptyEmbedIframeCommand, {
            place: 'after',
            removeEmptyLine: true,
            linkInputPopupOptions: {
              telemetrySegment: 'slash menu',
            },
          })
          .run();
      },
    },
  ],
};
