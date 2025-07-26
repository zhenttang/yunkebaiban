import { computed } from '@preact/signals-core';

import { evalFilter } from '../../core/filter/eval.js';
import { FilterTrait, filterTraitKey } from '../../core/filter/trait.js';
import type { FilterGroup } from '../../core/filter/types.js';
import { emptyFilterGroup } from '../../core/filter/utils.js';
import { GroupTrait, groupTraitKey } from '../../core/group-by/trait.js';
import { SortManager, sortTraitKey } from '../../core/sort/manager.js';
import { PropertyBase } from '../../core/view-manager/property.js';
import { RowBase } from '../../core/view-manager/row.js';
import { SingleViewBase } from '../../core/view-manager/single-view.js';
import type { ViewManager } from '../../core/view-manager/view-manager.js';
import type { 
  GanttViewData, 
  TaskDependency, 
  TimelineConfig, 
  DisplayConfig,
  GanttViewColumn 
} from './define.js';

/**
 * 甘特图属性类
 */
export class GanttProperty extends PropertyBase {
  constructor(
    private readonly ganttView: GanttSingleView,
    columnId: string
  ) {
    super(ganttView, columnId);
  }

  /**
   * 移动属性到指定位置
   */
  move(position: import('@blocksuite/affine-shared/utils').InsertToPosition): void {
    console.log('🚚 [GanttProperty] Moving property to position:', position);
    
    try {
      // 获取当前列数据
      const currentColumns = this.ganttView.data$.value?.columns || [];
      const targetColumn = currentColumns.find(col => col.id === this.id);
      
      if (!targetColumn) {
        console.warn('⚠️ [GanttProperty] Column not found for move operation:', this.id);
        return;
      }

      // 从当前位置移除
      const filteredColumns = currentColumns.filter(col => col.id !== this.id);
      
      // 计算新的插入位置
      let insertIndex = filteredColumns.length;
      
      if (position.before !== undefined && position.id) {
        const targetIndex = filteredColumns.findIndex(col => col.id === position.id);
        if (targetIndex >= 0) {
          insertIndex = position.before ? targetIndex : targetIndex + 1;
        }
      }
      
      // 插入到新位置
      const newColumns = [...filteredColumns];
      newColumns.splice(insertIndex, 0, targetColumn);
      
      // 更新视图数据
      this.ganttView.dataUpdate(() => ({
        columns: newColumns
      }));
      
      console.log('✅ [GanttProperty] Successfully moved property');
    } catch (error) {
      console.error('❌ [GanttProperty] Error moving property:', error);
    }
  }
}

/**
 * 甘特图行类
 */
export class GanttRow extends RowBase {
  constructor(
    readonly ganttView: GanttSingleView,
    rowId: string
  ) {
    super(ganttView, rowId);
  }
}

/**
 * 甘特图单视图管理器
 * 负责管理甘特图视图的数据和业务逻辑
 */
export class GanttSingleView extends SingleViewBase<GanttViewData> {
  
  /**
   * 视图类型
   */
  override get type(): string {
    return this.data$.value?.mode ?? 'gantt';
  }

  /**
   * 只读状态
   */
  readonly$ = computed(() => {
    return this.manager.readonly$.value;
  });

  /**
   * 详细属性列表（用于详情视图等）
   */
  detailProperties$ = computed(() => {
    return this.propertiesRaw$.value.filter(
      property => property.type$.value !== 'title'
    );
  });

  /**
   * 主要属性配置（标题列、图标列等）
   */
  mainProperties$ = computed(() => {
    return (
      this.data$.value?.header ?? {
        titleColumn: this.propertiesRaw$.value.find(
          property => property.type$.value === 'title'
        )?.id,
        iconColumn: 'type',
      }
    );
  });
  
  /**
   * 原始属性列表（包含隐藏的列）
   */
  propertiesRaw$ = computed(() => {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    
    this.data$.value?.columns.forEach(column => {
      if (needShow.has(column.id)) {
        result.push(column.id);
        needShow.delete(column.id);
      }
    });
    
    // 添加剩余的属性
    result.push(...needShow);
    return result.map(id => this.propertyGetOrCreate(id));
  });

  /**
   * 可见属性列表（不包含隐藏的列）
   */
  properties$ = computed(() => {
    return this.propertiesRaw$.value.filter(property => {
      try {
        // 检查属性是否被隐藏
        const columnData = this.data$.value?.columns.find(col => col.id === property.id);
        return !(columnData?.hide === true);
      } catch (e) {
        console.warn('⚠️ [GanttSingleView] Error checking property visibility:', e);
        return true; // 默认显示
      }
    });
  });

  /**
   * 过滤器配置
   */
  private readonly filter$ = computed(() => {
    return this.data$.value?.filter ?? emptyFilterGroup;
  });

