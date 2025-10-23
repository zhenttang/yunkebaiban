/**
 * 元素生成器 - 在白板上创建真实的 Shape 和 Connector 元素
 */

import type { SurfaceBlockModel } from '@blocksuite/yunke-block-surface';
import { ConnectorMode } from '@blocksuite/yunke-model';
import type { EdgelessRootService } from '@blocksuite/yunke-block-root';
import * as Y from 'yjs';

import { parseDSL } from './dsl-parser.js';
import { calculateLayout, type LayoutedDiagram } from './layout-engine.js';

/**
 * 生成结果
 */
export interface GeneratedElements {
  nodeIds: Map<string, string>; // DSL node id -> element id
  edgeIds: string[];
  groupIds: string[];
}

/**
 * Flowchart 元素生成器
 */
export class FlowchartElementGenerator {
  constructor(
    private surface: SurfaceBlockModel,
    private service?: EdgelessRootService
  ) {}

  /**
   * 从 DSL 代码生成图表元素
   * 
   * @param dslCode - DSL 代码
   * @param centerX - 画布中心 X 坐标
   * @param centerY - 画布中心 Y 坐标
   * @returns 生成的元素 ID 映射
   */
  async generateFromDSL(
    dslCode: string,
    centerX: number = 0,
    centerY: number = 0
  ): Promise<GeneratedElements> {
    // 1. 解析 DSL
    const diagram = parseDSL(dslCode);
    
    // 2. 计算布局
    const layout = calculateLayout(diagram);
    
    // 3. 创建元素
    return this.createElement(layout, centerX, centerY);
  }

  /**
   * 创建所有元素
   */
  private createElement(
    layout: LayoutedDiagram,
    offsetX: number,
    offsetY: number
  ): GeneratedElements {
    console.log('开始创建元素，偏移量:', { offsetX, offsetY });
    console.log('布局信息:', { 
      节点数: layout.nodes.length, 
      连线数: layout.edges.length,
      节点列表: layout.nodes.map(n => ({ id: n.id, label: n.label, x: n.x, y: n.y }))
    });
    
    const nodeIds = new Map<string, string>();
    
    // 1. 创建节点（Shape）
    layout.nodes.forEach(node => {
      const elementId = this.createNode(node, offsetX, offsetY);
      nodeIds.set(node.id, elementId);
    });
    
    console.log('所有节点创建完成:', Array.from(nodeIds.entries()));
    
    // 2. 创建连线（Connector）
    const edgeIds = layout.edges.map(edge => 
      this.createEdge(edge, nodeIds)
    ).filter(id => id !== null) as string[];
    
    console.log('所有连线创建完成:', edgeIds);
    
    // 3. 创建分组（暂时跳过，未来实现）
    const groupIds: string[] = [];
    
    return {
      nodeIds,
      edgeIds,
      groupIds,
    };
  }

  /**
   * 创建节点 (Shape)
   */
  private createNode(
    node: LayoutedDiagram['nodes'][0],
    offsetX: number,
    offsetY: number
  ): string {
    const x = node.x + offsetX;
    const y = node.y + offsetY;
    
    console.log('创建节点:', { id: node.id, x, y, width: node.width, height: node.height, label: node.label });
    
    const elementId = this.surface.addElement({
      type: 'shape',
      xywh: `[${x},${y},${node.width},${node.height}]`,
      shapeType: 'rect',
      radius: 8,
      filled: true,
      fillColor: '#1e96ed',  // 蓝色填充
      strokeWidth: 2,
      strokeColor: '#1565c0',  // 深蓝色边框
      strokeStyle: 'solid',
      shapeStyle: 'General',
      text: new Y.Text(node.label),
      textHorizontalAlign: 'center',
      textVerticalAlign: 'center',
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400',
      fontStyle: 'normal',
      color: '#ffffff',  // 白色文字
    });
    
    console.log('节点已创建，ID:', elementId);
    
    return elementId;
  }

  /**
   * 创建连线 (Connector)
   */
  private createEdge(
    edge: LayoutedDiagram['edges'][0],
    nodeIds: Map<string, string>
  ): string | null {
    const sourceId = nodeIds.get(edge.from);
    const targetId = nodeIds.get(edge.to);
    
    if (!sourceId || !targetId) {
      console.warn(`无法创建连线: ${edge.from} -> ${edge.to}, 节点不存在`);
      return null;
    }
    
    console.log('创建连线:', { from: edge.from, to: edge.to, sourceId, targetId, label: edge.label });
    
    const labelText = edge.label
      ? (() => {
          const text = new Y.Text();
          text.insert(0, edge.label);
          return text;
        })()
      : undefined;

    const connectorId = this.surface.addElement({
      type: 'connector',
      mode: ConnectorMode.Orthogonal,
      stroke: '#666666',  // 灰色连线
      strokeWidth: 2,
      strokeStyle: 'solid',
      rough: false,
      source: { id: sourceId },
      target: { id: targetId },
      frontEndpointStyle: 'None',
      rearEndpointStyle: 'Arrow',
      // 如果有标签，添加文本
      ...(edge.label ? {
        text: labelText,
        labelDisplay: true,
        labelStyle: {
          fontFamily: 'Inter',
          fontSize: 14,
          fontWeight: '400',
          fontStyle: 'normal',
          color: '#333333',
        },
      } : {}),
    });
    
    console.log('连线已创建，ID:', connectorId);
    
    return connectorId;
  }
}

/**
 * 辅助函数：在指定位置生成图表
 */
export async function generateFlowchartAt(
  surface: SurfaceBlockModel,
  dslCode: string,
  x: number,
  y: number,
  service?: EdgelessRootService
): Promise<GeneratedElements> {
  const generator = new FlowchartElementGenerator(surface, service);
  return generator.generateFromDSL(dslCode, x, y);
}

