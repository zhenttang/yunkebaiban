/**
 * AFFiNE 块命令样式一致性改进方案
 * 
 * 基于对现有系统的分析，发现块命令在以下方面与系统设计语言不一致：
 * 1. 右侧面板的现代化卡片式设计 vs 块命令的传统菜单样式
 * 2. 系统的圆润设计语言 vs 块命令的方形设计
 * 3. 统一的间距和排版规范
 * 4. 一致的颜色和阴影系统
 */

import { css } from 'lit';
import { unsafeCSS } from 'lit/directives/unsafe-css.js';
import { baseTheme } from '@toeverything/theme';

/**
 * 系统设计规范分析（基于截图）
 */
export const AFFINE_DESIGN_TOKENS = {
  // 从截图观察到的设计特征
  colors: {
    // 主色调 - 蓝色系（基础块按钮）
    primary: '#5B9CFF',           // 基础块的蓝色
    primaryHover: '#4A8AFF',      // 悬停状态
    primaryActive: '#3978EF',     // 激活状态
    
    // 中性色系
    background: '#FFFFFF',        // 主背景色
    surface: '#F8F9FB',          // 面板背景色
    surfaceHover: '#F1F3F5',     // 悬停背景色
    
    // 文字色系
    textPrimary: '#1A1B1E',      // 主文字（如"段落"）
    textSecondary: '#6B7280',     // 次要文字（如"转换为普通文本块"）
    textTertiary: '#9CA3AF',      // 三级文字
    
    // 边框色系
    border: '#E5E7EB',           // 一般边框
    borderLight: '#F3F4F6',      // 浅色边框
    
    // 功能色系
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // 圆角系统（现代化设计）
  borderRadius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    xxl: '16px',
  },
  
  // 间距系统
  spacing: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    xxl: '20px',
    xxxl: '24px',
  },
  
  // 字体系统
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '20px',
  },
  
  // 阴影系统（现代化卡片设计）
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // 过渡动画
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

/**
 * 改进后的 Slash Menu 样式
 * 与右侧面板的卡片式设计保持一致
 */
