import { css } from 'lit';
import { DesignTokens, StyleUtils, CommonStyles, AnimationKeyframes } from '../shared/design-tokens.js';

/**
 * LayoutSwitcher 组件样式
 * 实现类似Notion的布局切换器UI
 */
export const layoutSwitcherStyles = css`
  ${AnimationKeyframes.fadeIn}
  ${AnimationKeyframes.scaleIn}
  ${AnimationKeyframes.pulse}

  /* === 主容器样式 === */
  :host {
    display: inline-block;
    user-select: none;
  }

  .layout-switcher {
    ${CommonStyles.flexBetween}
    gap: ${DesignTokens.spacing.sm};
    padding: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.md};
    background: ${DesignTokens.colors.backgroundPrimary};
    border: 1px solid ${DesignTokens.colors.border};
    border-radius: ${DesignTokens.radius.lg};
    box-shadow: ${DesignTokens.shadow.sm};
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    position: relative;
    overflow: hidden;
  }

  ${StyleUtils.hover(`
    .layout-switcher {
      box-shadow: ${DesignTokens.shadow.md};
      border-color: ${DesignTokens.colors.borderHover};
    }
  `)}

  /* === 布局按钮样式 === */
  .layout-button {
    ${CommonStyles.flexCenter}
    flex-direction: column;
    width: 48px;
    height: 48px;
    border: 2px solid transparent;
    border-radius: ${DesignTokens.radius.lg};
    background: transparent;
    cursor: pointer;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.spring};
    color: ${DesignTokens.colors.icon};
    font-size: ${DesignTokens.typography.fontSize.sm};
    font-weight: ${DesignTokens.typography.fontWeight.medium};
    position: relative;
    overflow: hidden;
  }

  /* 按钮悬停效果 */
  ${StyleUtils.hover(`
    .layout-button {
      background: ${DesignTokens.colors.hover};
      border-color: ${DesignTokens.colors.primaryAlpha};
      color: ${DesignTokens.colors.primary};
      transform: translateY(-1px);
    }
  `)}

  /* 按钮激活效果 */
  .layout-button:active {
    transform: translateY(0) scale(0.95);
    transition: transform ${DesignTokens.animation.fast} ${DesignTokens.animation.easeOut};
  }

  /* 激活状态 */
  .layout-button.active {
    background: ${DesignTokens.colors.primary};
    border-color: ${DesignTokens.colors.primary};
    color: white;
    box-shadow: ${DesignTokens.shadow.md};
  }

  .layout-button.active::after {
    content: '✓';
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 8px;
    font-weight: ${DesignTokens.typography.fontWeight.bold};
    opacity: 0.9;
  }

  /* 禁用状态 */
  ${StyleUtils.disabled(`
    .layout-button {
      opacity: 0.4;
      cursor: not-allowed;
      background: ${DesignTokens.colors.backgroundDisabled};
      color: ${DesignTokens.colors.textDisabled};
      transform: none !important;
      border-color: transparent !important;
    }
  `)}

  /* === 按钮内容样式 === */
  .layout-icon {
    font-size: 16px;
    margin-bottom: 2px;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    line-height: 1;
  }

  ${StyleUtils.hover(`
    .layout-button .layout-icon {
      transform: scale(1.1);
    }
  `)}

  .layout-button.active .layout-icon {
    transform: scale(1.05);
  }

  .layout-label {
    font-size: ${DesignTokens.typography.fontSize.xs};
    opacity: 0.8;
    white-space: nowrap;
    line-height: ${DesignTokens.typography.lineHeight.tight};
  }

  /* === 加载状态 === */
  .layout-button.loading {
    position: relative;
    pointer-events: none;
  }

  .layout-button.loading .layout-icon,
  .layout-button.loading .layout-label {
    opacity: 0.3;
  }

  .layout-button.loading::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 16px;
    height: 16px;
    margin: -8px 0 0 -8px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* === 工具提示 === */
  .layout-button[title] {
    position: relative;
  }

  .layout-button[title]:hover::after {
    content: attr(title);
    position: absolute;
    top: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.sm};
    background: ${DesignTokens.colors.backgroundOverlay};
    color: ${DesignTokens.colors.textPrimary};
    border-radius: ${DesignTokens.radius.sm};
    font-size: ${DesignTokens.typography.fontSize.xs};
    white-space: nowrap;
    z-index: ${DesignTokens.zIndex.tooltip};
    opacity: 0;
    animation: fadeIn ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut} forwards;
    box-shadow: ${DesignTokens.shadow.lg};
    border: 1px solid ${DesignTokens.colors.border};
  }

  .layout-button[title]:hover::before {
    content: '';
    position: absolute;
    top: calc(100% + 4px);
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-bottom-color: ${DesignTokens.colors.backgroundOverlay};
    z-index: ${DesignTokens.zIndex.tooltip};
  }

  /* === 响应式设计 === */
  ${StyleUtils.mobile(`
    .layout-switcher {
      padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.sm};
      gap: ${DesignTokens.spacing.xs};
    }
    
    .layout-button {
      width: 36px;
      height: 36px;
    }
    
    .layout-label {
      display: none;
    }
    
    .layout-icon {
      font-size: 14px;
    }
  `)}

  /* === 变体样式 === */
  
  /* 紧凑模式 */
  :host([compact]) .layout-switcher {
    padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.xs};
    gap: ${DesignTokens.spacing.xs};
  }

  :host([compact]) .layout-button {
    width: 32px;
    height: 32px;
  }

  :host([compact]) .layout-icon {
    font-size: 12px;
  }

  :host([compact]) .layout-label {
    display: none;
  }

  /* 垂直排列 */
  :host([vertical]) .layout-switcher {
    flex-direction: column;
    width: 60px;
    height: auto;
  }

  :host([vertical]) .layout-button {
    width: 44px;
    margin-bottom: ${DesignTokens.spacing.xs};
  }

  :host([vertical]) .layout-button:last-child {
    margin-bottom: 0;
  }

  /* 大尺寸 */
  :host([size="large"]) .layout-button {
    width: 56px;
    height: 56px;
  }

  :host([size="large"]) .layout-icon {
    font-size: 18px;
  }

  :host([size="large"]) .layout-label {
    font-size: ${DesignTokens.typography.fontSize.sm};
  }

  /* 小尺寸 */
  :host([size="small"]) .layout-button {
    width: 32px;
    height: 32px;
  }

  :host([size="small"]) .layout-icon {
    font-size: 12px;
  }

  :host([size="small"]) .layout-label {
    font-size: ${DesignTokens.typography.fontSize.xs};
  }

  /* === 焦点样式 === */
  ${StyleUtils.focus(`
    .layout-button {
      outline: 2px solid ${DesignTokens.colors.primary};
      outline-offset: 2px;
    }
  `)}

  /* === 深色模式适配 === */
  ${StyleUtils.darkMode(`
    .layout-switcher {
      background: var(--yunke-background-primary-color);
      border-color: var(--yunke-border-color);
    }
    
    .layout-button:hover {
      background: var(--yunke-hover-color);
    }
  `)}

  /* === 动画优化 === */
  ${StyleUtils.reducedMotion(`
    .layout-button,
    .layout-icon,
    .layout-switcher {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
  `)}

  /* === 高对比度模式 === */
  @media (prefers-contrast: high) {
    .layout-switcher {
      border-width: 2px;
    }
    
    .layout-button {
      border-width: 2px;
    }
    
    .layout-button.active {
      border-width: 3px;
    }
  }

  /* === 特殊状态组合 === */
  .layout-button.active:hover {
    background: ${DesignTokens.colors.primary};
    transform: translateY(-1px) scale(1.02);
  }

  .layout-button.loading:hover {
    transform: none;
    background: transparent;
  }

  /* === 键盘导航样式 === */
  .layout-switcher:focus-within {
    outline: 2px solid ${DesignTokens.colors.primary};
    outline-offset: 2px;
    border-radius: ${DesignTokens.radius.lg};
  }

  /* === 响应式约束样式 (集成C2响应式系统) === */
  .layout-button.disabled-responsive {
    opacity: 0.3;
    cursor: not-allowed;
    pointer-events: none;
    background: ${DesignTokens.colors.backgroundDisabled};
    color: ${DesignTokens.colors.textDisabled};
  }
  
  .layout-button.disabled-responsive .layout-icon {
    opacity: 0.5;
  }
  
  /* 断点指示器样式 */
  .breakpoint-indicator {
    ${CommonStyles.flexCenter}
    font-size: ${DesignTokens.typography.fontSize.xs};
    color: ${DesignTokens.colors.textSecondary};
    background: ${DesignTokens.colors.backgroundSecondary};
    padding: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.sm};
    border-radius: ${DesignTokens.radius.sm};
    margin-right: ${DesignTokens.spacing.sm};
    border: 1px solid ${DesignTokens.colors.border};
  }
  
  /* 容器查询响应式隐藏 (与C2系统保持一致) */
  @container (max-width: ${DesignTokens.containerBreakpoints.medium}) {
    .layout-button:nth-child(n+4) {
      display: none;
    }
  }

  @container (max-width: ${DesignTokens.containerBreakpoints.small}) {
    .layout-button:nth-child(n+3) {
      display: none;
    }
  }
  @media (hover: none) and (pointer: coarse) {
    .layout-button {
      /* 增加触摸目标大小 */
      min-width: 44px;
      min-height: 44px;
    }
    
    .layout-button:hover {
      /* 移除悬停效果 */
      background: transparent;
      transform: none;
    }
    
    .layout-button:active {
      background: ${DesignTokens.colors.hover};
      transform: scale(0.95);
    }
  }
`;

/**
 * 布局模式图标映射
 */
export const LayoutModeIcons = {
  normal: '▊',
  '2-column': '▊▊',
  '3-column': '▊▊▊',
  '4-column': '▊▊▊▊',
  '5-column': '▊▊▊▊▊'
} as const;

/**
 * 布局模式标签映射
 */
export const LayoutModeLabels = {
  normal: '单列',
  '2-column': '双列',
  '3-column': '三列',
  '4-column': '四列',
  '5-column': '五列'
} as const;