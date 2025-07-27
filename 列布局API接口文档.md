# BlockSuite 列布局 API 接口文档

## 📚 API 概览

本文档描述了BlockSuite列布局系统的所有公共API接口，包括服务类、组件接口、事件系统和扩展接口。

## 🏗️ 核心服务 API

### 1. PageLayoutService

#### 类定义
```typescript
export class PageLayoutService {
  // 构造函数
  constructor(options?: PageLayoutServiceOptions);
  
  // 属性
  readonly currentMode$: ReadonlySignal<PageLayoutMode>;
  readonly columnCount$: ReadonlySignal<number>;
  readonly isTransitioning$: ReadonlySignal<boolean>;
  readonly effectiveMode$: ReadonlySignal<PageLayoutMode>;
  
  // 方法
  setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void>;
  getLayoutMode(docId: string): PageLayoutMode;
  setColumnWidths(widths: number[], docId: string): Promise<void>;
  getColumnWidths(docId: string): number[];
  distributeContent(blocks: Block[]): Block[][];
  recalculateLayout(docId: string): Promise<void>;
  
  // 事件监听
  onLayoutModeChange(): Observable<LayoutModeChangeEvent>;
  onLayoutError(): Observable<LayoutError>;
  onColumnWidthChange(): Observable<ColumnWidthChangeEvent>;
  
  // 生命周期
  initialize(): Promise<void>;
  dispose(): Promise<void>;
}
```

#### 接口定义

```typescript
interface PageLayoutServiceOptions {
  defaultMode?: PageLayoutMode;
  enableResponsive?: boolean;
  enableAnimation?: boolean;
  cacheSize?: number;
  syncProvider?: SyncProvider;
}

interface LayoutModeChangeEvent {
  docId: string;
  previousMode: PageLayoutMode;
  currentMode: PageLayoutMode;
  timestamp: number;
  source: 'user' | 'responsive' | 'api';
}

interface LayoutError {
  code: LayoutErrorCode;
  message: string;
  docId?: string;
  mode?: PageLayoutMode;
  cause?: Error;
}

enum LayoutErrorCode {
  INVALID_MODE = 'INVALID_MODE',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DISTRIBUTION_ERROR = 'DISTRIBUTION_ERROR',
  RENDERING_ERROR = 'RENDERING_ERROR'
}
```

#### 使用示例

```typescript
// 初始化服务
const layoutService = new PageLayoutService({
  defaultMode: PageLayoutMode.Normal,
  enableResponsive: true,
  enableAnimation: true
});

await layoutService.initialize();

// 切换布局模式
await layoutService.setLayoutMode(PageLayoutMode.ThreeColumn, 'doc-123');

// 监听布局变化
layoutService.onLayoutModeChange().subscribe(event => {
  console.log(`布局从 ${event.previousMode} 切换到 ${event.currentMode}`);
});

// 获取当前模式
const currentMode = layoutService.getLayoutMode('doc-123');

// 设置列宽度
await layoutService.setColumnWidths([1, 2, 1], 'doc-123');
```

### 2. ColumnDistributor

#### 类定义
```typescript
export class ColumnDistributor {
  constructor(options?: ColumnDistributorOptions);
  
  // 主要方法
  distributeBlocks(
    blocks: Block[], 
    columnCount: number, 
    strategy?: DistributionStrategy
  ): Block[][];
  
  redistributeOnModeChange(
    currentColumns: Block[][],
    newColumnCount: number
  ): Block[][];
  
  estimateLayoutHeight(columns: Block[][]): number[];
  
  // 策略管理
  registerStrategy(name: string, strategy: DistributionAlgorithm): void;
  unregisterStrategy(name: string): void;
  getAvailableStrategies(): string[];
  
  // 配置
  setBlockHeightEstimator(estimator: BlockHeightEstimator): void;
  setDistributionWeights(weights: DistributionWeights): void;
}
```

#### 接口定义

```typescript
interface ColumnDistributorOptions {
  defaultStrategy?: DistributionStrategy;
  enableHeightOptimization?: boolean;
  heightEstimator?: BlockHeightEstimator;
}

type DistributionStrategy = 
  | 'round-robin'
  | 'balanced-height' 
  | 'content-aware'
  | 'custom';

interface DistributionAlgorithm {
  distribute(blocks: Block[], columnCount: number): Block[][];
  estimateQuality(result: Block[][]): number;
}

interface BlockHeightEstimator {
  estimate(block: Block): number;
  cacheHeight(blockId: string, height: number): void;
  getCachedHeight(blockId: string): number | null;
}

interface DistributionWeights {
  heightBalance: number;    // 高度平衡权重
  contentType: number;      // 内容类型权重
  userPreference: number;   // 用户偏好权重
}
```

