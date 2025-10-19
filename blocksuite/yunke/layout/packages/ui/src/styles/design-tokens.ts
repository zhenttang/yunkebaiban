/**
 * 设计令牌系统 - BlockSuite列布局主题
 * 开发者B3任务：创建完整的设计令牌和主题系统
 */

/**
 * 颜色令牌
 */
export const ColorTokens = {
  // 主色调
  primary: {
    50: '#eff6ff',
    100: '#dbeafe', 
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // 主色
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // 灰度
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },
  
  // 语义颜色
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6'
  },
  
  // 背景颜色
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    elevated: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)'
  },
  
  // 文本颜色
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    link: '#3b82f6',
    linkHover: '#2563eb'
  },
  
  // 边框颜色
  border: {
    primary: '#e5e7eb',
    secondary: '#d1d5db',
    focus: '#3b82f6',
    error: '#ef4444',
    success: '#10b981'
  }
} as const;

/**
 * 间距令牌
 */
export const SpacingTokens = {
  0: '0px',
  1: '4px',
  2: '8px', 
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  32: '128px'
} as const;

/**
 * 字体令牌
 */
export const TypographyTokens = {
  fontFamily: {
    sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace']
  },
  
  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px'
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75'
  }
} as const;

/**
 * 圆角令牌
 */
export const BorderRadiusTokens = {
  none: '0px',
  sm: '2px',
  default: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px'
} as const;

/**
 * 阴影令牌
 */
export const ShadowTokens = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  default: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  focus: '0 0 0 3px rgba(59, 130, 246, 0.1)'
} as const;

/**
 * 过渡令牌
 */
export const TransitionTokens = {
  duration: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },
  
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    linear: 'linear'
  }
} as const;

/**
 * Z-index令牌
 */
export const ZIndexTokens = {
  auto: 'auto',
  base: '0',
  tooltip: '1000',
  modal: '2000',
  popover: '3000',
  notification: '4000',
  max: '9999'
} as const;

/**
 * 断点令牌
 */
export const BreakpointTokens = {
  mobile: '320px',
  tablet: '768px', 
  desktop: '1024px',
  wide: '1440px',
  ultrawide: '1920px'
} as const;

/**
 * 布局特定令牌
 */
export const LayoutTokens = {
  // 列相关
  column: {
    gap: SpacingTokens[4], // 16px
    padding: SpacingTokens[3], // 12px
    minWidth: '200px',
    maxWidth: '400px',
    borderRadius: BorderRadiusTokens.md,
    background: ColorTokens.background.primary,
    border: `1px solid ${ColorTokens.border.primary}`,
    shadow: ShadowTokens.sm
  },
  
  // Block相关
  block: {
    gap: SpacingTokens[2], // 8px
    padding: SpacingTokens[3], // 12px
    borderRadius: BorderRadiusTokens.default,
    background: ColorTokens.background.primary,
    border: `1px solid ${ColorTokens.border.primary}`,
    shadow: ShadowTokens.sm,
    hoverShadow: ShadowTokens.md
  },
  
  // 切换器相关
  switcher: {
    gap: SpacingTokens[2], // 8px
    padding: SpacingTokens[2], // 8px
    buttonSize: '32px',
    borderRadius: BorderRadiusTokens.lg,
    background: ColorTokens.background.secondary,
    border: `1px solid ${ColorTokens.border.primary}`
  },
  
  // 容器相关
  container: {
    maxWidth: '1200px',
    padding: SpacingTokens[6], // 24px
    margin: '0 auto'
  }
} as const;

/**
 * 主题配置类型
 */
export interface ThemeConfig {
  colors: typeof ColorTokens;
  spacing: typeof SpacingTokens;
  typography: typeof TypographyTokens;
  borderRadius: typeof BorderRadiusTokens;
  shadows: typeof ShadowTokens;
  transitions: typeof TransitionTokens;
  zIndex: typeof ZIndexTokens;
  breakpoints: typeof BreakpointTokens;
  layout: typeof LayoutTokens;
}

/**
 * 默认主题
 */
