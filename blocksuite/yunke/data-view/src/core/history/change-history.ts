/**
 * 数据变更历史记录系统
 */

export interface ChangeRecord {
  /** 变更 ID */
  id: string;
  /** 变更时间 */
  timestamp: number;
  /** 变更类型 */
  type: ChangeType;
  /** 视图 ID */
  viewId: string;
  /** 行 ID */
  rowId?: string;
  /** 属性 ID */
  propertyId?: string;
  /** 属性名称 */
  propertyName?: string;
  /** 旧值 */
  oldValue?: unknown;
  /** 新值 */
  newValue?: unknown;
  /** 操作用户 */
  userId?: string;
  /** 用户名称 */
  userName?: string;
}

export type ChangeType =
  | 'cell-update'      // 单元格更新
  | 'row-add'          // 添加行
  | 'row-delete'       // 删除行
  | 'property-add'     // 添加列
  | 'property-delete'  // 删除列
  | 'property-update'  // 更新列配置
  | 'view-update'      // 更新视图配置
  | 'filter-update'    // 更新筛选
  | 'sort-update';     // 更新排序

const MAX_HISTORY_SIZE = 1000;
const STORAGE_KEY_PREFIX = 'yunke-data-history-';

/**
 * 变更历史管理器
 */
export class ChangeHistoryManager {
  private static instances = new Map<string, ChangeHistoryManager>();
  private history: ChangeRecord[] = [];
  private viewId: string;
  private listeners: Set<(records: ChangeRecord[]) => void> = new Set();

  private constructor(viewId: string) {
    this.viewId = viewId;
    this.loadFromStorage();
  }

  /**
   * 获取指定视图的历史管理器
   */
  static getInstance(viewId: string): ChangeHistoryManager {
    let instance = ChangeHistoryManager.instances.get(viewId);
    if (!instance) {
      instance = new ChangeHistoryManager(viewId);
      ChangeHistoryManager.instances.set(viewId, instance);
    }
    return instance;
  }

  /**
   * 清除所有实例
   */
  static clearAll(): void {
    ChangeHistoryManager.instances.clear();
  }

  private get storageKey(): string {
    return `${STORAGE_KEY_PREFIX}${this.viewId}`;
  }

  /**
   * 从本地存储加载历史
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        this.history = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load change history:', e);
      this.history = [];
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      // 只保留最近的记录
      if (this.history.length > MAX_HISTORY_SIZE) {
        this.history = this.history.slice(-MAX_HISTORY_SIZE);
      }
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save change history:', e);
    }
  }

  /**
   * 记录变更
   */
  record(change: Omit<ChangeRecord, 'id' | 'timestamp' | 'viewId'>): void {
    const record: ChangeRecord = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      viewId: this.viewId,
    };

    this.history.push(record);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 记录单元格更新
   */
  recordCellUpdate(
    rowId: string,
    propertyId: string,
    propertyName: string,
    oldValue: unknown,
    newValue: unknown,
    userId?: string,
    userName?: string
  ): void {
    this.record({
      type: 'cell-update',
      rowId,
      propertyId,
      propertyName,
      oldValue,
      newValue,
      userId,
      userName,
    });
  }

  /**
   * 记录行添加
   */
  recordRowAdd(rowId: string, userId?: string, userName?: string): void {
    this.record({
      type: 'row-add',
      rowId,
      userId,
      userName,
    });
  }

  /**
   * 记录行删除
   */
  recordRowDelete(rowId: string, userId?: string, userName?: string): void {
    this.record({
      type: 'row-delete',
      rowId,
      userId,
      userName,
    });
  }

  /**
   * 记录列添加
   */
  recordPropertyAdd(
    propertyId: string,
    propertyName: string,
    userId?: string,
    userName?: string
  ): void {
    this.record({
      type: 'property-add',
      propertyId,
      propertyName,
      userId,
      userName,
    });
  }

  /**
   * 记录列删除
   */
  recordPropertyDelete(
    propertyId: string,
    propertyName: string,
    userId?: string,
    userName?: string
  ): void {
    this.record({
      type: 'property-delete',
      propertyId,
      propertyName,
      userId,
      userName,
    });
  }

  /**
   * 获取所有历史记录
   */
  getHistory(): ChangeRecord[] {
    return [...this.history];
  }

  /**
   * 获取最近的历史记录
   */
  getRecentHistory(limit = 50): ChangeRecord[] {
    return this.history.slice(-limit).reverse();
  }

  /**
   * 获取指定行的历史记录
   */
  getRowHistory(rowId: string): ChangeRecord[] {
    return this.history.filter(r => r.rowId === rowId).reverse();
  }

  /**
   * 获取指定单元格的历史记录
   */
  getCellHistory(rowId: string, propertyId: string): ChangeRecord[] {
    return this.history
      .filter(r => r.rowId === rowId && r.propertyId === propertyId)
      .reverse();
  }

  /**
   * 获取指定时间范围的历史记录
   */
  getHistoryByTimeRange(startTime: number, endTime: number): ChangeRecord[] {
    return this.history
      .filter(r => r.timestamp >= startTime && r.timestamp <= endTime)
      .reverse();
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * 订阅历史变更
   */
  subscribe(listener: (records: ChangeRecord[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const records = this.getRecentHistory();
    this.listeners.forEach(listener => listener(records));
  }
}

/**
 * 格式化变更类型为中文
 */
export function formatChangeType(type: ChangeType): string {
  const typeMap: Record<ChangeType, string> = {
    'cell-update': '更新单元格',
    'row-add': '添加行',
    'row-delete': '删除行',
    'property-add': '添加列',
    'property-delete': '删除列',
    'property-update': '更新列配置',
    'view-update': '更新视图',
    'filter-update': '更新筛选',
    'sort-update': '更新排序',
  };
  return typeMap[type] || type;
}

/**
 * 格式化变更描述
 */
export function formatChangeDescription(record: ChangeRecord): string {
  const time = new Date(record.timestamp).toLocaleString('zh-CN');
  const user = record.userName || '未知用户';

  switch (record.type) {
    case 'cell-update':
      return `${user} 更新了 "${record.propertyName}" 字段`;
    case 'row-add':
      return `${user} 添加了新行`;
    case 'row-delete':
      return `${user} 删除了行`;
    case 'property-add':
      return `${user} 添加了列 "${record.propertyName}"`;
    case 'property-delete':
      return `${user} 删除了列 "${record.propertyName}"`;
    default:
      return `${user} 进行了 ${formatChangeType(record.type)} 操作`;
  }
}

/**
 * 获取变更历史管理器
 */
export function getChangeHistoryManager(viewId: string): ChangeHistoryManager {
  return ChangeHistoryManager.getInstance(viewId);
}
