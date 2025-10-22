/**
 * 白板渲染器 - 将布局结果渲染为真实的白板元素
 * 
 * 职责：创建可编辑的 ShapeElement 和 ConnectorElement
 */

import type { SurfaceBlockModel } from '@blocksuite/yunke-block-surface';
import { ConnectorMode } from '@blocksuite/yunke-model';
import type { EdgelessRootService } from '@blocksuite/yunke-block-root';
import * as Y from 'yjs';

import { BaseRenderer } from '../core/base-renderer.js';
import type {
  LayoutResult,
  RenderConfig,
  RenderResult,
  LayoutedElement,
  LayoutedRelationship,
  Theme
} from '../core/diagram-types.js';

/**
 * 生成结果
 */
export interface EdgelessGenerationResult {
  elementIds: Map<string, string>;  // 元素ID映射
  layerIds: string[];                // 层背景ID列表
  nodeIds: string[];                 // 节点ID列表
  edgeIds: string[];                 // 连线ID列表
}

/**
 * 白板渲染器
 */
export class EdgelessRenderer extends BaseRenderer {
  readonly supportedTarget = 'edgeless' as const;
  
  constructor(
    private surface: SurfaceBlockModel,
    private service?: EdgelessRootService,
    theme?: Theme
  ) {
    super(theme);
  }
  
  render(layout: LayoutResult, config?: RenderConfig): RenderResult {
    // 计算偏移量（在视口中心生成）
    const offsetX = 0;
    const offsetY = 0;
    
    const result = this.generateElements(layout, offsetX, offsetY);
    
    return {
      target: 'edgeless',
      content: JSON.stringify(result), // 返回生成结果的JSON
      bounds: layout.bounds
    };
  }
  
  /**
   * 生成所有元素到白板
   */
  generateElements(
    layout: LayoutResult,
    offsetX: number = 0,
    offsetY: number = 0
  ): EdgelessGenerationResult {
    const elementIds = new Map<string, string>();
    const layerIds: string[] = [];
    const nodeIds: string[] = [];
    const edgeIds: string[] = [];
    
    // 1. 先创建层背景（最底层）
    const layers = layout.elements.filter(e => e.type === 'layer');
    layers.forEach(layer => {
      const id = this.createLayer(layer, offsetX, offsetY);
      elementIds.set(layer.id, id);
      layerIds.push(id);
    });
    
    // 2. 创建节点（中层）
    const nodes = layout.elements.filter(e => e.type === 'node');
    nodes.forEach(node => {
      if (node.data?.isTreeJunction) {
        const id = this.createJunctionNode(node, offsetX, offsetY);
        elementIds.set(node.id, id);
      } else {
        const id = this.createNode(node, offsetX, offsetY);
        elementIds.set(node.id, id);
        nodeIds.push(id);
      }
    });
    
    // 3. 创建连线（最上层）
    layout.relationships.forEach(rel => {
      const id = this.createEdge(rel, elementIds);
      if (id) {
        edgeIds.push(id);
      }
    });
    
    console.log('✅ 白板元素已生成:', {
      layers: layerIds.length,
      nodes: nodeIds.length,
      edges: edgeIds.length
    });
    
    return {
      elementIds,
      layerIds,
      nodeIds,
      edgeIds
    };
  }
  
  /**
   * 创建层背景
   */
  private createLayer(
    layer: LayoutedElement,
    offsetX: number,
    offsetY: number
  ): string {
    const x = layer.position.x + offsetX;
    const y = layer.position.y + offsetY;
    const w = layer.size.width;
    const h = layer.size.height;
    
    const style = this.applyTheme('node', layer.style);
    const fillColor = style.fillColor || '#f5f5f5';
    const radius = style.radius || 8;
    
    // 创建层背景 Shape
    const layerId = this.surface.addElement({
      type: 'shape',
      xywh: `[${x},${y},${w},${h}]`,
      shapeType: 'rect',
      radius: radius,
      filled: true,
      fillColor: fillColor,
      strokeWidth: 0,
      strokeColor: 'transparent',
      strokeStyle: 'none',
      // 层标题作为文本
      text: new Y.Text(layer.label),
      textHorizontalAlign: 'left',
      textVerticalAlign: 'top',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 16,
      fontWeight: '600',
      fontStyle: 'normal',
      color: '#555555',
      // 透明度
      opacity: 0.8,
    });
    
    return layerId;
  }
  
