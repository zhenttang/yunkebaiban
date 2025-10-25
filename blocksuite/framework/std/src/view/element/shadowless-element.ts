import type { Constructor } from '@blocksuite/global/utils';
import type { CSSResultGroup, CSSResultOrNative } from 'lit';
import { CSSResult, LitElement } from 'lit';

export class ShadowlessElement extends LitElement {
  // Map of the number of styles injected into a node
  // A reference count of the number of ShadowlessElements that are still connected
  static connectedCount = new WeakMap<
    Constructor, // class
    WeakMap<Node, number>
  >();

  static onDisconnectedMap = new WeakMap<
    Constructor, // class
    WeakMap<Node, (() => void) | null>
  >();

  // 🔧 全局样式缓存 - 防止重复注入相同的样式
  private static globalStyleCache = new Set<string>();
  
  // 🔧 样式元素映射 - 用于跟踪和清理
  private static styleElementMap = new Map<string, HTMLStyleElement>();
  
  // 🔧 计数器 - 用于生成唯一ID
  private static styleCounter = 0;

  /**
   * 计算字符串的哈希值（简单快速的哈希算法）
   */
  private static hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // styles registered in ShadowlessElement will be available globally
  // even if the element is not being rendered
  protected static override finalizeStyles(
    styles?: CSSResultGroup
  ): CSSResultOrNative[] {
    const elementStyles = super.finalizeStyles(styles);
    // XXX: This breaks component encapsulation and applies styles to the document.
    // These styles should be manually scoped.
    
    let injectedCount = 0;
    let skippedCount = 0;
    
    elementStyles.forEach((s: CSSResultOrNative) => {
      if (s instanceof CSSResult && typeof document !== 'undefined') {
        const cssText = s.cssText;
        const hash = this.hashCode(cssText);
        
        // 🔧 检查样式是否已经注入
        if (this.globalStyleCache.has(hash)) {
          skippedCount++;
          return; // 跳过已存在的样式
        }
        
        const styleRoot = document.head;
        const style = document.createElement('style');
        style.textContent = cssText;
        
        // 🔧 添加标识属性，方便调试
        style.dataset.yunkeStyleHash = hash;
        style.dataset.yunkeStyleId = `shadowless-${this.styleCounter++}`;
        
        styleRoot.append(style);
        
        // 🔧 记录到缓存
        this.globalStyleCache.add(hash);
        this.styleElementMap.set(hash, style);
        injectedCount++;
      }
    });
    
    // 🔧 调试日志（仅在开发模式下）
    if (injectedCount > 0 || skippedCount > 0) {
      const componentName = this.name || 'Unknown';
      console.debug(
        `[ShadowlessElement] ${componentName}: ` +
        `injected ${injectedCount}, skipped ${skippedCount} duplicate styles. ` +
        `Total cached: ${this.globalStyleCache.size}`
      );
    }
    
    return elementStyles;
  }
  
  /**
   * 🔧 新增：清理未使用的全局样式（可选调用）
   * 注意：只在确定样式不再需要时调用
   */
  static clearUnusedStyles(): number {
    let clearedCount = 0;
    
    this.styleElementMap.forEach((styleElement, hash) => {
      // 检查样式元素是否还在 DOM 中
      if (!document.head.contains(styleElement)) {
        this.globalStyleCache.delete(hash);
        this.styleElementMap.delete(hash);
        clearedCount++;
      }
    });
    
    if (clearedCount > 0) {
      console.log(
        `[ShadowlessElement] Cleared ${clearedCount} unused style references. ` +
        `Remaining: ${this.globalStyleCache.size}`
      );
    }
    
    return clearedCount;
  }
  
  /**
   * 🔧 新增：获取当前缓存的样式统计信息
   */
  static getStyleStats(): {
    totalCached: number;
    totalElements: number;
    memoryEstimate: string;
  } {
    let totalSize = 0;
    
    this.styleElementMap.forEach(styleElement => {
      totalSize += styleElement.textContent?.length || 0;
    });
    
    return {
      totalCached: this.globalStyleCache.size,
      totalElements: this.styleElementMap.size,
      memoryEstimate: `${(totalSize / 1024).toFixed(2)} KB`
    };
  }

  private getConnectedCount() {
    const SE = this.constructor as typeof ShadowlessElement;
    return SE.connectedCount.get(SE)?.get(this.getRootNode()) ?? 0;
  }

  private setConnectedCount(count: number) {
    const SE = this.constructor as typeof ShadowlessElement;

    if (!SE.connectedCount.has(SE)) {
      SE.connectedCount.set(SE, new WeakMap());
    }

    SE.connectedCount.get(SE)?.set(this.getRootNode(), count);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    const parentRoot = this.getRootNode();
    const SE = this.constructor as typeof ShadowlessElement;
    const insideShadowRoot = parentRoot instanceof ShadowRoot;
    const styleInjectedCount = this.getConnectedCount();

    if (styleInjectedCount === 0 && insideShadowRoot) {
      const elementStyles = SE.elementStyles;
      const injectedStyles: HTMLStyleElement[] = [];
      elementStyles.forEach((s: CSSResultOrNative) => {
        if (s instanceof CSSResult && typeof document !== 'undefined') {
          const style = document.createElement('style');
          style.textContent = s.cssText;
          parentRoot.prepend(style);
          injectedStyles.push(style);
        }
      });
      if (!SE.onDisconnectedMap.has(SE)) {
        SE.onDisconnectedMap.set(SE, new WeakMap());
      }
      SE.onDisconnectedMap.get(SE)?.set(parentRoot, () => {
        injectedStyles.forEach(style => style.remove());
      });
    }
    this.setConnectedCount(styleInjectedCount + 1);
  }

  override createRenderRoot() {
    return this;
  }

  override disconnectedCallback(): void {
    const parentRoot = this.getRootNode();
    super.disconnectedCallback();
    const SE = this.constructor as typeof ShadowlessElement;
    let styleInjectedCount = this.getConnectedCount();
    styleInjectedCount--;
    this.setConnectedCount(styleInjectedCount);

    if (styleInjectedCount === 0) {
      // remove the style element when the last shadowless element is disconnected in the parent root
      SE.onDisconnectedMap.get(SE)?.get(parentRoot)?.();
    }
  }
}
