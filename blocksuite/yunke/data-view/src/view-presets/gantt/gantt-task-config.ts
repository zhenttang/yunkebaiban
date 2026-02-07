/**
 * 甘特图任务配置面板
 * 从 gantt-view.ts 拆分出来，负责任务的编辑弹窗和数据保存
 */
import type { GanttTask } from './define.js';
import type { GanttSingleView } from './gantt-view-manager.js';
import { ganttLogger as logger, escapeHtml } from './gantt-utils.js';

// ====== 配置面板样式 ======

const CONFIG_PANEL_STYLES = `
  .task-config-panel {
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    right: 0 !important; bottom: 0 !important;
    z-index: 999999 !important;
    pointer-events: auto !important;
  }
  .task-config-overlay {
    position: fixed !important;
    top: 0 !important; left: 0 !important;
    right: 0 !important; bottom: 0 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important;
    pointer-events: auto !important;
  }
  .task-config-content {
    background: var(--yunke-background-primary-color, white) !important;
    border-radius: 12px !important;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
    max-width: 500px !important; width: 90vw !important;
    max-height: 80vh !important; overflow: hidden !important;
    display: flex !important; flex-direction: column !important;
    z-index: 1000000 !important; pointer-events: auto !important;
  }
  .task-config-header {
    padding: 20px 24px 16px !important;
    border-bottom: 1px solid var(--yunke-border-color, #e0e0e0) !important;
    display: flex !important; align-items: center !important;
    justify-content: space-between !important;
    background: var(--yunke-background-secondary-color, #f9f9f9) !important;
  }
  .task-config-header h3 {
    margin: 0 !important; font-size: 18px !important;
    font-weight: 600 !important;
    color: var(--yunke-text-primary-color, #333) !important;
  }
  .task-config-close {
    background: none !important; border: none !important;
    font-size: 24px !important; cursor: pointer !important;
    color: var(--yunke-text-secondary-color, #666) !important;
    width: 32px !important; height: 32px !important;
    display: flex !important; align-items: center !important;
    justify-content: center !important; border-radius: 6px !important;
    transition: background 0.2s !important;
  }
  .task-config-close:hover { background: var(--yunke-hover-color, #f0f0f0) !important; }
  .task-config-body {
    padding: 20px 24px !important; overflow-y: auto !important; flex: 1 !important;
  }
  .config-row {
    margin-bottom: 16px !important; display: flex !important;
    flex-direction: column !important; gap: 6px !important;
  }
  .config-row label {
    font-weight: 500 !important;
    color: var(--yunke-text-primary-color, #333) !important; font-size: 14px !important;
  }
  .config-row input, .config-row select {
    padding: 8px 12px !important;
    border: 1px solid var(--yunke-border-color, #e0e0e0) !important;
    border-radius: 6px !important; font-size: 14px !important;
    background: var(--yunke-background-primary-color, white) !important;
    color: var(--yunke-text-primary-color, #333) !important;
    transition: border-color 0.2s !important;
  }
  .config-row input:focus, .config-row select:focus {
    outline: none !important;
    border-color: var(--yunke-primary-color, #007bff) !important;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
  }
  .task-progress-slider { margin-right: 12px !important; flex: 1 !important; }
  .progress-display {
    font-weight: 600 !important;
    color: var(--yunke-primary-color, #007bff) !important; min-width: 40px !important;
  }
  .working-days { display: flex !important; flex-wrap: wrap !important; gap: 8px !important; }
  .day-checkbox {
    display: flex !important; align-items: center !important;
    gap: 4px !important; font-size: 13px !important; cursor: pointer !important;
  }
  .day-checkbox input { margin: 0 !important; width: auto !important; }
  .task-config-footer {
    padding: 16px 24px !important;
    border-top: 1px solid var(--yunke-border-color, #e0e0e0) !important;
    display: flex !important; gap: 12px !important; justify-content: flex-end !important;
    background: var(--yunke-background-secondary-color, #f9f9f9) !important;
  }
  .config-btn {
    padding: 8px 16px !important;
    border: 1px solid var(--yunke-border-color, #e0e0e0) !important;
    border-radius: 6px !important; font-size: 14px !important;
    font-weight: 500 !important; cursor: pointer !important; transition: all 0.2s !important;
  }
  .cancel-btn {
    background: var(--yunke-background-primary-color, white) !important;
    color: var(--yunke-text-secondary-color, #666) !important;
  }
  .cancel-btn:hover { background: var(--yunke-hover-color, #f0f0f0) !important; }
  .save-btn {
    background: var(--yunke-primary-color, #007bff) !important;
    color: white !important; border-color: var(--yunke-primary-color, #007bff) !important;
  }
  .save-btn:hover { background: var(--yunke-primary-color-hover, #0056b3) !important; }
  .delete-btn { background: #dc3545 !important; color: white !important; border-color: #dc3545 !important; }
  .delete-btn:hover { background: #c82333 !important; }
`;

