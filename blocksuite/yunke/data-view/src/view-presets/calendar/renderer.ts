import { createIcon } from '../../core/utils/uni-icon.js';
import { calendarViewModel } from './define.js';
import { CalendarViewUI, CalendarViewUILogic } from './pc/calendar-view-ui-logic.js';

// 注册自定义元素
if (!customElements.get('calendar-view-ui')) {
  customElements.define('calendar-view-ui', CalendarViewUI);
}

export const calendarViewMeta = calendarViewModel.createMeta({
  icon: createIcon('TodayIcon'),
  // @ts-expect-error fixme: typesafe
  pcLogic: () => CalendarViewUILogic,
  // @ts-expect-error fixme: typesafe  
  mobileLogic: () => CalendarViewUILogic, // 暂时复用 PC 端逻辑
});
