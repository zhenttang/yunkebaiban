/**
 * 基础渲染器 - 所有渲染器的父类
 * 
 * 职责：将布局结果渲染为不同的输出格式（SVG、Canvas、白板元素）
 */

import type {
  LayoutResult,
  RenderTarget,
  RenderConfig,
  RenderResult,
  LayoutedElement,
  LayoutedRelationship,
  Theme,
  ElementStyle,
  RelationshipStyle,
} from './diagram-types.js';

/**
 * 渲染器接口
 */
export interface IRenderer {
  /**
   * 渲染器支持的目标类型
   */
  readonly supportedTarget: RenderTarget;
  
  /**
   * 渲染布局结果
   * @param layout - 布局结果
   * @param config - 渲染配置
   * @returns 渲染结果
   */
  render(layout: LayoutResult, config?: RenderConfig): RenderResult;
}

/**
 * 基础渲染器抽象类
 */
export abstract class BaseRenderer implements IRenderer {
  abstract readonly supportedTarget: RenderTarget;
  
  /**
   * 当前主题
   */
  protected theme: Theme;
  
  constructor(theme?: Theme) {
    this.theme = theme || this.getDefaultTheme();
  }
  
  /**
   * 渲染主方法
   */
  abstract render(layout: LayoutResult, config?: RenderConfig): RenderResult;
  
  /**
   * 获取默认主题
   */
  protected getDefaultTheme(): Theme {
    return {
      name: 'default',
      node: {
        fillColor: '#1e96ed',
        strokeColor: '#1565c0',
        strokeWidth: 2,
        textColor: '#ffffff',
        fontSize: 14,
        filled: true,
      },
      relationship: {
        stroke: '#666666',
        strokeWidth: 2,
        strokeStyle: 'solid',
        targetArrow: 'arrow',
      },
      colors: {
        primary: '#1e96ed',
        secondary: '#64b5f6',
        accent: '#2196f3',
        background: '#ffffff',
        text: '#333333',
        border: '#e0e0e0',
      },
    };
  }
  
  /**
   * 应用主题到元素样式
   */
  protected applyTheme(
    elementType: 'node' | 'relationship',
    customStyle?: ElementStyle | RelationshipStyle
  ): ElementStyle | RelationshipStyle {
    const baseStyle = elementType === 'node' 
      ? this.theme.node 
      : this.theme.relationship;
    
    return {
      ...baseStyle,
      ...customStyle,
    };
  }
  
  /**
   * 工具方法：转义 HTML
   */
  protected escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 工具方法：生成路径字符串（SVG path）
   */
  protected generatePathString(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    
    return path;
  }
  
  /**
   * 工具方法：生成平滑曲线路径（贝塞尔曲线）
   */
  protected generateSmoothPath(points: Array<{ x: number; y: number }>): string {
    if (points.length < 2) return this.generatePathString(points);
    
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      const controlY = (current.y + next.y) / 2;
      
      path += ` Q ${current.x} ${current.y} ${controlX} ${controlY}`;
    }
    
    const last = points[points.length - 1];
    path += ` L ${last.x} ${last.y}`;
    
    return path;
  }
}

/**
 * 渲染器注册表
 */
export class RendererRegistry {
  private static renderers = new Map<RenderTarget, IRenderer>();
  
  /**
   * 注册渲染器
   */
  static register(renderer: IRenderer): void {
    this.renderers.set(renderer.supportedTarget, renderer);
  }
  
  /**
   * 获取渲染器
   */
  static get(target: RenderTarget): IRenderer | undefined {
    return this.renderers.get(target);
  }
  
  /**
   * 渲染布局结果
   */
  static render(
    layout: LayoutResult,
    target: RenderTarget,
    config?: RenderConfig
  ): RenderResult {
    const renderer = this.get(target);
    
    if (!renderer) {
      throw new Error(`No renderer found for target: ${target}`);
    }
    
    return renderer.render(layout, config);
  }
  
  /**
   * 列出所有已注册的渲染器
   */
  static list(): RenderTarget[] {
    return Array.from(this.renderers.keys());
  }
}