export const improvedSlashMenuStyles = css`
  .slash-menu {
    /* 现代化容器设计 */
    width: 320px;                                    /* 增加宽度，更现代 */
    max-height: 420px;                              /* 调整高度 */
    padding: ${AFFINE_DESIGN_TOKENS.spacing.lg};   /* 统一间距 */
    
    /* 现代化背景和边框 */
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border: 1px solid ${AFFINE_DESIGN_TOKENS.colors.borderLight};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.xl};  /* 更圆润 */
    
    /* 现代化阴影 */
    box-shadow: ${AFFINE_DESIGN_TOKENS.shadows.lg};
    
    /* 字体系统 */
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.base};
    
    /* 过渡效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.normal};
    
    /* 滚动条样式 */
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: ${AFFINE_DESIGN_TOKENS.colors.border} transparent;
  }
  
  .slash-menu::-webkit-scrollbar {
    width: 6px;
  }
  
  .slash-menu::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .slash-menu::-webkit-scrollbar-thumb {
    background: ${AFFINE_DESIGN_TOKENS.colors.border};
    border-radius: 3px;
  }
  
  /* 分组标题样式 - 与右侧面板一致 */
  .slash-menu-group-title {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.xs};
    font-weight: 600;
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin: ${AFFINE_DESIGN_TOKENS.spacing.lg} 0 ${AFFINE_DESIGN_TOKENS.spacing.md} 0;
    padding: 0 ${AFFINE_DESIGN_TOKENS.spacing.sm};
  }
  
  .slash-menu-group-title:first-child {
    margin-top: 0;
  }
  
  /* 菜单项容器 */
  .slash-menu-item {
    display: flex;
    align-items: center;
    gap: ${AFFINE_DESIGN_TOKENS.spacing.lg};
    padding: ${AFFINE_DESIGN_TOKENS.spacing.lg} ${AFFINE_DESIGN_TOKENS.spacing.md};
    margin-bottom: ${AFFINE_DESIGN_TOKENS.spacing.sm};
    
    /* 现代化卡片样式 */
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border: 1px solid transparent;
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.md};
    
    /* 过渡效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.fast};
    cursor: pointer;
    
    /* 文字不可选择 */
    user-select: none;
  }
  
  /* 菜单项悬停状态 - 现代化设计 */
  .slash-menu-item:hover {
    background: ${AFFINE_DESIGN_TOKENS.colors.surfaceHover};
    border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
    transform: translateY(-1px);                    /* 微妙的悬浮效果 */
    box-shadow: ${AFFINE_DESIGN_TOKENS.shadows.sm};
  }
  
  /* 菜单项激活状态 */
  .slash-menu-item:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  /* 菜单项选中状态 */
  .slash-menu-item.selected {
    background: rgba(91, 156, 255, 0.08);          /* 主色调透明背景 */
    border-color: ${AFFINE_DESIGN_TOKENS.colors.primary};
    color: ${AFFINE_DESIGN_TOKENS.colors.primary};
  }
  
  /* 图标容器 - 现代化设计 */
  .slash-menu-item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    
    /* 现代化背景 */
    background: ${AFFINE_DESIGN_TOKENS.colors.surface};
    border: 1px solid ${AFFINE_DESIGN_TOKENS.colors.borderLight};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.md};
    
    /* 过渡效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.fast};
  }
  
  .slash-menu-item:hover .slash-menu-item-icon {
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
  }
  
  .slash-menu-item.selected .slash-menu-item-icon {
    background: rgba(91, 156, 255, 0.1);
    border-color: ${AFFINE_DESIGN_TOKENS.colors.primary};
    color: ${AFFINE_DESIGN_TOKENS.colors.primary};
  }
  
  /* 图标SVG样式 */
  .slash-menu-item-icon svg {
    width: 20px;
    height: 20px;
    color: inherit;
  }
  
  /* 文字内容区域 */
  .slash-menu-item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: ${AFFINE_DESIGN_TOKENS.spacing.xs};
    min-width: 0;                                   /* 允许文字截断 */
  }
  
  /* 主标题样式 */
  .slash-menu-item-title {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.base};
    font-weight: 500;
    color: ${AFFINE_DESIGN_TOKENS.colors.textPrimary};
    line-height: 1.4;
    margin: 0;
  }
  
  .slash-menu-item:hover .slash-menu-item-title {
    color: ${AFFINE_DESIGN_TOKENS.colors.textPrimary};
  }
  
  .slash-menu-item.selected .slash-menu-item-title {
    color: ${AFFINE_DESIGN_TOKENS.colors.primary};
  }
  
  /* 描述文字样式 */
  .slash-menu-item-description {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.sm};
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
    line-height: 1.3;
    margin: 0;
    
    /* 文字截断 */
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .slash-menu-item:hover .slash-menu-item-description {
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
  }
  
  .slash-menu-item.selected .slash-menu-item-description {
    color: rgba(91, 156, 255, 0.7);
  }
  
  /* 键盘快捷键显示 */
  .slash-menu-item-shortcut {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.xs};
    color: ${AFFINE_DESIGN_TOKENS.colors.textTertiary};
    background: ${AFFINE_DESIGN_TOKENS.colors.surfaceHover};
    padding: ${AFFINE_DESIGN_TOKENS.spacing.xs} ${AFFINE_DESIGN_TOKENS.spacing.sm};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.sm};
    font-family: ui-monospace, 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
  }
  
  /* 分隔线样式 */
  .slash-menu-divider {
    height: 1px;
    background: ${AFFINE_DESIGN_TOKENS.colors.borderLight};
    margin: ${AFFINE_DESIGN_TOKENS.spacing.md} 0;
  }
  
  /* 空状态样式 */
  .slash-menu-empty {
    padding: ${AFFINE_DESIGN_TOKENS.spacing.xxxl};
    text-align: center;
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.sm};
  }
  
  .slash-menu-empty-icon {
    width: 48px;
    height: 48px;
    margin: 0 auto ${AFFINE_DESIGN_TOKENS.spacing.lg};
    opacity: 0.3;
  }
  
  /* 加载状态 */
  .slash-menu-loading {
    padding: ${AFFINE_DESIGN_TOKENS.spacing.xl};
    text-align: center;
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
  }
  
  .slash-menu-loading-spinner {
    width: 20px;
    height: 20px;
    margin: 0 auto ${AFFINE_DESIGN_TOKENS.spacing.md};
    border: 2px solid ${AFFINE_DESIGN_TOKENS.colors.border};
    border-top-color: ${AFFINE_DESIGN_TOKENS.colors.primary};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* 暗色主题支持 */
  @media (prefers-color-scheme: dark) {
    .slash-menu {
      background: #1F2937;
      border-color: #374151;
    }
    
    .slash-menu-item {
      background: #1F2937;
    }
    
    .slash-menu-item:hover {
      background: #374151;
      border-color: #4B5563;
    }
    
    .slash-menu-item-icon {
      background: #374151;
      border-color: #4B5563;
    }
    
    .slash-menu-item-title {
      color: #F9FAFB;
    }
    
    .slash-menu-item-description {
      color: #D1D5DB;
    }
    
    .slash-menu-group-title {
      color: #9CA3AF;
    }
  }
  
  /* 响应式设计 */
  @media (max-width: 768px) {
    .slash-menu {
      width: 300px;
      max-height: 360px;
      padding: ${AFFINE_DESIGN_TOKENS.spacing.md};
    }
    
    .slash-menu-item {
      padding: ${AFFINE_DESIGN_TOKENS.spacing.md} ${AFFINE_DESIGN_TOKENS.spacing.sm};
      gap: ${AFFINE_DESIGN_TOKENS.spacing.md};
    }
    
    .slash-menu-item-icon {
      width: 32px;
      height: 32px;
    }
    
    .slash-menu-item-icon svg {
      width: 18px;
      height: 18px;
    }
  }
  
  /* 高对比度模式支持 */
  @media (prefers-contrast: high) {
    .slash-menu-item {
      border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
    }
    
    .slash-menu-item:hover {
      border-color: ${AFFINE_DESIGN_TOKENS.colors.textPrimary};
    }
    
    .slash-menu-item.selected {
      border-color: ${AFFINE_DESIGN_TOKENS.colors.primary};
      background: rgba(91, 156, 255, 0.15);
    }
  }
  
  /* 减少动画模式支持 */
  @media (prefers-reduced-motion: reduce) {
    .slash-menu-item {
      transition: none;
    }
    
    .slash-menu-item:hover {
      transform: none;
    }
    
    .slash-menu-loading-spinner {
      animation: none;
    }
  }
`;

