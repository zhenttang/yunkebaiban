// 响应式管理相关的类型定义和接口契约

// 布局模式枚举 (临时定义，等待Team A的正式版本)
export enum PageLayoutMode {
  Normal = 'normal',
  TwoColumn = '2-column',
  ThreeColumn = '3-column',
  FourColumn = '4-column',
  FiveColumn = '5-column'
}

// 响应式事件类型
export interface ResponsiveChangeEvent {
  width: number;
  height: number;
  breakpoint: string;
  previousBreakpoint: string;
  orientation: 'portrait' | 'landscape';
  effectiveMode: PageLayoutMode;
  maxColumns: number;
}

// 响应式回调函数类型
export interface ResponsiveCallback {
  (event: ResponsiveChangeEvent): void;
}

// 响应式监听器句柄
export interface ResponsiveListenerHandle {
  id: string;
  container: HTMLElement;
  observer: ResizeObserver;
  cleanup: () => void;
}

// 断点配置接口
export interface BreakpointConfig {
  mobile: number;    // 768px
  tablet: number;    // 1024px
  desktop: number;   // 1440px
  large?: number;    // 1920px
  [key: string]: number | undefined;
}

// 响应式管理器主要接口
export interface IResponsiveManager {
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

// 列宽调整器接口
export interface IColumnResizer {
  setColumnWidths(widths: number[]): void;
  onColumnResize: (callback: (widths: number[]) => void) => void;
  enable(): void;
  disable(): void;
}

// 列宽调整事件
export interface ColumnResizeEvent {
  columnIndex: number;
  oldWidth: number;
  newWidth: number;
  allWidths: number[];
  timestamp: number;
}

// 响应式管理器选项
export interface ResponsiveManagerOptions {
  breakpoints?: BreakpointConfig;
  enableContainerQueries?: boolean;
  enableOrientationChange?: boolean;
  debounceDelay?: number;
}

// 自适应布局建议
export interface LayoutRecommendation {
  recommendedMode: PageLayoutMode;
  confidence: number; // 0-1
  reason: string;
  alternativeMode?: PageLayoutMode;
}