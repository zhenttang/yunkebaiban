/**
 * 甘特图时间轴计算
 * 纯函数模块，负责时间单位生成、任务位置/宽度计算、今日线定位
 */
import type { TimelineConfig } from './define.js';
import { ganttLogger as logger, isSameDay, getWeekStart } from './gantt-utils.js';

/** 时间轴单位 */
export interface TimelineUnit {
  date: Date;
  label: string;
  width: number;
  isToday: boolean;
  tooltip: string;
}

/**
 * 生成时间轴单位列表
 */
export function generateTimelineUnits(timeline: TimelineConfig): TimelineUnit[] {
  const units: TimelineUnit[] = [];
  const startDate = new Date(timeline.startDate);
  const endDate = new Date(timeline.endDate);
  const unitWidth = timeline.unitWidth || 120;
  let current = new Date(startDate);
  const today = new Date();

  while (current <= endDate) {
    let label: string;
    let nextDate: Date;
    let isToday = false;
    let unitDate: Date;

    switch (timeline.unit) {
      case 'day':
        label = current.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        nextDate = new Date(current);
        nextDate.setDate(current.getDate() + 1);
        isToday = isSameDay(current, today);
        unitDate = new Date(current);
        break;

      case 'week': {
        const weekStart = getWeekStart(current);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const startMonth = weekStart.getMonth() + 1;
        const endMonth = weekEnd.getMonth() + 1;
        label = startMonth === endMonth
          ? `${startMonth}月${weekStart.getDate()}-${weekEnd.getDate()}日`
          : `${startMonth}月${weekStart.getDate()}日-${endMonth}月${weekEnd.getDate()}日`;
        nextDate = new Date(weekStart);
        nextDate.setDate(weekStart.getDate() + 7);
        isToday = today >= weekStart && today <= weekEnd;
        unitDate = new Date(weekStart);
        current = nextDate;
        break;
      }

      case 'month':
        label = current.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
        nextDate = new Date(current);
        nextDate.setMonth(current.getMonth() + 1);
        nextDate.setDate(1);
        isToday = today.getFullYear() === current.getFullYear() && today.getMonth() === current.getMonth();
        unitDate = new Date(current);
        break;

      default:
        label = current.toLocaleDateString('zh-CN');
        nextDate = new Date(current);
        nextDate.setDate(current.getDate() + 1);
        isToday = isSameDay(current, today);
        unitDate = new Date(current);
    }

    units.push({
      date: unitDate,
      label,
      width: unitWidth,
      isToday,
      tooltip: unitDate.toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      }),
    });

    if (timeline.unit !== 'week') {
      current = nextDate;
    }
  }

  logger.debug('生成时间轴单位:', {
    unit: timeline.unit,
    totalUnits: units.length,
    totalWidth: units.reduce((sum, u) => sum + u.width, 0),
  });

  return units;
}

/**
 * 计算任务在时间轴上的像素位置
 */
export function calculateTaskPosition(
  taskStart: Date,
  timeline: TimelineConfig,
  totalWidth: number
): number {
  const timelineUnits = generateTimelineUnits(timeline);

  let accumulatedWidth = 0;
  for (let i = 0; i < timelineUnits.length; i++) {
    const unit = timelineUnits[i];
    const unitStartDate = unit.date;

    let unitEndDate: Date;
    if (i < timelineUnits.length - 1) {
      unitEndDate = timelineUnits[i + 1].date;
    } else {
      unitEndDate = new Date(unitStartDate);
      switch (timeline.unit) {
        case 'day':
          unitEndDate.setDate(unitStartDate.getDate() + 1);
          break;
        case 'week':
          unitEndDate.setDate(unitStartDate.getDate() + 7);
          break;
        case 'month':
          unitEndDate.setMonth(unitStartDate.getMonth() + 1);
          break;
        default:
          unitEndDate.setDate(unitStartDate.getDate() + 1);
      }
    }

    if (taskStart >= unitStartDate && taskStart < unitEndDate) {
      const unitSpan = unitEndDate.getTime() - unitStartDate.getTime();
      const taskOffsetInUnit = taskStart.getTime() - unitStartDate.getTime();
      const relativePosition = taskOffsetInUnit / unitSpan;
      return accumulatedWidth + relativePosition * unit.width;
    }

    accumulatedWidth += unit.width;
  }

  // 后备：线性计算
  const tlStart = new Date(timeline.startDate);
  const tlEnd = new Date(timeline.endDate);
  const tlSpan = tlEnd.getTime() - tlStart.getTime();
  const offset = Math.max(0, taskStart.getTime() - tlStart.getTime());
  return (offset / tlSpan) * totalWidth;
}

/**
 * 计算任务条的像素宽度
 */
export function calculateTaskWidth(
  taskStart: Date,
  taskEnd: Date,
  timeline: TimelineConfig,
  totalWidth: number
): number {
  const tlStart = new Date(timeline.startDate);
  const tlEnd = new Date(timeline.endDate);
  const effectiveStart = new Date(Math.max(taskStart.getTime(), tlStart.getTime()));
  const effectiveEnd = new Date(Math.min(taskEnd.getTime(), tlEnd.getTime()));

  if (effectiveStart >= effectiveEnd) return 40;

  const startPos = calculateTaskPosition(effectiveStart, timeline, totalWidth);
  const endPos = calculateTaskPosition(effectiveEnd, timeline, totalWidth);
  return Math.max(40, endPos - startPos);
}

/**
 * 计算今日线的位置（-1 表示不在范围内）
 */
export function calculateTodayPosition(
  timeline: TimelineConfig,
  totalWidth: number
): number {
  const startDate = new Date(timeline.startDate);
  const endDate = new Date(timeline.endDate);
  const today = new Date();

  if (today < startDate || today > endDate) return -1;

  const span = endDate.getTime() - startDate.getTime();
  const offset = today.getTime() - startDate.getTime();
  return (offset / span) * totalWidth;
}
