import { getSelectedModelsCommand } from '@blocksuite/yunke-shared/commands';
import { TelemetryProvider } from '@blocksuite/yunke-shared/services';
import { isInsideBlockByFlavour } from '@blocksuite/yunke-shared/utils';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { viewPresets } from '@blocksuite/data-view/view-presets';
import {
  DatabaseKanbanViewIcon,
  DatabaseTableViewIcon,
  DateTimeIcon, // 用作甘特图图标
  TodayIcon, // 用作日历图标
} from '@blocksuite/icons/lit';

import { insertDatabaseBlockCommand } from '../commands';
import { KanbanViewTooltip, TableViewTooltip, ChartViewTooltip } from './tooltips';

export const databaseSlashMenuConfig: SlashMenuConfig = {
  disableWhen: ({ model }) => model.flavour === 'yunke:database',
  items: [
    {
      name: 'Table View',
      description: '以表格格式显示项目。',
      searchAlias: ['database'],
      icon: DatabaseTableViewIcon(),
      tooltip: {
        figure: TableViewTooltip,
        caption: 'Table View',
      },
      group: '7_Database@0',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.tableViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedDatabaseBlockId }) => {
            if (insertedDatabaseBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:database',
              });
            }
          })
          .run();
      },
    },

    {
      name: 'Kanban View',
      description: 'Visualize data in a dashboard.',
      searchAlias: ['database'],
      icon: DatabaseKanbanViewIcon(),
      tooltip: {
        figure: KanbanViewTooltip,
        caption: 'Kanban View',
      },
      group: '7_Database@2',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.kanbanViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedDatabaseBlockId }) => {
            if (insertedDatabaseBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:database',
              });
            }
          })
          .run();
      },
    },

    {
      name: 'Gantt View',
      description: '以甘特图格式显示项目时间线。',
      searchAlias: ['database', 'gantt', '甘特图', 'timeline'],
      icon: DateTimeIcon(), 
      tooltip: {
        caption: 'Gantt View',
      },
      group: '7_Database@1',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.ganttViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedDatabaseBlockId }) => {
            if (insertedDatabaseBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:database',
              });
            }
          })
          .run();
      },
    },
    {
      name: 'Chart View',
      description: '以图表格式显示数据。',
      searchAlias: ['chart', '图表'],
      icon: DatabaseKanbanViewIcon(),
      tooltip: {
        figure: ChartViewTooltip,
        caption: 'Chart View',
      },
      group: '7_Database@4',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.chartViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedDatabaseBlockId }) => {
            if (insertedDatabaseBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:database',
              });
            }
          })
          .run();
      },
    },

    {
      name: 'Calendar View',
      description: '以日历格式显示日期数据。',
      searchAlias: ['calendar', '日历', 'schedule', '日程'],
      icon: TodayIcon(),
      tooltip: {
        caption: 'Calendar View',
      },
      group: '7_Database@3',
      when: ({ model }) =>
        !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
      action: ({ std }) => {
        std.command
          .chain()
          .pipe(getSelectedModelsCommand)
          .pipe(insertDatabaseBlockCommand, {
            viewType: viewPresets.calendarViewMeta.type,
            place: 'after',
            removeEmptyLine: true,
          })
          .pipe(({ insertedDatabaseBlockId }) => {
            if (insertedDatabaseBlockId) {
              const telemetry = std.getOptional(TelemetryProvider);
              telemetry?.track('BlockCreated', {
                blockType: 'yunke:database',
              });
            }
          })
          .run();
      },
    },
  ],
};
