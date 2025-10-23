/**
 * SVG 渲染器 V2 - 基于新架构
 * 
 * 将布局结果渲染为 SVG 字符串，用于预览
 */

import { BaseRenderer } from '../core/base-renderer.js';
import type {
  LayoutResult,
  RenderConfig,
  RenderResult,
  LayoutedElement,
  LayoutedRelationship,
  Theme
} from '../core/diagram-types.js';

export class SVGRendererV2 extends BaseRenderer {
  readonly supportedTarget = 'svg' as const;
  
  render(layout: LayoutResult, config?: RenderConfig): RenderResult {
    const padding = config?.padding || 20;
    const bounds = {
      ...layout.bounds,
      x: layout.bounds.x - padding,
      y: layout.bounds.y - padding,
      width: layout.bounds.width + padding * 2,
      height: layout.bounds.height + padding * 2
    };
    
    let svg = this.generateSVGHeader(bounds);
    svg += this.generateStyles();
    svg += this.generateDefs();
    
    // 渲染元素（先渲染层背景，再渲染节点）
    const layers = layout.elements.filter(e => e.type === 'layer');
    const nodes = layout.elements.filter(e => e.type === 'node');
    
    // 1. 渲染层背景
    layers.forEach(layer => {
      svg += this.renderLayer(layer);
    });
    
    // 2. 渲染连线（在节点下方）
    layout.relationships.forEach(rel => {
      svg += this.renderRelationship(rel);
    });
    
    // 3. 渲染节点（最上层）
    nodes.forEach(node => {
      svg += this.renderElement(node);
    });
    
    svg += '</svg>';
    
    return {
      target: 'svg',
      content: svg,
      bounds
    };
  }
  
