# B2 实时支援 B1 - LayoutSwitcher 组件开发

## 🚀 当前支援状态

**时间**: 2025-01-27
**支援对象**: 开发者B1 - 组件架构师  
**支援任务**: LayoutSwitcher 核心组件开发
**支援方式**: 实时技术指导 + 代码协助

## 🎯 立即开始的任务

### 1. 创建 LayoutSwitcher 组件基础结构

```bash
# 创建组件目录结构
mkdir -p packages/components/src/layout-switcher
cd packages/components/src/layout-switcher
```

```typescript
// 文件: packages/components/src/layout-switcher/layout-switcher.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { InteractionManager } from '../column-content/interaction-manager.js';
import { PageLayoutMode } from '@yunkebaiban/core';

@customElement('layout-switcher')
export class LayoutSwitcher extends LitElement {
  // === 核心属性 ===
  @property() currentMode: PageLayoutMode = PageLayoutMode.Normal;
  @property() disabled = false;
  @property() readonly = false;
  
  // === 内部状态 ===
  @state() private interactionManager?: InteractionManager;
  @state() private isAnimating = false;
  
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    
    .layout-switcher {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--affine-background-secondary-color);
      border-radius: 8px;
      border: 1px solid var(--affine-border-color);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .layout-switcher:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .layout-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      padding: 8px;
      border: 2px solid transparent;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      color: var(--affine-text-secondary-color);
    }
    
    .layout-button:hover:not(.disabled) {
      background: var(--affine-hover-color);
      border-color: var(--affine-primary-color);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .layout-button.active {
      background: var(--affine-primary-color);
      border-color: var(--affine-primary-color);
      color: white;
    }
    
    .layout-button.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .layout-icon {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .layout-label {
      font-size: 10px;
      font-weight: 500;
    }
    
    .layout-button:focus-visible {
      outline: 2px solid var(--affine-primary-color);
      outline-offset: 2px;
    }
  `;
  
  protected firstUpdated() {
    this.initializeInteractionManager();
  }
  
  protected render() {
    return html`
      <div class="layout-switcher" 
           ?data-disabled=${this.disabled}
           ?data-animating=${this.isAnimating}>
        ${this.renderLayoutButtons()}
      </div>
    `;
  }
  
  private renderLayoutButtons() {
    const modes = [
      { 
        mode: PageLayoutMode.Normal, 
        icon: '━', 
        label: '单列',
        description: '传统单列文档布局'
      },
      { 
        mode: PageLayoutMode.TwoColumn, 
        icon: '▢▢', 
        label: '双列',
        description: '左右双列并排布局'
      },
      { 
        mode: PageLayoutMode.ThreeColumn, 
        icon: '▢▢▢', 
        label: '三列',
        description: '三列并排布局'
      },
      { 
        mode: PageLayoutMode.FourColumn, 
        icon: '▢▢▢▢', 
        label: '四列',
        description: '四列并排布局'
      },
      { 
        mode: PageLayoutMode.FiveColumn, 
        icon: '▢▢▢▢▢', 
        label: '五列',
        description: '五列并排布局'
      }
    ];
    
    return modes.map(({ mode, icon, label, description }) => html`
      <button 
        class="layout-button ${this.getButtonClasses(mode)}"
        @click=${() => this.handleModeChange(mode)}
        @keydown=${this.handleKeydown}
        aria-label="切换到${label}布局"
        aria-describedby="layout-${mode}-description"
        title="${description}"
        data-mode=${mode}
        ?disabled=${this.disabled}
      >
        <span class="layout-icon">${icon}</span>
        <span class="layout-label">${label}</span>
        <span id="layout-${mode}-description" class="sr-only">${description}</span>
      </button>
    `);
  }
  
  private getButtonClasses(mode: PageLayoutMode): string {
    const classes = [];
    
    if (mode === this.currentMode) {
      classes.push('active');
    }
    
    if (this.disabled) {
      classes.push('disabled');
    }
    
    return classes.join(' ');
  }
  
  private async handleModeChange(newMode: PageLayoutMode) {
    if (this.disabled || this.readonly || newMode === this.currentMode || this.isAnimating) {
      return;
    }
    
    // 防止连续点击
    this.isAnimating = true;
    
    try {
      // 触发模式切换事件
      const changeEvent = new CustomEvent('layout-mode-change', {
        detail: { 
          oldMode: this.currentMode, 
          newMode,
          timestamp: Date.now(),
          source: 'user-interaction'
        },
        bubbles: true,
        composed: true
      });
      
      // 播放点击动画
      const button = this.querySelector(`[data-mode="${newMode}"]`) as HTMLElement;
      if (button && this.interactionManager) {
        const animations = this.interactionManager.getModules().animations;
        if (animations) {
          animations.animateButtonClick(button);
        }
      }
      
      // 更新当前模式
      this.currentMode = newMode;
      
      // 分发事件
      this.dispatchEvent(changeEvent);
      
      // 等待短暂时间确保动画完成
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } finally {
      this.isAnimating = false;
    }
  }
  
  private handleKeydown = (event: KeyboardEvent) => {
    // 数字键快速切换
    if (event.key >= '1' && event.key <= '5') {
      event.preventDefault();
      const modeIndex = parseInt(event.key) - 1;
      const modes = [
        PageLayoutMode.Normal,
        PageLayoutMode.TwoColumn,
        PageLayoutMode.ThreeColumn,
        PageLayoutMode.FourColumn,
        PageLayoutMode.FiveColumn
      ];
      
      if (modes[modeIndex]) {
        this.handleModeChange(modes[modeIndex]);
      }
      return;
    }
    
    // 方向键导航
    const buttons = Array.from(this.querySelectorAll('.layout-button')) as HTMLElement[];
    const currentIndex = buttons.findIndex(btn => btn.classList.contains('active'));
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        nextIndex = Math.min(buttons.length - 1, currentIndex + 1);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = buttons.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const activeButton = event.target as HTMLElement;
        const mode = activeButton.getAttribute('data-mode') as PageLayoutMode;
        if (mode) {
          this.handleModeChange(mode);
        }
        break;
    }
    
    if (nextIndex !== currentIndex) {
      buttons[nextIndex]?.focus();
    }
  };
  
  private initializeInteractionManager() {
    this.interactionManager = new InteractionManager(this, {
      enableDrag: false,
      enableAnimations: true,
      enableStateManagement: true,
      enableAccessibility: true,
      enableSlashMenu: false
    });
    
    // 设置切换器的可访问性
    this.interactionManager.setupLayoutSwitcherInteraction(this);
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.interactionManager?.cleanup();
  }
  
  // === 公共API ===
  
  /**
   * 程序化设置布局模式
   */
  setMode(mode: PageLayoutMode, source: 'user-interaction' | 'programmatic' = 'programmatic') {
    if (mode !== this.currentMode) {
      const oldMode = this.currentMode;
      this.currentMode = mode;
      
      // 触发变化事件
      this.dispatchEvent(new CustomEvent('layout-mode-change', {
        detail: { oldMode, newMode: mode, timestamp: Date.now(), source },
        bubbles: true,
        composed: true
      }));
    }
  }
  
  /**
   * 获取当前模式
   */
  getMode(): PageLayoutMode {
    return this.currentMode;
  }
  
  /**
   * 启用/禁用组件
   */
  setDisabled(disabled: boolean) {
    this.disabled = disabled;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'layout-switcher': LayoutSwitcher;
  }
}
```

### 2. 创建组件样式文件

```typescript
// 文件: packages/components/src/layout-switcher/layout-switcher-styles.ts
import { css } from 'lit';

