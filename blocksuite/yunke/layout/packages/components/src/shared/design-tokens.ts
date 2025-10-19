import { css } from 'lit';

/**
 * 设计令牌 - 统一的设计规范
 * 基于BlockSuite现有的CSS变量系统
 */
export const DesignTokens = {
  // 颜色系统
  colors: {
    // 主色调
    primary: 'var(--affine-primary-color)',
    primaryAlpha: 'var(--affine-primary-color-alpha, rgba(30, 150, 235, 0.1))',
    
    // 背景色
    backgroundPrimary: 'var(--affine-background-primary-color)',
    backgroundSecondary: 'var(--affine-background-secondary-color)',
    backgroundTertiary: 'var(--affine-background-tertiary-color)',
    backgroundOverlay: 'var(--affine-background-overlay-panel-color)',
    backgroundDisabled: 'var(--affine-background-disabled-color, #f4f4f5)',
    
    // 文本色
    textPrimary: 'var(--affine-text-primary-color)',
    textSecondary: 'var(--affine-text-secondary-color)',
    textDisabled: 'var(--affine-text-disable-color)',
    textEmphasis: 'var(--affine-text-emphasis-color)',
    
    // 边框色
    border: 'var(--affine-border-color)',
    borderHover: 'var(--affine-divider-color)',
    
    // 交互色
    hover: 'var(--affine-hover-color)',
    selected: 'var(--affine-primary-color-alpha)',
    error: 'var(--affine-error-color)',
    warning: 'var(--affine-warning-color)',
    success: 'var(--affine-success-color)',
    
    // 图标色
    icon: 'var(--affine-icon-color)',
    iconHover: 'var(--affine-icon-hover-color)',
    iconSecondary: 'var(--affine-icon-secondary-color)'
  },
  
  // 间距系统 (基于8px网格)
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px'
  },
  
  // 圆角系统
  radius: {
    xs: '2px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    round: '50%'
  },
  
  // 阴影系统
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 2px 4px rgba(0, 0, 0, 0.05)',
    lg: '0 4px 8px rgba(0, 0, 0, 0.1)',
    xl: '0 8px 24px rgba(0, 0, 0, 0.12)',
    inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)'
  },
  
  // 动画系统
  animation: {
    // 时长
    fast: '0.15s',
    normal: '0.3s',
    slow: '0.5s',
    
    // 缓动函数
    easeOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    
    // 延迟
    delay: {
      sm: '0.05s',
      md: '0.1s',
      lg: '0.2s'
    }
  },
  
  // 字体系统
  typography: {
    // 字体大小
    fontSize: {
      xs: '10px',
      sm: '12px',
      base: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px'
    },
    
    // 字重
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    
    // 行高
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75'
    }
  },
  
  // Z-index层级
  zIndex: {
    dropdown: '1000',
    modal: '1100',
    popover: '1200',
    tooltip: '1300'
  },
  
  // 断点系统 (集成C2响应式系统)
  breakpoints: {
    mobile: '768px',
    tablet: '1024px',
    desktop: '1440px',
    large: '1920px'
  },
  
  // 容器查询断点 (支持C2的容器查询)
  containerBreakpoints: {
    small: '400px',
    medium: '600px',
    large: '900px',
    xlarge: '1200px'
  }
} as const;

/**
 * 样式工具函数
 */
export const StyleUtils = {
  // 悬停状态
  hover: (styles: string) => `
    &:hover {
      ${styles}
    }
  `,
  
  // 激活状态
  active: (styles: string) => `
    &:active, &.active {
      ${styles}
    }
  `,
  
  // 禁用状态
  disabled: (styles: string) => `
    &:disabled, &[disabled] {
      ${styles}
    }
  `,
  
  // 焦点状态
  focus: (styles: string) => `
    &:focus-visible {
      ${styles}
    }
  `,
  
  // 响应式媒体查询
  mobile: (styles: string) => `
    @media (max-width: ${DesignTokens.breakpoints.mobile}) {
      ${styles}
    }
  `,
  
  tablet: (styles: string) => `
    @media (max-width: ${DesignTokens.breakpoints.tablet}) {
      ${styles}
    }
  `,
  
  desktop: (styles: string) => `
    @media (min-width: ${DesignTokens.breakpoints.desktop}) {
      ${styles}
    }
  `,
  
  // 容器查询 (增强支持C2的响应式系统)
  container: (condition: string, styles: string) => `
    @container (${condition}) {
      ${styles}
    }
  `,
  
  // 容器查询快捷方法
  containerSmall: (styles: string) => `
    @container (max-width: ${DesignTokens.containerBreakpoints.small}) {
      ${styles}
    }
  `,
  
  containerMedium: (styles: string) => `
    @container (max-width: ${DesignTokens.containerBreakpoints.medium}) {
      ${styles}
    }
  `,
  
  containerLarge: (styles: string) => `
    @container (max-width: ${DesignTokens.containerBreakpoints.large}) {
      ${styles}
    }
  `,
  
  // 列数响应式约束 (集成C2的maxColumns逻辑)
  maxColumns: (max: number, styles: string) => `
    &[data-max-columns="${max}"] {
      ${styles}
    }
  `,
  
  // 暗色模式
  darkMode: (styles: string) => `
    @media (prefers-color-scheme: dark) {
      ${styles}
    }
  `,
  
  // 减弱动画
  reducedMotion: (styles: string) => `
    @media (prefers-reduced-motion: reduce) {
      ${styles}
    }
  `
};

/**
 * 常用样式组合
 */
export const CommonStyles = {
  // 重置样式
  reset: css`
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-decoration: none;
    list-style: none;
    box-sizing: border-box;
  `,
  
  // Flex布局
  flexCenter: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  
  flexBetween: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,
  
  flexColumn: css`
    display: flex;
    flex-direction: column;
  `,
  
  // 文本省略
  textEllipsis: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  
  // 绝对定位居中
  absoluteCenter: css`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  `,
  
  // 隐藏滚动条
  hideScrollbar: css`
    -ms-overflow-style: none;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  `,
  
  // 自定义滚动条
  customScrollbar: css`
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: ${DesignTokens.colors.textDisabled};
      border-radius: ${DesignTokens.radius.sm};
    }
    
    &::-webkit-scrollbar-thumb:hover {
      background: ${DesignTokens.colors.textSecondary};
    }
  `
};

/**
 * 动画关键帧
 */
export const AnimationKeyframes = {
  // 淡入
  fadeIn: css`
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
  `,
  
  // 淡出
  fadeOut: css`
    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
  `,
  
  // 向上滑入
  slideUp: css`
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  // 向下滑入
  slideDown: css`
    @keyframes slideDown {
      from {
        transform: translateY(-20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  
  // 缩放进入
  scaleIn: css`
    @keyframes scaleIn {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  
  // 旋转加载
  spin: css`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,
  
  // 脉冲效果
  pulse: css`
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  
  // 弹跳效果
  bounce: css`
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translateY(0);
      }
      40%, 43% {
        transform: translateY(-8px);
      }
      70% {
        transform: translateY(-4px);
      }
      90% {
        transform: translateY(-2px);
      }
    }
  `
};