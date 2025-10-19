import { createIcon } from '../../core/utils/uni-icon.js';
import { ganttViewModel } from './define.js';
import { MobileGanttViewUI, MobileGanttViewUILogic } from './mobile/gantt-view-ui-logic.js';
import { GanttViewUI, GanttViewUILogic } from './pc/gantt-view-ui-logic.js';
import { GanttView } from './gantt-view.js'; // 确保导入甘特图主组件
import { GanttTimelineHeader } from './components/gantt-timeline-header.js'; // 导入时间轴头部
import { GanttTaskBar } from './components/gantt-task-bar.js'; // 导入任务条
import { GanttWorkingDaySegment } from './components/gantt-working-day-segment.js'; // 导入工作日段

// 注册所有自定义元素
if (!customElements.get('gantt-view')) {
  customElements.define('gantt-view', GanttView);
}
if (!customElements.get('gantt-timeline-header')) {
  customElements.define('gantt-timeline-header', GanttTimelineHeader);
}
if (!customElements.get('gantt-task-bar')) {
  customElements.define('gantt-task-bar', GanttTaskBar);
}
if (!customElements.get('gantt-working-day-segment')) {
  customElements.define('gantt-working-day-segment', GanttWorkingDaySegment);
}
if (!customElements.get('dv-gantt-view-ui')) {
  customElements.define('dv-gantt-view-ui', GanttViewUI);
}
if (!customElements.get('mobile-gantt-view-ui')) {
  customElements.define('mobile-gantt-view-ui', MobileGanttViewUI);
}

export const ganttViewMeta = ganttViewModel.createMeta({
  icon: createIcon('DatabaseKanbanViewIcon'), // 临时使用看板图标
  // @ts-expect-error fixme: typesafe
  pcLogic: () => GanttViewUILogic,
  // @ts-expect-error fixme: typesafe
  mobileLogic: () => MobileGanttViewUILogic,
});