export const layoutSwitcherStyles = css`
  /* 基础样式已包含在组件内 */
  
  /* 动画增强 */
  .layout-button {
    position: relative;
    overflow: hidden;
  }
  
  .layout-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    transition: left 0.5s ease;
  }
  
  .layout-button:hover::before {
    left: 100%;
  }
  
  .layout-button.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 2px;
    background: white;
    border-radius: 1px;
  }
  
  /* 响应式调整 */
  @media (max-width: 768px) {
    .layout-switcher {
      gap: 4px;
      padding: 6px 8px;
    }
    
    .layout-button {
      width: 40px;
      height: 40px;
    }
    
    .layout-icon {
      font-size: 14px;
    }
    
    .layout-label {
      font-size: 9px;
    }
  }
  
  /* 高对比度模式 */
  @media (prefers-contrast: high) {
    .layout-button {
      border-width: 3px;
    }
    
    .layout-button:focus-visible {
      outline-width: 3px;
    }
  }
  
  /* 减弱动画模式 */
  @media (prefers-reduced-motion: reduce) {
    .layout-button {
      transition: none;
    }
    
    .layout-button::before {
      display: none;
    }
  }
  
  /* 暗色主题优化 */
  @media (prefers-color-scheme: dark) {
    .layout-switcher {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
    
    .layout-switcher:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }
    
    .layout-button:hover:not(.disabled) {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
  }
`;
```

### 3. 创建组件测试文件

```typescript
// 文件: packages/components/src/layout-switcher/layout-switcher.test.ts
import { expect, fixture, html } from '@open-wc/testing';
import { LayoutSwitcher } from './layout-switcher.js';
import { PageLayoutMode } from '@yunkebaiban/core';