  /**
   * 创建节点
   */
  private createNode(
    node: LayoutedElement,
    offsetX: number,
    offsetY: number
  ): string {
    const x = node.position.x + offsetX;
    const y = node.position.y + offsetY;
    const w = node.size.width;
    const h = node.size.height;
    
    const style = this.applyTheme('node', node.style);
    
    // 根据形状类型选择
    const shapeType = this.mapShapeType(node.shape);
    const fillColor = style.fillColor || '#ffffff';
    const strokeColor = style.strokeColor || '#333333';
    const strokeWidth = style.strokeWidth || 1;
    const radius = style.radius || 4;
    
    const nodeId = this.surface.addElement({
      type: 'shape',
      xywh: `[${x},${y},${w},${h}]`,
      shapeType: shapeType,
      radius: radius,
      filled: true,
      fillColor: fillColor,
      strokeWidth: strokeWidth,
      strokeColor: strokeColor,
      strokeStyle: 'solid',
      shapeStyle: 'General',
      // 节点文本
      text: new Y.Text(node.label),
      textHorizontalAlign: 'center',
      textVerticalAlign: 'center',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: 14,
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#333333',
      // 阴影效果（如果支持）
      // shadow: true,
    });
    
    return nodeId;
  }
  
  /**
   * 创建连线
   */
  private createEdge(
    edge: LayoutedRelationship,
    elementIds: Map<string, string>
  ): string | null {
    const sourceId = elementIds.get(edge.source);
    const targetId = elementIds.get(edge.target);
    
    if (!sourceId || !targetId) {
      console.warn(`无法创建连线: ${edge.source} -> ${edge.target}, 元素不存在`);
      return null;
    }
    
    const style = this.applyTheme('relationship', edge.style);
    const stroke = style.stroke || '#999999';
    const strokeWidth = style.strokeWidth || 2;
    const strokeStyle = style.strokeStyle === 'dashed' ? 'dash' : 'solid';
    
    // 树状图连线使用自定义路径点，其他图使用 Connector 自动路由
    const isTreeEdge = edge.data?.isTreeEdge || edge.data?.edgeType?.startsWith('tree-');

    const endpointStyle = isTreeEdge
      ? 'None'
      : edge.style?.targetArrow === 'arrow'
        ? 'Arrow'
        : 'None';

    const connectorId = this.surface.addElement({
      type: 'connector',
      mode: ConnectorMode.Orthogonal,
      stroke: stroke,
      strokeWidth: strokeWidth,
      strokeStyle: strokeStyle as any,
      rough: false,
      source: { id: sourceId },
      target: { id: targetId },
      frontEndpointStyle: 'None',
      rearEndpointStyle: endpointStyle,
      // 如果有标签
      ...(edge.label
        ? {
            text: new Y.Text(edge.label),
            labelStyle: {
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '400',
              fontStyle: 'normal',
              color: '#666666',
            },
          }
        : {}),
    });

    return connectorId;
  }
  
  private createJunctionNode(
    node: LayoutedElement,
    offsetX: number,
    offsetY: number
  ): string {
    const x = node.position.x + offsetX;
    const y = node.position.y + offsetY;
    const w = node.size.width || 2;
    const h = node.size.height || 2;

    const junctionId = this.surface.addElement({
      type: 'shape',
      xywh: `[${x},${y},${w},${h}]`,
      shapeType: 'rect',
      filled: true,
      fillColor: 'transparent',
      strokeWidth: 0,
      strokeColor: 'transparent',
      strokeStyle: 'none',
      opacity: 0,
      locked: true,
      text: new Y.Text(''),
    });

    return junctionId;
  }

  /**
   * 映射形状类型到白板支持的类型
   */
  private mapShapeType(shape: string): string {
    const mapping: Record<string, string> = {
      'rect': 'rect',
      'roundrect': 'rect',  // 使用 rect + radius
      'circle': 'ellipse',
      'ellipse': 'ellipse',
      'diamond': 'diamond',
      'triangle': 'triangle',
    };
    
    return mapping[shape] || 'rect';
  }
}

/**
 * 辅助函数：在指定位置生成图表到白板
 */
export async function generateDiagramToEdgeless(
  surface: SurfaceBlockModel,
  layout: LayoutResult,
  centerX: number,
  centerY: number,
  service?: EdgelessRootService
): Promise<EdgelessGenerationResult> {
  // 计算偏移量，使图表中心位于指定位置
  const offsetX = centerX - layout.bounds.width / 2;
  const offsetY = centerY - layout.bounds.height / 2;
  
  const renderer = new EdgelessRenderer(surface, service);
  return renderer.generateElements(layout, offsetX, offsetY);
}

