/**
 * 树状图布局引擎
 * 
 * 实现垂直树形布局算法：
 * - 根节点在顶部
 * - 子节点在父节点下方
 * - 同层节点水平均匀分布
 * - 自动计算避免重叠
 */

import { BaseLayoutEngine } from '../core/base-layout.js';
import type {
  DiagramModel,
  DiagramRelationship,
  LayoutResult,
  LayoutedElement,
  LayoutedRelationship
} from '../core/diagram-types';
import type { LayoutConfig } from '../core/base-layout.js';

export interface TreeLayoutNode {
  id: string;
  label: string;
  level: number;
  children: TreeLayoutNode[];
  parent?: TreeLayoutNode;
  x: number;
  y: number;
  width: number;
  height: number;
  subtreeWidth: number; // 该节点及其所有子树的总宽度
}

export interface TreeLayoutConfig extends LayoutConfig {
  // 节点尺寸
  nodeWidth?: number;
  nodeHeight?: number;
  
  // 间距
  levelGap?: number;        // 层级间的垂直间距
  siblingGap?: number;      // 同层兄弟节点间的水平间距
  subtreeGap?: number;      // 子树之间的水平间距
  
  // 边距
  padding?: number;
}

export class TreeLayoutEngine extends BaseLayoutEngine {
  readonly supportedType = 'tree' as const;
  
  protected override defaultConfig = {
    nodeWidth: 120,       // 节点宽度
    nodeHeight: 50,       // 节点高度
    nodeSpacing: 20,      // 基础节点间距
    levelGap: 60,         // 层级间的垂直间距
    siblingGap: 20,       // 同层兄弟节点间的水平间距
    subtreeGap: 30,       // 不同子树之间的水平间距
    padding: 40           // 整体边距
  } as Required<TreeLayoutConfig>;
  
  private nodes: Map<string, TreeLayoutNode> = new Map();
  private rootNode: TreeLayoutNode | null = null;
  private maxLevel: number = 0;

  layout(model: DiagramModel, config?: TreeLayoutConfig): LayoutResult {
    const cfg = this.mergeConfig(config) as Required<TreeLayoutConfig>;
    
    // 重置状态
    this.nodes = new Map();
    this.rootNode = null;
    this.maxLevel = 0;

    // 构建树结构
    this.buildTree(model, cfg);

    if (!this.rootNode) {
      throw new Error('No root node found in diagram model');
    }

    // 计算子树宽度（从叶子节点向上）
    this.calculateSubtreeWidths(this.rootNode, cfg);

    // 计算节点位置（从根节点向下）
    this.calculatePositions(this.rootNode, 0, 0, cfg);

    // 将节点居中（调整 x 坐标使整棵树居中）
    this.centerTree(cfg);

    // 转换为 LayoutResult
    return this.convertToLayoutResult(model, cfg);
  }

  private buildTree(model: DiagramModel, cfg: Required<TreeLayoutConfig>): void {
    // 创建所有节点
    model.elements.forEach(element => {
      if (element.type === 'node') {
        const node: TreeLayoutNode = {
          id: element.id,
          label: element.label || '',
          level: element.data?.level ?? 0,
          children: [],
          x: 0,
          y: 0,
          width: cfg.nodeWidth,
          height: cfg.nodeHeight,
          subtreeWidth: cfg.nodeWidth
        };

        this.nodes.set(element.id, node);

        if (element.data?.isRoot) {
          this.rootNode = node;
        }

        this.maxLevel = Math.max(this.maxLevel, node.level);
      }
    });

    // 建立父子关系
    model.relationships.forEach(rel => {
      if (rel.type === 'edge') {
        const parent = this.nodes.get(rel.source);
        const child = this.nodes.get(rel.target);

        if (parent && child) {
          parent.children.push(child);
          child.parent = parent;
        }
      }
    });

    // 如果没有标记 root，找到没有父节点的节点作为 root
    if (!this.rootNode) {
      this.nodes.forEach(node => {
        if (!node.parent) {
          this.rootNode = node;
        }
      });
    }
  }

