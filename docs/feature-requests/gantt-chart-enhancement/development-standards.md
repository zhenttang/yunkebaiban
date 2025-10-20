# 甘特图增强功能 - 开发规范和最佳实践

## 📏 代码规范

### 1. TypeScript 开发规范

#### 1.1 类型定义规范

```typescript
// ✅ 正确的类型定义
export interface GanttTaskData {
  readonly id: string;              // 不可变属性用 readonly
  name: string;
  startDate: number;                // 时间戳统一使用 number 类型
  endDate: number;
  workingDays: readonly number[];   // 数组类型明确标注为只读
  status: TaskStatus;               // 使用枚举而非字符串字面量
  metadata?: TaskMetadata;          // 可选属性明确标注
}

// ❌ 错误的类型定义
export interface BadTaskData {
  id: any;                         // 避免使用 any
  name;                           // 缺少类型注解
  dates: object;                  // 过于宽泛的类型
  workingDays: number[];          // 可变数组类型
  status: string;                 // 应该使用更精确的类型
}

export type TaskStatus = 
  | 'not_started'
  | 'in_progress' 
  | 'completed'
  | 'on_hold'
  | 'cancelled';

// 泛型约束规范
export interface GanttViewProps<T extends GanttTaskData = GanttTaskData> {
  tasks: readonly T[];
  onTaskUpdate: (taskId: string, updates: Partial<T>) => void;
  renderTask?: (task: T) => TemplateResult;
}
```

#### 1.2 命名规范

```typescript
// 文件命名：kebab-case
// gantt-view.ts, task-bar-renderer.ts, working-days-editor.ts

// 类命名：PascalCase
export class GanttSingleView extends DataViewSingleViewBase<GanttViewData> {}
export class TaskBarRenderer extends WidgetElement {}

// 接口命名：PascalCase，以 I 开头（可选）
export interface IGanttCalculationEngine {}
export interface GanttViewConfig {}

// 类型别名：PascalCase
export type TaskDependencyType = 'finish-to-start' | 'start-to-start';
export type GanttTimelineUnit = 'day' | 'week' | 'month';

// 枚举：PascalCase，成员全大写
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// 常量：SCREAMING_SNAKE_CASE
export const GANTT_DEFAULT_CONFIG = {
  TASK_BAR_HEIGHT: 24,
  TIMELINE_UNIT_WIDTH: 60,
  MIN_DRAG_DISTANCE: 5,
} as const;

// 变量和函数：camelCase
const timelineConfig = getDefaultTimelineConfig();
const calculateWorkingDays = (startDate: Date, endDate: Date) => {};

// 组件属性：camelCase
@property({ attribute: false })
accessor selectedTasks: GanttTask[] = [];

@property({ type: Boolean, reflect: true })
accessor isEditable = false;

// CSS 类名：BEM 命名法
// .gantt-view__task-bar--selected
// .gantt-timeline__header--compact
```

#### 1.3 函数定义规范

```typescript
// ✅ 好的函数定义
/**
 * 计算任务的实际工作日数组
 * @param startDate 开始日期 (Unix 时间戳)
 * @param endDate 结束日期 (Unix 时间戳)  
 * @param workingDays 工作日配置，1=周一，7=周日
 * @param calendar 工作日历配置
 * @returns 实际工作日期数组
 * @throws {GanttCalculationError} 当日期范围无效时抛出
 */
export function calculateActualWorkingDays(
  startDate: number,
  endDate: number, 
  workingDays: readonly number[],
  calendar?: WorkingCalendar
): readonly Date[] {
  // 参数验证
  if (startDate >= endDate) {
    throw new GanttCalculationError(
      'startDate must be before endDate',
      'INVALID_DATE_RANGE',
      { startDate, endDate }
    );
  }
  
  // 具体实现...
  const result: Date[] = [];
  // ...
  return Object.freeze(result); // 返回不可变数组
}

// ✅ 异步函数规范
export async function loadGanttData(
  dataSourceId: string,
  options: LoadOptions = {}
): Promise<GanttLoadResult> {
  const { timeout = 5000, retries = 3 } = options;
  
  try {
    const data = await withTimeout(
      this.dataSource.load(dataSourceId),
      timeout
    );
    
    return {
      success: true,
      data: this.validateGanttData(data),
    };
  } catch (error) {
    logger.error('Failed to load gantt data', { dataSourceId, error });
    
    if (retries > 0) {
      return this.loadGanttData(dataSourceId, { ...options, retries: retries - 1 });
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ❌ 避免的函数定义
export function badFunction(data: any): any {  // 类型过于宽泛
  return data.someProperty;                    // 缺少错误处理
}
```

