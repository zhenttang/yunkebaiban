import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ResponsiveManager, DEFAULT_BREAKPOINTS } from '../responsive/responsive-manager.js';
import { ContainerQueryManager } from '../responsive/container-query-manager.js';
import type { PageLayoutMode, ResponsiveChangeEvent } from '../types/responsive-contracts.js';

/**
 * 响应式布局切换器示例组件
 * 
 * 这是一个完整的示例，展示如何集成响应式功能
 * 为开发者B1（组件架构师）提供参考
 */
@customElement('responsive-layout-switcher')
export class ResponsiveLayoutSwitcher extends LitElement {
  @property({ type: String }) docId = 'default';
  @property({ type: String }) currentMode: PageLayoutMode = 'normal';
  @state() private maxColumns = 5;
  @state() private currentBreakpoint = 'desktop';

  private responsiveManager = new ResponsiveManager();
  private containerQueryManager = ContainerQueryManager.getInstance();
  private responsiveHandle?: any;

  // 布局模式配置
  private layoutModes = [
    { mode: 'normal', columns: 1, label: '单列', icon: '▌' },
    { mode: '2-column', columns: 2, label: '双列', icon: '▌▌' },
    { mode: '3-column', columns: 3, label: '三列', icon: '▌▌▌' },
    { mode: '4-column', columns: 4, label: '四列', icon: '▌▌▌▌' },
    { mode: '5-column', columns: 5, label: '五列', icon: '▌▌▌▌▌' }
  ];

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--yunke-background-secondary-color);
      border-radius: 8px;
      border: 1px solid var(--yunke-border-color);
      user-select: none;
    }

    .breakpoint-indicator {
      font-size: 12px;
      color: var(--yunke-text-secondary-color);
      background: var(--yunke-background-overlay-panel-color);
      padding: 2px 6px;
      border-radius: 4px;
      margin-right: 8px;
    }

    .layout-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      height: 48px;
      background: transparent;
      border: 2px solid transparent;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: monospace;
      font-size: 12px;
      color: var(--yunke-text-primary-color);
    }

    .layout-button:hover {
      background: var(--yunke-hover-color);
      border-color: var(--yunke-primary-color);
    }

    .layout-button.active {
      background: var(--yunke-primary-color);
      color: white;
      border-color: var(--yunke-primary-color);
    }

    .layout-button:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      pointer-events: none;
    }

    .layout-button .icon {
      font-size: 16px;
      margin-bottom: 2px;
      line-height: 1;
    }

    .layout-button .label {
      font-size: 10px;
      line-height: 1;
    }

    /* 响应式样式 */
    @media (max-width: 768px) {
      :host {
        gap: 4px;
        padding: 4px 8px;
      }
      
      .layout-button {
        min-width: 36px;
        height: 36px;
      }
      
      .layout-button .icon {
        font-size: 14px;
      }
      
      .layout-button .label {
        display: none;
      }
      
      .breakpoint-indicator {
        font-size: 10px;
        padding: 1px 4px;
      }
    }

    /* 容器查询支持 */
    @container (max-width: 600px) {
      .layout-button:nth-child(n+4) {
        display: none;
      }
    }

    @container (max-width: 400px) {
      .layout-button:nth-child(n+3) {
        display: none;
      }
    }
  `;

  override async connectedCallback() {
    super.connectedCallback();
    await this.setupResponsiveListeners();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.responsiveHandle) {
      this.responsiveHandle.cleanup();
    }
  }

  /**
   * 设置响应式监听器
   */
  private async setupResponsiveListeners() {
    // 初始化响应式管理器
    await this.responsiveManager.initialize?.();
    
    // 获取容器元素
    const container = this.closest('.page-container') || 
                     this.closest('.layout-container') || 
                     document.body;

    // 设置容器查询
    this.containerQueryManager.setupContainerQueries(container as HTMLElement, DEFAULT_BREAKPOINTS);

    // 设置响应式监听
    this.responsiveHandle = this.responsiveManager.setupResponsiveListeners(
      container as HTMLElement,
      (event: ResponsiveChangeEvent) => this.handleResponsiveChange(event)
    );

    // 立即更新当前状态
    this.updateResponsiveState();
  }

  /**
   * 处理响应式变化
   */
  private handleResponsiveChange(event: ResponsiveChangeEvent) {
    console.log('响应式变化事件:', event);
    
    this.currentBreakpoint = event.breakpoint;
    this.maxColumns = event.maxColumns;
    
    // 如果当前模式超出了设备支持的列数，自动切换
    const currentColumns = this.layoutModes.find(m => m.mode === this.currentMode)?.columns || 1;
    if (currentColumns > this.maxColumns) {
      const fallbackMode = this.layoutModes.find(m => m.columns <= this.maxColumns)?.mode || 'normal';
      this.switchToMode(fallbackMode);
    }

    // 触发自定义事件通知父组件
    this.dispatchEvent(new CustomEvent('responsive-change', {
      detail: event,
      bubbles: true
    }));
  }

  /**
   * 更新当前响应式状态
   */
  private updateResponsiveState() {
    this.currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    this.maxColumns = this.responsiveManager.getMaxColumnsForWidth(window.innerWidth);
  }

  /**
   * 切换布局模式
   */
  private async switchToMode(mode: PageLayoutMode) {
    if (mode === this.currentMode) return;

    const modeConfig = this.layoutModes.find(m => m.mode === mode);
    if (!modeConfig) return;

    // 检查响应式约束
    if (modeConfig.columns > this.maxColumns) {
      // 显示提示信息
      this.showConstraintMessage(`当前屏幕尺寸最多支持 ${this.maxColumns} 列`);
      return;
    }

    // 触发模式切换事件
    const switchEvent = new CustomEvent('mode-switch', {
      detail: {
        from: this.currentMode,
        to: mode,
        docId: this.docId
      },
      bubbles: true
    });

    this.dispatchEvent(switchEvent);

    // 更新当前模式
    this.currentMode = mode;
  }

  /**
   * 显示约束提示消息
   */
  private showConstraintMessage(message: string) {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--yunke-background-overlay-panel-color);
      color: var(--yunke-text-primary-color);
      padding: 8px 16px;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      font-size: 14px;
      pointer-events: none;
    `;

    document.body.appendChild(toast);

    // 3秒后移除
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  /**
   * 渲染布局按钮
   */
  private renderLayoutButton(modeConfig: any) {
    const isActive = modeConfig.mode === this.currentMode;
    const isDisabled = modeConfig.columns > this.maxColumns;

    return html`
      <button
        class="layout-button ${isActive ? 'active' : ''}"
        ?disabled=${isDisabled}
        @click=${() => this.switchToMode(modeConfig.mode)}
        title="${modeConfig.label}${isDisabled ? ' (当前设备不支持)' : ''}"
      >
        <div class="icon">${modeConfig.icon}</div>
        <div class="label">${modeConfig.label}</div>
      </button>
    `;
  }

  override render(): TemplateResult {
    return html`
      <div class="breakpoint-indicator">
        ${this.currentBreakpoint} (最多${this.maxColumns}列)
      </div>
      
      ${this.layoutModes.map(mode => this.renderLayoutButton(mode))}
    `;
  }

  /**
   * 获取当前响应式状态（供外部调用）
   */
  getResponsiveState() {
    return {
      breakpoint: this.currentBreakpoint,
      maxColumns: this.maxColumns,
      currentMode: this.currentMode,
      isDesktop: this.responsiveManager.isDesktop(),
      isMobile: this.responsiveManager.isMobile(),
      isTablet: this.responsiveManager.isTablet()
    };
  }

  /**
   * 强制刷新响应式状态
   */
  refreshResponsiveState() {
    this.updateResponsiveState();
    this.requestUpdate();
  }
}