// ====== 属性查找辅助 ======

interface ViewDataSource {
  propertyTypeGet(id: string): string;
  cellValueGet(taskId: string, propertyId: string): { value?: unknown } | undefined;
  cellValueChange(taskId: string, propertyId: string, value: unknown): void;
}

interface ViewProperty {
  id: string;
  name$?: { value?: string };
}

function findProperty(
  properties: ViewProperty[],
  dataSource: ViewDataSource,
  matcher: (name: string | undefined, type: string) => boolean
): ViewProperty | undefined {
  return properties.find(p => {
    try {
      const name = p.name$?.value;
      const type = dataSource.propertyTypeGet(p.id);
      return matcher(name, type);
    } catch {
      return false;
    }
  });
}

function getCellValue(
  dataSource: ViewDataSource,
  taskId: string,
  property: ViewProperty | undefined
): unknown {
  if (!property) return undefined;
  try {
    return dataSource.cellValueGet(taskId, property.id)?.value;
  } catch (e) {
    logger.warn('读取属性值失败:', e);
    return undefined;
  }
}

// ====== 公开 API ======

export interface TaskConfigCallbacks {
  onSave: () => void;
  onDelete: (task: GanttTask) => void;
  onForceUpdate: () => void;
}

/**
 * 打开任务配置面板
 */
export function openTaskConfigPanel(
  task: GanttTask,
  view: GanttSingleView,
  callbacks: TaskConfigCallbacks
): void {
  logger.debug('Opening task config panel for:', task.name);

  // 移除已存在的配置面板
  document.querySelector('.task-config-panel')?.remove();

  const panel = createConfigPanel(task, view);
  document.body.appendChild(panel);
  addConfigPanelEventListeners(panel, task, view, callbacks);

  // 自动聚焦第一个输入框
  setTimeout(() => {
    const firstInput = panel.querySelector('input') as HTMLInputElement;
    if (firstInput) {
      firstInput.focus();
      firstInput.select();
    }
  }, 100);
}

// ====== 面板创建 ======

