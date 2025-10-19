/**
 * CSS Grid 布局样式系统
 * 开发者B3任务：实现完整的CSS Grid布局样式
 */

import { css } from 'lit';

/**
 * 基础网格布局样式
 */
export const GridLayoutStyles = css`
  /* ===== 基础网格容器 ===== */
  .grid-layout-container {
    display: grid;
    width: 100%;
    height: 100%;
    gap: var(--spacing-4, 16px);
    padding: var(--spacing-6, 24px);
    background: var(--bg-primary, #ffffff);
    transition: all var(--duration-normal, 300ms) var(--easing-easeInOut, ease-in-out);
    position: relative;
    overflow: hidden;
  }
  
  /* ===== 列数布局变体 ===== */
  
  /* 单列布局 */
  .grid-layout-1 {
    grid-template-columns: 1fr;
    grid-template-areas: "content";
  }
  
  /* 双列布局 */  
  .grid-layout-2 {
    grid-template-columns: 1fr 1fr;
    grid-template-areas: "col1 col2";
  }
  
  /* 三列布局 */
  .grid-layout-3 {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-areas: "col1 col2 col3";
  }
  
  /* 四列布局 */
  .grid-layout-4 {
    grid-template-columns: repeat(4, 1fr);
    grid-template-areas: "col1 col2 col3 col4";
  }
  
  /* 五列布局 */
  .grid-layout-5 {
    grid-template-columns: repeat(5, 1fr);
    grid-template-areas: "col1 col2 col3 col4 col5";
  }
  
  /* ===== 自适应列宽变体 ===== */
  
  /* 黄金比例布局 (主次列) */
  .grid-layout-golden {
    grid-template-columns: 1.618fr 1fr;
  }
  
  /* 侧边栏布局 */
  .grid-layout-sidebar {
    grid-template-columns: 300px 1fr;
  }
  
  /* 三栏布局 (左侧边栏 + 内容 + 右侧边栏) */
  .grid-layout-three-panel {
    grid-template-columns: 250px 1fr 200px;
  }
  
  /* ===== 响应式网格 ===== */
  
  /* 移动端优先的响应式网格 */
  .grid-layout-responsive {
    display: grid;
    gap: var(--spacing-2, 8px);
    padding: var(--spacing-3, 12px);
  }
  
  /* 移动端：单列 */
  @media (max-width: 767px) {
    .grid-layout-responsive {
      grid-template-columns: 1fr;
    }
    
    .grid-layout-container {
      gap: var(--spacing-2, 8px);
      padding: var(--spacing-3, 12px);
    }
  }
  
  /* 平板端：双列 */
  @media (min-width: 768px) and (max-width: 1023px) {
    .grid-layout-responsive {
      grid-template-columns: 1fr 1fr;
    }
  }
  
  /* 桌面端：三列 */
  @media (min-width: 1024px) and (max-width: 1439px) {
    .grid-layout-responsive {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  
  /* 宽屏：四列 */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .grid-layout-responsive {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  
  /* 超宽屏：五列 */
  @media (min-width: 1920px) {
    .grid-layout-responsive {
      grid-template-columns: repeat(5, 1fr);
    }
  }
  
  /* ===== 容器查询支持 ===== */
  
  /* 基于容器宽度的自适应布局 */
  @container (max-width: 600px) {
    .grid-layout-container {
      grid-template-columns: 1fr !important;
      gap: var(--spacing-2, 8px);
    }
  }
  
  @container (min-width: 601px) and (max-width: 900px) {
    .grid-layout-container {
      grid-template-columns: 1fr 1fr !important;
    }
  }
  
  @container (min-width: 901px) and (max-width: 1200px) {
    .grid-layout-container {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }
  
  /* ===== 列样式 ===== */
  
  .grid-column {
    display: flex;
    flex-direction: column;
    min-height: 200px;
    background: var(--bg-primary, #ffffff);
    border: 1px solid var(--border-primary, #e5e7eb);
    border-radius: var(--border-radius-md, 6px);
    padding: var(--spacing-3, 12px);
    transition: all var(--duration-fast, 150ms) var(--easing-easeOut, ease-out);
    position: relative;
    overflow: hidden;
  }
  
  .grid-column:hover {
    border-color: var(--border-focus, #3b82f6);
    box-shadow: var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1));
    transform: translateY(-1px);
  }
  
  .grid-column.drag-over {
    border-color: var(--color-primary-500, #3b82f6);
    background: var(--color-primary-50, #eff6ff);
    box-shadow: var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1));
  }
  
  .grid-column.empty {
    border-style: dashed;
    border-color: var(--border-secondary, #d1d5db);
    background: var(--bg-secondary, #f9fafb);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary, #6b7280);
    font-style: italic;
  }
  
  /* ===== 列标题 ===== */
  
  .column-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-2, 8px) var(--spacing-3, 12px);
    background: var(--bg-secondary, #f9fafb);
    border-radius: var(--border-radius-default, 4px);
    margin-bottom: var(--spacing-3, 12px);
    border: 1px solid var(--border-primary, #e5e7eb);
  }
  
  .column-title {
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    color: var(--text-primary, #111827);
    margin: 0;
  }
  
  .column-stats {
    font-size: var(--font-size-xs, 12px);
    color: var(--text-secondary, #6b7280);
    display: flex;
    gap: var(--spacing-2, 8px);
  }
  
  .column-stats .stat-item {
    display: flex;
    align-items: center;
    gap: var(--spacing-1, 4px);
  }
  
  /* ===== 网格动画 ===== */
  
  .grid-layout-container.transitioning {
    pointer-events: none;
  }
  
  .grid-column.entering {
    animation: columnEnter var(--duration-normal, 300ms) var(--easing-easeOut, ease-out) forwards;
  }
  
  .grid-column.leaving {
    animation: columnLeave var(--duration-normal, 300ms) var(--easing-easeIn, ease-in) forwards;
  }
  
  @keyframes columnEnter {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes columnLeave {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-20px) scale(0.95);
    }
  }
  
  /* ===== 网格工具栏 ===== */
  
  .grid-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-4, 16px);
    background: var(--bg-elevated, #ffffff);
    border-bottom: 1px solid var(--border-primary, #e5e7eb);
    position: sticky;
    top: 0;
    z-index: var(--z-base, 0);
  }
  
  .grid-toolbar-section {
    display: flex;
    align-items: center;
    gap: var(--spacing-3, 12px);
  }
  
  .grid-layout-indicator {
    display: flex;
    align-items: center;
    gap: var(--spacing-2, 8px);
    padding: var(--spacing-2, 8px) var(--spacing-3, 12px);
    background: var(--bg-secondary, #f9fafb);
    border-radius: var(--border-radius-md, 6px);
    border: 1px solid var(--border-primary, #e5e7eb);
    font-size: var(--font-size-sm, 14px);
    color: var(--text-secondary, #6b7280);
  }
  
  .layout-mode-icon {
    display: grid;
    gap: 2px;
    width: 16px;
    height: 12px;
  }
  
  .layout-mode-icon.cols-1 { grid-template-columns: 1fr; }
  .layout-mode-icon.cols-2 { grid-template-columns: 1fr 1fr; }
  .layout-mode-icon.cols-3 { grid-template-columns: repeat(3, 1fr); }
  .layout-mode-icon.cols-4 { grid-template-columns: repeat(4, 1fr); }
  .layout-mode-icon.cols-5 { grid-template-columns: repeat(5, 1fr); }
  
  .layout-mode-icon .col-indicator {
    background: currentColor;
    border-radius: 1px;
    opacity: 0.6;
  }
  
  /* ===== 网格辅助线 ===== */
  
  .grid-guidelines {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 1;
    opacity: 0;
    transition: opacity var(--duration-fast, 150ms) var(--easing-easeOut, ease-out);
  }
  
  .grid-layout-container:hover .grid-guidelines {
    opacity: 1;
  }
  
  .grid-guidelines::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--color-primary-200, #bfdbfe);
    left: 50%;
    transform: translateX(-50%);
  }
  
  /* ===== 性能优化 ===== */
  
  .grid-layout-container {
    contain: layout style paint;
    will-change: grid-template-columns;
  }
  
  .grid-column {
    contain: layout style paint;
  }
  
  /* 减少重绘的优化 */
  .grid-layout-container.optimized .grid-column {
    transform: translateZ(0); /* 强制硬件加速 */
  }
  
  /* ===== 无障碍支持 ===== */
  
  @media (prefers-reduced-motion: reduce) {
    .grid-layout-container,
    .grid-column,
    .column-header {
      transition: none !important;
      animation: none !important;
    }
    
    .grid-column.entering,
    .grid-column.leaving {
      animation: none !important;
    }
  }
  
  /* 高对比度模式支持 */
  @media (prefers-contrast: high) {
    .grid-column {
      border-width: 2px;
    }
    
    .grid-column:hover,
    .grid-column.drag-over {
      border-width: 3px;
    }
  }
  
  /* ===== 打印样式 ===== */
  
  @media print {
    .grid-layout-container {
      display: block !important;
      gap: 0;
      padding: 0;
    }
    
    .grid-column {
      display: block;
      break-inside: avoid;
      border: 1px solid #000;
      margin-bottom: 1rem;
      padding: 1rem;
    }
    
    .grid-toolbar {
      display: none;
    }
  }
`;