  /**
   * 生成 SVG 头部
   */
  private generateSVGHeader(bounds: { x: number; y: number; width: number; height: number }): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" 
      width="${bounds.width}" 
      height="${bounds.height}" 
      viewBox="${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}"
      preserveAspectRatio="xMidYMid meet">`;
  }
  
  /**
   * 生成样式
   */
  private generateStyles(): string {
    return `<style>
      .layer-background {
        opacity: 0.8;
      }
      .layer-title {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 16px;
        font-weight: 600;
        fill: #555555;
        user-select: none;
      }
      .node-rect {
        transition: all 0.2s;
      }
      .node-rect:hover {
        filter: brightness(1.1);
      }
      .node-text {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 14px;
        fill: #333333;
        text-anchor: middle;
        dominant-baseline: middle;
        user-select: none;
        pointer-events: none;
      }
      .edge-line {
        fill: none;
      }
      .edge-label {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12px;
        fill: #666666;
        text-anchor: middle;
        user-select: none;
      }
    </style>`;
  }
  
  /**
   * 生成定义（箭头等）
   */
  private generateDefs(): string {
    return `<defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="10" 
              refX="9" refY="3" orient="auto">
        <polygon points="0 0, 10 3, 0 6" fill="#999999" />
      </marker>
      
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.1"/>
      </filter>
    </defs>`;
  }
  
  /**
   * 渲染层背景
   */
  private renderLayer(layer: LayoutedElement): string {
    const pos = layer.position;
    const size = layer.size;
    const style = this.applyTheme('node', layer.style);
    
    const fillColor = style.fillColor || '#f5f5f5';
    const radius = style.radius || 8;
    
    let svg = '';
    
    // 层背景矩形
    svg += `<rect class="layer-background" 
      x="${pos.x}" 
      y="${pos.y}" 
      width="${size.width}" 
      height="${size.height}" 
      rx="${radius}" 
      fill="${fillColor}" 
      stroke="none" />`;
    
    // 层标题
    const titleX = pos.x + 100;  // 左侧偏移
    const titleY = pos.y + 28;   // 顶部偏移
    
    svg += `<text class="layer-title" 
      x="${titleX}" 
      y="${titleY}">${this.escapeHtml(layer.label)}</text>`;
    
    return svg;
  }
  
  /**
   * 渲染元素（节点）
   */
  private renderElement(elem: LayoutedElement): string {
    if (elem.data?.isTreeJunction) {
      return '';
    }

    const pos = elem.position;
    const size = elem.size;
    const style = this.applyTheme('node', elem.style);
    const role = elem.data?.role as string | undefined;

    if (role === 'entity') {
      style.fillColor = style.fillColor || '#9ccc65';
      style.strokeColor = style.strokeColor || '#558b2f';
      style.strokeWidth = style.strokeWidth || 2;
      style.radius = style.radius ?? 8;
    } else if (role === 'attribute') {
      style.fillColor = style.fillColor || '#ffffff';
      style.strokeColor = style.strokeColor || '#3f51b5';
      style.strokeWidth = style.strokeWidth || 2;
    } else if (role === 'relationship') {
      style.fillColor = style.fillColor || '#ffffff';
      style.strokeColor = style.strokeColor || '#3f51b5';
      style.strokeWidth = style.strokeWidth || 2;
    }

    let svg = '';

    // 根据形状类型渲染
    switch (elem.shape) {
      case 'rect':
        svg += this.renderRect(pos, size, style, elem.label);
        break;
      case 'roundrect':
        svg += this.renderRoundRect(pos, size, style, elem.label);
        break;
      case 'circle':
        svg += this.renderCircle(pos, size, style, elem.label);
        break;
      case 'diamond':
        svg += this.renderDiamond(pos, size, style, elem.label);
        break;
      default:
        svg += this.renderRoundRect(pos, size, style, elem.label);
    }
    
    return svg;
  }
  
  /**
   * 渲染矩形节点
   */
  private renderRect(
    pos: { x: number; y: number },
    size: { width: number; height: number },
    style: any,
    label: string
  ): string {
    const fillColor = style.fillColor || '#ffffff';
    const strokeColor = style.strokeColor || '#333333';
    const strokeWidth = style.strokeWidth || 1;
    
    return `
      <rect class="node-rect" 
        x="${pos.x}" 
        y="${pos.y}" 
        width="${size.width}" 
        height="${size.height}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        filter="url(#shadow)" />
      <text class="node-text" 
        x="${pos.x + size.width / 2}" 
        y="${pos.y + size.height / 2}">${this.escapeHtml(label)}</text>
    `;
  }
  
  /**
   * 渲染圆角矩形节点
   */
  private renderRoundRect(
    pos: { x: number; y: number },
    size: { width: number; height: number },
    style: any,
    label: string
  ): string {
    const fillColor = style.fillColor || '#ffffff';
    const strokeColor = style.strokeColor || '#333333';
    const strokeWidth = style.strokeWidth || 1;
    const radius = style.radius || 4;
    
    return `
      <rect class="node-rect" 
        x="${pos.x}" 
        y="${pos.y}" 
        width="${size.width}" 
        height="${size.height}" 
        rx="${radius}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        filter="url(#shadow)" />
      <text class="node-text" 
        x="${pos.x + size.width / 2}" 
        y="${pos.y + size.height / 2}">${this.escapeHtml(label)}</text>
    `;
  }
  
  /**
   * 渲染圆形节点
   */
  private renderCircle(
    pos: { x: number; y: number },
    size: { width: number; height: number },
    style: any,
    label: string
  ): string {
    const cx = pos.x + size.width / 2;
    const cy = pos.y + size.height / 2;
    const r = Math.min(size.width, size.height) / 2;
    const fillColor = style.fillColor || '#ffffff';
    const strokeColor = style.strokeColor || '#333333';
    const strokeWidth = style.strokeWidth || 1;
    
    return `
      <circle class="node-rect" 
        cx="${cx}" 
        cy="${cy}" 
        r="${r}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        filter="url(#shadow)" />
      <text class="node-text" 
        x="${cx}" 
        y="${cy}">${this.escapeHtml(label)}</text>
    `;
  }
  
  /**
   * 渲染菱形节点
   */
  private renderDiamond(
    pos: { x: number; y: number },
    size: { width: number; height: number },
    style: any,
    label: string
  ): string {
    const cx = pos.x + size.width / 2;
    const cy = pos.y + size.height / 2;
    const points = `${cx},${pos.y} ${pos.x + size.width},${cy} ${cx},${pos.y + size.height} ${pos.x},${cy}`;
    const fillColor = style.fillColor || '#ffffff';
    const strokeColor = style.strokeColor || '#333333';
    const strokeWidth = style.strokeWidth || 1;
    
    return `
      <polygon class="node-rect" 
        points="${points}" 
        fill="${fillColor}" 
        stroke="${strokeColor}" 
        stroke-width="${strokeWidth}" 
        filter="url(#shadow)" />
      <text class="node-text" 
        x="${cx}" 
        y="${cy}">${this.escapeHtml(label)}</text>
    `;
  }
  
  /**
   * 渲染关系（连线）
   */
  private renderRelationship(rel: LayoutedRelationship): string {
    if (!rel.points || rel.points.length < 2) return '';
    
    const style = this.applyTheme('relationship', rel.style);
    const path = this.generatePathString(rel.points);
    const stroke = style.stroke || '#999999';
    const strokeWidth = style.strokeWidth || 2;
    const strokeStyle = style.strokeStyle === 'dashed' ? '5,5' : 'none';
    
    // 树状图连线不显示箭头
    const isTreeEdge = rel.data?.isTreeEdge || rel.data?.edgeType === 'tree-orthogonal';
    const isErEdge = rel.data?.edgeType?.startsWith('er-');
    const markerEnd = isTreeEdge || isErEdge ? '' : 'marker-end="url(#arrowhead)"';

    let svg = `<path class="edge-line" 
      d="${path}" 
      stroke="${stroke}" 
      stroke-width="${strokeWidth}" 
      stroke-dasharray="${strokeStyle}" 
      ${markerEnd} />`;
    
    // 渲染标签
    if (rel.label && rel.points.length >= 2) {
      const midIndex = Math.floor(rel.points.length / 2);
      const midPoint = rel.points[midIndex];
      
      // 标签背景
      const labelWidth = rel.label.length * 7 + 8;
      svg += `<rect 
        x="${midPoint.x - labelWidth / 2}" 
        y="${midPoint.y - 10}" 
        width="${labelWidth}" 
        height="20" 
        fill="white" 
        stroke="none" />`;
      
      // 标签文本
      svg += `<text class="edge-label" 
        x="${midPoint.x}" 
        y="${midPoint.y + 4}">${this.escapeHtml(rel.label)}</text>`;
    }
    
    return svg;
  }
}

