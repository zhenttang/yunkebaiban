/**
 * 甘特图右键上下文菜单
 * 从 gantt-view.ts 拆分出来
 */
import type { GanttTask } from './define.js';
import { ganttLogger as logger } from './gantt-utils.js';

const CONTEXT_MENU_STYLES = `
  .task-context-menu {
    position: fixed !important;
    background: var(--yunke-background-primary-color, white) !important;
    border: 1px solid var(--yunke-border-color, #e0e0e0) !important;
    border-radius: 8px !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
    z-index: 999999 !important;
    min-width: 120px !important;
    padding: 4px 0 !important;
    font-size: 13px !important;
    pointer-events: auto !important;
  }
  .context-menu-item {
    padding: 8px 12px !important;
    cursor: pointer !important;
    transition: background 0.2s !important;
    display: flex !important;
    align-items: center !important;
    gap: 8px !important;
    color: var(--yunke-text-primary-color, #333) !important;
  }
  .context-menu-item:hover {
    background: var(--yunke-hover-color, #f0f0f0) !important;
  }
  .context-menu-item.delete-item:hover {
    background: #fee !important;
    color: #dc3545 !important;
  }
`;

export interface ContextMenuCallbacks {
  onEdit: (task: GanttTask) => void;
  onDelete: (task: GanttTask) => void;
}

/**
 * 显示任务右键菜单
 */
export function showTaskContextMenu(
  task: GanttTask,
  event: MouseEvent,
  callbacks: ContextMenuCallbacks
): void {
  logger.debug('Showing context menu for task:', task.name);

  // 移除之前的菜单
  document.querySelector('.task-context-menu')?.remove();

  const menu = document.createElement('div');
  menu.className = 'task-context-menu';
  menu.innerHTML = `
    <div class="context-menu-item edit-item" data-action="edit">
      <span>⚙️</span> 编辑任务
    </div>
    <div class="context-menu-item delete-item" data-action="delete">
      <span>🗑️</span> 删除任务
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = CONTEXT_MENU_STYLES;
  menu.appendChild(style);

  menu.style.left = `${event.clientX}px`;
  menu.style.top = `${event.clientY}px`;
  document.body.appendChild(menu);

  // 事件委托
  menu.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const menuItem = target.closest('.context-menu-item') as HTMLElement;
    if (!menuItem) return;

    const action = menuItem.getAttribute('data-action');
    if (action === 'edit') {
      callbacks.onEdit(task);
    } else if (action === 'delete') {
      if (confirm(`确定要删除任务"${task.name}"吗？`)) {
        callbacks.onDelete(task);
      }
    }
    menu.remove();
  });

  // 点击其他地方关闭菜单
  const closeMenu = (e: Event) => {
    if (!menu.contains(e.target as Node)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => document.addEventListener('click', closeMenu), 0);
}