export const DefaultTheme: ThemeConfig = {
  colors: ColorTokens,
  spacing: SpacingTokens,
  typography: TypographyTokens,
  borderRadius: BorderRadiusTokens,
  shadows: ShadowTokens,
  transitions: TransitionTokens,
  zIndex: ZIndexTokens,
  breakpoints: BreakpointTokens,
  layout: LayoutTokens
} as const;

/**
 * 暗色主题
 */
export const DarkTheme: ThemeConfig = {
  ...DefaultTheme,
  colors: {
    ...ColorTokens,
    background: {
      primary: '#111827',
      secondary: '#1f2937',
      tertiary: '#374151',
      elevated: '#1f2937',
      overlay: 'rgba(0, 0, 0, 0.8)'
    },
    text: {
      primary: '#f9fafb',
      secondary: '#d1d5db',
      tertiary: '#9ca3af',
      inverse: '#111827',
      link: '#60a5fa',
      linkHover: '#93c5fd'
    },
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      focus: '#60a5fa',
      error: '#f87171',
      success: '#34d399'
    }
  }
} as const;

/**
 * CSS变量生成器
 */
export function generateCSSVariables(theme: ThemeConfig): Record<string, string> {
  const variables: Record<string, string> = {};
  
  // 颜色变量
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    variables[`--color-primary-${key}`] = value;
  });
  
  Object.entries(theme.colors.gray).forEach(([key, value]) => {
    variables[`--color-gray-${key}`] = value;
  });
  
  Object.entries(theme.colors.semantic).forEach(([key, value]) => {
    variables[`--color-${key}`] = value;
  });
  
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    variables[`--bg-${key}`] = value;
  });
  
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    variables[`--text-${key}`] = value;
  });
  
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    variables[`--border-${key}`] = value;
  });
  
  // 间距变量
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables[`--spacing-${key}`] = value;
  });
  
  // 字体变量
  variables['--font-family-sans'] = theme.typography.fontFamily.sans.join(', ');
  variables['--font-family-mono'] = theme.typography.fontFamily.mono.join(', ');
  
  Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
    variables[`--font-size-${key}`] = value;
  });
  
  Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
    variables[`--font-weight-${key}`] = value;
  });
  
  // 圆角变量
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    variables[`--border-radius-${key}`] = value;
  });
  
  // 阴影变量
  Object.entries(theme.shadows).forEach(([key, value]) => {
    variables[`--shadow-${key}`] = value;
  });
  
  // 过渡变量
  Object.entries(theme.transitions.duration).forEach(([key, value]) => {
    variables[`--duration-${key}`] = value;
  });
  
  Object.entries(theme.transitions.easing).forEach(([key, value]) => {
    variables[`--easing-${key}`] = value;
  });
  
  // Z-index变量
  Object.entries(theme.zIndex).forEach(([key, value]) => {
    variables[`--z-${key}`] = value;
  });
  
  // 断点变量
  Object.entries(theme.breakpoints).forEach(([key, value]) => {
    variables[`--breakpoint-${key}`] = value;
  });
  
  return variables;
}

/**
 * 主题切换器
 */
export class ThemeSwitcher {
  private currentTheme: ThemeConfig = DefaultTheme;
  private styleElement?: HTMLStyleElement;
  
  constructor() {
    this.createStyleElement();
    this.applyTheme(this.currentTheme);
  }
  
  private createStyleElement() {
    this.styleElement = document.createElement('style');
    this.styleElement.id = 'blocksuite-layout-theme';
    document.head.appendChild(this.styleElement);
  }
  
  public setTheme(theme: ThemeConfig) {
    this.currentTheme = theme;
    this.applyTheme(theme);
  }
  
  public toggleDarkMode() {
    const isDark = this.currentTheme === DarkTheme;
    this.setTheme(isDark ? DefaultTheme : DarkTheme);
    return !isDark;
  }
  
  private applyTheme(theme: ThemeConfig) {
    if (!this.styleElement) return;
    
    const variables = generateCSSVariables(theme);
    const cssText = `:root {\n${Object.entries(variables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;
    
    this.styleElement.textContent = cssText;
  }
  
  public getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }
  
  public isDarkMode(): boolean {
    return this.currentTheme === DarkTheme;
  }
}

// 导出默认主题切换器实例
export const themeSwitcher = new ThemeSwitcher();