  private calculateSubtreeWidths(node: TreeLayoutNode, cfg: Required<TreeLayoutConfig>): number {
    if (node.children.length === 0) {
      // 叶子节点，子树宽度就是节点宽度
      node.subtreeWidth = node.width;
      return node.subtreeWidth;
    }

    // 递归计算所有子节点的子树宽度
    let totalChildrenWidth = 0;
    node.children.forEach((child, index) => {
      const childSubtreeWidth = this.calculateSubtreeWidths(child, cfg);
      totalChildrenWidth += childSubtreeWidth;
      
      // 添加兄弟节点间的间距
      if (index > 0) {
        totalChildrenWidth += cfg.subtreeGap;
      }
    });

    // 该节点的子树宽度是：max(节点自身宽度, 所有子节点子树宽度之和)
    node.subtreeWidth = Math.max(node.width, totalChildrenWidth);
    
    return node.subtreeWidth;
  }

  private calculatePositions(
    node: TreeLayoutNode,
    x: number,
    y: number,
    cfg: Required<TreeLayoutConfig>
  ): void {
    // 设置当前节点的位置
    // x 是该节点子树的左边界，节点本身居中
    node.x = x + (node.subtreeWidth - node.width) / 2;
    node.y = y;

    if (node.children.length === 0) {
      return;
    }

    // 计算子节点的起始 y 坐标
    const childY = y + node.height + cfg.levelGap;

    // 计算所有子节点的总宽度
    let totalChildrenWidth = 0;
    node.children.forEach((child, index) => {
      totalChildrenWidth += child.subtreeWidth;
      if (index > 0) {
        totalChildrenWidth += cfg.subtreeGap;
      }
    });

    // 子节点从哪里开始（居中对齐）
    let childX = x + (node.subtreeWidth - totalChildrenWidth) / 2;

    // 递归布局所有子节点
    node.children.forEach(child => {
      this.calculatePositions(child, childX, childY, cfg);
      childX += child.subtreeWidth + cfg.subtreeGap;
    });
  }

  private centerTree(cfg: Required<TreeLayoutConfig>): void {
    if (!this.rootNode) return;

    // 找到最小的 x 坐标
    let minX = Infinity;
    this.nodes.forEach(node => {
      minX = Math.min(minX, node.x);
    });

    // 将所有节点向右移动，使最左边的节点距离边界 padding
    const offsetX = cfg.padding - minX;
    this.nodes.forEach(node => {
      node.x += offsetX;
    });

    // 将所有节点向下移动 padding
    this.nodes.forEach(node => {
      node.y += cfg.padding;
    });
  }