/**
 * 网格工具类样式
 */
export const GridUtilityStyles = css`
  /* ===== 间距工具类 ===== */
  .gap-1 { gap: var(--spacing-1, 4px); }
  .gap-2 { gap: var(--spacing-2, 8px); }
  .gap-3 { gap: var(--spacing-3, 12px); }
  .gap-4 { gap: var(--spacing-4, 16px); }
  .gap-6 { gap: var(--spacing-6, 24px); }
  .gap-8 { gap: var(--spacing-8, 32px); }
  
  /* ===== 列宽工具类 ===== */
  .col-auto { grid-column: auto; }
  .col-span-1 { grid-column: span 1; }
  .col-span-2 { grid-column: span 2; }
  .col-span-3 { grid-column: span 3; }
  .col-span-4 { grid-column: span 4; }
  .col-span-5 { grid-column: span 5; }
  .col-span-full { grid-column: 1 / -1; }
  
  /* ===== 行高工具类 ===== */
  .row-auto { grid-row: auto; }
  .row-span-1 { grid-row: span 1; }
  .row-span-2 { grid-row: span 2; }
  .row-span-3 { grid-row: span 3; }
  .row-span-full { grid-row: 1 / -1; }
  
  /* ===== 对齐工具类 ===== */
  .justify-start { justify-content: start; }
  .justify-center { justify-content: center; }
  .justify-end { justify-content: end; }
  .justify-between { justify-content: space-between; }
  .justify-around { justify-content: space-around; }
  
  .items-start { align-items: start; }
  .items-center { align-items: center; }
  .items-end { align-items: end; }
  .items-stretch { align-items: stretch; }
  
  /* ===== 显示/隐藏工具类 ===== */
  .hidden { display: none; }
  .block { display: block; }
  .flex { display: flex; }
  .grid { display: grid; }
  .inline-block { display: inline-block; }
  .inline-flex { display: inline-flex; }
  .inline-grid { display: inline-grid; }
`;

