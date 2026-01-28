import { CalendarViewUI } from './pc/calendar-view-ui-logic.js';

export function calendarEffects() {
  if (!customElements.get('calendar-view-ui')) {
    customElements.define('calendar-view-ui', CalendarViewUI);
  }
}