#### 使用示例

```typescript
// 创建分配器
const distributor = new ColumnDistributor({
  defaultStrategy: 'balanced-height',
  enableHeightOptimization: true
});

// 分配Block到3列
const blocks = getDocumentBlocks();
const columns = distributor.distributeBlocks(blocks, 3);

// 注册自定义策略
distributor.registerStrategy('priority-based', new PriorityDistribution());

// 使用自定义策略分配
const priorityColumns = distributor.distributeBlocks(
  blocks, 
  3, 
  'priority-based'
);
```

### 3. StorageService

#### 类定义
```typescript
export class StorageService {
  constructor(options?: StorageServiceOptions);
  
  // 配置管理
  saveLayoutConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void>;
  loadLayoutConfig(docId: string): Promise<DocLayoutConfig | null>;
  updateLayoutConfig(docId: string, updates: Partial<DocLayoutConfig>): Promise<void>;
  deleteLayoutConfig(docId: string): Promise<void>;
  
  // 批量操作
  saveMultipleConfigs(configs: DocLayoutConfigBatch): Promise<void>;
  loadMultipleConfigs(docIds: string[]): Promise<Map<string, DocLayoutConfig>>;
  
  // 缓存管理
  clearCache(): void;
  getCacheSize(): number;
  setCacheOptions(options: CacheOptions): void;
  
  // 同步管理
  enableSync(provider: SyncProvider): Promise<void>;
  disableSync(): void;
  forceSyncUp(docId: string): Promise<void>;
  forceSyncDown(docId: string): Promise<void>;
}
```

#### 接口定义

```typescript
interface StorageServiceOptions {
  enableCache?: boolean;
  cacheSize?: number;
  enableLocalStorage?: boolean;
  syncProvider?: SyncProvider;
  compressionLevel?: number;
}

interface DocLayoutConfig {
  docId: string;
  layoutMode: PageLayoutMode;
  columnWidths: number[];
  responsive: boolean;
  lastModified: number;
  version: string;
  customData?: Record<string, any>;
}

interface DocLayoutConfigBatch {
  configs: DocLayoutConfig[];
  batchId: string;
  timestamp: number;
}

interface SyncProvider {
  upload(config: DocLayoutConfig): Promise<void>;
  download(docId: string): Promise<DocLayoutConfig | null>;
  delete(docId: string): Promise<void>;
  list(): Promise<string[]>;
  
  onConflict?: (local: DocLayoutConfig, remote: DocLayoutConfig) => DocLayoutConfig;
  onError?: (error: SyncError) => void;
}

interface CacheOptions {
  maxSize: number;
  ttl: number;          // Time to live in milliseconds
  enableLRU: boolean;   // Least Recently Used eviction
}
```

#### 使用示例

```typescript
// 初始化存储服务
const storage = new StorageService({
  enableCache: true,
  cacheSize: 100,
  enableLocalStorage: true
});

// 保存布局配置
await storage.saveLayoutConfig('doc-123', {
  layoutMode: PageLayoutMode.ThreeColumn,
  columnWidths: [1, 2, 1],
  responsive: true
});

// 加载配置
const config = await storage.loadLayoutConfig('doc-123');

// 启用云同步
await storage.enableSync(new FirebaseSyncProvider());

// 批量保存
await storage.saveMultipleConfigs({
  configs: [config1, config2, config3],
  batchId: 'batch-001',
  timestamp: Date.now()
});
```

## 🎨 UI 组件 API

### 1. LayoutSwitcher

#### 组件属性
```typescript
interface LayoutSwitcherProps {
  docId: string;
  currentMode?: PageLayoutMode;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'horizontal' | 'vertical' | 'dropdown';
  showLabels?: boolean;
  customModes?: CustomLayoutMode[];
  
  // 事件回调
  onModeChange?: (mode: PageLayoutMode) => void;
  onModeChangeStart?: (mode: PageLayoutMode) => void;
  onModeChangeComplete?: (mode: PageLayoutMode) => void;
  onError?: (error: LayoutError) => void;
}

interface CustomLayoutMode {
  id: string;
  mode: PageLayoutMode;
  icon: string | TemplateResult;
  label: string;
  tooltip?: string;
  disabled?: boolean;
}
```

