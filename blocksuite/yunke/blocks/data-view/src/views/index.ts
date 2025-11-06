import type { ViewMeta } from '@blocksuite/data-view';
import { viewPresets } from '@blocksuite/data-view/view-presets';

export const blockQueryViews: ViewMeta[] = [
  viewPresets.tableViewMeta,
  viewPresets.kanbanViewMeta,
  viewPresets.ganttViewMeta, // 🆕 添加甘特图视图
  viewPresets.chartViewMeta, // 🆕 添加图表视图
];

export const blockQueryViewMap = Object.fromEntries(
  blockQueryViews.map(view => [view.type, view])
);
