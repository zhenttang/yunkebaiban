/**
 * UI组件接口契约定义
 * 
 * 这些接口定义了UI组件层与核心服务层之间的契约
 * 在真实的核心服务就绪之前，我们使用这些接口进行开发
 */

import { TemplateResult } from 'lit';

// ============= 基础类型定义 =============

export enum PageLayoutMode {
  Normal = 'normal',
  TwoColumn = '2-column',
  ThreeColumn = '3-column',
  FourColumn = '4-column',
  FiveColumn = '5-column'
}

export interface LayoutModeConfig {
  columns: number;
  icon: string;
  label: string;
  defaultWidths: number[];
}

export const LayoutModeConfigMap: Record<PageLayoutMode, LayoutModeConfig> = {
  [PageLayoutMode.Normal]: {
    columns: 1,
    icon: '▊',
    label: '单列',
    defaultWidths: [1]
  },
  [PageLayoutMode.TwoColumn]: {
    columns: 2,
    icon: '▊▊',
    label: '双列',
    defaultWidths: [1, 1]
  },
  [PageLayoutMode.ThreeColumn]: {
    columns: 3,
    icon: '▊▊▊',
    label: '三列',
    defaultWidths: [1, 1, 1]
  },
  [PageLayoutMode.FourColumn]: {
    columns: 4,
    icon: '▊▊▊▊',
    label: '四列',
    defaultWidths: [1, 1, 1, 1]
  },
  [PageLayoutMode.FiveColumn]: {
    columns: 5,
    icon: '▊▊▊▊▊',
    label: '五列',
    defaultWidths: [1, 1, 1, 1, 1]
  }
};

// ============= 事件类型定义 =============

export interface LayoutModeChangeEvent {
  docId: string;
  previousMode: PageLayoutMode;
  currentMode: PageLayoutMode;
  timestamp: number;
  source: 'user' | 'responsive' | 'api';
}

export interface BlockMoveEvent {
  blockId: string;
  fromColumn: number;
  toColumn: number;
  fromIndex: number;
  toIndex: number;
}

export interface ColumnResizeEvent {
  columnIndex: number;
  newWidth: number;
  allWidths: number[];
}

// ============= 组件接口定义 =============

/**
 * 布局切换器组件接口
 */
export interface ILayoutSwitcher {
  /**
   * 切换到指定布局模式
   */
  switchToMode(mode: PageLayoutMode): Promise<void>;
  
  /**
   * 设置组件禁用状态
   */
  setDisabled(disabled: boolean): void;
  
  /**
   * 监听模式切换事件
   */
  onModeSwitch: (callback: (mode: PageLayoutMode) => void) => void;
  
  /**
   * 设置当前可用的模式
   */
  setAvailableModes(modes: PageLayoutMode[]): void;
}

/**
 * 列内容组件接口
 */
export interface IColumnContent {
  /**
   * 设置列中的Block列表
   */
  setBlocks(blocks: Block[]): void;
  
  /**
   * 在指定位置添加Block
   */
  addBlock(block: Block, index?: number): void;
  
  /**
   * 移除指定的Block
   */
  removeBlock(blockId: string): void;
  
  /**
   * 监听Block移动事件
   */
  onBlockMove: (callback: (event: BlockMoveEvent) => void) => void;
  
  /**
   * 设置只读模式
   */
  setReadonly(readonly: boolean): void;
}

/**
 * 布局工具栏组件接口
 */
export interface ILayoutToolbar {
  /**
   * 设置当前布局模式
   */
  setCurrentMode(mode: PageLayoutMode): void;
  
  /**
   * 设置可用的布局模式
   */
  setAvailableModes(modes: PageLayoutMode[]): void;
  
  /**
   * 添加自定义工具栏操作
   */
  addCustomAction(action: ToolbarAction): void;
  
  /**
   * 显示/隐藏工具栏
   */
  setVisible(visible: boolean): void;
}

// ============= Block类型定义 (临时) =============

/**
 * Block基础接口 (临时定义，等待核心服务提供)
 */
export interface Block {
  id: string;
  flavour: string;
  text?: string;
  children: Block[];
  parent: Block | null;
  props?: Record<string, any>;
}

// ============= 工具栏操作定义 =============

export interface ToolbarAction {
  id: string;
  label: string;
  icon: string | TemplateResult;
  tooltip?: string;
  disabled?: boolean;
  onClick: () => void;
}

// ============= 观察者模式定义 =============

export interface Observable<T> {
  subscribe(callback: (value: T) => void): () => void;
}

// ============= 服务接口定义 (等待核心服务实现) =============

/**
 * 页面布局服务接口 (临时定义)
 * 这个接口将由开发者A1提供具体实现
 */
export interface IPageLayoutService {
  setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void>;
  getLayoutMode(docId: string): PageLayoutMode;
  onLayoutModeChange(): Observable<LayoutModeChangeEvent>;
  distributeContent(blocks: Block[]): Block[][];
}

/**
 * 存储服务接口 (临时定义)
 * 这个接口将由开发者A2提供具体实现
 */
export interface IStorageService {
  saveLayoutConfig(docId: string, config: any): Promise<void>;
  loadLayoutConfig(docId: string): Promise<any>;
}

/**
 * 内容分配器接口 (临时定义)
 * 这个接口将由开发者A3提供具体实现
 */
export interface IColumnDistributor {
  distributeBlocks(blocks: Block[], columnCount: number): Block[][];
  redistributeOnModeChange(currentColumns: Block[][], newColumnCount: number): Block[][];
}