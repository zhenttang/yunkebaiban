// 文件: packages/components/src/column-content/interaction-animations.ts
import { LitElement } from 'lit';

/**
 * 交互动画管理器
 * 
 * 提供流畅的交互动画效果:
 * - 组件加载动画
 * - 状态转换动画
 * - 微交互反馈
 * - 列布局切换动画
 * - 内容变化动画
 */
export class InteractionAnimations {
  private container: HTMLElement;
  private animationQueue: AnimationTask[] = [];
  private isProcessingQueue = false;
  
  // 动画配置
  private defaultOptions: KeyframeAnimationOptions = {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fill: 'forwards'
  };

  constructor(container: HTMLElement) {
    this.container = container;
    this.injectStyles();
    this.setupIntersectionObserver();
  }

  /**
   * 播放组件进入动画
   */
  animateComponentEntry(element: HTMLElement, options?: AnimationOptions) {
    const config = { ...this.defaultOptions, ...options };
    
    // 设置初始状态
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px) scale(0.95)';
    
    // 执行进入动画
    const animation = element.animate([
      {
        opacity: 0,
        transform: 'translateY(20px) scale(0.95)',
        filter: 'blur(4px)'
      },
      {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        filter: 'blur(0px)'
      }
    ], config);
    
    animation.addEventListener('finish', () => {
      element.style.opacity = '';
      element.style.transform = '';
    });
    