#### 使用示例
```typescript
// HTML模板中使用
html`
  <layout-switcher
    .docId=${this.docId}
    .currentMode=${this.currentMode}
    .size=${'medium'}
    .variant=${'horizontal'}
    .showLabels=${true}
    @mode-change=${this.handleModeChange}
    @mode-change-start=${this.handleModeChangeStart}
  ></layout-switcher>
`;

// 事件处理
private handleModeChange(event: CustomEvent<PageLayoutMode>) {
  console.log('模式已切换到:', event.detail);
}

// 程序化使用
const switcher = document.createElement('layout-switcher');
switcher.docId = 'doc-123';
switcher.currentMode = PageLayoutMode.TwoColumn;
switcher.addEventListener('mode-change', this.handleModeChange);
```

### 2. ColumnContent

#### 组件属性
```typescript
interface ColumnContentProps {
  columnIndex: number;
  blocks: Block[];
  readonly?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showHeader?: boolean;
  allowDrop?: boolean;
  allowReorder?: boolean;
  
  // 样式定制
  headerTemplate?: TemplateResult;
  footerTemplate?: TemplateResult;
  emptyTemplate?: TemplateResult;
  
  // 事件回调
  onBlockAdd?: (columnIndex: number, position: number) => void;
  onBlockRemove?: (blockId: string, columnIndex: number) => void;
  onBlockMove?: (blockId: string, fromIndex: number, toIndex: number) => void;
  onBlockDrop?: (event: BlockDropEvent) => void;
  onColumnResize?: (columnIndex: number, width: number) => void;
}

interface BlockDropEvent {
  sourceBlockId: string;
  targetColumnIndex: number;
  targetPosition: number;
  sourceColumnIndex?: number;
  dropEffect: 'move' | 'copy';
}
```

#### 使用示例
```typescript
// 基础使用
html`
  <column-content
    .columnIndex=${0}
    .blocks=${this.firstColumnBlocks}
    .readonly=${false}
    .showHeader=${true}
    @block-add=${this.handleBlockAdd}
    @block-drop=${this.handleBlockDrop}
  ></column-content>
`;

// 自定义模板
html`
  <column-content
    .columnIndex=${1}
    .blocks=${this.secondColumnBlocks}
    .headerTemplate=${html`
      <div class="custom-header">
        <span>自定义列头</span>
        <button @click=${this.clearColumn}>清空</button>
      </div>
    `}
    .emptyTemplate=${html`
      <div class="empty-state">
        <p>此列暂无内容</p>
        <button @click=${this.addFirstBlock}>添加第一个内容</button>
      </div>
    `}
  ></column-content>
`;
```

### 3. LayoutRenderer

#### 渲染器接口
```typescript
interface LayoutRenderer {
  // 主要渲染方法
  renderLayout(
    mode: PageLayoutMode,
    blocks: Block[],
    options?: LayoutRenderOptions
  ): Promise<TemplateResult>;
  
  renderColumn(
    columnIndex: number,
    blocks: Block[],
    options?: ColumnRenderOptions
  ): Promise<TemplateResult>;
  
  // 实用方法
  estimateRenderTime(blocks: Block[]): number;
  preloadAssets(blocks: Block[]): Promise<void>;
  cleanup(): void;
}

interface LayoutRenderOptions {
  enableAnimation?: boolean;
  enableVirtualization?: boolean;
  customColumnRenderer?: ColumnRenderer;
  responsive?: ResponsiveOptions;
  theme?: LayoutTheme;
}

interface ColumnRenderOptions {
  showHeader?: boolean;
  showFooter?: boolean;
  enableDragDrop?: boolean;
  virtualizeBlocks?: boolean;
  maxHeight?: number;
}

interface ResponsiveOptions {
  breakpoints: Record<string, number>;
  mobileFirst: boolean;
  hiddenModes: PageLayoutMode[];
}

interface LayoutTheme {
  colors: {
    primary: string;
    secondary: string;
    border: string;
    background: string;
  };
  spacing: {
    gap: number;
    padding: number;
    margin: number;
  };
  animation: {
    duration: number;
    easing: string;
  };
}
```

