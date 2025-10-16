import {
  catchErrorInto,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import dayjs from 'dayjs';
import ICAL from 'ical.js';
import { EMPTY, map, mergeMap, switchMap, throttleTime } from 'rxjs';

import type {
  CalendarStore,
  CalendarSubscriptionConfig,
} from '../store/calendar';
import type { CalendarEvent, EventsByDateMap } from '../type';
import { parseCalendarUrl } from '../utils/calendar-url-parser';
import { isAllDay } from '../utils/is-all-day';

export class CalendarSubscription extends Entity<{ url: string }> {
  constructor(private readonly store: CalendarStore) {
    super();
  }

  config$ = LiveData.from(
    this.store.watchSubscription(this.props.url).pipe(
      map(config => config ?? ({} as CalendarSubscriptionConfig))
    ),
    {} as CalendarSubscriptionConfig
  );
  content$ = LiveData.from(
    this.store.watchSubscriptionCache(this.props.url),
    ''
  );
  name$ = LiveData.computed(get => {
    const config = get(this.config$);
    // 安全检查：确保 config 存在且不为 null
    if (!config) {
      return '';
    }
    if (config.name !== undefined) {
      return config.name;
    }
    const content = get(this.content$);
    if (!content) return '';
    try {
      const jCal = ICAL.parse(content ?? '');
      const vCalendar = new ICAL.Component(jCal);
      return (vCalendar.getFirstPropertyValue('x-wr-calname') as string) || '';
    } catch {
      return '';
    }
  });

  eventsByDateMap$ = LiveData.computed(get => {
    const content = get(this.content$);
    const config = get(this.config$);

    const map: EventsByDateMap = new Map();

    // 安全检查：确保 config 和 content 都存在
    if (!content || !config || !config.showEvents) return map;

    const jCal = ICAL.parse(content);
    const vCalendar = new ICAL.Component(jCal);
    const vEvents = vCalendar.getAllSubcomponents('vevent');

    for (const vEvent of vEvents) {
      const event = new ICAL.Event(vEvent);
      const calendarEvent: CalendarEvent = {
        id: event.uid,
        url: this.url,
        title: event.summary,
        startAt: event.startDate,
        endAt: event.endDate,
      };

      // create index for each day of the event
      if (event.startDate && event.endDate) {
        const start = dayjs(event.startDate.toJSDate());
        const end = dayjs(event.endDate.toJSDate());

        let current = start;
        while (current.isBefore(end) || current.isSame(end, 'day')) {
          if (
            current.isSame(end, 'day') &&
            end.hour() === 0 &&
            end.minute() === 0
          ) {
            break;
          }
          const todayEvent: CalendarEvent = { ...calendarEvent };
          const dateKey = current.format('YYYY-MM-DD');
          if (!map.has(dateKey)) {
            map.set(dateKey, []);
          }
          todayEvent.allDay = isAllDay(current, start, end);
          todayEvent.date = current;
          todayEvent.id = `${event.uid}-${dateKey}`;
          if (
            config.showAllDayEvents ||
            (!config.showAllDayEvents && !todayEvent.allDay)
          ) {
            map.get(dateKey)?.push(todayEvent);
          }
          current = current.add(1, 'day');
        }
      } else {
        console.warn("事件的开始或结束日期缺失", event);
      }
    }

    return map;
  });

  url = this.props.url;
  loading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  update = effect(
    throttleTime(30 * 1000),
    switchMap(() =>
      fromPromise(async () => {
        const url = parseCalendarUrl(this.url);
        const response = await fetch(url);
        return await response.text();
      }).pipe(
        mergeMap(value => {
          this.store.setSubscriptionCache(this.url, value).catch(console.error);
          return EMPTY;
        }),
        catchErrorInto(this.error$),
        onStart(() => this.loading$.setValue(true)),
        onComplete(() => this.loading$.setValue(false))
      )
    )
  );

  override dispose() {
    super.dispose();
    this.update.reset();
  }
}