  /**
   * 排序管理器
   */
  readonly sortManager = new SortManager(this, sortTraitKey);

  /**
   * 甘特图时间轴配置
   */
  readonly timeline$ = computed(() => {
    return this.data$.value?.timeline ?? this.getDefaultTimeline();
  });

  /**
   * 甘特图显示配置
   */
  readonly display$ = computed(() => {
    return this.data$.value?.display ?? this.getDefaultDisplay();
  });

  /**
   * 任务依赖关系列表
   */
  readonly dependencies$ = computed(() => {
    return this.data$.value?.dependencies ?? [];
  });

  /**
   * 经过过滤的行数据
   */
  readonly rows$ = computed(() => {
    return this.dataSource.rows$.value.filter(rowId => {
      const filterResult = evalFilter(this.filter$.value, {
        dataSource: this.dataSource,
        rowId,
        ast: true,
      });
      return filterResult.type === 'filter' ? filterResult.value : true;
    }).map(rowId => this.rowGetOrCreate(rowId));
  });

  constructor(viewManager: ViewManager, id: string) {
    super(viewManager, id);
  }

  // ==================== 必需的抽象方法实现 ====================

  /**
   * 添加新属性/列
   */
  override propertyAdd(
    position: import('@blocksuite/affine-shared/utils').InsertToPosition,
    ops?: {
      type?: string;
      name?: string;
    }
  ): string | undefined {
    console.log('➕ [GanttSingleView] Adding property:', ops);
    
    // 调用父类方法添加到数据源
    const id = this.dataSource.propertyAdd(position, ops);
    if (!id) {
      console.error('❌ [GanttSingleView] Failed to add property to datasource');
      return;
    }
    
    console.log('✅ [GanttSingleView] Added property to datasource:', id);
    
    try {
      // 添加到甘特图视图的列配置
      const currentColumns = this.data$.value?.columns || [];
      
      // 检查是否已存在
      const existingColumn = currentColumns.find(col => col.id === id);
      if (existingColumn) {
        console.log('⚠️ [GanttSingleView] Column already exists in view:', id);
        return id;
      }
      
      // 创建新的列配置
      const newColumn: GanttViewColumn = {
        id,
        hide: false,
        width: 120, // 默认宽度
      };
      
      // 计算插入位置
      let insertIndex = currentColumns.length;
      if (position.before !== undefined && position.id) {
        const targetIndex = currentColumns.findIndex(col => col.id === position.id);
        if (targetIndex >= 0) {
          insertIndex = position.before ? targetIndex : targetIndex + 1;
        }
      }
      
      // 插入新列
      const newColumns = [...currentColumns];
      newColumns.splice(insertIndex, 0, newColumn);
      
      // 更新视图数据
      this.dataUpdate(() => ({
        columns: newColumns
      }));
      
      console.log('✅ [GanttSingleView] Added column to view configuration:', newColumn);
      return id;
    } catch (error) {
      console.error('❌ [GanttSingleView] Error adding column to view:', error);
      // 如果视图配置失败，不要回滚数据源的添加，只是返回 ID
      return id;
    }
  }

  /**
   * 创建属性实例  
   */
  propertyGetOrCreate(columnId: string): GanttProperty {
    return new GanttProperty(this, columnId);
  }

  /**
   * 创建行实例
   */
  override rowGetOrCreate(rowId: string): GanttRow {
    return new GanttRow(this, rowId);
  }

  /**
   * 检查行是否应该显示（基于过滤条件）
   */
  isShow(rowId: string): boolean {
    if (this.filter$.value?.conditions.length) {
      const filterResult = evalFilter(this.filter$.value, {
        dataSource: this.dataSource,
        rowId,
        ast: true,
      });
      return filterResult.type === 'filter' ? filterResult.value : true;
    }
    return true;
  }

  // ==================== 甘特图专用方法 ====================

  /**
   * 更新时间轴配置
   */
  updateTimeline(timeline: Partial<TimelineConfig>) {
    console.log('🔄 [GanttSingleView] Updating timeline:', timeline);
    
    try {
      const currentTimeline = this.timeline$.value;
      console.log('📅 [GanttSingleView] Current timeline:', currentTimeline);
      
      this.dataUpdate(data => ({
        ...data,
        timeline: {
          ...currentTimeline,
          ...timeline,
        },
      }));
      
      console.log('✅ [GanttSingleView] Timeline updated successfully');
    } catch (error) {
      console.error('❌ [GanttSingleView] Error updating timeline:', error);
    }
  }

  /**
   * 更新显示配置
   */
  updateDisplay(display: Partial<DisplayConfig>) {
    this.dataUpdate(data => ({
      ...data,
      display: {
        ...data.display,
        ...display,
      },
    }));
  }