#### 使用示例
```typescript
// 创建渲染器实例
const renderer = new DefaultLayoutRenderer({
  enableAnimation: true,
  enableVirtualization: true,
  theme: {
    colors: {
      primary: '#007acc',
      secondary: '#f5f5f5',
      border: '#e0e0e0',
      background: '#ffffff'
    },
    spacing: {
      gap: 16,
      padding: 12,
      margin: 8
    }
  }
});

// 渲染布局
const layoutTemplate = await renderer.renderLayout(
  PageLayoutMode.ThreeColumn,
  documentBlocks,
  {
    enableAnimation: true,
    responsive: {
      breakpoints: { mobile: 768, tablet: 1024 },
      mobileFirst: true
    }
  }
);

// 渲染单列
const columnTemplate = await renderer.renderColumn(
  0,
  firstColumnBlocks,
  {
    showHeader: true,
    enableDragDrop: true,
    maxHeight: 800
  }
);
```

## 🎭 动画系统 API

### 1. AnimationManager

#### 类定义
```typescript
export class AnimationManager {
  constructor(options?: AnimationManagerOptions);
  
  // 布局切换动画
  transitionToLayout(
    fromMode: PageLayoutMode,
    toMode: PageLayoutMode,
    container: HTMLElement,
    options?: TransitionOptions
  ): Promise<void>;
  
  // 列动画
  animateColumnChanges(
    columns: HTMLElement[],
    changes: ColumnChange[],
    options?: ColumnAnimationOptions
  ): Promise<void>;
  
  // Block动画
  animateBlockMovement(
    block: HTMLElement,
    fromPosition: Position,
    toPosition: Position,
    options?: BlockAnimationOptions
  ): Promise<void>;
  
  // 工具方法
  preloadAnimations(): Promise<void>;
  cancelAllAnimations(): void;
  pauseAnimations(): void;
  resumeAnimations(): void;
}
```

#### 接口定义
```typescript
interface AnimationManagerOptions {
  enableAnimations?: boolean;
  defaultDuration?: number;
  defaultEasing?: string;
  reducedMotion?: boolean;
}

interface TransitionOptions {
  duration?: number;
  easing?: string;
  stagger?: number;      // 各列动画间隔时间
  direction?: 'in' | 'out' | 'cross';
  customKeyframes?: Keyframe[];
}

interface ColumnAnimationOptions {
  type: 'fade' | 'slide' | 'scale' | 'flip';
  duration?: number;
  easing?: string;
  stagger?: number;
}

interface BlockAnimationOptions {
  duration?: number;
  easing?: string;
  path?: 'direct' | 'arc' | 'bounce';
  onComplete?: () => void;
}

interface ColumnChange {
  type: 'add' | 'remove' | 'move' | 'resize';
  columnIndex: number;
  element: HTMLElement;
  metadata?: any;
}

interface Position {
  x: number;
  y: number;
  width?: number;
  height?: number;
}
```

#### 使用示例
```typescript
// 创建动画管理器
const animationManager = new AnimationManager({
  enableAnimations: true,
  defaultDuration: 300,
  defaultEasing: 'cubic-bezier(0.4, 0, 0.2, 1)'
});

// 执行布局切换动画
await animationManager.transitionToLayout(
  PageLayoutMode.Normal,
  PageLayoutMode.ThreeColumn,
  containerElement,
  {
    duration: 400,
    stagger: 100,
    direction: 'cross'
  }
);

// 动画Block移动
await animationManager.animateBlockMovement(
  blockElement,
  { x: 100, y: 200 },
  { x: 300, y: 400 },
  {
    duration: 500,
    path: 'arc',
    onComplete: () => console.log('移动完成')
  }
);
```

## 📱 响应式系统 API

### 1. ResponsiveManager

#### 类定义
```typescript
export class ResponsiveManager {
  constructor(options?: ResponsiveManagerOptions);
  
  // 模式计算
  getEffectiveMode(requestedMode: PageLayoutMode): PageLayoutMode;
  getMaxColumnsForWidth(width: number): number;
  getModeByColumnCount(columns: number): PageLayoutMode;
  
  // 监听器管理
  setupResponsiveListeners(
    container: HTMLElement,
    callback: ResponsiveCallback
  ): ResponsiveListenerHandle;
  
  removeResponsiveListeners(handle: ResponsiveListenerHandle): void;
  
  // 断点管理
  setBreakpoints(breakpoints: BreakpointConfig): void;
  getBreakpoints(): BreakpointConfig;
  getCurrentBreakpoint(): string;
  
  // 查询方法
  isDesktop(): boolean;
  isTablet(): boolean;
  isMobile(): boolean;
  matchesBreakpoint(name: string): boolean;
}
```

