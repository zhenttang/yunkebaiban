/**
 * 响应式样式系统
 * 开发者B3任务：实现完整的响应式布局样式
 */

import { css } from 'lit';

/**
 * 基础响应式样式
 */
export const ResponsiveBaseStyles = css`
  /* ===== 响应式容器 ===== */
  .responsive-container {
    container-type: inline-size;
    width: 100%;
    height: 100%;
  }
  
  /* ===== 流体网格系统 ===== */
  .fluid-grid {
    display: grid;
    gap: clamp(8px, 2vw, 24px);
    padding: clamp(12px, 3vw, 48px);
    grid-template-columns: repeat(var(--grid-columns, 1), minmax(0, 1fr));
    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* ===== 断点特定样式 ===== */
  
  /* 超小屏幕 (320px - 479px) */
  @media (max-width: 479px) {
    .responsive-container {
      --grid-columns: 1;
      --column-gap: 8px;
      --container-padding: 8px;
    }
    
    .fluid-grid {
      gap: var(--column-gap);
      padding: var(--container-padding);
    }
    
    .layout-switcher {
      display: none; /* 隐藏布局切换器 */
    }
    
    .column-header {
      padding: 6px 8px;
      font-size: 12px;
    }
    
    .block-item {
      padding: 8px;
      margin-bottom: 6px;
    }
  }
  
  /* 小屏幕 - 手机 (480px - 767px) */
  @media (min-width: 480px) and (max-width: 767px) {
    .responsive-container {
      --grid-columns: 1;
      --column-gap: 12px;
      --container-padding: 12px;
    }
    
    .layout-switcher {
      scale: 0.8; /* 缩小切换器 */
    }
    
    .layout-switcher .mode-button {
      width: 28px;
      height: 28px;
    }
    
    /* 允许在横屏时显示双列 */
    @media (orientation: landscape) {
      .responsive-container.allow-landscape-dual {
        --grid-columns: 2;
      }
    }
  }
  
  /* 中等屏幕 - 平板竖屏 (768px - 1023px) */
  @media (min-width: 768px) and (max-width: 1023px) {
    .responsive-container {
      --grid-columns: 2;
      --column-gap: 16px;
      --container-padding: 16px;
    }
    
    .layout-switcher .tooltip {
      display: none; /* 隐藏工具提示以节省空间 */
    }
    
    /* 平板横屏可以显示三列 */
    @media (orientation: landscape) {
      .responsive-container.allow-tablet-triple {
        --grid-columns: 3;
      }
    }
  }
  
  /* 大屏幕 - 平板横屏/小桌面 (1024px - 1439px) */
  @media (min-width: 1024px) and (max-width: 1439px) {
    .responsive-container {
      --grid-columns: 3;
      --column-gap: 20px;
      --container-padding: 24px;
    }
  }
  
  /* 超大屏幕 - 桌面 (1440px - 1919px) */
  @media (min-width: 1440px) and (max-width: 1919px) {
    .responsive-container {
      --grid-columns: 4;
      --column-gap: 24px;
      --container-padding: 32px;
    }
  }
  
  /* 巨大屏幕 - 宽屏桌面 (1920px+) */
  @media (min-width: 1920px) {
    .responsive-container {
      --grid-columns: 5;
      --column-gap: 32px;
      --container-padding: 48px;
    }
  }
  
  /* ===== 容器查询样式 ===== */
  
  /* 基于容器宽度的布局调整 */
  @container (max-width: 400px) {
    .fluid-grid {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 8px;
    }
    
    .column-header {
      display: none; /* 超窄容器隐藏列标题 */
    }
  }
  
  @container (min-width: 401px) and (max-width: 600px) {
    .fluid-grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 12px;
    }
  }
  
  @container (min-width: 601px) and (max-width: 900px) {
    .fluid-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      padding: 16px;
    }
  }
  
  @container (min-width: 901px) and (max-width: 1200px) {
    .fluid-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 20px;
    }
  }
  
  @container (min-width: 1201px) and (max-width: 1600px) {
    .fluid-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 24px;
      padding: 24px;
    }
  }
  
  @container (min-width: 1601px) {
    .fluid-grid {
      grid-template-columns: repeat(5, 1fr);
      gap: 32px;
      padding: 32px;
    }
  }
  
  /* ===== 设备特定优化 ===== */
  
  /* 触摸设备优化 */
  @media (pointer: coarse) {
    .layout-switcher .mode-button {
      min-width: 44px;
      min-height: 44px;
    }
    
    .block-item {
      padding: 16px; /* 增大触摸目标 */
    }
    
    .action-button {
      min-width: 44px;
      min-height: 44px;
      padding: 12px;
    }
    
    .column-resizer {
      width: 20px; /* 加宽拖拽手柄 */
    }
  }
  
  /* 精确指针设备优化 */
  @media (pointer: fine) {
    .layout-switcher .mode-button {
      min-width: 32px;
      min-height: 32px;
    }
    
    .column-resizer {
      width: 8px;
    }
    
    .column-resizer:hover {
      width: 12px;
    }
  }
  
  /* ===== 方向响应式样式 ===== */
  
  /* 竖屏模式 */
  @media (orientation: portrait) {
    .responsive-container {
      --max-columns: 2; /* 竖屏最多2列 */
    }
    
    .layout-switcher {
      flex-direction: column;
      gap: 8px;
    }
    
    .toolbar {
      flex-direction: column;
      gap: 12px;
    }
  }
  
  /* 横屏模式 */
  @media (orientation: landscape) {
    .responsive-container {
      --max-columns: 5; /* 横屏可以更多列 */
    }
    
    .layout-switcher {
      flex-direction: row;
      gap: 8px;
    }
  }
  
  /* ===== 像素密度响应式 ===== */
  
  /* 高像素密度屏幕优化 */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
    .grid-column {
      border-width: 0.5px; /* 更细的边框 */
    }
    
    .layout-mode-icon .col-indicator {
      width: 100%;
      height: 100%;
      background-size: contain;
    }
  }
  
  /* ===== 网络连接响应式 ===== */
  
  /* 慢速连接优化 */
  @media (prefers-reduced-data: reduce) {
    .grid-column {
      box-shadow: none; /* 减少视觉效果 */
    }
    
    .block-item {
      transition: none; /* 禁用动画 */
    }
    
    .particle-effects {
      display: none; /* 禁用粒子效果 */
    }
  }
  
  /* ===== 暗色模式响应式 ===== */
  
  @media (prefers-color-scheme: dark) {
    .responsive-container {
      --bg-primary: #111827;
      --bg-secondary: #1f2937;
      --text-primary: #f9fafb;
      --text-secondary: #d1d5db;
      --border-primary: #374151;
    }
    
    .grid-column {
      background: var(--bg-secondary);
      border-color: var(--border-primary);
      color: var(--text-primary);
    }
  }
  
  /* ===== 高对比度模式 ===== */
  
  @media (prefers-contrast: high) {
    .grid-column {
      border-width: 2px;
      border-color: currentColor;
    }
    
    .layout-switcher .mode-button {
      border: 2px solid currentColor;
    }
    
    .layout-switcher .mode-button:hover {
      background: currentColor;
      color: var(--bg-primary);
    }
  }
  
  /* ===== 减弱动画偏好 ===== */
  
  @media (prefers-reduced-motion: reduce) {
    .fluid-grid,
    .grid-column,
    .layout-switcher .mode-button,
    .block-item {
      transition: none !important;
      animation: none !important;
    }
    
    .layout-switcher .mode-button.animating {
      animation: none !important;
    }
  }
  
  /* ===== 强制颜色模式 ===== */
  
  @media (forced-colors: active) {
    .grid-column {
      border: 1px solid ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }
    
    .grid-column:hover {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
    
    .layout-switcher .mode-button {
      border: 1px solid ButtonText;
      background: ButtonFace;
      color: ButtonText;
    }
    
    .layout-switcher .mode-button.active {
      background: Highlight;
      color: HighlightText;
      border-color: Highlight;
    }
  }
`;

