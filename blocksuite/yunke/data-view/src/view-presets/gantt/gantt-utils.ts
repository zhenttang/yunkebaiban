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

/**
 * 获取任务条颜色（综合状态 + 优先级）
 */
export function getTaskBarColor(
  status: string,
  priority: string
): string {
  let baseColor: string;
  switch (status) {
    case 'completed': baseColor = '#10b981'; break;
    case 'in_progress': baseColor = '#3b82f6'; break;
    case 'paused': baseColor = '#f59e0b'; break;
    case 'not_started':
    default: baseColor = '#6b7280'; break;
  }
  switch (priority) {
    case 'urgent': return status === 'completed' ? baseColor : '#ef4444';
    case 'high': return adjustColorBrightness(baseColor, -30);
    case 'low': return adjustColorBrightness(baseColor, 40);
    default: return baseColor;
  }
}

/**
 * 获取任务边框颜色（按优先级）
 */
export function getTaskBorderColor(priority: string): string {
  switch (priority) {
    case 'urgent': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#059669';
    case 'low':
    default: return '#4b5563';
  }
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