#### 接口定义
```typescript
interface ResponsiveManagerOptions {
  breakpoints?: BreakpointConfig;
  enableContainerQueries?: boolean;
  enableOrientationChange?: boolean;
  debounceDelay?: number;
}

interface BreakpointConfig {
  mobile: number;
  tablet: number;
  desktop: number;
  large?: number;
  [key: string]: number | undefined;
}

interface ResponsiveCallback {
  (event: ResponsiveChangeEvent): void;
}

interface ResponsiveChangeEvent {
  width: number;
  height: number;
  breakpoint: string;
  previousBreakpoint: string;
  orientation: 'portrait' | 'landscape';
  effectiveMode: PageLayoutMode;
  maxColumns: number;
}

interface ResponsiveListenerHandle {
  id: string;
  container: HTMLElement;
  observer: ResizeObserver;
  cleanup: () => void;
}
```

#### 使用示例
```typescript
// 创建响应式管理器
const responsiveManager = new ResponsiveManager({
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    large: 1920
  },
  enableContainerQueries: true,
  debounceDelay: 250
});

// 获取有效模式
const effectiveMode = responsiveManager.getEffectiveMode(
  PageLayoutMode.FiveColumn
);

// 设置响应式监听
const handle = responsiveManager.setupResponsiveListeners(
  containerElement,
  (event) => {
    console.log(`窗口大小变化: ${event.width}x${event.height}`);
    console.log(`当前断点: ${event.breakpoint}`);
    console.log(`有效模式: ${event.effectiveMode}`);
    
    // 根据响应式变化调整布局
    layoutService.setLayoutMode(event.effectiveMode, docId);
  }
);

// 查询当前状态
if (responsiveManager.isMobile()) {
  console.log('当前是移动设备');
}

// 清理监听器
responsiveManager.removeResponsiveListeners(handle);
```

## 🔌 扩展系统 API

### 1. LayoutExtensionAPI

#### 接口定义
```typescript
export interface LayoutExtensionAPI {
  // 模式扩展
  registerLayoutMode(mode: CustomLayoutModeDefinition): void;
  unregisterLayoutMode(modeId: string): void;
  getRegisteredModes(): CustomLayoutModeDefinition[];
  
  // 策略扩展  
  registerDistributionStrategy(
    name: string, 
    strategy: DistributionAlgorithm
  ): void;
  unregisterDistributionStrategy(name: string): void;
  
  // 渲染器扩展
  registerCustomRenderer(
    modeId: string,
    renderer: CustomLayoutRenderer
  ): void;
  
  // 事件系统
  onLayoutChange(listener: LayoutChangeListener): UnsubscribeFunction;
  onColumnChange(listener: ColumnChangeListener): UnsubscribeFunction;
  onBlockMove(listener: BlockMoveListener): UnsubscribeFunction;
  
  // 状态查询
  getCurrentLayoutState(docId: string): LayoutState;
  getLayoutHistory(docId: string): LayoutHistoryEntry[];
  
  // 控制方法
  forceRecalculation(docId: string): Promise<void>;
  exportLayoutConfig(docId: string): DocLayoutConfig;
  importLayoutConfig(config: DocLayoutConfig): Promise<void>;
}
```

