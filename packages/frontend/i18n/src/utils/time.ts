import dayjs from 'dayjs';

import { I18n, type I18nInstance } from '../i18next';

export type TimeUnit =
  | 'second'
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'year';

const timeUnitCode = {
  second: 1,
  minute: 2,
  hour: 3,
  day: 4,
  week: 5,
  month: 6,
  year: 7,
} satisfies Record<TimeUnit, number>;

/**
 * ```ts
 * // 时间戳转字符串
 * i18nTime(1728538228000) -> 'Oct 10, 2024, 1:30:28 PM'
 *
 * // 绝对时间字符串
 * i18nTime('2024-10-10 13:30:28', { absolute: { accuracy: 'minute' } }) -> '2024-10-10 13:30 PM'
 * i18nTime('2024-10-10 13:30:28', { absolute: { accuracy: 'minute', noDate: true } }) -> '13:30 PM'
 * i18nTime('2024-10-10 13:30:28', { absolute: { accuracy: 'minute', noYear: true } }) -> 'Oct 10, 13:30 PM'
 * i18nTime('2024-10-10 13:30:28', { absolute: { accuracy: 'day' } }) -> 'Oct 10, 2024'
 *
 * // 相对时间字符串
 * i18nTime('2024-10-10 13:30:30', { relative: true }) -> 'now'
 * i18nTime('2024-10-10 13:30:00', { relative: true }) -> '30s ago'
 * i18nTime('2024-10-10 13:30:30', { relative: { accuracy: 'minute' } }) -> '2m ago'
 *
 * // 如果时间超过1天，显示绝对时间字符串
 * i18nTime('2024-10-9 14:30:30', { relative: { max: [1, 'day'] } }) -> '23h ago'
 * i18nTime('2024-10-9 13:30:30', { relative: { max: [1, 'day'] } }) -> 'Oct 9, 2024, 1:30:30 PM'
 * ```
 */
