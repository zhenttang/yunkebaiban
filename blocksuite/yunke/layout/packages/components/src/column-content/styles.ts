import { css } from 'lit';
import { DesignTokens, StyleUtils, CommonStyles, AnimationKeyframes } from '../shared/design-tokens.js';

/**
 * ColumnContent 组件样式
 * 实现列内容容器的完整样式系统
 */
export const columnContentStyles = css`
  ${AnimationKeyframes.fadeIn}
  ${AnimationKeyframes.slideUp}
  ${AnimationKeyframes.pulse}
  ${AnimationKeyframes.bounce}

  /* === 主容器样式 === */
  :host {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .column-content {
    ${CommonStyles.flexColumn}
    min-height: 200px;
    max-height: calc(100vh - 200px);
    background: ${DesignTokens.colors.backgroundPrimary};
    border: 2px solid ${DesignTokens.colors.border};
    border-radius: ${DesignTokens.radius.xl};
    overflow: hidden;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    position: relative;
  }

  /* === 列头部样式 === */
  .column-header {
    ${CommonStyles.flexBetween}
    padding: ${DesignTokens.spacing.md} ${DesignTokens.spacing.lg};
    background: ${DesignTokens.colors.backgroundSecondary};
    border-bottom: 1px solid ${DesignTokens.colors.border};
    user-select: none;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .column-title {
    font-size: ${DesignTokens.typography.fontSize.base};
    font-weight: ${DesignTokens.typography.fontWeight.semibold};
    color: ${DesignTokens.colors.textPrimary};
    margin: 0;
    line-height: ${DesignTokens.typography.lineHeight.tight};
  }

  .column-actions {
    ${CommonStyles.flexCenter}
    gap: ${DesignTokens.spacing.xs};
    opacity: 0;
    transition: opacity ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
  }

  ${StyleUtils.hover(`
    .column-header .column-actions {
      opacity: 1;
    }
  `)}

  .column-action-button {
    ${CommonStyles.flexCenter}
    width: 24px;
    height: 24px;
    border-radius: ${DesignTokens.radius.sm};
    background: transparent;
    border: none;
    color: ${DesignTokens.colors.iconSecondary};
    cursor: pointer;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
  }

  ${StyleUtils.hover(`
    .column-action-button {
      background: ${DesignTokens.colors.hover};
      color: ${DesignTokens.colors.icon};
    }
  `)}

  /* === 列内容区域 === */
  .column-body {
    flex: 1;
    padding: ${DesignTokens.spacing.lg};
    overflow-y: auto;
    overflow-x: hidden;
    ${CommonStyles.customScrollbar}
  }

  /* === Block容器样式 === */
  .block-container {
    ${CommonStyles.flexColumn}
    gap: ${DesignTokens.spacing.md};
    min-height: 100px;
  }

  .block-item {
    position: relative;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    border-radius: ${DesignTokens.radius.md};
    padding: ${DesignTokens.spacing.sm};
    border: 1px solid transparent;
  }

  ${StyleUtils.hover(`
    .block-item {
      transform: translateY(-1px);
      box-shadow: ${DesignTokens.shadow.md};
      border-color: ${DesignTokens.colors.border};
    }
  `)}

  .block-item.dragging {
    opacity: 0.5;
    transform: rotate(2deg) scale(0.95);
    z-index: 1000;
    box-shadow: ${DesignTokens.shadow.xl};
  }

  .block-item.drag-ghost {
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    background: ${DesignTokens.colors.backgroundPrimary};
    border: 2px solid ${DesignTokens.colors.primary};
    box-shadow: ${DesignTokens.shadow.xl};
  }

  /* === 空状态样式 === */
  .column-empty {
    ${CommonStyles.flexCenter}
    ${CommonStyles.flexColumn}
    flex: 1;
    padding: ${DesignTokens.spacing.xxxl} ${DesignTokens.spacing.lg};
    color: ${DesignTokens.colors.textSecondary};
    text-align: center;
  }

  .empty-icon {
    font-size: 48px;
    margin-bottom: ${DesignTokens.spacing.lg};
    opacity: 0.6;
    color: ${DesignTokens.colors.iconSecondary};
  }

  .empty-title {
    font-size: ${DesignTokens.typography.fontSize.lg};
    font-weight: ${DesignTokens.typography.fontWeight.medium};
    margin-bottom: ${DesignTokens.spacing.sm};
    color: ${DesignTokens.colors.textPrimary};
  }

  .empty-description {
    font-size: ${DesignTokens.typography.fontSize.sm};
    opacity: 0.8;
    margin-bottom: ${DesignTokens.spacing.xl};
    line-height: ${DesignTokens.typography.lineHeight.relaxed};
    max-width: 200px;
  }

  /* === 添加内容按钮 === */
  .add-content-button {
    ${CommonStyles.flexCenter}
    gap: ${DesignTokens.spacing.sm};
    padding: ${DesignTokens.spacing.md} ${DesignTokens.spacing.lg};
    margin: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.lg} ${DesignTokens.spacing.lg};
    border: 2px dashed ${DesignTokens.colors.border};
    border-radius: ${DesignTokens.radius.lg};
    background: transparent;
    color: ${DesignTokens.colors.textSecondary};
    cursor: pointer;
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
    font-size: ${DesignTokens.typography.fontSize.sm};
    font-weight: ${DesignTokens.typography.fontWeight.medium};
    position: relative;
    overflow: hidden;
  }

  ${StyleUtils.hover(`
    .add-content-button {
      border-color: ${DesignTokens.colors.primary};
      background: ${DesignTokens.colors.primaryAlpha};
      color: ${DesignTokens.colors.primary};
      transform: translateY(-1px);
      box-shadow: ${DesignTokens.shadow.sm};
    }
  `)}

  .add-content-button:active {
    transform: translateY(0) scale(0.98);
  }

  .add-content-button .add-icon {
    font-size: 16px;
    transition: transform ${DesignTokens.animation.normal} ${DesignTokens.animation.spring};
  }

  ${StyleUtils.hover(`
    .add-content-button .add-icon {
      transform: scale(1.1) rotate(90deg);
    }
  `)}

  /* === 拖拽状态样式 === */
  .column-content.drag-over {
    border-color: ${DesignTokens.colors.primary};
    background: ${DesignTokens.colors.primaryAlpha};
    box-shadow: 0 0 0 4px ${DesignTokens.colors.primaryAlpha};
    transform: scale(1.02);
  }

  .column-content.drag-over .column-header {
    background: ${DesignTokens.colors.primary};
    color: white;
  }

  .column-content.drag-over .column-title {
    color: white;
  }

  /* 拖拽放置指示器 */
  .drop-indicator {
    height: 3px;
    background: ${DesignTokens.colors.primary};
    border-radius: ${DesignTokens.radius.sm};
    margin: ${DesignTokens.spacing.sm} 0;
    opacity: 0;
    transform: scaleX(0);
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.spring};
    position: relative;
  }

  .drop-indicator.active {
    opacity: 1;
    transform: scaleX(1);
    animation: pulse 1s ease-in-out infinite;
  }

  .drop-indicator::before {
    content: '';
    position: absolute;
    left: -4px;
    top: -4px;
    width: 8px;
    height: 11px;
    background: ${DesignTokens.colors.primary};
    border-radius: 50%;
    opacity: 0;
    transition: opacity ${DesignTokens.animation.normal} ${DesignTokens.animation.easeOut};
  }

  .drop-indicator.active::before {
    opacity: 1;
  }

  /* === 选中状态 === */
  .column-content.selected {
    border-color: ${DesignTokens.colors.primary};
    box-shadow: 0 0 0 3px ${DesignTokens.colors.primaryAlpha};
  }

  .column-content.selected .column-header {
    background: ${DesignTokens.colors.primaryAlpha};
  }

  /* === 只读模式 === */
  .column-content.readonly {
    border-style: solid;
    border-color: ${DesignTokens.colors.border};
    opacity: 0.8;
  }

  .column-content.readonly .add-content-button,
  .column-content.readonly .column-actions {
    display: none;
  }

  .column-content.readonly .block-item {
    pointer-events: none;
  }

  .column-content.readonly .column-header {
    background: ${DesignTokens.colors.backgroundTertiary};
  }

  /* === 加载状态 === */
  .column-content.loading {
    position: relative;
    pointer-events: none;
  }

  .column-content.loading::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${DesignTokens.colors.backgroundPrimary};
    opacity: 0.8;
    z-index: 1000;
  }

  .column-content.loading::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 32px;
    height: 32px;
    margin: -16px 0 0 -16px;
    border: 3px solid ${DesignTokens.colors.border};
    border-top: 3px solid ${DesignTokens.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 1001;
  }

  /* === 响应式设计 === */
  ${StyleUtils.mobile(`
    .column-content {
      min-height: 150px;
      border-radius: ${DesignTokens.radius.lg};
    }
    
    .column-header {
      padding: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.md};
    }
    
    .column-body {
      padding: ${DesignTokens.spacing.md};
    }
    
    .column-title {
      font-size: ${DesignTokens.typography.fontSize.sm};
    }
    
    .add-content-button {
      padding: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.md};
      margin: ${DesignTokens.spacing.sm};
      font-size: ${DesignTokens.typography.fontSize.xs};
    }
    
    .empty-icon {
      font-size: 36px;
    }
    
    .block-item {
      padding: ${DesignTokens.spacing.xs};
    }
  `)}

  /* === 紧凑模式 === */
  :host([compact]) .column-content {
    min-height: 120px;
  }

  :host([compact]) .column-header {
    padding: ${DesignTokens.spacing.sm} ${DesignTokens.spacing.md};
  }

  :host([compact]) .column-body {
    padding: ${DesignTokens.spacing.md};
  }

  :host([compact]) .add-content-button {
    padding: ${DesignTokens.spacing.sm};
    margin: ${DesignTokens.spacing.xs} ${DesignTokens.spacing.md} ${DesignTokens.spacing.md};
  }

  /* === 变体样式 === */
  
  /* 无边框变体 */
  :host([variant="borderless"]) .column-content {
    border: none;
    background: transparent;
  }

  :host([variant="borderless"]) .column-header {
    background: transparent;
    border-bottom: 1px solid ${DesignTokens.colors.border};
  }

  /* 卡片变体 */
  :host([variant="card"]) .column-content {
    box-shadow: ${DesignTokens.shadow.lg};
    border: 1px solid ${DesignTokens.colors.border};
  }

  /* 强调变体 */
  :host([variant="emphasized"]) .column-content {
    border: 2px solid ${DesignTokens.colors.primary};
    box-shadow: 0 0 0 2px ${DesignTokens.colors.primaryAlpha};
  }

  /* === 焦点样式 === */
  ${StyleUtils.focus(`
    .column-content {
      outline: 2px solid ${DesignTokens.colors.primary};
      outline-offset: 2px;
    }
  `)}

  /* === 深色模式适配 === */
  ${StyleUtils.darkMode(`
    .column-content {
      background: var(--affine-background-primary-color);
      border-color: var(--affine-border-color);
    }
    
    .column-header {
      background: var(--affine-background-secondary-color);
    }
    
    .add-content-button:hover {
      background: var(--affine-primary-color-alpha);
    }
  `)}

  /* === 动画优化 === */
  ${StyleUtils.reducedMotion(`
    .column-content,
    .block-item,
    .add-content-button,
    .drop-indicator {
      transition: none !important;
      animation: none !important;
      transform: none !important;
    }
  `)}

  /* === 高对比度模式 === */
  @media (prefers-contrast: high) {
    .column-content {
      border-width: 3px;
    }
    
    .column-header {
      border-bottom-width: 2px;
    }
    
    .add-content-button {
      border-width: 3px;
    }
  }

  /* === 特殊交互状态 === */
  .column-content.drag-over.drop-valid {
    border-color: ${DesignTokens.colors.success};
    background: var(--affine-success-color-alpha, rgba(34, 197, 94, 0.1));
  }

  .column-content.drag-over.drop-invalid {
    border-color: ${DesignTokens.colors.error};
    background: var(--affine-error-color-alpha, rgba(239, 68, 68, 0.1));
  }

  /* === 触摸设备优化 === */
  @media (hover: none) and (pointer: coarse) {
    .add-content-button {
      min-height: 44px;
      padding: ${DesignTokens.spacing.md} ${DesignTokens.spacing.lg};
    }
    
    .column-action-button {
      min-width: 44px;
      min-height: 44px;
    }
    
    .block-item:hover {
      transform: none;
      box-shadow: none;
    }
    
    .add-content-button:hover {
      transform: none;
    }
  }

  /* === 列索引指示器 === */
  .column-index {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 20px;
    height: 20px;
    background: ${DesignTokens.colors.primary};
    color: white;
    border-radius: 50%;
    font-size: ${DesignTokens.typography.fontSize.xs};
    font-weight: ${DesignTokens.typography.fontWeight.bold};
    ${CommonStyles.flexCenter}
    z-index: 10;
    opacity: 0;
    transform: scale(0.8);
    transition: all ${DesignTokens.animation.normal} ${DesignTokens.animation.spring};
  }

  :host([show-index]) .column-index {
    opacity: 1;
    transform: scale(1);
  }
`;

/**
 * 空状态图标
 */
export const EmptyStateIcons = {
  default: '📄',
  add: '➕',
  drag: '👆',
  loading: '⏳'
} as const;