#### 类型定义
```typescript
interface CustomLayoutModeDefinition {
  id: string;
  name: string;
  description?: string;
  icon: string | TemplateResult;
  columnCount: number;
  constraints?: LayoutConstraints;
  renderer?: CustomLayoutRenderer;
  defaultColumnWidths?: number[];
  supportedBlockTypes?: string[];
  customProperties?: Record<string, any>;
}

interface CustomLayoutRenderer {
  renderLayout(
    blocks: Block[],
    options: LayoutRenderOptions
  ): Promise<TemplateResult>;
  
  supportsMode(mode: PageLayoutMode): boolean;
  getRequiredAssets?(): string[];
  preload?(): Promise<void>;
  cleanup?(): void;
}

interface LayoutState {
  docId: string;
  mode: PageLayoutMode;
  columnCount: number;
  columnWidths: number[];
  blockDistribution: Block[][];
  responsive: boolean;
  lastModified: number;
  isTransitioning: boolean;
}

interface LayoutHistoryEntry {
  timestamp: number;
  action: 'mode_change' | 'resize' | 'redistribute';
  from: Partial<LayoutState>;
  to: Partial<LayoutState>;
  source: 'user' | 'api' | 'responsive';
}

// 事件监听器类型
type LayoutChangeListener = (event: LayoutChangeEvent) => void;
type ColumnChangeListener = (event: ColumnChangeEvent) => void;
type BlockMoveListener = (event: BlockMoveEvent) => void;
type UnsubscribeFunction = () => void;

interface LayoutChangeEvent {
  type: 'layout_change';
  docId: string;
  previousState: LayoutState;
  currentState: LayoutState;
  timestamp: number;
}

interface ColumnChangeEvent {
  type: 'column_change';
  docId: string;
  columnIndex: number;
  changeType: 'width' | 'content' | 'add' | 'remove';
  oldValue: any;
  newValue: any;
  timestamp: number;
}

interface BlockMoveEvent {
  type: 'block_move';
  docId: string;
  blockId: string;
  fromColumn: number;
  toColumn: number;
  fromIndex: number;
  toIndex: number;
  timestamp: number;
}
```

#### 使用示例
```typescript
// 获取扩展API实例
const extensionAPI = getLayoutExtensionAPI();

// 注册自定义布局模式
extensionAPI.registerLayoutMode({
  id: 'sidebar-main',
  name: '侧边栏+主要内容',
  icon: '◧',
  columnCount: 2,
  defaultColumnWidths: [1, 3],
  constraints: {
    minColumns: 2,
    maxColumns: 2,
    supportedBlockTypes: ['affine:paragraph', 'affine:image']
  },
  renderer: new SidebarMainRenderer()
});

// 注册分配策略
extensionAPI.registerDistributionStrategy(
  'sidebar-priority',
  new SidebarPriorityDistribution()
);

// 监听布局变化
const unsubscribe = extensionAPI.onLayoutChange((event) => {
  console.log('布局已变化:', event);
  
  // 记录到分析系统
  analytics.track('layout_change', {
    docId: event.docId,
    from: event.previousState.mode,
    to: event.currentState.mode
  });
});

// 获取当前状态
const currentState = extensionAPI.getCurrentLayoutState('doc-123');

// 导出配置
const config = extensionAPI.exportLayoutConfig('doc-123');
await saveToFile(config, 'layout-config.json');

// 清理监听器
unsubscribe();
```

### 2. 插件基类

#### LayoutPlugin
```typescript
export abstract class LayoutPlugin {
  // 插件元信息
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly description?: string;
  abstract readonly author?: string;
  
  // 依赖声明
  readonly dependencies?: string[];
  readonly peerDependencies?: string[];
  
  // 生命周期方法
  abstract install(api: LayoutExtensionAPI): Promise<void>;
  abstract uninstall(): Promise<void>;
  
  // 可选生命周期钩子
  onActivate?(): Promise<void>;
  onDeactivate?(): Promise<void>;
  onLayoutModeChange?(from: PageLayoutMode, to: PageLayoutMode): void;
  onColumnResize?(columnIndex: number, newWidth: number): void;
  onBlockMove?(blockId: string, fromColumn: number, toColumn: number): void;
  
  // 配置方法
  getDefaultConfig?(): Record<string, any>;
  validateConfig?(config: Record<string, any>): boolean;
  updateConfig?(config: Record<string, any>): Promise<void>;
  
  // 状态管理
  getState?(): Record<string, any>;
  setState?(state: Record<string, any>): void;
  
  // 错误处理
  onError?(error: Error): void;
}
```

#### 插件管理器
```typescript
export class LayoutPluginManager {
  // 插件管理
  registerPlugin(plugin: LayoutPlugin): Promise<void>;
  unregisterPlugin(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): LayoutPlugin | null;
  getInstalledPlugins(): LayoutPlugin[];
  
  // 生命周期管理
  activatePlugin(pluginId: string): Promise<void>;
  deactivatePlugin(pluginId: string): Promise<void>;
  isPluginActive(pluginId: string): boolean;
  
  // 配置管理
  getPluginConfig(pluginId: string): Record<string, any>;
  setPluginConfig(pluginId: string, config: Record<string, any>): Promise<void>;
  
  // 依赖管理
  checkDependencies(pluginId: string): DependencyCheckResult;
  resolveDependencies(pluginId: string): Promise<void>;
  
  // 事件系统
  onPluginInstalled(listener: PluginEventListener): UnsubscribeFunction;
  onPluginUninstalled(listener: PluginEventListener): UnsubscribeFunction;
  onPluginError(listener: PluginErrorListener): UnsubscribeFunction;
}
```