export function i18nTime(
  time: dayjs.ConfigType,
  options: {
    // 覆盖i18n实例，默认是全局I18n实例
    i18n?: I18nInstance;
    // 覆盖当前时间，默认是当前时间
    now?: dayjs.ConfigType;
    relative?:
      | {
          // 显示相对时间的最大时间，如果时间超过此时间，显示绝对时间
          max?: [number, TimeUnit];
          // 显示这个精度的时间
          accuracy?: TimeUnit;
          // 显示星期几，例如'星期一'，'星期二'等
          weekday?: boolean;
          // 如果时间是昨天或明天，显示'昨天'或'明天'
          yesterdayAndTomorrow?: boolean;
        }
      | true; // 使用默认相对选项
    absolute?: {
      // 显示这个精度的时间
      accuracy?: TimeUnit;
      // 隐藏年份
      noYear?: boolean;
      // 隐藏日期（年、月、日）
      noDate?: boolean;
    };
  } = {}
) {
  const i18n = options.i18n ?? I18n;
  time = dayjs(time);
  if (!time.isValid()) {
    return ''; // 无效时间，返回空字符串
  }

  const now = dayjs(options.now);

  const defaultRelativeOption = {
    max: [1000, 'year'],
    accuracy: 'second',
    weekday: false,
    yesterdayAndTomorrow: true,
  } satisfies typeof options.relative;

  const relativeOption = options.relative
    ? options.relative === true
      ? defaultRelativeOption
      : {
          ...defaultRelativeOption,
          ...options.relative,
        }
    : null;

  const defaultAbsoluteOption = {
    accuracy: 'second',
    noYear: false,
    noDate: false,
  } satisfies typeof options.absolute;

  const absoluteOption = {
    ...defaultAbsoluteOption,
    ...options.absolute,
  };

  if (relativeOption) {
    // 显示相对时间

    const formatter = new Intl.RelativeTimeFormat(i18n.language, {
      style: 'narrow',
      numeric: relativeOption.yesterdayAndTomorrow ? 'auto' : 'always',
    });

    const timeUnitProcessor = {
      second: () => {
        const diffSecond = time.diff(now) / 1000;
        if (Math.abs(diffSecond) < 1) {
          return i18n['com.yunke.time.now']();
        }
        if (
          relativeOption.max[1] === 'second' &&
          Math.abs(diffSecond) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (Math.abs(diffSecond) < 60) {
          return formatter.format(Math.trunc(diffSecond), 'second');
        }
        return null;
      },
      minute: () => {
        const diffMinute = time.diff(now) / 1000 / 60;
        if (Math.abs(diffMinute) < 1) {
          return i18n['com.yunke.time.now']();
        }
        if (
          relativeOption.max[1] === 'minute' &&
          Math.abs(diffMinute) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (Math.abs(diffMinute) < 60) {
          return formatter.format(Math.trunc(diffMinute), 'minute');
        }
        return null;
      },
      hour: () => {
        const diffHour = time.diff(now) / 1000 / 60 / 60;
        if (Math.abs(diffHour) < 1) {
          return i18n['com.yunke.time.now']();
        }
        if (
          relativeOption.max[1] === 'hour' &&
          Math.abs(diffHour) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (Math.abs(diffHour) < 24) {
          return formatter.format(Math.trunc(diffHour), 'hour');
        }
        return null;
      },
      day: () => {
        const diffDay = time.startOf('day').diff(now.startOf('day'), 'day');
        if (Math.abs(diffDay) < 1) {
          return i18n['com.yunke.time.today']();
        }
        if (
          relativeOption.max[1] === 'day' &&
          Math.abs(diffDay) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (relativeOption.yesterdayAndTomorrow && Math.abs(diffDay) < 2) {
          return formatter.format(Math.trunc(diffDay), 'day');
        } else if (relativeOption.weekday && Math.abs(diffDay) < 7) {
          return new Intl.DateTimeFormat(i18n.language, {
            weekday: 'long',
          }).format(time.startOf('day').toDate());
        } else if (Math.abs(diffDay) < 7) {
          return formatter.format(Math.trunc(diffDay), 'day');
        }
        return null;
      },
      week: () => {
        const inSameMonth = time.startOf('month').isSame(now.startOf('month'));
        const diffWeek = time.startOf('week').diff(now.startOf('week'), 'week');
        if (Math.abs(diffWeek) < 1) {
          return i18n['com.yunke.time.this-week']();
        }
        if (
          relativeOption.max[1] === 'week' &&
          Math.abs(diffWeek) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (inSameMonth || Math.abs(diffWeek) < 3) {
          return formatter.format(Math.trunc(diffWeek), 'week');
        }
        return null;
      },
      month: () => {
        const diffMonth = time
          .startOf('month')
          .diff(now.startOf('month'), 'month');
        if (Math.abs(diffMonth) < 1) {
          return i18n['com.yunke.time.this-mouth']();
        }
        if (
          relativeOption.max[1] === 'month' &&
          Math.abs(diffMonth) >= relativeOption.max[0]
        ) {
          return false;
        }
        if (Math.abs(diffMonth) < 12) {
          return formatter.format(Math.trunc(diffMonth), 'month');
        }
        return null;
      },
      year: () => {
        const diffYear = time.startOf('year').diff(now.startOf('year'), 'year');
        if (Math.abs(diffYear) < 1) {
          return i18n['com.yunke.time.this-year']();
        }
        if (
          relativeOption.max[1] === 'year' &&
          Math.abs(diffYear) >= relativeOption.max[0]
        ) {
          return false;
        }
        return formatter.format(Math.trunc(diffYear), 'year');
      },
    } as Record<TimeUnit, () => string | false | null>;

    const processors = Object.entries(timeUnitProcessor).sort(
      (a, b) => timeUnitCode[a[0] as TimeUnit] - timeUnitCode[b[0] as TimeUnit]
    ) as [TimeUnit, () => string | false | null][];

    for (const [unit, processor] of processors) {
      if (timeUnitCode[relativeOption.accuracy] > timeUnitCode[unit]) {
        continue;
      }
      const result = processor();
      if (result) {
        return result;
      }
      if (result === false) {
        break;
      }
    }
  }

  // 显示绝对时间
  const formatter = new Intl.DateTimeFormat(i18n.language, {
    year:
      !absoluteOption.noYear && !absoluteOption.noDate ? 'numeric' : undefined,
    month:
      !absoluteOption.noDate &&
      timeUnitCode[absoluteOption.accuracy] <= timeUnitCode['month']
        ? 'short'
        : undefined,
    day:
      !absoluteOption.noDate &&
      timeUnitCode[absoluteOption.accuracy] <= timeUnitCode['day']
        ? 'numeric'
        : undefined,
    hour:
      timeUnitCode[absoluteOption.accuracy] <= timeUnitCode['hour']
        ? 'numeric'
        : undefined,
    minute:
      timeUnitCode[absoluteOption.accuracy] <= timeUnitCode['minute']
        ? 'numeric'
        : undefined,
    second:
      timeUnitCode[absoluteOption.accuracy] <= timeUnitCode['second']
        ? 'numeric'
        : undefined,
  });

  return formatter.format(time.toDate());
}
