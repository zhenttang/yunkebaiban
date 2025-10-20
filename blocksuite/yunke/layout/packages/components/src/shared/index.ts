/**
 * 样式系统统一入口
 * 
 * 提供完整的样式系统，包括：
 * - 设计令牌和工具函数
 * - 组件样式
 * - 布局系统
 * - 主题管理
 */

import { css } from 'lit';

// 核心设计系统
export { 
  DesignTokens, 
  StyleUtils, 
  CommonStyles, 
  AnimationKeyframes 
} from './design-tokens.js';

/**
 * 全局样式重置
 */
export const globalReset = css`
  /* 确保所有元素使用 border-box */
  *, *::before, *::after {
    box-sizing: border-box;
  }

  /* 平滑滚动 */
  html {
    scroll-behavior: smooth;
  }

  /* 基础字体设置 */
  body {
    font-family: var(--yunke-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* 移除默认焦点轮廓，使用自定义样式 */
  :focus {
    outline: none;
  }

  /* 为键盘用户提供可见的焦点指示器 */
  :focus-visible {
    outline: 2px solid var(--yunke-primary-color);
    outline-offset: 2px;
  }
`;

/**
 * 样式配置选项
 */
export interface StyleConfig {
  theme?: 'light' | 'dark' | 'auto';
  reducedMotion?: boolean;
  highContrast?: boolean;
  compact?: boolean;
}

/**
 * 样式配置工具
 */
export class StyleConfigManager {
  private static config: StyleConfig = {
    theme: 'auto',
    reducedMotion: false,
    highContrast: false,
    compact: false
  };

  /**
   * 更新样式配置
   */
  static updateConfig(newConfig: Partial<StyleConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyConfig();
  }

  /**
   * 获取当前配置
   */
  static getConfig(): StyleConfig {
    return { ...this.config };
  }

  /**
   * 应用配置到文档
   */
  private static applyConfig(): void {
    const root = document.documentElement;
    
    // 应用主题
    if (this.config.theme !== 'auto') {
      root.setAttribute('data-theme', this.config.theme!);
    } else {
      root.removeAttribute('data-theme');
    }

    // 应用减弱动画
    if (this.config.reducedMotion) {
      root.style.setProperty('--animation-duration', '0ms');
    } else {
      root.style.removeProperty('--animation-duration');
    }

    // 应用高对比度
    if (this.config.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }

    // 应用紧凑模式
    if (this.config.compact) {
      root.setAttribute('data-compact', 'true');
    } else {
      root.removeAttribute('data-compact');
    }
  }

  /**
   * 检测用户偏好并自动配置
   */
  static detectUserPreferences(): void {
    // 检测减弱动画偏好
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.reducedMotion = true;
    }

    // 检测高对比度偏好
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.highContrast = true;
    }

    // 监听偏好变化
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.updateConfig({ reducedMotion: e.matches });
    });

    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.updateConfig({ highContrast: e.matches });
    });

    this.applyConfig();
  }

  /**
   * 初始化样式系统
   */
  static initialize(): void {
    this.detectUserPreferences();
    
    // 在文档加载完成后应用配置
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.applyConfig());
    } else {
      this.applyConfig();
    }
  }
}

// 自动初始化样式系统
if (typeof window !== 'undefined') {
  StyleConfigManager.initialize();
}