/**
 * 主题变体样式
 */
export const GridThemeStyles = css`
  /* ===== 明亮主题 ===== */
  .theme-light {
    --bg-primary: #ffffff;
    --bg-secondary: #f9fafb;
    --bg-tertiary: #f3f4f6;
    --text-primary: #111827;
    --text-secondary: #6b7280;
    --border-primary: #e5e7eb;
    --border-secondary: #d1d5db;
  }
  
  /* ===== 暗色主题 ===== */
  .theme-dark {
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --bg-tertiary: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-primary: #374151;
    --border-secondary: #4b5563;
  }
  
  .theme-dark .grid-column {
    background: var(--bg-secondary);
    border-color: var(--border-primary);
  }
  
  .theme-dark .grid-column:hover {
    border-color: var(--color-primary-400, #60a5fa);
  }
  
  .theme-dark .column-header {
    background: var(--bg-tertiary);
    border-color: var(--border-primary);
  }
  
  /* ===== 高对比度主题 ===== */
  .theme-high-contrast {
    --bg-primary: #ffffff;
    --bg-secondary: #f0f0f0;
    --text-primary: #000000;
    --text-secondary: #333333;
    --border-primary: #000000;
    --border-secondary: #666666;
  }
  
  .theme-high-contrast .grid-column {
    border-width: 2px;
    border-color: var(--border-primary);
  }
  
  .theme-high-contrast .grid-column:hover {
    border-width: 3px;
    border-color: #0066cc;
  }
`;

/**
 * 组合所有网格样式
 */
export const CompleteGridStyles = css`
  ${GridLayoutStyles}
  ${GridUtilityStyles}
  ${GridThemeStyles}
`;