import { DebugLogger } from '@blocksuite/global/utils';

/**
 * 甘特图模块统一日志实例
 * 替代散落在代码各处的 console.log/warn/error
 */
export const ganttLogger = new DebugLogger('yunke:gantt-view');

/**
 * 对字符串进行 HTML 转义，防止 XSS 注入
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ====== 状态/优先级显示名称 ======

const STATUS_DISPLAY_MAP: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  completed: '已完成',
  paused: '已暂停',
  on_hold: '暂停',
  cancelled: '已取消',
};

const PRIORITY_DISPLAY_MAP: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '紧急',
};

export function getStatusDisplayName(status: string): string {
  return STATUS_DISPLAY_MAP[status] ?? status;
}

export function getPriorityDisplayName(priority: string): string {
  return PRIORITY_DISPLAY_MAP[priority] ?? priority;
}

// ====== 颜色工具 ======

/** 调整颜色亮度 */
export function adjustColorBrightness(
  hex: string,
  percent: number
): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** 任务条颜色映射 */
const TASK_BAR_COLORS: Record<string, string> = {
  completed: '#10b981',
  in_progress: '#6366f1',
  not_started: '#94a3b8',
  on_hold: '#f59e0b',
  paused: '#f59e0b',
  cancelled: '#ef4444',
};

const TASK_BORDER_COLORS: Record<string, string> = {
  completed: '#059669',
  in_progress: '#4f46e5',
  not_started: '#64748b',
  on_hold: '#d97706',
  paused: '#d97706',
  cancelled: '#dc2626',
};

export function getTaskBarColorByStatus(status: string): string {
  return TASK_BAR_COLORS[status] ?? '#6366f1';
}

export function getTaskBorderColorByStatus(status: string): string {
  return TASK_BORDER_COLORS[status] ?? '#4f46e5';
}

// ====== 日期工具 ======

/** 判断两个日期是否同一天 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/** 获取一年中的周数 */
export function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** 获取周起始日期（周一） */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