#### 1.4 错误处理规范

```typescript
// 自定义错误类
export class GanttError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GanttError';
    
    // 保持错误堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GanttError);
    }
  }
}

// 具体错误类型
export class GanttCalculationError extends GanttError {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'GanttCalculationError';
  }
}

export class GanttValidationError extends GanttError {
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'GanttValidationError';
  }
}

// 错误码常量
export const GANTT_ERROR_CODES = {
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  CIRCULAR_DEPENDENCY: 'CIRCULAR_DEPENDENCY',
  INVALID_WORKING_DAYS: 'INVALID_WORKING_DAYS',
  CALCULATION_TIMEOUT: 'CALCULATION_TIMEOUT',
  DATA_SOURCE_ERROR: 'DATA_SOURCE_ERROR',
} as const;

// 使用示例
try {
  const result = calculateCriticalPath(tasks, dependencies);
} catch (error) {
  if (error instanceof GanttCalculationError) {
    switch (error.code) {
      case GANTT_ERROR_CODES.CIRCULAR_DEPENDENCY:
        this.showCircularDependencyWarning(error.context);
        break;
      case GANTT_ERROR_CODES.CALCULATION_TIMEOUT:
        this.showTimeoutRetryOption();
        break;
      default:
        this.logError(error);
    }
  } else {
    // 处理未知错误
    this.handleUnknownError(error);
  }
}
```

### 2. Lit 组件开发规范

#### 2.1 组件结构规范

```typescript
// ✅ 标准的 Lit 组件结构
@customElement('gantt-task-bar')
export class GanttTaskBar extends WidgetElement {
  // 1. 静态属性定义在前
  static override styles = css`
    :host {
      display: block;
      position: relative;
    }
    
    .task-bar {
      height: var(--gantt-task-bar-height, 24px);
      border-radius: var(--gantt-task-bar-radius, 4px);
      transition: all 0.2s ease;
    }
  `;
  
  // 2. 属性装饰器，按重要性排序
  @property({ type: String, reflect: true })
  accessor taskId = '';
  
  @property({ attribute: false })
  accessor task!: GanttTask;
  
  @property({ type: Boolean, reflect: true })
  accessor selected = false;
  
  @property({ type: Boolean })
  accessor editable = true;
  
  // 3. 状态属性
  @state()
  private accessor _isDragging = false;
  
  @state()
  private accessor _hoverSegment: string | null = null;
  
  // 4. 查询装饰器
  @query('.task-bar')
  private accessor _taskBarElement!: HTMLElement;
  
  @queryAll('.task-segment')
  private accessor _segmentElements!: NodeListOf<HTMLElement>;
  
  // 5. 私有属性
  private _dragHandler?: DragHandler;
  private _resizeObserver?: ResizeObserver;
  
  // 6. 生命周期方法
  override connectedCallback() {
    super.connectedCallback();
    this._setupEventListeners();
    this._initializeResizeObserver();
  }
  
  override disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupEventListeners();
    this._resizeObserver?.disconnect();
  }
  
  override willUpdate(changedProperties: PropertyValues<this>) {
    super.willUpdate(changedProperties);
    
    if (changedProperties.has('task')) {
      this._validateTask();
    }
    
    if (changedProperties.has('selected')) {
      this._updateSelectionState();
    }
  }
  
  override updated(changedProperties: PropertyValues<this>) {
    super.updated(changedProperties);
    
    if (changedProperties.has('task')) {
      this._updateTaskDisplay();
    }
  }
  
  // 7. 渲染方法
  protected override render(): TemplateResult {
    if (!this.task) {
      return html`<div class="task-bar task-bar--empty">No task data</div>`;
    }
    
    return html`
      <div 
        class="task-bar ${this._getTaskBarClasses()}"
        style=${this._getTaskBarStyles()}
        @click=${this._onTaskBarClick}
        @mouseenter=${this._onMouseEnter}
        @mouseleave=${this._onMouseLeave}
      >
        ${this._renderTaskSegments()}
        ${this._renderTaskLabel()}
        ${this.selected ? this._renderSelectionIndicator() : nothing}
      </div>
    `;
  }
  
  // 8. 私有方法，按功能分组
  private _getTaskBarClasses(): string {
    const classes = ['task-bar'];
    
    if (this.selected) classes.push('task-bar--selected');
    if (this._isDragging) classes.push('task-bar--dragging');
    if (!this.editable) classes.push('task-bar--readonly');
    
    return classes.join(' ');
  }
  
  private _getTaskBarStyles(): string {
    const { task } = this;
    return styleMap({
      '--task-color': task.color,
      '--task-progress': `${task.progress}%`,
      width: `${this._calculateTaskWidth()}px`,
      left: `${this._calculateTaskPosition()}px`,
    });
  }
  
  private _renderTaskSegments(): TemplateResult[] {
    return this.task.workingDays.map((segment, index) => html`
      <gantt-task-segment
        .segment=${segment}
        .task=${this.task}
        .index=${index}
        ?selected=${this._hoverSegment === segment.id}
        @segment-click=${this._onSegmentClick}
      ></gantt-task-segment>
    `);
  }
  
  // 9. 事件处理方法
  private _onTaskBarClick(e: Event) {
    e.stopPropagation();
    
    const event = new CustomEvent('task-select', {
      detail: { taskId: this.taskId, task: this.task },
      bubbles: true,
      composed: true,
    });
    
    this.dispatchEvent(event);
  }
  
  private _onMouseEnter() {
    if (!this.editable) return;
    
    this._showTooltip();
  }
  
  private _onMouseLeave() {
    this._hideTooltip();
    this._hoverSegment = null;
  }
  
  // 10. 辅助方法
  private _calculateTaskWidth(): number {
    const { task } = this;
    const { startDate, endDate } = task;
    const duration = endDate - startDate;
    const pixelsPerDay = 60; // 可配置
    
    return Math.max(duration / (24 * 60 * 60 * 1000) * pixelsPerDay, 20);
  }
  
  private _validateTask(): void {
    if (!this.task) return;
    
    const { startDate, endDate, workingDays } = this.task;
    
    if (startDate >= endDate) {
      throw new GanttValidationError(
        'Task start date must be before end date',
        GANTT_ERROR_CODES.INVALID_DATE_RANGE,
        { taskId: this.taskId, startDate, endDate }
      );
    }
    
    if (!workingDays || workingDays.length === 0) {
      throw new GanttValidationError(
        'Task must have at least one working day',
        GANTT_ERROR_CODES.INVALID_WORKING_DAYS,
        { taskId: this.taskId, workingDays }
      );
    }
  }
}
```

