import type { ViewMeta } from '@blocksuite/data-view';
import { viewConverts, viewPresets } from '@blocksuite/data-view/view-presets';

export const databaseBlockViews: ViewMeta[] = [
  viewPresets.tableViewMeta,
  viewPresets.kanbanViewMeta,
  viewPresets.ganttViewMeta, // 🆕 添加甘特图视图
  viewPresets.chartViewMeta, // 🆕 添加图表视图
];

export const databaseBlockViewMap = Object.fromEntries(
  databaseBlockViews.map(view => [view.type, view])
);

export const databaseBlockViewConverts = [...viewConverts];