function createConfigPanel(
  task: GanttTask,
  view: GanttSingleView
): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'task-config-panel';

  const startDate = new Date(task.startDate);
  const endDate = new Date(task.endDate);
  const properties = (view?.properties$?.value || []) as ViewProperty[];
  const ds = view.dataSource as unknown as ViewDataSource;

  const currentStatus =
    (getCellValue(
      ds,
      task.id,
      findProperty(properties, ds, (name, type) =>
        name === '状态' || name === 'Status' || type === 'select'
      )
    ) as string) || task.status;

  const currentProgress =
    (getCellValue(
      ds,
      task.id,
      findProperty(properties, ds, (name, type) =>
        name === '进度' || name === 'Progress' || type === 'progress'
      )
    ) as number) ?? task.progress;

  const currentPriority =
    (getCellValue(
      ds,
      task.id,
      findProperty(properties, ds, (name) =>
        name === '优先级' || name === 'Priority'
      )
    ) as string) || task.priority;

  panel.innerHTML = `
    <div class="task-config-overlay">
      <div class="task-config-content">
        <div class="task-config-header">
          <h3>任务配置</h3>
          <button class="task-config-close" aria-label="关闭">×</button>
        </div>
        <div class="task-config-body">
          <div class="config-row">
            <label>任务名称：</label>
            <input type="text" class="task-name-input" value="${escapeHtml(task.name)}" placeholder="请输入任务名称">
          </div>
          <div class="config-row">
            <label>开始时间：</label>
            <input type="date" class="task-start-date" value="${startDate.toISOString().split('T')[0]}">
          </div>
          <div class="config-row">
            <label>结束时间：</label>
            <input type="date" class="task-end-date" value="${endDate.toISOString().split('T')[0]}">
          </div>
          <div class="config-row">
            <label>任务状态：</label>
            <select class="task-status-select">
              <option value="not_started" ${currentStatus === 'not_started' ? 'selected' : ''}>未开始</option>
              <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>进行中</option>
              <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>已完成</option>
              <option value="paused" ${currentStatus === 'paused' ? 'selected' : ''}>已暂停</option>
            </select>
          </div>
          <div class="config-row">
            <label>完成进度：</label>
            <input type="range" class="task-progress-slider" min="0" max="100" value="${currentProgress}" step="5">
            <span class="progress-display">${currentProgress}%</span>
          </div>
          <div class="config-row">
            <label>优先级：</label>
            <select class="task-priority-select">
              <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>低</option>
              <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>中</option>
              <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>高</option>
              <option value="urgent" ${currentPriority === 'urgent' ? 'selected' : ''}>紧急</option>
            </select>
          </div>
          <div class="config-row">
            <label>工作日：</label>
            <div class="working-days">
              ${['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                .map(
                  (day, i) => `
                <label class="day-checkbox">
                  <input type="checkbox" value="${i + 1}" ${task.workingDays.includes(i + 1) ? 'checked' : ''}>
                  ${day}
                </label>`
                )
                .join('')}
            </div>
          </div>
        </div>
        <div class="task-config-footer">
          <button class="config-btn cancel-btn">取消</button>
          <button class="config-btn save-btn">保存</button>
          <button class="config-btn delete-btn">删除任务</button>
        </div>
      </div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = CONFIG_PANEL_STYLES;
  panel.appendChild(style);

  return panel;
}

// ====== 事件绑定 ======

function addConfigPanelEventListeners(
  panel: HTMLElement,
  task: GanttTask,
  view: GanttSingleView,
  callbacks: TaskConfigCallbacks
): void {
  const closeBtn = panel.querySelector('.task-config-close') as HTMLButtonElement;
  const cancelBtn = panel.querySelector('.cancel-btn') as HTMLButtonElement;
  const saveBtn = panel.querySelector('.save-btn') as HTMLButtonElement;
  const deleteBtn = panel.querySelector('.delete-btn') as HTMLButtonElement;
  const progressSlider = panel.querySelector('.task-progress-slider') as HTMLInputElement;
  const progressDisplay = panel.querySelector('.progress-display') as HTMLSpanElement;
  const overlay = panel.querySelector('.task-config-overlay') as HTMLElement;

  const closePanel = () => panel.remove();

  closeBtn?.addEventListener('click', closePanel);
  cancelBtn?.addEventListener('click', closePanel);
  overlay?.addEventListener('click', (e) => {
    if (e.target === overlay) closePanel();
  });

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      closePanel();
      document.removeEventListener('keydown', handleKeydown);
    }
  };
  document.addEventListener('keydown', handleKeydown);

  progressSlider?.addEventListener('input', () => {
    if (progressDisplay) {
      progressDisplay.textContent = `${progressSlider.value}%`;
    }
  });

  saveBtn?.addEventListener('click', () => {
    saveTaskConfig(panel, task, view, callbacks.onForceUpdate);
    closePanel();
  });

  deleteBtn?.addEventListener('click', () => {
    if (confirm(`确定要删除任务"${task.name}"吗？`)) {
      callbacks.onDelete(task);
      closePanel();
    }
  });
}

// ====== 保存逻辑 ======

function saveTaskConfig(
  panel: HTMLElement,
  task: GanttTask,
  view: GanttSingleView,
  onForceUpdate: () => void
): void {
  try {
    const nameInput = panel.querySelector('.task-name-input') as HTMLInputElement;
    const startDateInput = panel.querySelector('.task-start-date') as HTMLInputElement;
    const endDateInput = panel.querySelector('.task-end-date') as HTMLInputElement;
    const statusSelect = panel.querySelector('.task-status-select') as HTMLSelectElement;
    const progressSlider = panel.querySelector('.task-progress-slider') as HTMLInputElement;
    const prioritySelect = panel.querySelector('.task-priority-select') as HTMLSelectElement;
    const workingDayCheckboxes = panel.querySelectorAll(
      '.day-checkbox input[type="checkbox"]'
    ) as NodeListOf<HTMLInputElement>;

    const workingDays: number[] = [];
    workingDayCheckboxes.forEach(cb => {
      if (cb.checked) workingDays.push(parseInt(cb.value));
    });

    const properties = (view?.properties$?.value || []) as ViewProperty[];
    const ds = view.dataSource as unknown as ViewDataSource;

    // 更新标题
    const titleProp = findProperty(properties, ds, (_, type) => type === 'title');
    if (titleProp && nameInput?.value?.trim()) {
      ds.cellValueChange(task.id, titleProp.id, nameInput.value.trim());
    }

    // 更新日期范围
    const dateProp = findProperty(properties, ds, (_, type) => type === 'date-range');
    if (dateProp && startDateInput?.value && endDateInput?.value) {
      ds.cellValueChange(task.id, dateProp.id, {
        value: {
          startDate: new Date(startDateInput.value).getTime(),
          endDate: new Date(endDateInput.value).getTime(),
          workingDays,
        },
      });
    }

    // 更新状态
    const statusProp = findProperty(
      properties, ds,
      (name, type) => name === '状态' || name === 'Status' || type === 'select'
    );
    if (statusProp && statusSelect?.value) {
      ds.cellValueChange(task.id, statusProp.id, { value: statusSelect.value });
    } else if (!statusProp && statusSelect?.value) {
      // 创建状态属性
      try {
        const id = view.propertyAdd('end', { type: 'select', name: '状态' });
        if (id) ds.cellValueChange(task.id, id, { value: statusSelect.value });
      } catch (e) {
        logger.warn('Failed to create status property:', e);
      }
    }

    // 更新进度
    const progressProp = findProperty(
      properties, ds,
      (name, type) => name === '进度' || name === 'Progress' || type === 'progress'
    );
    if (progressProp && progressSlider?.value !== undefined) {
      ds.cellValueChange(task.id, progressProp.id, {
        value: parseInt(progressSlider.value),
      });
    } else if (!progressProp && progressSlider?.value !== undefined) {
      try {
        const id = view.propertyAdd('end', { type: 'number', name: '进度' });
        if (id) ds.cellValueChange(task.id, id, { value: parseInt(progressSlider.value) });
      } catch (e) {
        logger.warn('Failed to create progress property:', e);
      }
    }

    // 更新优先级
    const priorityProp = findProperty(
      properties, ds,
      (name) => name === '优先级' || name === 'Priority'
    );
    if (priorityProp && prioritySelect?.value) {
      ds.cellValueChange(task.id, priorityProp.id, { value: prioritySelect.value });
    } else if (!priorityProp && prioritySelect?.value) {
      try {
        const id = view.propertyAdd('end', { type: 'select', name: '优先级' });
        if (id) ds.cellValueChange(task.id, id, { value: prioritySelect.value });
      } catch (e) {
        logger.warn('Failed to create priority property:', e);
      }
    }

    logger.debug('Task config saved for:', task.id);

    // 触发视图强制更新
    onForceUpdate();
    Promise.resolve().then(onForceUpdate);
    setTimeout(onForceUpdate, 50);
    setTimeout(onForceUpdate, 200);
  } catch (error) {
    logger.error('Error saving task config:', error);
    alert('保存任务配置时出错，请稍后重试。');
  }
}
