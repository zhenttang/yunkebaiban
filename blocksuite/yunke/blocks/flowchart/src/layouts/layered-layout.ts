/**
 * 分层架构图布局引擎
 * 
 * 布局规则：
 * 1. 每层占据一个横条区域
 * 2. 层内节点横向排列，居中对齐
 * 3. 层之间紧密排列（间隔很小）
 * 4. 整体居中显示
 */

import { BaseLayoutEngine } from '../core/base-layout.js';
import type {
  DiagramModel,
  LayoutResult,
  LayoutedElement,
  LayoutedRelationship,
  Position
} from '../core/diagram-types.js';
import type { LayoutConfig } from '../core/base-layout.js';

/**
 * 分层布局专用配置
 */
export interface LayeredLayoutConfig extends LayoutConfig {
  layerHeight?: number;        // 每层的高度
  layerGap?: number;            // 层之间的间距
  layerPadding?: number;        // 层内边距
  canvasWidth?: number;         // 画布宽度（层会铺满）
}

export class LayeredLayoutEngine extends BaseLayoutEngine {
  readonly supportedType = 'layered' as const;
  
  protected override defaultConfig = {
    ...super.defaultConfig,
    nodeWidth: 140,              // 节点宽度
    nodeHeight: 50,              // 节点高度
    nodeSpacing: 16,             // 节点间距
    layerHeight: 120,            // 层高度
    layerGap: 2,                 // 层间距（很小）
    layerPadding: 20,            // 层内边距
    canvasWidth: 1000,           // 默认画布宽度
    padding: 40,                 // 整体边距
  } as Required<LayeredLayoutConfig>;
  
  layout(model: DiagramModel, config?: LayeredLayoutConfig): LayoutResult {
    const cfg = this.mergeConfig(config) as Required<LayeredLayoutConfig>;
    
    // 获取所有层级元素
    const layers = model.elements.filter(e => e.type === 'layer');
    const nodes = model.elements.filter(e => e.type === 'node');
    
    const layoutedElements: LayoutedElement[] = [];
    let currentY = cfg.padding;
    
    // 布局每一层
    layers.forEach((layer, layerIndex) => {
      // 获取该层的所有节点
      const layerNodes = nodes.filter(n => n.parent === layer.id);
      
      // 计算该层节点的总宽度
      const totalNodesWidth = layerNodes.length * cfg.nodeWidth + 
                              (layerNodes.length - 1) * cfg.nodeSpacing;
      
      // 计算起始 X 坐标（居中）
      const startX = (cfg.canvasWidth - totalNodesWidth) / 2;
      
      // 布局层背景
      layoutedElements.push({
        ...layer,
        position: {
          x: cfg.padding,
          y: currentY
        },
        size: {
          width: cfg.canvasWidth - cfg.padding * 2,
          height: cfg.layerHeight
        },
        data: {
          ...layer.data,
          layerIndex
        }
      });
      
      // 布局层内节点
      layerNodes.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * (cfg.nodeWidth + cfg.nodeSpacing);
        const y = currentY + cfg.layerPadding + 
                  (cfg.layerHeight - cfg.layerPadding * 2 - cfg.nodeHeight) / 2;
        
        layoutedElements.push({
          ...node,
          position: { x, y },
          size: {
            width: cfg.nodeWidth,
            height: cfg.nodeHeight
          }
        });
      });
      
      // 更新下一层的 Y 坐标
      currentY += cfg.layerHeight + cfg.layerGap;
    });
    
    // 布局连线（如果有）
    const layoutedRelationships: LayoutedRelationship[] = [];
    
    model.relationships.forEach(rel => {
      const source = layoutedElements.find(e => e.id === rel.source);
      const target = layoutedElements.find(e => e.id === rel.target);
      
      if (source && target) {
        // 计算连线路径
        const points = this.calculateConnectionPath(
          source.position,
          source.size,
          target.position,
          target.size
        );
        
        layoutedRelationships.push({
          ...rel,
          points
        });
      }
    });
    
    // 计算整体边界
    const bounds = this.calculateBounds(layoutedElements);
    
    // 添加外边距
    bounds.x -= cfg.padding;
    bounds.y -= cfg.padding;
    bounds.width += cfg.padding * 2;
    bounds.height += cfg.padding * 2;
    
    return {
      elements: layoutedElements,
      relationships: layoutedRelationships,
      bounds
    };
  }
  
  /**
   * 计算连线路径（垂直方向）
   */
  private calculateConnectionPath(
    sourcePos: Position,
    sourceSize: { width: number; height: number },
    targetPos: Position,
    targetSize: { width: number; height: number }
  ): Position[] {
    // 从源节点底部中心到目标节点顶部中心
    const startX = sourcePos.x + sourceSize.width / 2;
    const startY = sourcePos.y + sourceSize.height;
    const endX = targetPos.x + targetSize.width / 2;
    const endY = targetPos.y;
    
    // 如果在同一层（Y坐标相近），使用横向连线
    if (Math.abs(startY - endY) < 50) {
      return [
        { x: sourcePos.x + sourceSize.width, y: sourcePos.y + sourceSize.height / 2 },
        { x: targetPos.x, y: targetPos.y + targetSize.height / 2 }
      ];
    }
    
    // 垂直连线
    const midY = (startY + endY) / 2;
    
    return [
      { x: startX, y: startY },
      { x: startX, y: midY },
      { x: endX, y: midY },
      { x: endX, y: endY }
    ];
  }
}