## 🔧 工具函数 API

### 1. Layout Utilities

```typescript
// 布局计算工具
export namespace LayoutUtils {
  // 模式转换
  function modeToColumnCount(mode: PageLayoutMode): number;
  function columnCountToMode(count: number): PageLayoutMode;
  function getNextMode(currentMode: PageLayoutMode): PageLayoutMode;
  function getPreviousMode(currentMode: PageLayoutMode): PageLayoutMode;
  
  // 宽度计算
  function calculateColumnWidths(
    totalWidth: number,
    ratios: number[],
    gaps: number[]
  ): number[];
  
  function normalizeWidthRatios(ratios: number[]): number[];
  
  // 布局验证
  function isValidLayoutMode(mode: string): mode is PageLayoutMode;
  function isValidColumnConfiguration(config: ColumnConfig): boolean;
  function validateLayoutConstraints(
    mode: PageLayoutMode,
    constraints: LayoutConstraints
  ): ValidationResult;
  
  // 响应式计算
  function getEffectiveModeForWidth(
    requestedMode: PageLayoutMode,
    width: number,
    breakpoints: BreakpointConfig
  ): PageLayoutMode;
  
  // Block分析
  function analyzeBlockDistribution(columns: Block[][]): DistributionAnalysis;
  function estimateBlockHeight(block: Block): number;
  function groupBlocksByType(blocks: Block[]): Map<string, Block[]>;
}

// 类型定义
interface ColumnConfig {
  count: number;
  widths: number[];
  minWidths?: number[];
  maxWidths?: number[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface DistributionAnalysis {
  totalBlocks: number;
  averageBlocksPerColumn: number;
  heightBalance: number;        // 0-1, 1为完全平衡
  typeDistribution: Map<string, number>;
  recommendations: string[];
}
```

### 2. Storage Utilities

```typescript
export namespace StorageUtils {
  // 序列化
  function serializeLayoutConfig(config: DocLayoutConfig): string;
  function deserializeLayoutConfig(data: string): DocLayoutConfig;
  function compressLayoutConfig(config: DocLayoutConfig): ArrayBuffer;
  function decompressLayoutConfig(data: ArrayBuffer): DocLayoutConfig;
  
  // 验证
  function validateStoredConfig(data: any): data is DocLayoutConfig;
  function migrateOldConfig(oldConfig: any, version: string): DocLayoutConfig;
  
  // 批量操作
  function batchSerialize(configs: DocLayoutConfig[]): string;
  function batchDeserialize(data: string): DocLayoutConfig[];
  
  // 同步工具
  function generateConfigHash(config: DocLayoutConfig): string;
  function compareConfigs(
    local: DocLayoutConfig,
    remote: DocLayoutConfig
  ): ConfigComparison;
  
  function mergeConfigs(
    local: DocLayoutConfig,
    remote: DocLayoutConfig,
    strategy: MergeStrategy
  ): DocLayoutConfig;
}

// 类型定义
interface ConfigComparison {
  identical: boolean;
  differences: ConfigDifference[];
  conflictResolution: 'local' | 'remote' | 'merge' | 'manual';
}

interface ConfigDifference {
  field: string;
  localValue: any;
  remoteValue: any;
  timestamp: {
    local: number;
    remote: number;
  };
}

type MergeStrategy = 'latest-wins' | 'local-priority' | 'remote-priority' | 'custom';
```

### 3. Animation Utilities

```typescript
export namespace AnimationUtils {
  // 缓动函数
  function createEasingFunction(name: string): (t: number) => number;
  function cubicBezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number;
  
  // 关键帧生成
  function generateFadeKeyframes(direction: 'in' | 'out'): Keyframe[];
  function generateSlideKeyframes(
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number
  ): Keyframe[];
  function generateScaleKeyframes(from: number, to: number): Keyframe[];
  
  // 动画序列
  function createStaggeredAnimation(
    elements: HTMLElement[],
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions,
    stagger: number
  ): Animation[];
  
  function chainAnimations(animations: Animation[]): Promise<void>;
  function parallelAnimations(animations: Animation[]): Promise<void>;
  
  // 性能优化
  function batchAnimations(callback: () => void): void;
  function debounceAnimation(
    callback: () => void,
    delay: number
  ): () => void;
  
  // 检测支持
  function supportsWebAnimations(): boolean;
  function supportsCSS3Transforms(): boolean;
  function prefersReducedMotion(): boolean;
}
```