/**
 * 改进后的工具栏样式
 * 与系统整体设计保持一致
 */
export const improvedToolbarStyles = css`
  .affine-toolbar {
    /* 现代化容器 */
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border: 1px solid ${AFFINE_DESIGN_TOKENS.colors.borderLight};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.lg};
    box-shadow: ${AFFINE_DESIGN_TOKENS.shadows.md};
    
    /* 内边距调整 */
    padding: ${AFFINE_DESIGN_TOKENS.spacing.sm} ${AFFINE_DESIGN_TOKENS.spacing.md};
    gap: ${AFFINE_DESIGN_TOKENS.spacing.sm};
    
    /* 过渡效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.normal};
  }
  
  .affine-toolbar-item {
    /* 现代化按钮设计 */
    padding: ${AFFINE_DESIGN_TOKENS.spacing.md};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.md};
    border: 1px solid transparent;
    
    /* 悬停效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.fast};
  }
  
  .affine-toolbar-item:hover {
    background: ${AFFINE_DESIGN_TOKENS.colors.surfaceHover};
    border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
    transform: translateY(-1px);
    box-shadow: ${AFFINE_DESIGN_TOKENS.shadows.sm};
  }
  
  .affine-toolbar-item.active {
    background: rgba(91, 156, 255, 0.1);
    border-color: ${AFFINE_DESIGN_TOKENS.colors.primary};
    color: ${AFFINE_DESIGN_TOKENS.colors.primary};
  }
`;

