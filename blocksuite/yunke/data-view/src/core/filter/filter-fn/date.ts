import { addDays } from 'date-fns/addDays';
import { endOfMonth } from 'date-fns/endOfMonth';
import { endOfWeek } from 'date-fns/endOfWeek';
import { format } from 'date-fns/format';
import { startOfDay } from 'date-fns/startOfDay';
import { startOfMonth } from 'date-fns/startOfMonth';
import { startOfWeek } from 'date-fns/startOfWeek';
import { subDays } from 'date-fns/subDays';

import { t } from '../../logical/type-presets.js';
import { createFilter } from './create.js';

// 获取今天的开始和结束时间戳
const getTodayRange = () => {
  const now = new Date();
  const start = startOfDay(now).getTime();
  const end = startOfDay(addDays(now, 1)).getTime() - 1;
  return { start, end };
};

// 获取本周的开始和结束时间戳
const getThisWeekRange = () => {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }).getTime();
  const end = endOfWeek(now, { weekStartsOn: 1 }).getTime();
  return { start, end };
};

// 获取本月的开始和结束时间戳
const getThisMonthRange = () => {
  const now = new Date();
  const start = startOfMonth(now).getTime();
  const end = endOfMonth(now).getTime();
  return { start, end };
};

export const dateFilter = [
  createFilter({
    name: 'before',
    self: t.date.instance(),
    args: [t.date.instance()] as const,
    label: '早于',
    shortString: v => (v ? ` < ${format(v.value, 'yyyy/MM/dd')}` : undefined),
    impl: (self, value) => {
      if (self == null) {
        return false;
      }
      return self < value;
    },
    defaultValue: args => subDays(args[0], 1).getTime(),
  }),
  createFilter({
    name: 'after',
    self: t.date.instance(),
    args: [t.date.instance()] as const,
    label: '晚于',
    shortString: v => (v ? ` > ${format(v.value, 'yyyy/MM/dd')}` : undefined),
    impl: (self, value) => {
      if (self == null) {
        return false;
      }
      return self > value;
    },
    defaultValue: args => addDays(args[0], 1).getTime(),
  }),
  // 相对日期筛选 - 今天
  createFilter({
    name: 'date-is-today',
    self: t.date.instance(),
    args: [] as const,
    label: '今天',
    shortString: () => ' = 今天',
    impl: (self) => {
      if (self == null) {
        return false;
      }
      const { start, end } = getTodayRange();
      return self >= start && self <= end;
    },
    defaultValue: () => Date.now(),
  }),
  // 相对日期筛选 - 本周
  createFilter({
    name: 'date-is-this-week',
    self: t.date.instance(),
    args: [] as const,
    label: '本周',
    shortString: () => ' = 本周',
    impl: (self) => {
      if (self == null) {
        return false;
      }
      const { start, end } = getThisWeekRange();
      return self >= start && self <= end;
    },
    defaultValue: () => Date.now(),
  }),
  // 相对日期筛选 - 本月
  createFilter({
    name: 'date-is-this-month',
    self: t.date.instance(),
    args: [] as const,
    label: '本月',
    shortString: () => ' = 本月',
    impl: (self) => {
      if (self == null) {
        return false;
      }
      const { start, end } = getThisMonthRange();
      return self >= start && self <= end;
    },
    defaultValue: () => Date.now(),
  }),
  // 相对日期筛选 - 过去N天
  createFilter({
    name: 'date-in-past-days',
    self: t.date.instance(),
    args: [t.number.instance()] as const,
    label: '过去N天',
    shortString: v => (v ? ` 在过去 ${v.value} 天内` : undefined),
    impl: (self, days) => {
      if (self == null || days == null) {
        return false;
      }
      const now = Date.now();
      const pastDate = subDays(new Date(), days).getTime();
      return self >= pastDate && self <= now;
    },
    defaultValue: () => 7,
  }),
  // 相对日期筛选 - 未来N天
  createFilter({
    name: 'date-in-next-days',
    self: t.date.instance(),
    args: [t.number.instance()] as const,
    label: '未来N天',
    shortString: v => (v ? ` 在未来 ${v.value} 天内` : undefined),
    impl: (self, days) => {
      if (self == null || days == null) {
        return false;
      }
      const now = Date.now();
      const futureDate = addDays(new Date(), days).getTime();
      return self >= now && self <= futureDate;
    },
    defaultValue: () => 7,
  }),
  // 相对日期筛选 - 过去N天前
  createFilter({
    name: 'date-more-than-days-ago',
    self: t.date.instance(),
    args: [t.number.instance()] as const,
    label: '超过N天前',
    shortString: v => (v ? ` > ${v.value} 天前` : undefined),
    impl: (self, days) => {
      if (self == null || days == null) {
        return false;
      }
      const pastDate = subDays(new Date(), days).getTime();
      return self < pastDate;
    },
    defaultValue: () => 30,
  }),
];