## 📊 错误处理与日志

### 1. Error Types

```typescript
// 错误类型
export class LayoutError extends Error {
  constructor(
    public code: LayoutErrorCode,
    message: string,
    public context?: LayoutErrorContext
  ) {
    super(message);
    this.name = 'LayoutError';
  }
}

export enum LayoutErrorCode {
  // 配置错误
  INVALID_LAYOUT_MODE = 'INVALID_LAYOUT_MODE',
  INVALID_COLUMN_CONFIG = 'INVALID_COLUMN_CONFIG',
  INVALID_DISTRIBUTION_STRATEGY = 'INVALID_DISTRIBUTION_STRATEGY',
  
  // 存储错误
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  STORAGE_ACCESS_DENIED = 'STORAGE_ACCESS_DENIED',
  STORAGE_CORRUPTION = 'STORAGE_CORRUPTION',
  
  // 渲染错误
  RENDER_TIMEOUT = 'RENDER_TIMEOUT',
  RENDER_MEMORY_ERROR = 'RENDER_MEMORY_ERROR',
  RENDER_DOM_ERROR = 'RENDER_DOM_ERROR',
  
  // 网络错误
  SYNC_CONNECTION_ERROR = 'SYNC_CONNECTION_ERROR',
  SYNC_AUTHENTICATION_ERROR = 'SYNC_AUTHENTICATION_ERROR',
  SYNC_CONFLICT_ERROR = 'SYNC_CONFLICT_ERROR',
  
  // 插件错误
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  PLUGIN_DEPENDENCY_ERROR = 'PLUGIN_DEPENDENCY_ERROR',
  PLUGIN_API_ERROR = 'PLUGIN_API_ERROR'
}

interface LayoutErrorContext {
  docId?: string;
  mode?: PageLayoutMode;
  columnIndex?: number;
  blockId?: string;
  pluginId?: string;
  stackTrace?: string;
  userAgent?: string;
  timestamp: number;
}
```

### 2. Logger API

```typescript
export class LayoutLogger {
  // 日志级别
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
  
  // 日志方法
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
  
  // 性能日志
  time(label: string): void;
  timeEnd(label: string): void;
  measure(name: string, startMark: string, endMark: string): void;
  
  // 自定义输出
  addAppender(appender: LogAppender): void;
  removeAppender(appender: LogAppender): void;
  
  // 配置
  setConfig(config: LoggerConfig): void;
  getConfig(): LoggerConfig;
}

enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

interface LogContext {
  docId?: string;
  mode?: PageLayoutMode;
  action?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface LogAppender {
  append(level: LogLevel, message: string, context?: LogContext): void;
  flush?(): void;
  close?(): void;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageSize: number;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enablePerformance: boolean;
}
```

#### 使用示例
```typescript
// 配置日志器
const logger = new LayoutLogger();
logger.setLevel(LogLevel.INFO);
logger.setConfig({
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  maxStorageSize: 1024 * 1024, // 1MB
  enablePerformance: true
});

// 记录日志
logger.info('布局模式切换', {
  docId: 'doc-123',
  mode: PageLayoutMode.ThreeColumn,
  action: 'user_click'
});

// 性能测量
logger.time('layout_render');
await renderLayout();
logger.timeEnd('layout_render');

// 错误处理
try {
  await layoutService.setLayoutMode(invalidMode, docId);
} catch (error) {
  logger.error('布局切换失败', error, {
    docId,
    mode: invalidMode,
    action: 'api_call'
  });
  
  throw new LayoutError(
    LayoutErrorCode.INVALID_LAYOUT_MODE,
    '不支持的布局模式',
    {
      docId,
      mode: invalidMode,
      timestamp: Date.now()
    }
  );
}
```

---

**文档版本**: v1.0  
**创建日期**: 2025-07-27  
**最后更新**: 2025-07-27  
**API版本**: 1.0.0  