/**
 * 与右侧面板一致的块命令项组件样式
 */
export const blockCommandItemStyles = css`
  .block-command-item {
    /* 基础布局 */
    display: flex;
    align-items: center;
    gap: ${AFFINE_DESIGN_TOKENS.spacing.lg};
    width: 100%;
    padding: ${AFFINE_DESIGN_TOKENS.spacing.lg};
    margin-bottom: ${AFFINE_DESIGN_TOKENS.spacing.sm};
    
    /* 现代化外观 */
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border: 1px solid transparent;
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.md};
    color: ${AFFINE_DESIGN_TOKENS.colors.textPrimary};
    text-align: left;
    cursor: pointer;
    
    /* 过渡效果 */
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.fast};
    
    /* 移除默认按钮样式 */
    font-family: inherit;
    font-size: inherit;
    text-decoration: none;
    outline: none;
  }
  
  .block-command-item:hover {
    background: ${AFFINE_DESIGN_TOKENS.colors.surfaceHover};
    border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
    transform: translateY(-1px);
    box-shadow: ${AFFINE_DESIGN_TOKENS.shadows.sm};
  }
  
  .block-command-item:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  .block-command-item:focus-visible {
    outline: 2px solid ${AFFINE_DESIGN_TOKENS.colors.primary};
    outline-offset: 2px;
  }
  
  /* 图标样式 */
  .block-command-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    
    background: ${AFFINE_DESIGN_TOKENS.colors.surface};
    border: 1px solid ${AFFINE_DESIGN_TOKENS.colors.borderLight};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.md};
    
    transition: all ${AFFINE_DESIGN_TOKENS.transitions.fast};
  }
  
  .block-command-item:hover .block-command-icon {
    background: ${AFFINE_DESIGN_TOKENS.colors.background};
    border-color: ${AFFINE_DESIGN_TOKENS.colors.border};
  }
  
  /* 文本内容 */
  .block-command-content {
    flex: 1;
    min-width: 0;
  }
  
  .block-command-title {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.base};
    font-weight: 500;
    color: ${AFFINE_DESIGN_TOKENS.colors.textPrimary};
    margin: 0 0 ${AFFINE_DESIGN_TOKENS.spacing.xs} 0;
    line-height: 1.4;
  }
  
  .block-command-description {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.sm};
    color: ${AFFINE_DESIGN_TOKENS.colors.textSecondary};
    margin: 0;
    line-height: 1.3;
    
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  /* 键盘快捷键 */
  .block-command-shortcut {
    font-size: ${AFFINE_DESIGN_TOKENS.fontSize.xs};
    color: ${AFFINE_DESIGN_TOKENS.colors.textTertiary};
    background: ${AFFINE_DESIGN_TOKENS.colors.surfaceHover};
    padding: ${AFFINE_DESIGN_TOKENS.spacing.xs} ${AFFINE_DESIGN_TOKENS.spacing.sm};
    border-radius: ${AFFINE_DESIGN_TOKENS.borderRadius.sm};
    font-family: ui-monospace, 'SF Mono', monospace;
  }
`;

export default {
  AFFINE_DESIGN_TOKENS,
  improvedSlashMenuStyles,
  improvedToolbarStyles,
  blockCommandItemStyles,
};