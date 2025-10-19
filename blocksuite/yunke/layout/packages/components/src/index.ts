/**
 * BlockSuite 布局组件库主入口
 * 
 * 提供多列布局系统的UI组件，包含响应式功能集成
 */

// 组件导出
export { LayoutSwitcher } from './layout-switcher/layout-switcher.js';
export { ColumnContent } from './column-content/column-content.js';

// 服务导出
export { LayoutRenderer } from './services/layout-renderer.js';
export type { LayoutRenderConfig } from './services/layout-renderer.js';

// 事件系统导出
export { 
  LayoutEventBus, 
  layoutEventBus, 
  emitLayoutEvent, 
  withLayoutEvents 
} from './events/layout-event-bus.js';
export type {
  LayoutEvent,
  LayoutEventListener,
  LayoutInitEvent,
  LayoutErrorEvent,
  LayoutStateChangeEvent,
  BlockSelectionEvent,
  LayoutQualityEvent,
  LayoutEventMixin
} from './events/layout-event-bus.js';

// 性能优化导出
export {
  VirtualScrollManager,
  LazyLoadManager,
  DebounceManager,
  ThrottleManager,
  PerformanceMonitor,
  PerformanceOptimizer
} from './performance/performance-optimizer.js';
export type {
  VirtualScrollConfig,
  VirtualScrollItem
} from './performance/performance-optimizer.js';

// 类型定义导出
export type {
  PageLayoutMode,
  LayoutModeConfig,
  LayoutModeChangeEvent,
  BlockMoveEvent,
  ColumnResizeEvent,
  Block,
  ILayoutSwitcher,
  IColumnContent,
  ILayoutToolbar,
  IPageLayoutService,
  IStorageService,
  IColumnDistributor
} from './types/component-contracts.js';

// 配置导出
export { LayoutModeConfigMap } from './types/component-contracts.js';

// 设计系统导出
export { DesignTokens, StyleUtils, CommonStyles, AnimationKeyframes } from './shared/design-tokens.js';

// 样式导出
export { layoutSwitcherStyles, LayoutModeIcons, LayoutModeLabels } from './layout-switcher/styles.js';
export { columnContentStyles, EmptyStateIcons } from './column-content/styles.js';

// 响应式功能类型导出（从interactions包重新导出）
export type { 
  ResponsiveChangeEvent, 
  ResponsiveBreakpoint 
} from '@blocksuite/yunke-layout-interactions/types/responsive-contracts';

// 使用示例导出（可选，用于开发和测试）
export { ResponsiveLayoutDemo } from './examples/responsive-layout-demo.js';