/**
 * 响应式网格组件样式
 */
export const ResponsiveComponentStyles = css`
  /* ===== 智能列宽 ===== */
  .smart-columns {
    display: grid;
    gap: var(--column-gap, 16px);
    grid-template-columns: repeat(
      auto-fit, 
      minmax(min(300px, 100%), 1fr)
    );
  }
  
  /* ===== 自适应卡片网格 ===== */
  .adaptive-card-grid {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(
      auto-fill,
      minmax(min(250px, 100%), 1fr)
    );
  }
  
  /* ===== 弹性列布局 ===== */
  .flexible-columns {
    display: grid;
    gap: var(--column-gap, 16px);
    grid-template-columns: repeat(
      var(--columns, auto-fit),
      minmax(var(--min-column-width, 200px), 1fr)
    );
  }
  
  /* ===== 响应式工具栏 ===== */
  .responsive-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  
  @container (max-width: 600px) {
    .responsive-toolbar {
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .responsive-toolbar > * {
      width: 100%;
      justify-content: center;
    }
  }
  
  /* ===== 响应式导航 ===== */
  .responsive-nav {
    display: flex;
    gap: 1rem;
  }
  
  @container (max-width: 500px) {
    .responsive-nav {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
    }
  }
  
  @container (max-width: 300px) {
    .responsive-nav {
      grid-template-columns: 1fr;
    }
  }
`;

