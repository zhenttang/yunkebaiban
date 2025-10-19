import { css } from 'lit';
import { DesignTokens, StyleUtils, CommonStyles, AnimationKeyframes } from './design-tokens.js';

/**
 * 布局容器样式 - CSS Grid布局系统
 * 实现动态列数的网格布局
 */
export const layoutStyles = css`
  ${AnimationKeyframes.fadeIn}
  ${AnimationKeyframes.scaleIn}

  /* === 主布局容器 === */
  .column-layout-container {
    display: grid;
    gap: var(--column-gap, ${DesignTokens.spacing.xl});
    width: 100%;
    min-height: 100vh;
    padding: ${DesignTokens.spacing.lg};
    background: ${DesignTokens.colors.backgroundSecondary};
    transition: grid-template-columns ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    position: relative;
    
    /* 支持容器查询 (集成C2响应式系统) */
    container-type: inline-size;
    container-name: layout-container;
  }

  /* === 动态列数样式 === */
  .column-layout-1 { 
    grid-template-columns: 1fr;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .column-layout-2 { 
    grid-template-columns: 1fr 1fr;
  }
  
  .column-layout-3 { 
    grid-template-columns: 1fr 1fr 1fr;
  }
  
  .column-layout-4 { 
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
  
  .column-layout-5 { 
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
  }

  /* === 自定义列宽样式 === */
  .column-layout-container.custom-widths {
    grid-template-columns: var(--custom-columns);
  }

  /* === 响应式布局 === */
  ${StyleUtils.mobile(`
    .column-layout-container {
      grid-template-columns: 1fr !important;
      padding: ${DesignTokens.spacing.md};
      gap: ${DesignTokens.spacing.lg};
    }
  `)}

  ${StyleUtils.tablet(`
    .column-layout-3,
    .column-layout-4,
    .column-layout-5 {
      grid-template-columns: 1fr 1fr;
    }
  `)}

  /* === 容器查询响应式 (集成C2响应式系统) === */
  ${StyleUtils.containerSmall(`
    .column-layout-container {
      grid-template-columns: 1fr !important;
      gap: ${DesignTokens.spacing.md};
    }
  `)}

  ${StyleUtils.containerMedium(`
    .column-layout-3,
    .column-layout-4,
    .column-layout-5 {
      grid-template-columns: 1fr 1fr !important;
    }
  `)}

  ${StyleUtils.containerLarge(`
    .column-layout-4,
    .column-layout-5 {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  `)}

  /* 容器查询约束 - 隐藏不支持的按钮 */
  @container layout-container (max-width: ${DesignTokens.containerBreakpoints.medium}) {
    .layout-switcher .layout-button:nth-child(n+4) {
      display: none;
    }
  }

  @container layout-container (max-width: ${DesignTokens.containerBreakpoints.small}) {
    .layout-switcher .layout-button:nth-child(n+3) {
      display: none;
    }
  }

  /* === 列间分隔线 === */
  .column-layout-container.show-dividers {
    position: relative;
  }

  .column-layout-container.show-dividers::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: calc(50% - 1px);
    width: 1px;
    background: ${DesignTokens.colors.border};
    opacity: 0.5;
    pointer-events: none;
  }

  /* === 布局切换动画 === */
  .layout-switching {
    animation: layoutTransition ${DesignTokens.animation.slow} ${DesignTokens.animation.easeInOut};
  }

  @keyframes layoutTransition {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(0.98);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* === 空布局状态 === */
  .layout-empty {
    ${CommonStyles.flexCenter}
    ${CommonStyles.flexColumn}
    grid-column: 1 / -1;
    min-height: 400px;
    color: ${DesignTokens.colors.textSecondary};
    text-align: center;
    padding: ${DesignTokens.spacing.xxxl};
  }

  .layout-empty-icon {
    font-size: 64px;
    margin-bottom: ${DesignTokens.spacing.xl};
    opacity: 0.6;
  }

  .layout-empty-title {
    font-size: ${DesignTokens.typography.fontSize.xl};
    font-weight: ${DesignTokens.typography.fontWeight.semibold};
    margin-bottom: ${DesignTokens.spacing.md};
    color: ${DesignTokens.colors.textPrimary};
  }

  .layout-empty-description {
    font-size: ${DesignTokens.typography.fontSize.base};
    opacity: 0.8;
    max-width: 400px;
    line-height: ${DesignTokens.typography.lineHeight.relaxed};
  }

  /* === 列调整器样式 === */
  .column-resizer {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 8px;
    margin-left: -4px;
    cursor: col-resize;
    z-index: 10;
    user-select: none;
    opacity: 0;
    transition: opacity ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
  }

  .column-layout-container:hover .column-resizer {
    opacity: 1;
  }

  .resizer-handle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 40px;
    margin: -20px 0 0 -2px;
    background: ${DesignTokens.colors.primary};
    border-radius: ${DesignTokens.radius.sm};
    opacity: 0;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
  }

  .column-resizer:hover .resizer-handle {
    opacity: 0.6;
    width: 6px;
    margin-left: -3px;
  }

  .column-resizer.active .resizer-handle {
    opacity: 1;
    height: 60px;
    margin-top: -30px;
    box-shadow: ${DesignTokens.shadow.md};
  }

  /* === 拖拽引导线 === */
  .resize-guide-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: ${DesignTokens.colors.primary};
    opacity: 0;
    z-index: 1000;
    pointer-events: none;
    transition: opacity ${DesignTokens.animation.fast} ${DesignTokens.animation.easeOut};
  }

  .resize-guide-line.active {
    opacity: 0.8;
    box-shadow: 0 0 4px ${DesignTokens.colors.primary};
  }

  .resize-original-line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 1px;
    background: ${DesignTokens.colors.border};
    opacity: 0.5;
    z-index: 999;
    pointer-events: none;
    border-style: dashed;
  }

  /* === 宽度提示工具栏 === */
  .resize-tooltip {
    position: absolute;
    top: -32px;
    left: 50%;
    transform: translateX(-50%);
    padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.sm};
    background: ${DesignTokens.colors.backgroundOverlay};
    color: ${DesignTokens.colors.textPrimary};
    border-radius: ${DesignTokens.radius.sm};
    font-size: ${DesignTokens.typography.fontSize.xs};
    white-space: nowrap;
    opacity: 0;
    transition: opacity ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    z-index: ${DesignTokens.zIndex.tooltip};
    box-shadow: ${DesignTokens.shadow.lg};
    border: 1px solid ${DesignTokens.colors.border};
  }

  .resize-tooltip.active {
    opacity: 1;
  }

  .resize-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    margin-left: -4px;
    border: 4px solid transparent;
    border-top-color: ${DesignTokens.colors.backgroundOverlay};
  }

  /* === 布局工具栏样式 === */
  .layout-toolbar {
    ${CommonStyles.flexBetween}
    gap: ${DesignTokens.spacing.md};
    padding: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.lg};
    background: ${DesignTokens.colors.backgroundPrimary};
    border-bottom: 1px solid ${DesignTokens.colors.border};
    box-shadow: ${DesignTokens.shadow.sm};
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .toolbar-group {
    ${CommonStyles.flexCenter}
    gap: ${DesignTokens.spacing.xs};
    padding: 0 ${DesignTokens.spacing.sm};
  }

  .toolbar-group:not(:last-child)::after {
    content: '';
    width: 1px;
    height: 20px;
    background: ${DesignTokens.colors.border};
    margin-left: ${DesignTokens.spacing.sm};
  }

  .toolbar-button {
    ${CommonStyles.flexCenter}
    min-width: 32px;
    height: 32px;
    padding: 0 ${DesignTokens.spacing.sm};
    border: none;
    border-radius: ${DesignTokens.radius.md};
    background: transparent;
    color: ${DesignTokens.colors.icon};
    cursor: pointer;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    font-size: ${DesignTokens.typography.fontSize.sm};
    position: relative;
  }

  ${StyleUtils.hover(`
    .toolbar-button {
      background: ${DesignTokens.colors.hover};
      color: ${DesignTokens.colors.textPrimary};
    }
  `)}

  .toolbar-button:active {
    transform: scale(0.95);
  }

  .toolbar-button.active {
    background: ${DesignTokens.colors.primary};
    color: white;
  }

  ${StyleUtils.disabled(`
    .toolbar-button {
      opacity: 0.4;
      cursor: not-allowed;
    }
  `)}

  /* === 当前模式指示器 === */
  .current-mode-indicator {
    ${CommonStyles.flexCenter}
    gap: ${DesignTokens.spacing.sm};
    padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.md};
    background: ${DesignTokens.colors.backgroundSecondary};
    border-radius: ${DesignTokens.radius.md};
    font-size: ${DesignTokens.typography.fontSize.sm};
    font-weight: ${DesignTokens.typography.fontWeight.medium};
    color: ${DesignTokens.colors.textPrimary};
  }

  .mode-icon {
    font-size: 16px;
    color: ${DesignTokens.colors.primary};
  }

  /* === 特殊布局模式 === */
  
  /* 全宽模式 */
  .column-layout-container.full-width {
    max-width: none;
    margin: 0;
  }

  /* 居中模式 */
  .column-layout-container.centered {
    max-width: 1400px;
    margin: 0 auto;
  }

  /* 紧凑模式 */
  .column-layout-container.compact {
    gap: ${DesignTokens.spacing.md};
    padding: ${DesignTokens.spacing.md};
  }

  /* === 打印样式 === */
  @media print {
    .column-layout-container {
      grid-template-columns: 1fr !important;
      gap: ${DesignTokens.spacing.lg};
      padding: 0;
      background: white;
    }
    
    .layout-toolbar,
    .column-resizer,
    .resize-guide-line,
    .resize-tooltip {
      display: none !important;
    }
  }

  /* === 高对比度模式 === */
  @media (prefers-contrast: high) {
    .column-layout-container {
      border: 2px solid ${DesignTokens.colors.border};
    }
    
    .resizer-handle {
      background: ${DesignTokens.colors.textPrimary};
      border: 1px solid ${DesignTokens.colors.border};
    }
  }

  /* === 动画优化 === */
  ${StyleUtils.reducedMotion(`
    .column-layout-container,
    .layout-switching,
    .column-resizer,
    .resizer-handle {
      transition: none !important;
      animation: none !important;
    }
  `)}
`;

/**
 * 主题系统
 */
export const ThemeManager = {
  // 主题变量定义
  themes: {
    light: css`
      :host {
        --theme-background-primary: #ffffff;
        --theme-background-secondary: #f8f9fa;
        --theme-text-primary: #1f2937;
        --theme-text-secondary: #6b7280;
        --theme-border: #e5e7eb;
        --theme-shadow: rgba(0, 0, 0, 0.1);
      }
    `,
    
    dark: css`
      :host {
        --theme-background-primary: #1f2937;
        --theme-background-secondary: #111827;
        --theme-text-primary: #f9fafb;
        --theme-text-secondary: #d1d5db;
        --theme-border: #374151;
        --theme-shadow: rgba(0, 0, 0, 0.3);
      }
    `,
    
    auto: css`
      :host {
        /* 跟随系统主题 */
        color-scheme: light dark;
      }
      
      ${StyleUtils.darkMode(`
        :host {
          --theme-background-primary: #1f2937;
          --theme-background-secondary: #111827;
          --theme-text-primary: #f9fafb;
          --theme-text-secondary: #d1d5db;
          --theme-border: #374151;
          --theme-shadow: rgba(0, 0, 0, 0.3);
        }
      `)}
    `
  },

  // 自定义主题支持
  createCustomTheme: (colors: Record<string, string>) => css`
    :host {
      ${Object.entries(colors).map(([key, value]) => 
        `--theme-${key}: ${value};`
      ).join('\n')}
    }
  `,

  // 主题切换动画
  themeTransition: css`
    * {
      transition: 
        background-color ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut},
        border-color ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut},
        color ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    }
  `
};

/**
 * 布局预设
 */
export const LayoutPresets = {
  // 文档编辑布局
  document: css`
    .column-layout-container {
      max-width: 800px;
      margin: 0 auto;
      padding: ${DesignTokens.spacing.xl} ${DesignTokens.spacing.lg};
    }
  `,

  // 仪表板布局
  dashboard: css`
    .column-layout-container {
      gap: ${DesignTokens.spacing.lg};
      padding: ${DesignTokens.spacing.lg};
    }
  `,

  // 卡片网格布局
  cardGrid: css`
    .column-layout-container {
      gap: ${DesignTokens.spacing.xl};
      padding: ${DesignTokens.spacing.xl};
    }
    
    .column-content {
      min-height: 300px;
      box-shadow: ${DesignTokens.shadow.lg};
    }
  `,

  // 紧凑列表布局
  compactList: css`
    .column-layout-container {
      gap: ${DesignTokens.spacing.sm};
      padding: ${DesignTokens.spacing.md};
    }
    
    .column-content {
      min-height: 150px;
    }
  `
};

/**
 * 导出所有样式
 */
export const allLayoutStyles = css`
  ${layoutStyles}
  ${ThemeManager.themes.auto}
  ${ThemeManager.themeTransition}
`;