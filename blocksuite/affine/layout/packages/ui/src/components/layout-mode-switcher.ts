/**
 * 布局模式切换组件完整实现
 * 开发者B1任务：完善LayoutSwitcher核心组件
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PageLayoutMode, createAnimationManager, useResponsiveLayout } from '@blocksuite/affine-layout-interactions';
import { IPageLayoutService, SERVICE_TOKENS } from '@blocksuite/affine-layout-core';

@customElement('layout-mode-switcher')
export class LayoutModeSwitcher extends LitElement {
  @property({ type: String })
  currentMode: PageLayoutMode = PageLayoutMode.Normal;
  
  @property({ type: String })
  docId = '';
  
  @property({ type: Boolean })
  disabled = false;
  
  @property({ type: String })
  size: 'small' | 'medium' | 'large' = 'medium';
  
  @property({ type: Boolean })
  enableResponsive = true;
  
  @state()
  private isAnimating = false;
  
  @state()
  private hoveredMode: PageLayoutMode | null = null;
  
  @state()
  private recommendedMode: PageLayoutMode | null = null;
  
  @state()
  private availableModes: PageLayoutMode[] = [
    PageLayoutMode.Normal,
    PageLayoutMode.TwoColumn,
    PageLayoutMode.ThreeColumn,
    PageLayoutMode.FourColumn,
    PageLayoutMode.FiveColumn
  ];
  
  // 服务实例
  private layoutService?: IPageLayoutService;
  private animationManager = createAnimationManager();
  private responsiveLayout = useResponsiveLayout();
  private unsubscribeResponsive?: () => void;
  
  connectedCallback() {
    super.connectedCallback();
    this.initializeServices();
    this.setupResponsiveListener();
    this.updateAvailableModes();
  }
  
  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeResponsive?.();
    this.animationManager.cleanup();
  }
  
  /**
   * 初始化服务
   */
  private async initializeServices() {
    try {
      // 从服务容器获取布局服务（模拟，实际应该通过DI）
      // this.layoutService = container.get<IPageLayoutService>(SERVICE_TOKENS.PAGE_LAYOUT_SERVICE);
      
      // 临时使用Mock服务用于开发
      this.layoutService = await this.createMockLayoutService();
      
      // 监听布局模式变化
      if (this.layoutService) {
        this.layoutService.onLayoutModeChange().subscribe(event => {
          if (event.docId === this.docId) {
            this.currentMode = event.currentMode;
            this.requestUpdate();
          }
        });
      }
    } catch (error) {
      console.error('Failed to initialize layout service:', error);
    }
  }
  
  /**
   * 设置响应式监听
   */
  private setupResponsiveListener() {
    if (!this.enableResponsive) return;
    
    this.unsubscribeResponsive = this.responsiveLayout.onModeChange((recommendedMode) => {
      this.recommendedMode = recommendedMode;
      this.requestUpdate();
    });
    
    // 初始化推荐模式
    this.recommendedMode = this.responsiveLayout.getRecommendedMode();
  }
  
  /**
   * 更新可用模式列表
   */
  private updateAvailableModes() {
    const deviceInfo = this.responsiveLayout.getDeviceInfo();
    
    // 基于设备类型过滤可用模式
    this.availableModes = [
      PageLayoutMode.Normal,
      PageLayoutMode.TwoColumn,
      PageLayoutMode.ThreeColumn,
      PageLayoutMode.FourColumn,
      PageLayoutMode.FiveColumn
    ].filter(mode => {
      return this.responsiveLayout.isAppropriate(mode);
    });
  }
  
  /**
   * 创建Mock布局服务（开发用）
   */
  private async createMockLayoutService(): Promise<IPageLayoutService> {
    // 这里应该返回真实的服务实例，现在先返回Mock
    return {
      setLayoutMode: async (mode: PageLayoutMode, docId: string) => {
        this.currentMode = mode;
        await this.animateLayoutChange(mode);
      },
      getLayoutMode: (docId: string) => this.currentMode,
      onLayoutModeChange: () => ({
        subscribe: (callback: any) => () => {}
      }),
      getLayoutConfig: () => null,
      updateLayoutConfig: async () => {},
      initialize: async () => {},
      dispose: async () => {},
      setColumnWidths: async () => {},
      getColumnWidths: () => []
    } as any;
  }
  
  /**
   * 执行布局变更动画
   */
  private async animateLayoutChange(newMode: PageLayoutMode) {
    const oldMode = this.currentMode;
    
    try {
      // 使用动画管理器执行布局切换动画
      await this.animationManager.animateLayoutTransition(oldMode, newMode);
      
      // 创建粒子效果
      await this.animationManager.createParticleEffect(this, 'transform');
      
    } catch (error) {
      console.error('Layout change animation failed:', error);
    }
  }
  
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px;
      border-radius: 8px;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
    }
    
    :host([disabled]) {
      opacity: 0.5;
      pointer-events: none;
    }
    
    .mode-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: var(--button-size);
      height: var(--button-size);
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    
    .mode-button:hover {
      background: var(--bg-hover);
      transform: scale(1.05);
    }
    
    .mode-button.active {
      background: var(--primary-color);
      color: white;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    }
    
    .mode-button.recommended {
      border: 2px solid var(--success-color);
      box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2);
    }
    
    .mode-button.unavailable {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .mode-button.animating {
      animation: pulse 0.6s ease-in-out;
    }
    
    .mode-icon {
      display: grid;
      gap: 2px;
      grid-template-columns: repeat(var(--columns), 1fr);
      width: 60%;
      height: 60%;
    }
    
    .column-indicator {
      background: currentColor;
      border-radius: 1px;
      opacity: 0.8;
      transition: all 0.2s ease;
    }
    
    .mode-button:hover .column-indicator {
      opacity: 1;
      transform: scaleY(1.2);
    }
    
    .tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: var(--tooltip-bg);
      color: var(--tooltip-color);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
      z-index: 1000;
    }
    
    .mode-button:hover .tooltip {
      opacity: 1;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    /* 不同尺寸 */
    :host([size="small"]) {
      --button-size: 24px;
      gap: 4px;
      padding: 4px;
    }
    
    :host([size="medium"]) {
      --button-size: 32px;
    }
    
    :host([size="large"]) {
      --button-size: 40px;
      gap: 12px;
      padding: 12px;
    }
  `;
  
  private readonly modes = [
    { mode: PageLayoutMode.Normal, columns: 1, label: '单列' },
    { mode: PageLayoutMode.TwoColumn, columns: 2, label: '双列' },
    { mode: PageLayoutMode.ThreeColumn, columns: 3, label: '三列' },
    { mode: PageLayoutMode.FourColumn, columns: 4, label: '四列' },
    { mode: PageLayoutMode.FiveColumn, columns: 5, label: '五列' }
  ];
  
  render() {
    return html`
      ${this.modes.map(({ mode, columns, label }) => {
        const isActive = this.currentMode === mode;
        const isRecommended = this.recommendedMode === mode && !isActive;
        const isAvailable = this.availableModes.includes(mode);
        
        return html`
          <button
            class="mode-button 
              ${isActive ? 'active' : ''} 
              ${isRecommended ? 'recommended' : ''}
              ${!isAvailable ? 'unavailable' : ''}
              ${this.isAnimating ? 'animating' : ''}"
            @click="${() => this.handleModeClick(mode)}"
            @mouseenter="${() => this.hoveredMode = mode}"
            @mouseleave="${() => this.hoveredMode = null}"
            ?disabled="${this.disabled || !isAvailable}"
            title="${this.getButtonTooltip(mode, isRecommended, isAvailable)}"
          >
            <div class="mode-icon" style="--columns: ${columns}">
              ${Array.from({ length: columns }, () => html`
                <div class="column-indicator"></div>
              `)}
            </div>
            <div class="tooltip">${label}${isRecommended ? ' (推荐)' : ''}</div>
          </button>
        `;
      })}
    `;
  }
  
  /**
   * 获取按钮工具提示
   */
  private getButtonTooltip(mode: PageLayoutMode, isRecommended: boolean, isAvailable: boolean): string {
    const modeLabels = {
      [PageLayoutMode.Normal]: '单列布局',
      [PageLayoutMode.TwoColumn]: '双列布局',
      [PageLayoutMode.ThreeColumn]: '三列布局', 
      [PageLayoutMode.FourColumn]: '四列布局',
      [PageLayoutMode.FiveColumn]: '五列布局'
    };
    
    let tooltip = modeLabels[mode];
    
    if (isRecommended) {
      tooltip += ' (系统推荐)';
    }
    
    if (!isAvailable) {
      tooltip += ' (当前设备不支持)';
    }
    
    return tooltip;
  }
  
  private async handleModeClick(mode: PageLayoutMode) {
    if (this.disabled || mode === this.currentMode || this.isAnimating) {
      return;
    }
    
    // 检查模式是否可用
    if (!this.availableModes.includes(mode)) {
      this.showUnavailableMessage(mode);
      return;
    }
    
    this.isAnimating = true;
    
    try {
      // 触发模式切换事件
      const event = new CustomEvent('mode-change', {
        detail: {
          previousMode: this.currentMode,
          newMode: mode,
          timestamp: Date.now(),
          docId: this.docId
        },
        bubbles: true,
        composed: true
      });
      
      this.dispatchEvent(event);
      
      // 通过布局服务切换模式
      if (this.layoutService && this.docId) {
        await this.layoutService.setLayoutMode(mode, this.docId);
      }
      
      // 添加触觉反馈（如果支持）
      this.addHapticFeedback();
      
      // 添加弹性动画效果
      await this.animationManager.createElasticAnimation(this, {
        scale: 1.05,
        duration: 400,
        elasticity: 0.6
      });
      
    } catch (error) {
      console.error('Failed to change layout mode:', error);
      this.showErrorMessage(error);
    } finally {
      setTimeout(() => {
        this.isAnimating = false;
      }, 600);
    }
  }
  
  /**
   * 显示不可用模式的提示
   */
  private showUnavailableMessage(mode: PageLayoutMode) {
    const deviceInfo = this.responsiveLayout.getDeviceInfo();
    const message = `当前设备(${deviceInfo.type})不支持${this.getButtonTooltip(mode, false, false)}`;
    
    // 这里可以显示一个临时提示
    this.createTemporaryTooltip(message);
  }
  
  /**
   * 显示错误信息
   */
  private showErrorMessage(error: any) {
    const message = `切换布局失败: ${error.message || '未知错误'}`;
    this.createTemporaryTooltip(message, 'error');
  }
  
  /**
   * 创建临时提示
   */
  private createTemporaryTooltip(message: string, type: 'info' | 'error' = 'info') {
    const tooltip = document.createElement('div');
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    // 淡入
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
    });
    
    // 3秒后淡出并移除
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 300);
    }, 3000);
  }
  
  /**
   * 添加触觉反馈
   */
  private addHapticFeedback() {
    if ('vibrate' in navigator) {
      navigator.vibrate(50); // 50ms振动
    }
  }
}

/**
 * 拖拽控制组件模板
 * 开发者B2任务：实现拖拽交互逻辑
 */
@customElement('drag-handle')
export class DragHandle extends LitElement {
  @property({ type: String })
  targetId = '';
  
  @property({ type: String })
  dragData = '';
  
  @state()
  private isDragging = false;
  
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      cursor: grab;
      border-radius: 4px;
      transition: all 0.2s ease;
    }
    
    :host(:hover) {
      background: var(--bg-hover);
    }
    
    :host([dragging]) {
      cursor: grabbing;
      opacity: 0.7;
    }
    
    .handle-icon {
      width: 12px;
      height: 12px;
      background: currentColor;
      mask: url("data:image/svg+xml,%3csvg viewBox='0 0 20 20' fill='currentColor' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'/%3e%3c/svg%3e") no-repeat center;
      mask-size: contain;
    }
  `;
  
  render() {
    return html`
      <div 
        class="handle-icon"
        draggable="true"
        @dragstart="${this.handleDragStart}"
        @dragend="${this.handleDragEnd}"
      ></div>
    `;
  }
  
  private handleDragStart(event: DragEvent) {
    this.isDragging = true;
    
    // 开发者B2：设置拖拽数据和样式
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', this.dragData || this.targetId);
      event.dataTransfer.effectAllowed = 'move';
      
      // TODO: 设置拖拽预览图像
      // TODO: 添加拖拽开始动画
    }
    
    this.dispatchEvent(new CustomEvent('drag-start', {
      detail: { targetId: this.targetId, dragData: this.dragData },
      bubbles: true
    }));
  }
  
  private handleDragEnd(event: DragEvent) {
    this.isDragging = false;
    
    // 开发者B2：清理拖拽状态
    // TODO: 添加拖拽结束动画
    // TODO: 清理临时样式
    
    this.dispatchEvent(new CustomEvent('drag-end', {
      detail: { targetId: this.targetId },
      bubbles: true
    }));
  }
}