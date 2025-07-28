/**
 * 布局切换器组件
 * 
 * 提供用户界面来切换不同的页面布局模式
 * 支持单列、双列、三列、四列、五列布局
 */

import { LitElement, html, css, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { 
  PageLayoutMode, 
  LayoutModeConfigMap, 
  ILayoutSwitcher,
  LayoutModeChangeEvent,
  IPageLayoutService
} from '../types/component-contracts.js';
import { DesignTokens, CommonStyles, StyleUtils, AnimationKeyframes } from '../shared/design-tokens.js';
import { layoutSwitcherStyles, LayoutModeIcons, LayoutModeLabels } from './styles.js';
import { layoutEventBus } from '../events/layout-event-bus.js';

// 响应式功能集成
import { ResponsiveManager, DEFAULT_BREAKPOINTS } from '@blocksuite/affine-layout-interactions/responsive/responsive-manager';
import { ContainerQueryManager } from '@blocksuite/affine-layout-interactions/responsive/container-query-manager';
import type { ResponsiveChangeEvent } from '@blocksuite/affine-layout-interactions/types/responsive-contracts';

/**
 * 布局切换器组件
 * 
 * @example
 * ```html
 * <layout-switcher 
 *   .docId=${'doc-123'}
 *   .currentMode=${PageLayoutMode.ThreeColumn}
 *   .disabled=${false}
 *   @mode-changed=${this.handleModeChanged}>
 * </layout-switcher>
 * ```
 */
@customElement('layout-switcher')
export class LayoutSwitcher extends LitElement implements ILayoutSwitcher {
  static styles = layoutSwitcherStyles;

  // ============= 组件属性 =============
  
  /**
   * 文档ID
   */
  @property({ type: String })
  docId!: string;
  
  /**
   * 当前布局模式
   */
  @property({ type: String })
  currentMode: PageLayoutMode = PageLayoutMode.Normal;
  
  /**
   * 是否禁用
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;
  
  /**
   * 组件尺寸
   */
  @property({ type: String })
  size: 'small' | 'medium' | 'large' = 'medium';
  
  /**
   * 布局变体
   */
  @property({ type: String })
  variant: 'horizontal' | 'vertical' | 'dropdown' = 'horizontal';
  
  /**
   * 是否显示标签
   */
  @property({ type: Boolean })
  showLabels = true;
  
  /**
   * 可用的布局模式
   */
  @property({ type: Array })
  availableModes: PageLayoutMode[] = Object.values(PageLayoutMode);
  
  /**
   * 是否启用响应式功能
   */
  @property({ type: Boolean })
  enableResponsive = true;
  
  /**
   * 是否显示断点指示器
   */
  @property({ type: Boolean })
  showBreakpointIndicator = false;
  
  // ============= 内部状态 =============
  
  /**
   * 是否正在切换中
   */
  @state()
  private isTransitioning = false;
  
  /**
   * 最后点击时间 (用于防抖)
   */
  @state()
  private lastClickTime = 0;
  
  /**
   * 当前响应式断点
   */
  @state()
  private currentBreakpoint = 'desktop';
  
  /**
   * 设备支持的最大列数
   */
  @state()
  private maxColumns = 5;
  
  /**
   * 布局服务实例 (将来从依赖注入获取)
   */
  private layoutService?: IPageLayoutService;
  
  /**
   * 模式切换事件监听器
   */
  private modeChangeListeners: Array<(mode: PageLayoutMode) => void> = [];
  
  /**
   * 响应式管理器
   */
  private responsiveManager = new ResponsiveManager();
  
  /**
   * 容器查询管理器
   */
  private containerQueryManager = ContainerQueryManager.getInstance();
  
  /**
   * 响应式监听器句柄
   */
  private responsiveHandle?: any;
  
  /**
   * 布局模式配置映射
   */
  private layoutModes = [
    { mode: PageLayoutMode.Normal, columns: 1, label: '单列', icon: '▌' },
    { mode: PageLayoutMode.TwoColumn, columns: 2, label: '双列', icon: '▌▌' },
    { mode: PageLayoutMode.ThreeColumn, columns: 3, label: '三列', icon: '▌▌▌' },
    { mode: PageLayoutMode.FourColumn, columns: 4, label: '四列', icon: '▌▌▌▌' },
    { mode: PageLayoutMode.FiveColumn, columns: 5, label: '五列', icon: '▌▌▌▌▌' }
  ];

  // ============= 生命周期方法 =============
  
  override async connectedCallback() {
    super.connectedCallback();
    this.setupLayoutService(); // 异步初始化
    this.setupKeyboardNavigation();
    
    // 启用响应式功能
    if (this.enableResponsive) {
      await this.setupResponsiveListeners();
    }
  }
  
  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanupEventListeners();
    this.cleanupResponsiveListeners();
  }
  
  // ============= 渲染方法 =============
  
  override render(): TemplateResult {
    return html`
      <div class="layout-switcher-container" role="radiogroup" aria-label="布局模式选择">
        ${this.showBreakpointIndicator ? this.renderBreakpointIndicator() : ''}
        ${this.availableModes.map(mode => this.renderModeButton(mode))}
      </div>
    `;
  }
  
  /**
   * 渲染断点指示器
   */
  private renderBreakpointIndicator(): TemplateResult {
    return html`
      <div class="breakpoint-indicator">
        ${this.currentBreakpoint} (最多${this.maxColumns}列)
      </div>
    `;
  }
  
  /**
   * 渲染单个布局模式按钮
   */
  private renderModeButton(mode: PageLayoutMode): TemplateResult {
    const config = LayoutModeConfigMap[mode];
    const modeConfig = this.layoutModes.find(m => m.mode === mode);
    const isActive = this.currentMode === mode;
    const isLoading = this.isTransitioning && this.currentMode === mode;
    
    // 响应式约束检查
    const isDisabledByResponsive = this.enableResponsive && modeConfig && modeConfig.columns > this.maxColumns;
    const isDisabled = this.disabled || this.isTransitioning || isDisabledByResponsive;
    
    // 使用B3样式工程师设计的图标和标签
    const icon = LayoutModeIcons[mode as keyof typeof LayoutModeIcons] || config.icon;
    const label = LayoutModeLabels[mode as keyof typeof LayoutModeLabels] || config.label;
    const tooltip = isDisabledByResponsive 
      ? `${label}布局 (当前设备不支持)`
      : `${label}布局`;
    
    return html`
      <button
        class="layout-button ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''} ${isDisabledByResponsive ? 'disabled-responsive' : ''}"
        role="radio"
        aria-checked="${isActive}"
        aria-label="${tooltip}"
        title="${tooltip}"
        ?disabled="${isDisabled}"
        data-mode="${mode}"
        @click="${() => this.switchToMode(mode)}"
        @keydown="${this.handleButtonKeydown}"
      >
        <div class="layout-button-content">
          <span class="layout-icon" aria-hidden="true">${icon}</span>
          ${this.showLabels ? html`
            <span class="layout-label">${label}</span>
          ` : ''}
        </div>
      </button>
    `;
  }
  
  // ============= 公共接口实现 =============
  
  /**
   * 切换到指定布局模式
   */
  async switchToMode(mode: PageLayoutMode): Promise<void> {
    // 防抖处理
    const now = Date.now();
    if (now - this.lastClickTime < 300) {
      return;
    }
    this.lastClickTime = now;
    
    // 防止重复点击当前模式
    if (mode === this.currentMode || this.isTransitioning) {
      return;
    }
    
    // 检查模式是否可用
    if (!this.availableModes.includes(mode)) {
      console.warn(`Layout mode ${mode} is not available`);
      return;
    }
    
    // 响应式约束检查
    if (this.enableResponsive) {
      const modeConfig = this.layoutModes.find(m => m.mode === mode);
      if (modeConfig && modeConfig.columns > this.maxColumns) {
        this.showConstraintMessage(`当前屏幕尺寸最多支持 ${this.maxColumns} 列`);
        return;
      }
    }
    
    const previousMode = this.currentMode;
    this.isTransitioning = true;
    
    // 发送状态变化事件
    layoutEventBus.emit({
      type: 'layout-state-change',
      docId: this.docId,
      state: 'transitioning',
      timestamp: Date.now()
    });
    
    try {
      // 添加点击反馈动画
      const button = this.shadowRoot?.querySelector(`[data-mode="${mode}"]`) as HTMLElement;
      if (button) {
        this.addClickFeedback(button);
      }
      
      // 调用布局服务切换模式
      if (this.layoutService) {
        await this.layoutService.setLayoutMode(mode, this.docId);
      }
      
      // 更新当前模式
      this.currentMode = mode;
      
      // 发送模式切换事件到事件总线
      layoutEventBus.emit({
        type: 'layout-mode-change',
        docId: this.docId,
        previousMode,
        currentMode: mode,
        columnWidths: LayoutModeConfigMap[mode].defaultWidths,
        timestamp: Date.now(),
        source: 'user'
      });
      
      // 触发原有DOM事件（向后兼容）
      this.dispatchModeChangeEvent(previousMode, mode);
      
      // 通知监听器
      this.notifyModeChangeListeners(mode);
      
      // 触发触觉反馈 (移动端)
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      // 发送状态完成事件
      layoutEventBus.emit({
        type: 'layout-state-change',
        docId: this.docId,
        state: 'idle',
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Failed to switch layout mode:', error);
      
      // 发送错误事件
      layoutEventBus.emit({
        type: 'layout-error',
        docId: this.docId,
        error: error as Error,
        operation: `switch-to-${mode}`,
        timestamp: Date.now()
      });
      
      this.handleSwitchError(error as Error, mode);
    } finally {
      this.isTransitioning = false;
    }
  }
  
  /**
   * 设置组件禁用状态
   */
  setDisabled(disabled: boolean): void {
    this.disabled = disabled;
  }
  
  /**
   * 监听模式切换事件
   */
  onModeSwitch(callback: (mode: PageLayoutMode) => void): void {
    this.modeChangeListeners.push(callback);
  }
  
  /**
   * 设置可用的模式
   */
  setAvailableModes(modes: PageLayoutMode[]): void {
    this.availableModes = [...modes];
    this.requestUpdate();
  }
  
  /**
   * 获取当前响应式状态
   */
  getResponsiveState() {
    return {
      breakpoint: this.currentBreakpoint,
      maxColumns: this.maxColumns,
      currentMode: this.currentMode,
      enableResponsive: this.enableResponsive,
      isDesktop: this.responsiveManager.isDesktop(),
      isMobile: this.responsiveManager.isMobile(),
      isTablet: this.responsiveManager.isTablet()
    };
  }
  
  /**
   * 强制刷新响应式状态
   */
  refreshResponsiveState() {
    if (this.enableResponsive) {
      this.updateResponsiveState();
      this.requestUpdate();
    }
  }
  
  /**
   * 设置响应式功能开关
   */
  setResponsiveEnabled(enabled: boolean): void {
    if (enabled === this.enableResponsive) return;
    
    this.enableResponsive = enabled;
    
    if (enabled && !this.responsiveHandle) {
      this.setupResponsiveListeners();
    } else if (!enabled && this.responsiveHandle) {
      this.cleanupResponsiveListeners();
    }
  }
  
  // ============= 私有方法 =============
  
  /**
   * 设置布局服务 (连接真实Mock服务)
   */
  private async setupLayoutService(): Promise<void> {
    try {
      // 动态导入Mock服务
      const { MockPageLayoutService } = await import('@blocksuite/affine-layout-testing/mocks/core-services');
      this.layoutService = new MockPageLayoutService();
      
      // 初始化服务
      await this.layoutService.initialize();
      
      // 订阅布局模式变化
      this.layoutService.onLayoutModeChange().subscribe((event) => {
        if (event.docId === this.docId && event.currentMode !== this.currentMode) {
          this.currentMode = event.currentMode;
          this.requestUpdate();
        }
      });
      
      console.log('✅ LayoutSwitcher: 已连接到MockPageLayoutService');
    } catch (error) {
      console.warn('⚠️ 无法加载Mock服务，使用本地实现:', error);
      
      // 降级到本地Mock实现
      this.layoutService = {
        async setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void> {
          console.log(`✅ Local Mock: Switching to ${mode} for document ${docId}`);
          await new Promise(resolve => setTimeout(resolve, 200));
        },
        getLayoutMode: (docId: string) => this.currentMode,
        onLayoutModeChange: () => ({
          subscribe: (callback: (event: LayoutModeChangeEvent) => void) => () => {}
        }),
        distributeContent: (blocks) => [blocks],
        async initialize() {},
        async dispose() {}
      };
    }
  }
  
  /**
   * 设置键盘导航
   */
  private setupKeyboardNavigation(): void {
    this.addEventListener('keydown', this.handleKeydown);
  }
  
  /**
   * 清理事件监听器
   */
  private cleanupEventListeners(): void {
    this.removeEventListener('keydown', this.handleKeydown);
    this.modeChangeListeners = [];
  }
  
  /**
   * 设置响应式监听器
   */
  private async setupResponsiveListeners(): Promise<void> {
    try {
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
      
      console.log('✅ LayoutSwitcher: 响应式功能已启用');
    } catch (error) {
      console.warn('⚠️ 响应式功能启用失败，将使用默认行为:', error);
      this.enableResponsive = false;
    }
  }
  
  /**
   * 清理响应式监听器
   */
  private cleanupResponsiveListeners(): void {
    if (this.responsiveHandle) {
      this.responsiveHandle.cleanup();
      this.responsiveHandle = null;
    }
  }
  
  /**
   * 处理响应式变化
   */
  private handleResponsiveChange(event: ResponsiveChangeEvent): void {
    console.log('📱 LayoutSwitcher 响应式变化事件:', event);
    
    this.currentBreakpoint = event.breakpoint;
    this.maxColumns = event.maxColumns;
    
    // 如果当前模式超出了设备支持的列数，自动切换
    const modeConfig = this.layoutModes.find(m => m.mode === this.currentMode);
    if (modeConfig && modeConfig.columns > this.maxColumns) {
      const fallbackMode = this.layoutModes
        .filter(m => m.columns <= this.maxColumns)
        .pop()?.mode || PageLayoutMode.Normal;
      
      console.log(`📱 自动切换到兼容模式: ${this.currentMode} -> ${fallbackMode}`);
      this.switchToMode(fallbackMode);
    }

    // 触发自定义事件通知父组件
    this.dispatchEvent(new CustomEvent('responsive-change', {
      detail: event,
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 更新当前响应式状态
   */
  private updateResponsiveState(): void {
    this.currentBreakpoint = this.responsiveManager.getCurrentBreakpoint();
    this.maxColumns = this.responsiveManager.getMaxColumnsForWidth(window.innerWidth);
  }
  
  /**
   * 显示约束提示消息
   */
  private showConstraintMessage(message: string): void {
    // 创建临时提示元素
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--affine-background-overlay-panel-color);
      color: var(--affine-text-primary-color);
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
   * 处理键盘导航
   */
  private handleKeydown = (event: KeyboardEvent): void => {
    if (this.disabled) return;
    
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.selectPreviousMode();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.selectNextMode();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.activateSelectedMode();
        break;
      case 'Escape':
        this.blur();
        break;
      // 数字键快捷方式
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        event.preventDefault();
        this.switchToModeByNumber(parseInt(event.key));
        break;
    }
  };
  
  /**
   * 处理按钮键盘事件
   */
  private handleButtonKeydown = (event: KeyboardEvent): void => {
    // 阻止事件冒泡，避免重复处理
    event.stopPropagation();
  };
  
  /**
   * 选择上一个模式
   */
  private selectPreviousMode(): void {
    const currentIndex = this.availableModes.indexOf(this.currentMode);
    const previousIndex = currentIndex > 0 ? currentIndex - 1 : this.availableModes.length - 1;
    this.switchToMode(this.availableModes[previousIndex]);
  }
  
  /**
   * 选择下一个模式
   */
  private selectNextMode(): void {
    const currentIndex = this.availableModes.indexOf(this.currentMode);
    const nextIndex = currentIndex < this.availableModes.length - 1 ? currentIndex + 1 : 0;
    this.switchToMode(this.availableModes[nextIndex]);
  }
  
  /**
   * 激活当前选中的模式
   */
  private activateSelectedMode(): void {
    // 当前实现中，选中即激活，无需额外操作
  }
  
  /**
   * 通过数字键切换到指定模式
   */
  private switchToModeByNumber(num: number): void {
    if (num >= 1 && num <= this.availableModes.length) {
      const targetMode = this.availableModes[num - 1];
      this.switchToMode(targetMode);
    }
  }
  
  /**
   * 添加点击反馈动画
   */
  private addClickFeedback(element: HTMLElement): void {
    element.style.transform = 'scale(0.95)';
    element.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
      element.style.transform = '';
      setTimeout(() => {
        element.style.transition = '';
      }, 200);
    }, 100);
  }
  
  /**
   * 触发模式切换事件
   */
  private dispatchModeChangeEvent(previousMode: PageLayoutMode, currentMode: PageLayoutMode): void {
    const event = new CustomEvent('mode-changed', {
      detail: {
        docId: this.docId,
        previousMode,
        currentMode,
        timestamp: Date.now(),
        source: 'user'
      } as LayoutModeChangeEvent,
      bubbles: true,
      composed: true
    });
    
    this.dispatchEvent(event);
  }
  
  /**
   * 通知模式切换监听器
   */
  private notifyModeChangeListeners(mode: PageLayoutMode): void {
    this.modeChangeListeners.forEach(listener => {
      try {
        listener(mode);
      } catch (error) {
        console.error('Error in mode change listener:', error);
      }
    });
  }
  
  /**
   * 处理切换错误
   */
  private handleSwitchError(error: Error, mode: PageLayoutMode): void {
    console.error(`Failed to switch to ${mode}:`, error);
    
    // 触发错误事件
    const errorEvent = new CustomEvent('mode-change-error', {
      detail: {
        error: error.message,
        mode,
        docId: this.docId
      },
      bubbles: true,
      composed: true
    });
    
    this.dispatchEvent(errorEvent);
    
    // 可以在这里添加用户友好的错误提示
    // 例如显示toast通知
  }
}