  private convertToLayoutResult(model: DiagramModel, cfg: Required<TreeLayoutConfig>): LayoutResult {
    const elements: LayoutedElement[] = [];
    const relationships: LayoutedRelationship[] = [];

    // 转换节点为 LayoutedElement
    this.nodes.forEach(node => {
      const originalElement = model.elements.find(e => e.id === node.id);
      if (originalElement) {
        elements.push({
          ...originalElement,
          position: {
            x: node.x,
            y: node.y
          },
          size: {
            width: node.width,
            height: node.height
          },
          data: {
            ...originalElement.data,
            level: node.level,
            childCount: node.children.length,
            isLeaf: node.children.length === 0,
            subtreeWidth: node.subtreeWidth
          }
        });
      }
    });

    const junctionSize = 4;
    const junctionElements = new Map<string, LayoutedElement>();

    const getElementCenter = (element: LayoutedElement) => ({
      x: element.position.x + element.size.width / 2,
      y: element.position.y + element.size.height / 2,
    });

    const ensureJunction = (
      id: string,
      centerX: number,
      centerY: number
    ): LayoutedElement => {
      const existing = junctionElements.get(id);
      if (existing) {
        return existing;
      }

      const junction: LayoutedElement = {
        id,
        type: 'node',
        shape: 'rect',
        label: '',
        position: {
          x: centerX - junctionSize / 2,
          y: centerY - junctionSize / 2,
        },
        size: {
          width: junctionSize,
          height: junctionSize,
        },
        style: {
          fillColor: 'transparent',
          strokeColor: 'transparent',
          strokeWidth: 0,
          opacity: 0,
        },
        data: {
          isTreeJunction: true,
        },
      };

      junctionElements.set(id, junction);
      return junction;
    };

    const parentToRelations = new Map<string, DiagramRelationship[]>();
    model.relationships.forEach(rel => {
      if (rel.type === 'edge') {
        const relations = parentToRelations.get(rel.source) || [];
        relations.push(rel);
        parentToRelations.set(rel.source, relations);
      }
    });

    parentToRelations.forEach((relations, parentId) => {
      const parentNode = this.nodes.get(parentId);
      if (!parentNode) {
        return;
      }

      const relationInfos = relations
        .map(rel => ({
          rel,
          node: this.nodes.get(rel.target),
        }))
        .filter((item): item is { rel: DiagramRelationship; node: TreeLayoutNode } =>
          Boolean(item.node)
        );

      if (relationInfos.length === 0) {
        return;
      }

      const parentCenterX = parentNode.x + parentNode.width / 2;
      const parentBottomY = parentNode.y + parentNode.height;

      if (relationInfos.length === 1) {
        const [{ rel, node: childNode }] = relationInfos;
        const childCenterX = childNode.x + childNode.width / 2;
        const childTopY = childNode.y;

        relationships.push({
          ...rel,
          points: [
            { x: parentCenterX, y: parentBottomY },
            { x: childCenterX, y: childTopY },
          ],
          data: {
            ...rel.data,
            edgeType: 'tree-orthogonal',
            isTreeEdge: true,
          },
        });
        return;
      }

      const firstChildTopY = relationInfos[0].node.y;
      const midY = (parentBottomY + firstChildTopY) / 2;

      const baseStyle = relationInfos[0].rel.style ?? {};

      const parentJunctionId = `${parentId}::junction`;
      const parentJunction = ensureJunction(parentJunctionId, parentCenterX, midY);

      relationships.push({
        id: `${parentId}::junction-vertical`,
        type: 'edge',
        source: parentId,
        target: parentJunction.id,
        label: '',
        style: {
          ...baseStyle,
          targetArrow: 'none',
          sourceArrow: 'none',
        },
        points: [
          { x: parentCenterX, y: parentBottomY },
          { x: parentCenterX, y: midY },
        ],
        data: {
          edgeType: 'tree-vertical-from-parent',
          isTreeEdge: true,
        },
      });

      const childAnchors = relationInfos.map(({ rel, node: childNode }) => {
        const childCenterX = childNode.x + childNode.width / 2;
        const anchorId = `${parentId}::junction-${childNode.id}`;
        const anchor = ensureJunction(anchorId, childCenterX, midY);

        return {
          rel,
          childNode,
          anchor,
          childCenterX,
          childTopY: childNode.y,
        };
      });

      const sortedAnchors = [...childAnchors.map(item => item.anchor), parentJunction]
        .sort((a, b) => getElementCenter(a).x - getElementCenter(b).x);

      for (let i = 0; i < sortedAnchors.length - 1; i++) {
        const from = sortedAnchors[i];
        const to = sortedAnchors[i + 1];

        if (from.id === to.id) {
          continue;
        }

        const fromCenter = getElementCenter(from);
        const toCenter = getElementCenter(to);

        relationships.push({
          id: `${from.id}->${to.id}`,
          type: 'edge',
          source: from.id,
          target: to.id,
          label: '',
          style: {
            ...baseStyle,
            targetArrow: 'none',
            sourceArrow: 'none',
          },
          points: [
            { x: fromCenter.x, y: midY },
            { x: toCenter.x, y: midY },
          ],
          data: {
            edgeType: 'tree-horizontal',
            isTreeEdge: true,
          },
        });
      }

      childAnchors.forEach(({ rel, childNode, anchor, childCenterX, childTopY }) => {
        relationships.push({
          ...rel,
          source: anchor.id,
          points: [
            { x: childCenterX, y: midY },
            { x: childCenterX, y: childTopY },
          ],
          style: {
            ...rel.style,
            targetArrow: 'none',
            sourceArrow: 'none',
          },
          data: {
            ...rel.data,
            edgeType: 'tree-vertical-to-child',
            isTreeEdge: true,
          },
        });
      });
    });

    junctionElements.forEach(junction => {
      elements.push(junction);
    });

    return {
      elements,
      relationships,
      bounds: this.calculateTreeBounds(cfg)
    };
  }

  private calculateTreeBounds(cfg: Required<TreeLayoutConfig>): { x: number; y: number; width: number; height: number } {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });

    return {
      x: minX - cfg.padding,
      y: minY - cfg.padding,
      width: maxX - minX + cfg.padding * 2,
      height: maxY - minY + cfg.padding * 2
    };
  }

  /**
   * 获取树的根节点（用于调试）
   */
  getRoot(): TreeLayoutNode | null {
    return this.rootNode;
  }

  /**
   * 获取所有节点（用于调试）
   */
  getNodes(): Map<string, TreeLayoutNode> {
    return this.nodes;
  }
}