/**
 * 响应式布局容器示例组件
 * 
 * 展示如何创建支持响应式的布局容器
 */
@customElement('responsive-layout-container')
export class ResponsiveLayoutContainer extends LitElement {
  @property({ type: String }) layoutMode: PageLayoutMode = 'normal';
  @property({ type: Array }) columnWidths: number[] = [1];
  
  @state() private isDragging = false;
  @state() private currentBreakpoint = 'desktop';

  private responsiveManager = new ResponsiveManager();

  static styles = css`
    :host {
      display: block;
      width: 100%;
      min-height: 400px;
      container-type: inline-size;
      container-name: layout-container;
    }

    .layout-grid {
      display: grid;
      gap: var(--column-gap, 24px);
      width: 100%;
      min-height: inherit;
      transition: grid-template-columns 0.3s ease;
    }

    .column {
      background: var(--yunke-background-primary-color);
      border: 2px solid var(--yunke-border-color);
      border-radius: 8px;
      padding: 16px;
      min-height: 200px;
      position: relative;
    }

    .column.drag-over {
      border-color: var(--yunke-primary-color);
      background: var(--yunke-primary-color-alpha);
    }

    /* 响应式布局 */
    @container layout-container (max-width: 768px) {
      .layout-grid {
        grid-template-columns: 1fr !important;
        gap: 16px;
      }
    }

    @container layout-container (min-width: 769px) and (max-width: 1024px) {
      .layout-grid.layout-3,
      .layout-grid.layout-4,
      .layout-grid.layout-5 {
        grid-template-columns: 1fr 1fr !important;
      }
    }

    @container layout-container (min-width: 1025px) and (max-width: 1440px) {
      .layout-grid.layout-5 {
        grid-template-columns: 1fr 1fr 1fr 1fr !important;
      }
    }
  `;

  override connectedCallback() {
    super.connectedCallback();
    this.setupResponsiveMonitoring();
  }

  private async setupResponsiveMonitoring() {
    await this.responsiveManager.initialize?.();
    
    this.responsiveManager.setupResponsiveListeners(this, (event) => {
      this.currentBreakpoint = event.breakpoint;
      this.applyResponsiveConstraints(event);
    });
  }

  private applyResponsiveConstraints(event: ResponsiveChangeEvent) {
    // 根据响应式事件调整布局
    const effectiveMode = this.responsiveManager.getEffectiveMode(this.layoutMode);
    
    if (effectiveMode !== this.layoutMode) {
      // 发送布局模式变更事件
      this.dispatchEvent(new CustomEvent('layout-constrained', {
        detail: {
          requestedMode: this.layoutMode,
          effectiveMode: effectiveMode,
          reason: `${event.breakpoint} 断点限制`
        },
        bubbles: true
      }));
    }
  }

  private getGridColumns(): string {
    const columnCount = this.columnWidths.length;
    return this.columnWidths.map(w => `${w}fr`).join(' ');
  }

  override render(): TemplateResult {
    const columnCount = this.columnWidths.length;
    
    return html`
      <div 
        class="layout-grid layout-${columnCount}"
        style="grid-template-columns: ${this.getGridColumns()}"
      >
        ${this.columnWidths.map((_, index) => html`
          <div class="column" data-column-index="${index}">
            <slot name="column-${index}">
              <p>列 ${index + 1}</p>
              <p>断点: ${this.currentBreakpoint}</p>
            </slot>
          </div>
        `)}
      </div>
    `;
  }
}

// 导出组件以供其他开发者使用
declare global {
  interface HTMLElementTagNameMap {
    'responsive-layout-switcher': ResponsiveLayoutSwitcher;
    'responsive-layout-container': ResponsiveLayoutContainer;
  }
}