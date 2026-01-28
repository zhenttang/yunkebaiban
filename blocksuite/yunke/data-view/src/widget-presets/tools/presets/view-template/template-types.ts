/**
 * 视图模板类型定义
 */

export interface ViewTemplateConfig {
  /** 模板 ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 模板描述 */
  description?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 视图类型 */
  viewType: string;
  /** 视图配置数据 */
  viewData: ViewTemplateData;
  /** 是否为系统预设模板 */
  isPreset?: boolean;
  /** 模板图标 */
  icon?: string;
  /** 模板分类 */
  category?: string;
}

export interface ViewTemplateData {
  /** 视图名称（作为默认名称） */
  name?: string;
  /** 列配置 */
  columns?: ColumnTemplateConfig[];
  /** 筛选配置 */
  filter?: unknown;
  /** 排序配置 */
  sort?: unknown;
  /** 分组配置 */
  groupBy?: unknown;
  /** 其他视图特定配置 */
  viewSpecific?: Record<string, unknown>;
}

export interface ColumnTemplateConfig {
  /** 列类型 */
  type: string;
  /** 列名称 */
  name: string;
  /** 列宽度 */
  width?: number;
  /** 是否隐藏 */
  hide?: boolean;
  /** 属性数据（如选项配置等） */
  propertyData?: unknown;
}

/**
 * 预设模板类别
 */
export type TemplateCategory = 
  | 'project'      // 项目管理
  | 'task'         // 任务管理
  | 'crm'          // 客户管理
  | 'inventory'    // 库存管理
  | 'hr'           // 人力资源
  | 'finance'      // 财务管理
  | 'custom';      // 自定义

/**
 * 预设视图模板列表
 */
export const PRESET_VIEW_TEMPLATES: ViewTemplateConfig[] = [
  {
    id: 'preset-task-board',
    name: '任务看板',
    description: '使用看板视图管理任务状态',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewType: 'kanban',
    isPreset: true,
    category: 'task',
    viewData: {
      name: '任务看板',
      columns: [
        { type: 'title', name: '任务名称' },
        { type: 'select', name: '状态', propertyData: {
          options: [
            { id: '1', value: '待开始', color: 'gray' },
            { id: '2', value: '进行中', color: 'blue' },
            { id: '3', value: '已完成', color: 'green' },
          ]
        }},
        { type: 'person', name: '负责人' },
        { type: 'date', name: '截止日期' },
        { type: 'progress', name: '进度' },
      ],
    },
  },
  {
    id: 'preset-project-tracker',
    name: '项目追踪表',
    description: '追踪项目进度和里程碑',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewType: 'table',
    isPreset: true,
    category: 'project',
    viewData: {
      name: '项目追踪',
      columns: [
        { type: 'title', name: '项目名称' },
        { type: 'select', name: '阶段' },
        { type: 'date-range', name: '项目周期' },
        { type: 'progress', name: '完成度' },
        { type: 'person', name: '项目经理' },
        { type: 'number', name: '预算' },
      ],
    },
  },
  {
    id: 'preset-crm-contacts',
    name: '客户联系人',
    description: '管理客户和联系人信息',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewType: 'table',
    isPreset: true,
    category: 'crm',
    viewData: {
      name: '客户管理',
      columns: [
        { type: 'title', name: '客户名称' },
        { type: 'email', name: '邮箱' },
        { type: 'phone', name: '电话' },
        { type: 'select', name: '客户类型' },
        { type: 'select', name: '状态' },
        { type: 'date', name: '最后联系时间' },
        { type: 'person', name: '负责销售' },
      ],
    },
  },
  {
    id: 'preset-calendar-events',
    name: '日程安排',
    description: '日历视图管理日程和事件',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewType: 'calendar',
    isPreset: true,
    category: 'task',
    viewData: {
      name: '日程安排',
      columns: [
        { type: 'title', name: '事件名称' },
        { type: 'date', name: '日期' },
        { type: 'select', name: '类型' },
        { type: 'person', name: '参与人' },
        { type: 'location', name: '地点' },
      ],
    },
  },
  {
    id: 'preset-inventory',
    name: '库存管理',
    description: '管理产品库存和进出记录',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    viewType: 'table',
    isPreset: true,
    category: 'inventory',
    viewData: {
      name: '库存管理',
      columns: [
        { type: 'title', name: '商品名称' },
        { type: 'text', name: 'SKU' },
        { type: 'number', name: '库存数量' },
        { type: 'number', name: '单价' },
        { type: 'select', name: '分类' },
        { type: 'attachment', name: '图片' },
      ],
    },
  },
];
