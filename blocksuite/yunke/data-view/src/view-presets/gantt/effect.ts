import { GanttViewUI } from './pc/gantt-view-ui-logic.js';
import { MobileGanttViewUI } from './mobile/gantt-view-ui-logic.js';

export function ganttEffects() {
  customElements.define('dv-gantt-view-ui', GanttViewUI);
  customElements.define('mobile-gantt-view-ui', MobileGanttViewUI);
}