  /**
   * 添加任务依赖关系
   */
  addDependency(fromTaskId: string, toTaskId: string, type: TaskDependency['type'], lag = 0) {
    // 检查是否会产生循环依赖
    if (this.wouldCreateCircularDependency(fromTaskId, toTaskId)) {
      throw new Error('Adding this dependency would create a circular dependency');
    }

    const dependencies = [...this.dependencies$.value];
    const newDependency: TaskDependency = {
      id: `${fromTaskId}-${toTaskId}`,
      fromTaskId,
      toTaskId,
      type,
      lag,
      isFlexible: true,
    };

    dependencies.push(newDependency);

    this.dataUpdate(data => ({
      ...data,
      dependencies,
    }));
  }

  /**
   * 移除任务依赖关系
   */
  removeDependency(dependencyId: string) {
    const dependencies = this.dependencies$.value.filter(dep => dep.id !== dependencyId);
    
    this.dataUpdate(data => ({
      ...data,
      dependencies,
    }));
  }

  /**
   * 更新任务依赖关系
   */
  updateDependency(dependencyId: string, updates: Partial<Omit<TaskDependency, 'id'>>) {
    const dependencies = this.dependencies$.value.map(dep => 
      dep.id === dependencyId ? { ...dep, ...updates } : dep
    );

    this.dataUpdate(data => ({
      ...data,
      dependencies,
    }));
  }

  /**
   * 获取指定任务的所有前置依赖
   */
  getTaskPredecessors(taskId: string): TaskDependency[] {
    return this.dependencies$.value.filter(dep => dep.toTaskId === taskId);
  }

  /**
   * 获取指定任务的所有后续依赖
   */
  getTaskSuccessors(taskId: string): TaskDependency[] {
    return this.dependencies$.value.filter(dep => dep.fromTaskId === taskId);
  }

  /**
   * 更新列配置
   */
  updateColumn(columnId: string, updates: Partial<GanttViewColumn>) {
    const columns = this.data$.value?.columns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ) ?? [];

    this.dataUpdate(data => ({
      ...data,
      columns,
    }));
  }

  /**
   * 切换列的可见性
   */
  toggleColumnVisibility(columnId: string) {
    const column = this.data$.value?.columns.find(col => col.id === columnId);
    if (column) {
      this.updateColumn(columnId, { hide: !column.hide });
    }
  }

  /**
   * 调整列宽
   */
  resizeColumn(columnId: string, width: number) {
    this.updateColumn(columnId, { width: Math.max(width, 100) }); // 最小宽度100px
  }

  // ==================== 私有辅助方法 ====================

  /**
   * 检查是否会产生循环依赖
   */
  private wouldCreateCircularDependency(fromTaskId: string, toTaskId: string): boolean {
    // 构建依赖图
    const dependencyMap = new Map<string, string[]>();
    
    for (const dep of this.dependencies$.value) {
      if (!dependencyMap.has(dep.fromTaskId)) {
        dependencyMap.set(dep.fromTaskId, []);
      }
      dependencyMap.get(dep.fromTaskId)!.push(dep.toTaskId);
    }

    // 添加新的依赖关系进行测试
    if (!dependencyMap.has(fromTaskId)) {
      dependencyMap.set(fromTaskId, []);
    }
    dependencyMap.get(fromTaskId)!.push(toTaskId);

    // 深度优先搜索检测循环
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (nodeId: string): boolean => {
      if (recursionStack.has(nodeId)) {
        return true; // 发现循环
      }
      
      if (visited.has(nodeId)) {
        return false; // 已访问过且无循环
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = dependencyMap.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (hasCycle(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // 检查所有节点
    for (const nodeId of dependencyMap.keys()) {
      if (hasCycle(nodeId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * 获取默认时间轴配置 - 默认按周显示（可动态切换）
   */
  private getDefaultTimeline(): TimelineConfig {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const startOfWeek = this.getWeekStart(new Date(now)).getTime();
    
    return {
      startDate: startOfWeek, // 从本周开始
      endDate: startOfWeek + 8 * oneWeek, // 8周后（适合的项目周期）
      unit: 'week', // 默认按周显示（用户可通过按钮切换为日/月）
      showWeekends: true,
      workingDays: [1, 2, 3, 4, 5], // 周一到周五
      unitWidth: 120, // 默认单位宽度，会根据时间单位动态调整
    };
  }

  /**
   * 获取默认显示配置
   */
  private getDefaultDisplay(): DisplayConfig {
    return {
      showCriticalPath: false,
      showProgress: true,
      compactMode: false,
      showDependencies: true,
      showWorkingDayGrid: true,
    };
  }

  // ==================== 特性支持 ====================

  [filterTraitKey] = FilterTrait;
  [groupTraitKey] = GroupTrait;
  [sortTraitKey] = this.sortManager;
}