/**
 * 响应式文字和间距
 */
export const ResponsiveTypographyStyles = css`
  /* ===== 流体字体大小 ===== */
  .fluid-text-xs { font-size: clamp(10px, 2vw, 12px); }
  .fluid-text-sm { font-size: clamp(12px, 2.5vw, 14px); }
  .fluid-text-base { font-size: clamp(14px, 3vw, 16px); }
  .fluid-text-lg { font-size: clamp(16px, 3.5vw, 18px); }
  .fluid-text-xl { font-size: clamp(18px, 4vw, 20px); }
  .fluid-text-2xl { font-size: clamp(20px, 5vw, 24px); }
  .fluid-text-3xl { font-size: clamp(24px, 6vw, 30px); }
  
  /* ===== 流体间距 ===== */
  .fluid-p-sm { padding: clamp(8px, 2vw, 12px); }
  .fluid-p-md { padding: clamp(12px, 3vw, 16px); }
  .fluid-p-lg { padding: clamp(16px, 4vw, 24px); }
  .fluid-p-xl { padding: clamp(24px, 5vw, 32px); }
  
  .fluid-m-sm { margin: clamp(8px, 2vw, 12px); }
  .fluid-m-md { margin: clamp(12px, 3vw, 16px); }
  .fluid-m-lg { margin: clamp(16px, 4vw, 24px); }
  .fluid-m-xl { margin: clamp(24px, 5vw, 32px); }
  
  .fluid-gap-sm { gap: clamp(8px, 2vw, 12px); }
  .fluid-gap-md { gap: clamp(12px, 3vw, 16px); }
  .fluid-gap-lg { gap: clamp(16px, 4vw, 24px); }
  .fluid-gap-xl { gap: clamp(24px, 5vw, 32px); }
`;

/**
 * 打印媒体查询样式
 */
export const PrintStyles = css`
  @media print {
    .responsive-container {
      display: block !important;
      container-type: normal !important;
    }
    
    .fluid-grid {
      display: block !important;
      gap: 0 !important;
      padding: 0 !important;
    }
    
    .grid-column {
      display: block !important;
      break-inside: avoid;
      margin-bottom: 1rem;
      border: 1px solid #000;
      padding: 1rem;
    }
    
    .layout-switcher,
    .responsive-toolbar,
    .action-button {
      display: none !important;
    }
    
    .block-item {
      break-inside: avoid;
      margin-bottom: 0.5rem;
    }
    
    /* 确保文本颜色在打印时可见 */
    * {
      color: #000 !important;
      background: transparent !important;
    }
  }
`;

/**
 * 组合所有响应式样式
 */
export const CompleteResponsiveStyles = css`
  ${ResponsiveBaseStyles}
  ${ResponsiveComponentStyles}
  ${ResponsiveTypographyStyles}
  ${PrintStyles}
`;