#### 2.2 样式规范

```typescript
// CSS-in-JS 样式规范
export const ganttStyles = css`
  /* 1. 使用 CSS 自定义属性实现主题化 */
  :host {
    --gantt-primary-color: var(--yunke-primary-color, #6366f1);
    --gantt-background-color: var(--yunke-background-primary-color, #ffffff);
    --gantt-text-color: var(--yunke-text-primary-color, #1f2937);
    --gantt-border-color: var(--yunke-border-color, #e5e7eb);
    
    /* 甘特图专用变量 */
    --gantt-task-bar-height: 24px;
    --gantt-task-bar-radius: 4px;
    --gantt-timeline-unit-width: 60px;
    --gantt-row-height: 32px;
  }
  
  /* 2. 组件根元素样式 */
  .gantt-view {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--yunke-font-family);
    font-size: 14px;
    color: var(--gantt-text-color);
    background: var(--gantt-background-color);
  }
  
  /* 3. 布局相关样式 */
  .gantt-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--gantt-border-color);
    background: var(--gantt-background-color);
    min-height: 48px;
  }
  
  .gantt-content {
    display: grid;
    grid-template-columns: 300px 1fr;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }
  
  .task-list {
    border-right: 1px solid var(--gantt-border-color);
    overflow-y: auto;
    background: var(--gantt-background-color);
  }
  
  .timeline-area {
    overflow: auto;
    position: relative;
    background: var(--gantt-background-color);
  }
  
  /* 4. 任务条样式 */
  .task-bar {
    position: relative;
    height: var(--gantt-task-bar-height);
    border-radius: var(--gantt-task-bar-radius);
    cursor: pointer;
    transition: all 0.2s ease;
    
    /* 使用 CSS Grid 布局工作日段 */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(20px, 1fr));
    gap: 2px;
  }
  
  .task-bar:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    z-index: 10;
  }
  
  .task-bar--selected {
    box-shadow: 0 0 0 2px var(--gantt-primary-color);
    z-index: 20;
  }
  
  .task-bar--dragging {
    opacity: 0.8;
    transform: rotate(2deg) scale(1.02);
    z-index: 100;
  }
  
  /* 5. 工作日段样式 */
  .task-segment {
    height: 100%;
    border-radius: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 500;
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }
  
  .task-segment--working {
    background: var(--task-color, var(--gantt-primary-color));
    opacity: 1;
  }
  
  .task-segment--non-working {
    background: transparent;
    border: 2px dashed var(--task-color, var(--gantt-primary-color));
    opacity: 0.4;
    color: var(--task-color, var(--gantt-primary-color));
    height: 8px;
    margin: auto 0;
  }
  
  /* 6. 时间轴样式 */
  .timeline-header {
    display: flex;
    border-bottom: 1px solid var(--gantt-border-color);
    background: var(--gantt-background-color);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  
  .timeline-unit {
    min-width: var(--gantt-timeline-unit-width);
    padding: 8px 4px;
    text-align: center;
    border-right: 1px solid var(--gantt-border-color);
    font-size: 12px;
    font-weight: 500;
  }
  
  .timeline-unit--today {
    background: color-mix(in srgb, var(--gantt-primary-color) 10%, transparent);
    color: var(--gantt-primary-color);
    font-weight: 600;
  }
  
  .timeline-unit--weekend {
    background: var(--yunke-background-secondary-color);
    color: var(--yunke-text-secondary-color);
  }
  
  /* 7. 响应式设计 */
  @media (max-width: 768px) {
    .gantt-content {
      grid-template-columns: 200px 1fr;
    }
    
    .gantt-header {
      padding: 8px 12px;
      min-height: 40px;
    }
    
    .timeline-unit {
      min-width: 40px;
      padding: 6px 2px;
      font-size: 10px;
    }
    
    :host {
      --gantt-task-bar-height: 20px;
      --gantt-row-height: 28px;
    }
  }
  
  /* 8. 打印样式 */
  @media print {
    .gantt-view {
      break-inside: avoid;
    }
    
    .task-bar {
      break-inside: avoid;
      box-shadow: none !important;
    }
    
    .gantt-header {
      break-after: avoid;
    }
  }
  
  /* 9. 高对比度模式支持 */
  @media (prefers-contrast: high) {
    .task-bar {
      border: 2px solid currentColor;
    }
    
    .task-segment--non-working {
      border-width: 3px;
    }
  }
  
  /* 10. 减少动画模式支持 */
  @media (prefers-reduced-motion: reduce) {
    .task-bar,
    .task-segment {
      transition: none;
    }
  }
`;
```

### 3. 数据处理规范

#### 3.1 数据验证规范

```typescript
// 使用 Zod 进行运行时数据验证
import { z } from 'zod';

// 基础数据类型验证
export const ganttTaskSchema = z.object({
  id: z.string().uuid('Task ID must be a valid UUID'),
  name: z.string().min(1, 'Task name is required').max(200, 'Task name too long'),
  description: z.string().optional(),
  
  startDate: z.number().int().positive('Start date must be a positive timestamp'),
  endDate: z.number().int().positive('End date must be a positive timestamp'),
  
  workingDays: z.array(z.number().int().min(0).max(6))
    .min(1, 'At least one working day is required')
    .refine(days => new Set(days).size === days.length, 'Duplicate working days'),
  
  progress: z.number().min(0).max(100),
  status: z.enum(['not_started', 'in_progress', 'completed', 'on_hold', 'cancelled']),
  
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  
  assignees: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
}).refine(
  data => data.startDate < data.endDate,
  {
    message: 'Start date must be before end date',
    path: ['endDate'],
  }
);

// 依赖关系验证
export const taskDependencySchema = z.object({
  id: z.string().uuid(),
  fromTaskId: z.string().uuid(),
  toTaskId: z.string().uuid(),
  type: z.enum(['finish-to-start', 'start-to-start', 'finish-to-finish', 'start-to-finish']),
  lag: z.number().int(),
}).refine(
  data => data.fromTaskId !== data.toTaskId,
  {
    message: 'A task cannot depend on itself',
    path: ['toTaskId'],
  }
);

// 甘特图视图数据验证
export const ganttViewDataSchema = z.object({
  timeline: z.object({
    startDate: z.number().int().positive(),
    endDate: z.number().int().positive(),
    unit: z.enum(['day', 'week', 'month']),
    showWeekends: z.boolean(),
    workingDays: z.array(z.number().int().min(0).max(6)),
  }),
  
  columns: z.array(z.string().uuid()),
  
  dependencies: z.array(taskDependencySchema),
  
  display: z.object({
    showCriticalPath: z.boolean(),
    showProgress: z.boolean(),
    compactMode: z.boolean(),
  }),
});

// 数据验证函数
export function validateGanttTask(data: unknown): GanttTask {
  try {
    return ganttTaskSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new GanttValidationError(
        'Invalid task data',
        GANTT_ERROR_CODES.INVALID_TASK_DATA,
        {
          validationErrors: error.errors,
          receivedData: data,
        }
      );
    }
    throw error;
  }
}

// 批量验证
export function validateGanttTasks(tasks: unknown[]): GanttTask[] {
  const validated: GanttTask[] = [];
  const errors: Array<{ index: number; error: GanttValidationError }> = [];
  
  for (let i = 0; i < tasks.length; i++) {
    try {
      validated.push(validateGanttTask(tasks[i]));
    } catch (error) {
      if (error instanceof GanttValidationError) {
        errors.push({ index: i, error });
      } else {
        throw error;
      }
    }
  }
  
  if (errors.length > 0) {
    throw new GanttValidationError(
      `Validation failed for ${errors.length} tasks`,
      GANTT_ERROR_CODES.BATCH_VALIDATION_FAILED,
      { errors, validatedCount: validated.length }
    );
  }
  
  return validated;
}
```

#### 3.2 数据转换规范

```typescript
// 数据转换工具类
export class GanttDataTransformer {
  
  /**
   * 将外部数据格式转换为内部甘特图数据格式
   */
  static fromExternalFormat(externalData: ExternalTaskData[]): GanttTask[] {
    return externalData.map(item => this.transformSingleTask(item));
  }
  
  /**
   * 将内部数据格式转换为外部格式（用于导出）
   */
  static toExternalFormat(ganttTasks: GanttTask[]): ExternalTaskData[] {
    return ganttTasks.map(task => ({
      id: task.id,
      title: task.name,
      start_date: new Date(task.startDate).toISOString(),
      end_date: new Date(task.endDate).toISOString(),
      progress: task.progress / 100,
      working_days: task.workingDays.join(','),
      status: task.status,
      color: task.color,
      assignee_ids: task.assignees,
      tags: task.tags,
    }));
  }
  
  /**
   * 从现有甘特图模板转换数据
   */
  static fromLegacyTemplate(templateData: LegacyGanttTemplate): GanttViewData {
    const tasks = this.extractTasksFromTemplate(templateData);
    const dependencies = this.extractDependenciesFromTemplate(templateData);
    
    return {
      timeline: {
        startDate: Math.min(...tasks.map(t => t.startDate)),
        endDate: Math.max(...tasks.map(t => t.endDate)),
        unit: 'day',
        showWeekends: true,
        workingDays: [1, 2, 3, 4, 5],
      },
      columns: tasks.map(t => t.id),
      dependencies,
      display: {
        showCriticalPath: false,
        showProgress: true,
        compactMode: false,
      },
    };
  }
  
  private static transformSingleTask(external: ExternalTaskData): GanttTask {
    // 数据清理和转换
    const startDate = new Date(external.start_date).getTime();
    const endDate = new Date(external.end_date).getTime();
    
    if (isNaN(startDate) || isNaN(endDate)) {
      throw new GanttValidationError(
        'Invalid date format in external data',
        GANTT_ERROR_CODES.INVALID_DATE_FORMAT,
        { taskId: external.id, startDate: external.start_date, endDate: external.end_date }
      );
    }
    
    return {
      id: external.id,
      name: external.title?.trim() || 'Untitled Task',
      description: external.description || undefined,
      startDate,
      endDate,
      workingDays: external.working_days 
        ? external.working_days.split(',').map(d => parseInt(d.trim(), 10))
        : [1, 2, 3, 4, 5],
      progress: Math.round((external.progress || 0) * 100),
      status: this.normalizeStatus(external.status),
      color: this.normalizeColor(external.color),
      priority: this.normalizePriority(external.priority),
      assignees: external.assignee_ids || [],
      tags: external.tags || [],
      level: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }
  
  private static normalizeStatus(status: string | undefined): TaskStatus {
    const statusMap: Record<string, TaskStatus> = {
      'todo': TaskStatus.NOT_STARTED,
      'doing': TaskStatus.IN_PROGRESS,
      'done': TaskStatus.COMPLETED,
      'blocked': TaskStatus.ON_HOLD,
      'cancelled': TaskStatus.CANCELLED,
    };
    
    return statusMap[status?.toLowerCase() || ''] || TaskStatus.NOT_STARTED;
  }
  
  private static normalizeColor(color: string | undefined): string {
    if (!color) return '#6366f1'; // 默认颜色
    
    // 处理各种颜色格式
    if (color.startsWith('#') && color.length === 7) {
      return color;
    }
    
    // 转换命名颜色
    const namedColors: Record<string, string> = {
      red: '#ef4444',
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      purple: '#8b5cf6',
      gray: '#6b7280',
    };
    
    return namedColors[color.toLowerCase()] || '#6366f1';
  }
}

// 外部数据接口定义
interface ExternalTaskData {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  progress?: number;
  working_days?: string;
  status?: string;
  color?: string;
  priority?: string;
  assignee_ids?: string[];
  tags?: string[];
}
```

### 4. 测试规范

#### 4.1 单元测试规范

```typescript
// gantt-calculation-engine.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GanttCalculationEngine } from '../calculation-engine';
import { createMockTasks, createMockDependencies } from './test-utils';

describe('GanttCalculationEngine', () => {
  let engine: GanttCalculationEngine;
  let mockTasks: Map<string, GanttTask>;
  let mockDependencies: Map<string, TaskDependency>;
  
  beforeEach(() => {
    mockTasks = createMockTasks();
    mockDependencies = createMockDependencies();
    engine = new GanttCalculationEngine(mockTasks, mockDependencies);
  });
  
  describe('calculateWorkingDays', () => {
    it('应该正确计算工作日，排除周末', () => {
      const startDate = new Date('2025-01-01'); // 周三
      const endDate = new Date('2025-01-07');   // 周二
      const workingDays = [1, 2, 3, 4, 5]; // 周一到周五
      
      const result = engine.calculateWorkingDays(startDate, endDate, workingDays);
      
      expect(result).toHaveLength(4); // 周三、周四、周五、周一
      expect(result[0]).toEqual(new Date('2025-01-01')); // 周三
      expect(result[1]).toEqual(new Date('2025-01-02')); // 周四
      expect(result[2]).toEqual(new Date('2025-01-03')); // 周五
      expect(result[3]).toEqual(new Date('2025-01-06')); // 周一
    });
    
    it('应该处理节假日', () => {
      const calendar = createMockCalendar({
        holidays: [new Date('2025-01-02')], // 周四是节假日
      });
      
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-03');
      const workingDays = [1, 2, 3, 4, 5];
      
      engine = new GanttCalculationEngine(calendar, mockTasks, mockDependencies);
      const result = engine.calculateWorkingDays(startDate, endDate, workingDays);
      
      expect(result).toHaveLength(2); // 排除了节假日
      expect(result).not.toContainEqual(new Date('2025-01-02'));
    });
    
    it('应该在无效输入时抛出错误', () => {
      const startDate = new Date('2025-01-02');
      const endDate = new Date('2025-01-01'); // 结束日期早于开始日期
      const workingDays = [1, 2, 3, 4, 5];
      
      expect(() => {
        engine.calculateWorkingDays(startDate, endDate, workingDays);
      }).toThrow(GanttCalculationError);
    });
  });
  
  describe('calculateCriticalPath', () => {
    it('应该正确计算关键路径', () => {
      // 设置测试数据：A -> B -> C 和 A -> D -> C 两条路径
      const tasks = new Map([
        ['A', createMockTask({ id: 'A', duration: 3 })],
        ['B', createMockTask({ id: 'B', duration: 5 })],
        ['C', createMockTask({ id: 'C', duration: 2 })],
        ['D', createMockTask({ id: 'D', duration: 3 })],
      ]);
      
      const dependencies = new Map([
        ['A-B', createMockDependency({ fromTaskId: 'A', toTaskId: 'B' })],
        ['B-C', createMockDependency({ fromTaskId: 'B', toTaskId: 'C' })],
        ['A-D', createMockDependency({ fromTaskId: 'A', toTaskId: 'D' })],
        ['D-C', createMockDependency({ fromTaskId: 'D', toTaskId: 'C' })],
      ]);
      
      engine = new GanttCalculationEngine(tasks, dependencies);
      const result = engine.calculateCriticalPath();
      
      expect(result.criticalPath).toEqual(['A', 'B', 'C']); // 更长的路径
      expect(result.projectDuration).toBe(10); // 3 + 5 + 2
      expect(result.criticalTasks).toContain('A');
      expect(result.criticalTasks).toContain('B');
      expect(result.criticalTasks).toContain('C');
      expect(result.criticalTasks).not.toContain('D'); // D 有浮动时间
    });
    
    it('应该检测循环依赖', () => {
      const dependencies = new Map([
        ['A-B', createMockDependency({ fromTaskId: 'A', toTaskId: 'B' })],
        ['B-C', createMockDependency({ fromTaskId: 'B', toTaskId: 'C' })],
        ['C-A', createMockDependency({ fromTaskId: 'C', toTaskId: 'A' })], // 循环
      ]);
      
      engine = new GanttCalculationEngine(mockTasks, dependencies);
      
      expect(() => {
        engine.calculateCriticalPath();  
      }).toThrow(GanttCalculationError);
    });
  });
});

// 测试工具函数
function createMockTask(overrides: Partial<GanttTask> = {}): GanttTask {
  return {
    id: 'test-task',
    name: 'Test Task',
    startDate: Date.now(),
    endDate: Date.now() + 24 * 60 * 60 * 1000,
    duration: 1,
    workingDays: [1, 2, 3, 4, 5],
    progress: 0,
    status: TaskStatus.NOT_STARTED,
    color: '#6366f1',
    priority: TaskPriority.MEDIUM,
    assignees: [],
    tags: [],
    level: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

function createMockDependency(overrides: Partial<TaskDependency> = {}): TaskDependency {
  return {
    id: 'test-dependency',
    fromTaskId: 'task-1',
    toTaskId: 'task-2',
    type: 'finish-to-start',
    lag: 0,
    isFlexible: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}
```

#### 4.2 组件测试规范

```typescript
// gantt-task-bar.test.ts
import { fixture, expect, html } from '@open-wc/testing';
import { GanttTaskBar } from '../gantt-task-bar';
import { createMockTask } from './test-utils';

describe('GanttTaskBar', () => {
  let element: GanttTaskBar;
  let mockTask: GanttTask;
  
  beforeEach(async () => {
    mockTask = createMockTask({
      id: 'test-task',
      name: 'Test Task',
      color: '#ff6b6b',
      workingDays: [1, 2, 3, 4, 5],
    });
    
    element = await fixture(html`
      <gantt-task-bar 
        .task=${mockTask}
        .taskId=${'test-task'}
      ></gantt-task-bar>
    `);
  });
  
  it('应该正确渲染任务条', () => {
    const taskBar = element.shadowRoot!.querySelector('.task-bar');
    expect(taskBar).to.exist;
    expect(taskBar).to.have.class('task-bar');
  });
  
  it('应该显示任务名称', () => {
    const taskLabel = element.shadowRoot!.querySelector('.task-label');
    expect(taskLabel).to.exist;
    expect(taskLabel!.textContent).to.equal('Test Task');
  });
  
  it('应该应用任务颜色', () => {
    const taskBar = element.shadowRoot!.querySelector('.task-bar') as HTMLElement;
    const computedStyle = getComputedStyle(taskBar);
    
    // 检查 CSS 自定义属性
    expect(taskBar.style.getPropertyValue('--task-color')).to.equal('#ff6b6b');
  });
  
  it('应该在点击时触发选择事件', async () => {
    let eventFired = false;
    let eventDetail: any;
    
    element.addEventListener('task-select', (e: CustomEvent) => {
      eventFired = true;  
      eventDetail = e.detail;
    });
    
    const taskBar = element.shadowRoot!.querySelector('.task-bar') as HTMLElement;
    taskBar.click();
    
    await element.updateComplete;
    
    expect(eventFired).to.be.true;
    expect(eventDetail.taskId).to.equal('test-task');
    expect(eventDetail.task).to.equal(mockTask);
  });
  
  it('应该响应属性变化', async () => {
    element.selected = true;
    await element.updateComplete;
    
    const taskBar = element.shadowRoot!.querySelector('.task-bar');
    expect(taskBar).to.have.class('task-bar--selected');
    
    element.selected = false;
    await element.updateComplete;
    
    expect(taskBar).not.to.have.class('task-bar--selected');
  });
  
  it('应该处理空任务数据', async () => {
    element.task = null as any;
    await element.updateComplete;
    
    const emptyState = element.shadowRoot!.querySelector('.task-bar--empty');
    expect(emptyState).to.exist;
    expect(emptyState!.textContent).to.contain('No task data');
  });
  
  it('应该支持无障碍功能', () => {
    const taskBar = element.shadowRoot!.querySelector('.task-bar') as HTMLElement;
    
    expect(taskBar.getAttribute('role')).to.equal('button');
    expect(taskBar.getAttribute('aria-label')).to.contain('Test Task');
    expect(taskBar.getAttribute('tabindex')).to.equal('0');
  });
});
```

### 5. 性能优化规范

#### 5.1 防抖和节流规范

```typescript
// 防抖装饰器
export function debounce(delay: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let timeoutId: NodeJS.Timeout;
    const originalMethod = descriptor.value;
    
    descriptor.value = function (this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        originalMethod.apply(this, args);
      }, delay);
    };
    
    return descriptor;
  };
}

// 节流装饰器
export function throttle(interval: number = 100) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let lastCallTime = 0;
    const originalMethod = descriptor.value;
    
    descriptor.value = function (this: any, ...args: any[]) {
      const now = Date.now();
      if (now - lastCallTime >= interval) {
        lastCallTime = now;
        return originalMethod.apply(this, args);
      }
    };
    
    return descriptor;
  };
}

// 使用示例
export class GanttInteractionHandler {
  
  @debounce(300)
  private handleSearchInput(query: string) {
    // 搜索逻辑，避免频繁调用
    this.performSearch(query);
  }
  
  @throttle(16) // 60fps
  private handleScrollUpdate(scrollPosition: number) {
    // 滚动更新，限制频率
    this.updateVisibleItems(scrollPosition);
  }
  
  @debounce(500)
  private handleTaskUpdate(taskId: string, updates: Partial<GanttTask>) {
    // 任务更新，避免频繁保存
    this.saveTaskChanges(taskId, updates);
  }
}
```

#### 5.2 内存管理规范

```typescript
// 内存管理工具类
export class MemoryManager {
  private static cleanupTasks = new Set<() => void>();
  
  /**
   * 注册清理任务
   */
  static registerCleanup(cleanupFn: () => void): () => void {
    this.cleanupTasks.add(cleanupFn);
    
    // 返回取消注册函数
    return () => {
      this.cleanupTasks.delete(cleanupFn);
    };
  }
  
  /**
   * 执行所有清理任务
   */
  static cleanup(): void {
    this.cleanupTasks.forEach(cleanupFn => {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    
    this.cleanupTasks.clear();
  }
  
  /**
   * 监控内存使用
   */
  static monitorMemoryUsage(): void {
    if (typeof window === 'undefined' || !window.performance?.memory) {
      return;
    }
    
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = window.performance.memory;
    const usagePercentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;
    
    if (usagePercentage > 80) {
      console.warn('High memory usage detected:', {
        used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        percentage: `${usagePercentage.toFixed(1)}%`,
      });
      
      // 触发清理
      this.cleanup();
    }
  }
}

// 在组件中使用内存管理
export class GanttView extends WidgetElement {
  private _cleanupRegistry: Array<() => void> = [];
  
  override connectedCallback() {
    super.connectedCallback();
    
    // 注册各种清理任务
    this._registerCleanupTasks();
  }
  
  override disconnectedCallback() {
    super.disconnectedCallback();
    
    // 执行清理
    this._cleanupRegistry.forEach(cleanup => cleanup());
    this._cleanupRegistry.length = 0;
  }
  
  private _registerCleanupTasks() {
    // 清理事件监听器
    const handleResize = this._handleResize.bind(this);
    window.addEventListener('resize', handleResize);
    this._cleanupRegistry.push(() => {
      window.removeEventListener('resize', handleResize);
    });
    
    // 清理定时器
    const intervalId = setInterval(() => {
      this._updateTimeline();
    }, 1000);
    this._cleanupRegistry.push(() => {
      clearInterval(intervalId);
    });
    
    // 清理观察器
    const resizeObserver = new ResizeObserver(this._handleContainerResize.bind(this));
    resizeObserver.observe(this);
    this._cleanupRegistry.push(() => {
      resizeObserver.disconnect();
    });
  }
}
```

---

**文档版本**: v1.0  
**创建时间**: 2025-01-25  
**维护者**: 开发团队  
**状态**: 开发规范制定完成