    return animation;
  }

  /**
   * 播放组件退出动画
   */
  animateComponentExit(element: HTMLElement, options?: AnimationOptions): Promise<void> {
    const config = { ...this.defaultOptions, duration: 200, ...options };
    
    const animation = element.animate([
      {
        opacity: 1,
        transform: 'scale(1)',
        filter: 'blur(0px)'
      },
      {
        opacity: 0,
        transform: 'scale(0.9)',
        filter: 'blur(2px)'
      }
    ], config);
    
    return new Promise(resolve => {
      animation.addEventListener('finish', () => resolve());
    });
  }

  /**
   * 播放列布局切换动画
   */
  async animateLayoutSwitch(
    oldColumns: HTMLElement[], 
    newColumns: HTMLElement[],
    layoutMode: string
  ) {
    // 添加到动画队列
    this.addToQueue({
      type: 'layout-switch',
      action: () => this.executeLayoutSwitchAnimation(oldColumns, newColumns, layoutMode)
    });
  }

  private async executeLayoutSwitchAnimation(
    oldColumns: HTMLElement[],
    newColumns: HTMLElement[],
    layoutMode: string
  ) {
    const container = this.container.querySelector('.layout-container') as HTMLElement;
    if (!container) return;
    
    // 1. 准备阶段 - 设置容器状态
    container.classList.add('layout-switching');
    
    // 2. 退出动画 - 旧列淡出
    if (oldColumns.length > 0) {
      const exitPromises = oldColumns.map((column, index) => {
        return this.animateColumnExit(column, index * 50);
      });
      
      await Promise.all(exitPromises);
    }
    
    // 3. 布局重构阶段
    this.updateLayoutStructure(container, layoutMode);
    
    // 4. 进入动画 - 新列进入
    const entryPromises = newColumns.map((column, index) => {
      return this.animateColumnEntry(column, index * 80);
    });
    
    await Promise.all(entryPromises);
    
    // 5. 完成清理
    container.classList.remove('layout-switching');
    this.showLayoutSwitchFeedback(layoutMode);
  }

  private animateColumnExit(column: HTMLElement, delay: number = 0): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        const animation = column.animate([
          {
            opacity: 1,
            transform: 'translateX(0) scale(1)',
            filter: 'blur(0px)'
          },
          {
            opacity: 0,
            transform: 'translateX(-30px) scale(0.95)',
            filter: 'blur(2px)'
          }
        ], {
          duration: 250,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          fill: 'forwards'
        });
        
        animation.addEventListener('finish', () => resolve());
      }, delay);
    });
  }

  private animateColumnEntry(column: HTMLElement, delay: number = 0): Promise<void> {
    // 设置初始状态
    column.style.opacity = '0';
    column.style.transform = 'translateX(30px) scale(0.95)';
    
    return new Promise(resolve => {
      setTimeout(() => {
        const animation = column.animate([
          {
            opacity: 0,
            transform: 'translateX(30px) scale(0.95)',
            filter: 'blur(2px)'
          },
          {
            opacity: 1,
            transform: 'translateX(0) scale(1)',
            filter: 'blur(0px)'
          }
        ], {
          duration: 350,
          easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          fill: 'forwards'
        });
        
        animation.addEventListener('finish', () => {
          column.style.opacity = '';
          column.style.transform = '';
          resolve();
        });
      }, delay);
    });
  }

  /**
   * 播放内容添加动画
   */
  animateContentAddition(element: HTMLElement, insertIndex: number) {
    // 设置初始状态
    element.style.opacity = '0';
    element.style.transform = 'translateY(-10px) scale(0.9)';
    element.style.maxHeight = '0px';
    element.style.overflow = 'hidden';
    
    // 获取目标高度
    const targetHeight = element.scrollHeight;
    
    // 执行动画
    const animation = element.animate([
      {
        opacity: 0,
        transform: 'translateY(-10px) scale(0.9)',
        maxHeight: '0px'
      },
      {
        opacity: 1,
        transform: 'translateY(0) scale(1)',
        maxHeight: targetHeight + 'px'
      }
    ], {
      duration: 400,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });
    
    animation.addEventListener('finish', () => {
      element.style.opacity = '';
      element.style.transform = '';
      element.style.maxHeight = '';
      element.style.overflow = '';
    });
    
    // 添加入场光效
    this.addSparkleEffect(element);
    
    return animation;
  }

  /**
   * 播放内容移除动画
   */
  animateContentRemoval(element: HTMLElement): Promise<void> {
    const animation = element.animate([
      {
        opacity: 1,
        transform: 'scale(1)',
        maxHeight: element.offsetHeight + 'px'
      },
      {
        opacity: 0,
        transform: 'scale(0.9)',
        maxHeight: '0px'
      }
    ], {
      duration: 300,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      fill: 'forwards'
    });
    
    return new Promise(resolve => {
      animation.addEventListener('finish', () => resolve());
    });
  }

  /**
   * 播放按钮点击动画
   */
  animateButtonClick(button: HTMLElement) {
    // 涟漪效果
    this.createRippleEffect(button);
    
    // 按钮按压动画
    const animation = button.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(0.95)' },
      { transform: 'scale(1)' }
    ], {
      duration: 150,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    return animation;
  }

  /**
   * 播放悬停动画
   */
  animateHover(element: HTMLElement, isEntering: boolean) {
    if (isEntering) {
      element.animate([
        {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
        }
      ], {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      });
    } else {
      element.animate([
        {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
        },
        {
          transform: 'translateY(0)',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        }
      ], {
        duration: 200,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      });
    }
  }

  /**
   * 播放错误震动动画
   */
  animateError(element: HTMLElement) {
    const animation = element.animate([
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-5px)' },
      { transform: 'translateX(5px)' },
      { transform: 'translateX(0)' }
    ], {
      duration: 400,
      easing: 'cubic-bezier(0.36, 0, 0.66, -0.56)'
    });
    
    // 添加错误高亮
    element.style.outline = '2px solid #ef4444';
    element.style.outlineOffset = '2px';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.outlineOffset = '';
    }, 800);
    
    return animation;
  }

  /**
   * 播放成功动画
   */
  animateSuccess(element: HTMLElement) {
    // 成功缩放动画
    const scaleAnimation = element.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ], {
      duration: 300,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
    
    // 添加成功光环
    this.addSuccessGlow(element);
    
    return scaleAnimation;
  }

  /**
   * 批量播放堆叠动画
   */
  animateStaggered(elements: HTMLElement[], animationType: 'entry' | 'exit', staggerDelay: number = 50) {
    const animations = elements.map((element, index) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          const animation = animationType === 'entry' 
            ? this.animateComponentEntry(element)
            : this.animateComponentExit(element);
            
          if (animation instanceof Animation) {
            animation.addEventListener('finish', () => resolve());
          } else {
            animation.then(() => resolve());
          }
        }, index * staggerDelay);
      });
    });
    
    return Promise.all(animations);
  }

  // 辅助方法
  private createRippleEffect(element: HTMLElement) {
    const ripple = document.createElement('div');
    ripple.className = 'interaction-ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${size}px;
      height: ${size}px;
      background: var(--affine-primary-color-alpha);
      border-radius: 50%;
      transform: translate(-50%, -50%) scale(0);
      pointer-events: none;
      z-index: 1;
    `;
    
    element.style.position = 'relative';
    element.appendChild(ripple);
    
    const animation = ripple.animate([
      { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.8 },
      { transform: 'translate(-50%, -50%) scale(2)', opacity: 0 }
    ], {
      duration: 600,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    });
    
    animation.addEventListener('finish', () => {
      ripple.remove();
    });
  }

  private addSparkleEffect(element: HTMLElement) {
    const sparkles = [];
    const sparkleCount = 6;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle-effect';
      sparkle.innerHTML = '✨';
      
      const angle = (360 / sparkleCount) * i;
      const distance = 50 + Math.random() * 30;
      
      sparkle.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 12px;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
      `;
      
      element.style.position = 'relative';
      element.appendChild(sparkle);
      sparkles.push(sparkle);
      
      // 发散动画
      setTimeout(() => {
        const x = Math.cos(angle * Math.PI / 180) * distance;
        const y = Math.sin(angle * Math.PI / 180) * distance;
        
        sparkle.animate([
          {
            transform: 'translate(-50%, -50%) scale(0) rotate(0deg)',
            opacity: 1
          },
          {
            transform: `translate(${x - 50}%, ${y - 50}%) scale(1) rotate(180deg)`,
            opacity: 1
          },
          {
            transform: `translate(${x - 50}%, ${y - 50}%) scale(0) rotate(360deg)`,
            opacity: 0
          }
        ], {
          duration: 800,
          easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        }).addEventListener('finish', () => {
          sparkle.remove();
        });
      }, i * 50);
    }
  }

  private addSuccessGlow(element: HTMLElement) {
    const glow = document.createElement('div');
    glow.className = 'success-glow';
    glow.style.cssText = `
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      background: linear-gradient(45deg, #22c55e, #10b981);
      border-radius: 8px;
      opacity: 0;
      pointer-events: none;
      z-index: -1;
      filter: blur(8px);
    `;
    
    element.style.position = 'relative';
    element.appendChild(glow);
    
    const animation = glow.animate([
      { opacity: 0 },
      { opacity: 0.6 },
      { opacity: 0 }
    ], {
      duration: 1000,
      easing: 'ease-in-out'
    });
    
    animation.addEventListener('finish', () => {
      glow.remove();
    });
  }

  private updateLayoutStructure(container: HTMLElement, layoutMode: string) {
    // 这里应该调用实际的布局更新逻辑
    // 现在先模拟更新
    console.log(`更新布局结构到: ${layoutMode}`);
  }

  private showLayoutSwitchFeedback(layoutMode: string) {
    const modeNames: Record<string, string> = {
      'normal': '单列布局',
      'two-column': '双列布局',
      'three-column': '三列布局',
      'four-column': '四列布局',
      'five-column': '五列布局'
    };
    
    const modeName = modeNames[layoutMode] || layoutMode;
    
    const toast = document.createElement('div');
    toast.className = 'layout-switch-toast';
    toast.innerHTML = `
      <div class="toast-icon">🎨</div>
      <div class="toast-message">已切换到${modeName}</div>
    `;
    
    toast.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--affine-background-overlay-panel-color);
      color: var(--affine-text-primary-color);
      padding: 12px 20px;
      border-radius: 25px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid var(--affine-border-color);
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    const showAnimation = toast.animate([
      {
        opacity: 0,
        transform: 'translateX(-50%) translateY(20px)'
      },
      {
        opacity: 1,
        transform: 'translateX(-50%) translateY(0)'
      }
    ], {
      duration: 300,
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      fill: 'forwards'
    });
    
    // 自动消失
    setTimeout(() => {
      toast.animate([
        {
          opacity: 1,
          transform: 'translateX(-50%) translateY(0)'
        },
        {
          opacity: 0,
          transform: 'translateX(-50%) translateY(-20px)'
        }
      ], {
        duration: 300,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      }).addEventListener('finish', () => {
        toast.remove();
      });
    }, 2000);
  }

  private addToQueue(task: AnimationTask) {
    this.animationQueue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.animationQueue.length === 0) return;
    
    this.isProcessingQueue = true;
    
    while (this.animationQueue.length > 0) {
      const task = this.animationQueue.shift()!;
      try {
        await task.action();
      } catch (error) {
        console.error('Animation task failed:', error);
      }
    }
    
    this.isProcessingQueue = false;
  }

  private setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement;
          if (element.hasAttribute('data-animate-on-visible')) {
            this.animateComponentEntry(element);
            observer.unobserve(element);
          }
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '50px'
    });
    
    // 观察所有需要懒加载动画的元素
    const animatedElements = this.container.querySelectorAll('[data-animate-on-visible]');
    animatedElements.forEach(element => {
      observer.observe(element);
    });
  }

  private injectStyles() {
    const styleId = 'interaction-animations-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* 布局切换状态 */
      .layout-switching {
        pointer-events: none;
        position: relative;
      }
      
      .layout-switching::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(1px);
        z-index: 1;
        pointer-events: none;
      }
      
      /* 动画相关工具类 */
      .animate-on-visible {
        opacity: 0;
        transform: translateY(20px);
      }
      
      /* 减弱动画模式 */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01s !important;
          transition-duration: 0.01s !important;
        }
      }
      
      /* 高性能动画优化 */
      .interaction-ripple,
      .sparkle-effect,
      .success-glow {
        will-change: transform, opacity;
      }
    `;
    
    document.head.appendChild(style);
  }

  // 公共方法
  clearQueue() {
    this.animationQueue = [];
  }

  dispose() {
    this.clearQueue();
    
    // 移除注入的样式
    const styleElement = document.getElementById('interaction-animations-styles');
    styleElement?.remove();
  }
}

// 类型定义
interface AnimationOptions extends KeyframeAnimationOptions {
  delay?: number;
}

interface AnimationTask {
  type: string;
  action: () => Promise<void>;
}

// 导出工厂函数
export function createInteractionAnimations(container: HTMLElement): InteractionAnimations {
  return new InteractionAnimations(container);
}