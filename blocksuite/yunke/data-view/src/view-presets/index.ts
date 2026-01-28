import { kanbanViewMeta } from './kanban/index.js';
import { tableViewMeta } from './table/index.js';
import { ganttViewMeta } from './gantt/index.js';
import { chartViewMeta } from './chart/renderer.js';
import { calendarViewMeta } from './calendar/index.js';

export * from './convert.js';
export * from './kanban/index.js';
export * from './table/index.js';
export * from './gantt/index.js';
export * from './chart/index.js';
export * from './calendar/index.js';

export const viewPresets = {
  tableViewMeta: tableViewMeta,
  kanbanViewMeta: kanbanViewMeta,
  ganttViewMeta: ganttViewMeta,
  chartViewMeta: chartViewMeta,
  calendarViewMeta: calendarViewMeta,
};
