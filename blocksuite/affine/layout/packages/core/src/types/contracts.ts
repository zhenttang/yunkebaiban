import { Observable } from 'rxjs';
import { signal } from '@preact/signals-core';

/**
 * 页面布局模式枚举
 */
export enum PageLayoutMode {
  Normal = 'normal',
  TwoColumn = '2-column',
  ThreeColumn = '3-column',
  FourColumn = '4-column',
  FiveColumn = '5-column'
}

/**
 * 布局模式配置
 */
export interface LayoutModeConfig {
  columns: number;
  minWidth: number;
  defaultWidths: number[];
  responsive: boolean;
}

/**
 * 布局模式配置映射
 */
export const LayoutModeConfigMap: Record<PageLayoutMode, LayoutModeConfig> = {
  [PageLayoutMode.Normal]: {
    columns: 1,
    minWidth: 400,
    defaultWidths: [1],
    responsive: true
  },
  [PageLayoutMode.TwoColumn]: {
    columns: 2,
    minWidth: 800,
    defaultWidths: [0.6, 0.4],
    responsive: true
  },
  [PageLayoutMode.ThreeColumn]: {
    columns: 3,
    minWidth: 1200,
    defaultWidths: [0.4, 0.3, 0.3],
    responsive: true
  },
  [PageLayoutMode.FourColumn]: {
    columns: 4,
    minWidth: 1600,
    defaultWidths: [0.25, 0.25, 0.25, 0.25],
    responsive: true
  },
  [PageLayoutMode.FiveColumn]: {
    columns: 5,
    minWidth: 2000,
    defaultWidths: [0.2, 0.2, 0.2, 0.2, 0.2],
    responsive: true
  }
};

/**
 * 布局模式变更事件
 */
export interface LayoutModeChangeEvent {
  docId: string;
  previousMode: PageLayoutMode;
  currentMode: PageLayoutMode;
  columnWidths: number[];
  timestamp: number;
  source: 'user' | 'auto' | 'responsive';
}

/**
 * Block实体接口
 */
export interface Block {
  id: string;
  type: string;
  content: any;
  properties?: Record<string, any>;
  children?: Block[];
  parent?: string;
  index: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * 文档布局配置
 */
export interface DocLayoutConfig {
  docId: string;
  layoutMode: PageLayoutMode;
  columnWidths: number[];
  responsive: boolean;
  lastModified: number;
  version: string;
  metadata?: Record<string, any>;
}

/**
 * 页面布局服务接口
 */
export interface IPageLayoutService {
  /**
   * 设置文档的布局模式
   */
  setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void>;
  
  /**
   * 获取文档的当前布局模式
   */
  getLayoutMode(docId: string): PageLayoutMode;
  
  /**
   * 设置列宽度
   */
  setColumnWidths(widths: number[], docId: string): Promise<void>;
  
  /**
   * 获取列宽度
   */
  getColumnWidths(docId: string): number[];
  
  /**
   * 监听布局模式变更事件
   */
  onLayoutModeChange(): Observable<LayoutModeChangeEvent>;
  
  /**
   * 获取当前布局配置
   */
  getLayoutConfig(docId: string): DocLayoutConfig | null;
  
  /**
   * 批量更新布局配置
   */
  updateLayoutConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void>;
  
  /**
   * 初始化服务
   */
  initialize(): Promise<void>;
  
  /**
   * 销毁服务
   */
  dispose(): Promise<void>;
}

/**
 * 存储服务接口
 */
export interface IStorageService {
  /**
   * 保存布局配置
   */
  saveLayoutConfig(docId: string, config: DocLayoutConfig): Promise<void>;
  
  /**
   * 加载布局配置
   */
  loadLayoutConfig(docId: string): Promise<DocLayoutConfig | null>;
  
  /**
   * 删除布局配置
   */
  clearLayoutConfig(docId: string): Promise<void>;
  
  /**
   * 获取所有文档的布局配置
   */
  getAllLayoutConfigs(): Promise<DocLayoutConfig[]>;
  
  /**
   * 批量保存布局配置
   */
  batchSaveLayoutConfigs(configs: DocLayoutConfig[]): Promise<void>;
}

/**
 * 列内容分配器接口
 */
export interface IColumnDistributor {
  /**
   * 将块分配到指定数量的列中
   */
  distributeBlocks(blocks: Block[], columnCount: number): Block[][];
  
  /**
   * 当布局模式改变时重新分配块
   */
  redistributeOnModeChange(currentColumns: Block[][], newColumnCount: number): Block[][];
  
  /**
   * 移动块到指定列和位置
   */
  moveBlock(blockId: string, targetColumn: number, targetIndex: number, columns: Block[][]): Block[][];
  
  /**
   * 获取分配质量评分
   */
  evaluateDistribution(columns: Block[][]): number;
}

/**
 * 块高度估算器接口
 */
export interface IBlockHeightEstimator {
  /**
   * 估算块的渲染高度
   */
  estimate(block: Block): number;
  
  /**
   * 缓存块的实际高度
   */
  cacheHeight(blockId: string, height: number): void;
  
  /**
   * 获取缓存的高度
   */
  getCachedHeight(blockId: string): number | null;
  
  /**
   * 清除缓存
   */
  clearCache(): void;
  
  /**
   * 批量估算块高度
   */
  batchEstimate(blocks: Block[]): number[];
}

/**
 * 服务令牌 - 用于依赖注入
 */
export const SERVICE_TOKENS = {
  PAGE_LAYOUT_SERVICE: Symbol('IPageLayoutService'),
  STORAGE_SERVICE: Symbol('IStorageService'),
  COLUMN_DISTRIBUTOR: Symbol('IColumnDistributor'),
  BLOCK_HEIGHT_ESTIMATOR: Symbol('IBlockHeightEstimator')
} as const;

/**
 * 布局变更操作类型
 */
export type LayoutChangeOperation = 
  | 'mode-change'
  | 'column-resize'
  | 'block-move'
  | 'block-add'
  | 'block-remove';

/**
 * 布局变更操作记录
 */
export interface LayoutChangeRecord {
  id: string;
  docId: string;
  operation: LayoutChangeOperation;
  timestamp: number;
  data: any;
  userId?: string;
  source: 'user' | 'system' | 'auto';
}

/**
 * 配置验证器接口
 */
export interface IConfigValidator {
  /**
   * 验证布局配置是否有效
   */
  validateLayoutConfig(config: DocLayoutConfig): ValidationResult;
  
  /**
   * 验证列宽度配置
   */
  validateColumnWidths(widths: number[]): ValidationResult;
  
  /**
   * 验证布局模式
   */
  validateLayoutMode(mode: PageLayoutMode, constraints?: any): ValidationResult;
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}