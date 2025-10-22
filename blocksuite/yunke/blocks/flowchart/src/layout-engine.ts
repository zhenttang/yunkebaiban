/**
 * 布局引擎 - 计算节点和连线的位置
 * 使用分层布局算法（Layered Layout / Sugiyama）
 */

import type { ParsedDiagram, ParsedNode, ParsedEdge } from './dsl-parser.js';

// 布局配置
const LAYOUT_CONFIG = {
  NODE_WIDTH: 180,
  NODE_HEIGHT: 80,
  HORIZONTAL_GAP: 120,
  VERTICAL_GAP: 80,
  GROUP_PADDING: 40,
  GROUP_HEADER_HEIGHT: 50,
};

export interface LayoutedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  group?: string;
}

export interface LayoutedEdge {
  from: string;
  to: string;
  label?: string;
}

export interface LayoutedGroup {
  id: string;
  label: string;
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LayoutedDiagram {
  nodes: LayoutedNode[];
  edges: LayoutedEdge[];
  groups: LayoutedGroup[];
}

/**
 * 计算图表布局
 */
export function calculateLayout(diagram: ParsedDiagram): LayoutedDiagram {
  // 1. 计算每个节点的层级
  const levels = calculateNodeLevels(diagram.nodes, diagram.edges);
  
  // 2. 按层级分组
  const levelGroups = groupNodesByLevel(diagram.nodes, levels);
  
  // 3. 计算节点位置
  const layoutedNodes = calculateNodePositions(levelGroups, diagram.nodes);
  
  // 4. 计算分组边界
  const layoutedGroups = calculateGroupBounds(diagram.groups, layoutedNodes);
  
  // 5. 返回布局后的图表
  return {
    nodes: layoutedNodes,
    edges: diagram.edges.map(edge => ({
      from: edge.from,
      to: edge.to,
      label: edge.label,
    })),
    groups: layoutedGroups,
  };
}

/**
 * 计算节点层级（拓扑排序）
 */
function calculateNodeLevels(
  nodes: ParsedNode[],
  edges: ParsedEdge[]
): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  
  // 初始化入度
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
  });
  
  // 计算入度
  edges.forEach(edge => {
    const currentDegree = inDegree.get(edge.to) || 0;
    inDegree.set(edge.to, currentDegree + 1);
  });
  
  // 拓扑排序 - BFS
  const queue: string[] = [];
  
  // 找出所有入度为 0 的节点（起始节点）
  inDegree.forEach((degree, id) => {
    if (degree === 0) {
      levels.set(id, 0);
      queue.push(id);
    }
  });
  
  // 广度优先遍历
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    
    // 处理所有从当前节点出发的边
    edges.forEach(edge => {
      if (edge.from === current) {
        // 目标节点的层级 = max(现有层级, 当前层级 + 1)
        const newLevel = Math.max(
          levels.get(edge.to) || 0,
          currentLevel + 1
        );
        levels.set(edge.to, newLevel);
        
        // 减少入度
        const newDegree = (inDegree.get(edge.to) || 0) - 1;
        inDegree.set(edge.to, newDegree);
        
        // 入度为 0 时加入队列
        if (newDegree === 0 && !queue.includes(edge.to)) {
          queue.push(edge.to);
        }
      }
    });
  }
  
  // 处理孤立节点（没有连线的节点）
  nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  return levels;
}

/**
 * 按层级分组节点
 */
function groupNodesByLevel(
  nodes: ParsedNode[],
  levels: Map<string, number>
): Map<number, ParsedNode[]> {
  const groups = new Map<number, ParsedNode[]>();
  
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!groups.has(level)) {
      groups.set(level, []);
    }
    groups.get(level)!.push(node);
  });
  
  return groups;
}

/**
 * 计算节点位置
 */
function calculateNodePositions(
  levelGroups: Map<number, ParsedNode[]>,
  _allNodes: ParsedNode[]
): LayoutedNode[] {
  const layoutedNodes: LayoutedNode[] = [];
  
  levelGroups.forEach((nodes, level) => {
    nodes.forEach((node, indexInLevel) => {
      const x = level * (LAYOUT_CONFIG.NODE_WIDTH + LAYOUT_CONFIG.HORIZONTAL_GAP);
      const y = indexInLevel * (LAYOUT_CONFIG.NODE_HEIGHT + LAYOUT_CONFIG.VERTICAL_GAP);
      
      layoutedNodes.push({
        id: node.id,
        label: node.label,
        x,
        y,
        width: LAYOUT_CONFIG.NODE_WIDTH,
        height: LAYOUT_CONFIG.NODE_HEIGHT,
        group: node.group,
      });
    });
  });
  
  return layoutedNodes;
}

/**
 * 计算分组边界
 */
function calculateGroupBounds(
  groups: Map<string, { label: string; nodeIds: string[] }>,
  nodes: LayoutedNode[]
): LayoutedGroup[] {
  const layoutedGroups: LayoutedGroup[] = [];
  
  groups.forEach((group, groupId) => {
    // 找出属于这个分组的所有节点
    const groupNodes = nodes.filter(n => n.group === groupId);
    
    if (groupNodes.length === 0) {
      return;
    }
    
    // 计算边界框
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    groupNodes.forEach(node => {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + node.width);
      maxY = Math.max(maxY, node.y + node.height);
    });
    
    // 添加内边距和标题区域
    layoutedGroups.push({
      id: groupId,
      label: group.label,
      nodeIds: group.nodeIds,
      bounds: {
        x: minX - LAYOUT_CONFIG.GROUP_PADDING,
        y: minY - LAYOUT_CONFIG.GROUP_PADDING - LAYOUT_CONFIG.GROUP_HEADER_HEIGHT,
        width: maxX - minX + LAYOUT_CONFIG.GROUP_PADDING * 2,
        height: maxY - minY + LAYOUT_CONFIG.GROUP_PADDING * 2 + LAYOUT_CONFIG.GROUP_HEADER_HEIGHT,
      },
    });
  });
  
  return layoutedGroups;
}

/**
 * 计算布局的总边界
 */
export function calculateLayoutBounds(layout: LayoutedDiagram): {
  width: number;
  height: number;
} {
  let maxX = 0;
  let maxY = 0;
  
  // 考虑节点
  layout.nodes.forEach(node => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });
  
  // 考虑分组
  layout.groups.forEach(group => {
    maxX = Math.max(maxX, group.bounds.x + group.bounds.width);
    maxY = Math.max(maxY, group.bounds.y + group.bounds.height);
  });
  
  return {
    width: maxX + 40,
    height: maxY + 40,
  };
}

