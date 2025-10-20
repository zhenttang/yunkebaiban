// 文件: packages/components/src/column-content/add-content-button.ts
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

/**
 * AddContentButton组件 - 列底部的添加内容按钮
 * 
 * 功能:
 * - 显示友好的添加内容提示
 * - 集成SlashMenu系统
 * - 支持键盘导航
 * - 提供点击反馈动画
 */
@customElement('add-content-button')
export class AddContentButton extends LitElement {
  @property() columnIndex!: number;
  @property() insertIndex?: number;
  @property() disabled = false;
  @property() readonly = false;
  
  @state() private isHovered = false;
  @state() private isPressed = false;
  @state() private showRipple = false;
  
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    
    .add-content-container {
      position: relative;
      overflow: hidden;
    }
    
    .add-content-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 16px;
      margin: 8px 0;
      border: 2px dashed var(--yunke-border-color);
      border-radius: 8px;
      background: transparent;
      color: var(--yunke-text-secondary-color);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 14px;
      font-weight: 500;
      outline: none;
      position: relative;
    }
    
    .add-content-button:hover {
      border-color: var(--yunke-primary-color);
      background: var(--yunke-primary-color-alpha);
      color: var(--yunke-primary-color);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    .add-content-button:active {
      transform: translateY(0);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }
    
    .add-content-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }
    
    .add-content-button:disabled:hover {
      border-color: var(--yunke-border-color);
      background: transparent;
      color: var(--yunke-text-secondary-color);
      transform: none;
      box-shadow: none;
    }
    
    /* 键盘焦点样式 */
    .add-content-button:focus-visible {
      outline: 2px solid var(--yunke-primary-color);
      outline-offset: 2px;
    }
    
    /* 添加图标 */
    .add-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: currentColor;
      color: white;
      font-size: 12px;
      font-weight: bold;
      transition: transform 0.2s ease;
    }
    
    .add-content-button:hover .add-icon {
      transform: scale(1.1);
    }
    
    /* 涟漪效果 */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: var(--yunke-primary-color-alpha);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
      pointer-events: none;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    /* 提示文本动画 */
    .button-text {
      transition: transform 0.2s ease;
    }
    
    .add-content-button:hover .button-text {
      transform: translateX(2px);
    }
    
    /* 不同状态的提示文本 */
    .hint-text {
      font-size: 12px;
      color: var(--yunke-text-tertiary-color);
      margin-top: 4px;
      text-align: center;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .add-content-container:hover .hint-text {
      opacity: 1;
    }
    
    /* 空列状态的特殊样式 */
    :host([empty]) .add-content-button {
      border-style: solid;
      border-width: 1px;
      background: var(--yunke-background-secondary-color);
      min-height: 120px;
      flex-direction: column;
      gap: 12px;
    }
    
    :host([empty]) .add-icon {
      width: 24px;
      height: 24px;
      font-size: 16px;
    }
    
    :host([empty]) .button-text {
      font-size: 16px;
      font-weight: 600;
    }
    
    /* 只读模式 */
    :host([readonly]) {
      display: none;
    }
    
    /* 响应式设计 */
    @media (max-width: 768px) {
      .add-content-button {
        padding: 10px 12px;
        font-size: 13px;
      }
      
      .add-icon {
        width: 14px;
        height: 14px;
        font-size: 10px;
      }
      
      :host([empty]) .add-content-button {
        min-height: 100px;
        gap: 8px;
      }
      
      :host([empty]) .add-icon {
        width: 20px;
        height: 20px;
        font-size: 14px;
      }
    }
  `;
  
  render() {
    const buttonStyles = {
      borderColor: this.isHovered ? 'var(--yunke-primary-color)' : undefined,
      transform: this.isPressed ? 'scale(0.98)' : undefined
    };
    
    return html`
      <div class="add-content-container">
        <button
          class="add-content-button"
          style=${styleMap(buttonStyles)}
          ?disabled=${this.disabled || this.readonly}
          @click=${this.handleClick}
          @mouseenter=${this.handleMouseEnter}
          @mouseleave=${this.handleMouseLeave}
          @mousedown=${this.handleMouseDown}
          @mouseup=${this.handleMouseUp}
          @keydown=${this.handleKeydown}
          aria-label=${this.getAriaLabel()}
        >
          <div class="add-icon">+</div>
          <span class="button-text">${this.getButtonText()}</span>
          
          ${this.showRipple ? html`<div class="ripple"></div>` : ''}
        </button>
        
        <div class="hint-text">${this.getHintText()}</div>
      </div>
    `;
  }
  
  private handleClick = (event: MouseEvent) => {
    if (this.disabled || this.readonly) return;
    
    // 添加涟漪效果
    this.addRippleEffect(event);
    
    // 添加点击动画
    this.addClickAnimation();
    
    // 显示SlashMenu
    this.showSlashMenu(event);
    
    // 触发自定义事件
    this.dispatchEvent(new CustomEvent('add-content', {
      detail: {
        columnIndex: this.columnIndex,
        insertIndex: this.insertIndex ?? -1,
        source: 'click'
      },
      bubbles: true
    }));
  };
  
  private handleKeydown = (event: KeyboardEvent) => {
    if (this.disabled || this.readonly) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      
      // 模拟点击事件
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      });
      
      this.handleClick(clickEvent);
    }
  };
  
  private handleMouseEnter = () => {
    this.isHovered = true;
  };
  
  private handleMouseLeave = () => {
    this.isHovered = false;
  };
  
  private handleMouseDown = () => {
    this.isPressed = true;
  };
  
  private handleMouseUp = () => {
    this.isPressed = false;
  };
  
  private showSlashMenu(event: MouseEvent) {
    const rect = this.getBoundingClientRect();
    
    // 创建SlashMenu显示事件
    const menuEvent = new CustomEvent('show-slash-menu', {
      detail: {
        columnIndex: this.columnIndex,
        insertIndex: this.insertIndex ?? -1,
        position: {
          x: rect.left,
          y: rect.bottom + 8,
          width: rect.width
        },
        sourceElement: this,
        trigger: 'add-button'
      },
      bubbles: true
    });
    
    this.dispatchEvent(menuEvent);
  }
  
  private addRippleEffect(event: MouseEvent) {
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    const button = this.shadowRoot?.querySelector('.add-content-button');
    button?.appendChild(ripple);
    
    // 动画结束后移除
    ripple.addEventListener('animationend', () => {
      ripple.remove();
    });
  }
  
  private addClickAnimation() {
    this.style.transform = 'scale(0.95)';
    this.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      this.style.transform = '';
      setTimeout(() => {
        this.style.transition = '';
      }, 200);
    }, 100);
  }
  
  private getButtonText(): string {
    const isEmpty = this.hasAttribute('empty');
    
    if (isEmpty) {
      return '点击添加第一个内容';
    }
    
    return '添加内容';
  }
  
  private getHintText(): string {
    const isEmpty = this.hasAttribute('empty');
    
    if (isEmpty) {
      return '开始在此列中创建内容';
    }
    
    return `在第 ${this.columnIndex + 1} 列中添加新内容`;
  }
  
  private getAriaLabel(): string {
    return `在第 ${this.columnIndex + 1} 列添加内容`;
  }
  
  // 公共方法
  focus() {
    const button = this.shadowRoot?.querySelector('.add-content-button') as HTMLElement;
    button?.focus();
  }
  
  blur() {
    const button = this.shadowRoot?.querySelector('.add-content-button') as HTMLElement;
    button?.blur();
  }
}