describe('LayoutSwitcher', () => {
  it('should render correctly', async () => {
    const el = await fixture<LayoutSwitcher>(html`
      <layout-switcher></layout-switcher>
    `);
    
    expect(el).to.exist;
    expect(el.currentMode).to.equal(PageLayoutMode.Normal);
  });
  
  it('should handle mode changes', async () => {
    const el = await fixture<LayoutSwitcher>(html`
      <layout-switcher></layout-switcher>
    `);
    
    let eventFired = false;
    el.addEventListener('layout-mode-change', () => {
      eventFired = true;
    });
    
    // 模拟点击双列按钮
    const twoColumnButton = el.querySelector('[data-mode="2-column"]') as HTMLElement;
    twoColumnButton.click();
    
    await el.updateComplete;
    
    expect(eventFired).to.be.true;
    expect(el.currentMode).to.equal(PageLayoutMode.TwoColumn);
  });
  
  it('should handle keyboard navigation', async () => {
    const el = await fixture<LayoutSwitcher>(html`
      <layout-switcher></layout-switcher>
    `);
    
    // 测试数字键切换
    const keyEvent = new KeyboardEvent('keydown', { key: '3' });
    el.dispatchEvent(keyEvent);
    
    await el.updateComplete;
    
    expect(el.currentMode).to.equal(PageLayoutMode.ThreeColumn);
  });
  
  it('should respect disabled state', async () => {
    const el = await fixture<LayoutSwitcher>(html`
      <layout-switcher disabled></layout-switcher>
    `);
    
    const originalMode = el.currentMode;
    
    // 尝试点击其他按钮
    const threeColumnButton = el.querySelector('[data-mode="3-column"]') as HTMLElement;
    threeColumnButton.click();
    
    await el.updateComplete;
    
    // 模式不应该改变
    expect(el.currentMode).to.equal(originalMode);
  });
});
```

### 4. 创建组件入口文件

```typescript
// 文件: packages/components/src/layout-switcher/index.ts
export { LayoutSwitcher } from './layout-switcher.js';
export { layoutSwitcherStyles } from './layout-switcher-styles.js';

// 自动注册组件
import './layout-switcher.js';
```

## 🎯 下一步指导

### B1 应该立即执行：

1. **创建上述文件结构** (15分钟)
2. **测试基础组件功能** (15分钟)
3. **集成到项目中** (20分钟)
4. **验证交互功能** (10分钟)

### 关键集成点：

1. **确保导入正确**：
   ```typescript
   import { PageLayoutMode } from '@yunkebaiban/core';
   import { InteractionManager } from '../column-content/interaction-manager.js';
   ```

2. **事件监听**：
   ```typescript
   // 在父组件中监听布局变化
   layoutSwitcher.addEventListener('layout-mode-change', (event) => {
     console.log('Layout changed:', event.detail);
   });
   ```

3. **样式集成**：确保组件样式与整体设计系统一致。

## 🚨 立即需要解决的问题

1. **确认 PageLayoutMode 枚举导入路径**
2. **验证 InteractionManager 可用性**
3. **测试组件渲染**

**B2实时支援状态：✅ 就绪**  
*随时为B1解决技术问题和集成困难！*