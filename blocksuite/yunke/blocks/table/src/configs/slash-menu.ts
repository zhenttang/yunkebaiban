import { getSelectedModelsCommand } from '@blocksuite/yunke-shared/commands';
import { TelemetryProvider } from '@blocksuite/yunke-shared/services';
import { isInsideBlockByFlavour } from '@blocksuite/yunke-shared/utils';
import type { SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { TableIcon } from '@blocksuite/icons/lit';

import { insertTableBlockCommand } from '../commands';
import { tableTooltip } from './tooltips';

export const tableSlashMenuConfig: SlashMenuConfig = {
  disableWhen: ({ model }) => model.flavour === 'yunke:table',
  items: [
    {
      name: '表格',
      description: '创建一个简单的表格。',
      icon: TableIcon(),
      tooltip: {
        figure: tableTooltip,
        caption: 'Table',
      },
      group: '4_Content & Media@0',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertTableBlockCommand, {
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedTableBlockId }) => {
            if (insertedTableBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:table',
              });
            }
          })
          .run();
      },
    },
  ],
};
