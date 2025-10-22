/**
 * SVG 渲染器
 * 将解析后的图表渲染为 SVG
 */

import type { ParsedDiagram, ParsedNode, ParsedEdge } from './dsl-parser.js';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const H_GAP = 120;
const V_GAP = 80;
const GROUP_PADDING = 40;
const GROUP_HEADER_HEIGHT = 40;

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GroupBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export function renderDiagramToSVG(diagram: ParsedDiagram): {
  svg: string;
  nodeCount: number;
  edgeCount: number;
} {
  if (diagram.nodes.length === 0) {
    throw new Error('未找到任何节点定义');
  }

  // 计算节点布局
  const layout = calculateLayout(diagram);
  
  // 计算画布大小
  const bounds = calculateCanvasBounds(layout.positions, layout.groupBounds);
  
  // 生成 SVG
  const svg = generateSVG(diagram, layout.positions, layout.groupBounds, bounds);
  
  return {
    svg,
    nodeCount: diagram.nodes.length,
    edgeCount: diagram.edges.length,
  };
}

function calculateLayout(diagram: ParsedDiagram): {
  positions: Map<string, NodePosition>;
  groupBounds: Map<string, GroupBounds>;
} {
  const positions = new Map<string, NodePosition>();
  const groupBounds = new Map<string, GroupBounds>();
  
  // 计算每个节点的层级（用于布局）
  const levels = calculateNodeLevels(diagram);
  
  // 按层级分组
  const levelGroups = groupNodesByLevel(diagram.nodes, levels);
  
  // 计算基本位置
  let offsetY = 20;
  
  levelGroups.forEach((nodes, level) => {
    let maxHeightInLevel = 0;
    
    nodes.forEach((node, index) => {
      const x = level * (NODE_WIDTH + H_GAP) + 20;
      const y = offsetY + index * (NODE_HEIGHT + V_GAP);
      
      positions.set(node.id, {
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
      
      maxHeightInLevel = Math.max(maxHeightInLevel, y + NODE_HEIGHT);
    });
  });
  
  // 计算分组边界
  diagram.groups.forEach((group, groupId) => {
    const groupNodes = diagram.nodes.filter(n => n.group === groupId);
    if (groupNodes.length === 0) return;
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    groupNodes.forEach(node => {
      const pos = positions.get(node.id);
      if (pos) {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + pos.width);
        maxY = Math.max(maxY, pos.y + pos.height);
      }
    });
    
    if (minX !== Infinity) {
      groupBounds.set(groupId, {
        x: minX - GROUP_PADDING,
        y: minY - GROUP_PADDING - GROUP_HEADER_HEIGHT,
        width: maxX - minX + GROUP_PADDING * 2,
        height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER_HEIGHT,
        label: group.label,
      });
    }
  });
  
  return { positions, groupBounds };
}

function calculateNodeLevels(diagram: ParsedDiagram): Map<string, number> {
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();
  
  // 初始化入度
  diagram.nodes.forEach(node => {
    inDegree.set(node.id, 0);
  });
  
  // 计算入度
  diagram.edges.forEach(edge => {
    inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
  });
  
  // 拓扑排序
  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) {
      levels.set(id, 0);
      queue.push(id);
    }
  });
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLevel = levels.get(current) || 0;
    
    diagram.edges.forEach(edge => {
      if (edge.from === current) {
        const newLevel = Math.max(levels.get(edge.to) || 0, currentLevel + 1);
        levels.set(edge.to, newLevel);
        const newDegree = (inDegree.get(edge.to) || 0) - 1;
        inDegree.set(edge.to, newDegree);
        if (newDegree === 0 && !queue.includes(edge.to)) {
          queue.push(edge.to);
        }
      }
    });
  }
  
  // 处理孤立节点
  diagram.nodes.forEach(node => {
    if (!levels.has(node.id)) {
      levels.set(node.id, 0);
    }
  });
  
  return levels;
}

function groupNodesByLevel(nodes: ParsedNode[], levels: Map<string, number>): Map<number, ParsedNode[]> {
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

function calculateCanvasBounds(
  positions: Map<string, NodePosition>,
  groupBounds: Map<string, GroupBounds>
): { width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + pos.width);
    maxY = Math.max(maxY, pos.y + pos.height);
  });
  
  groupBounds.forEach(bounds => {
    minX = Math.min(minX, bounds.x);
    minY = Math.min(minY, bounds.y);
    maxX = Math.max(maxX, bounds.x + bounds.width);
    maxY = Math.max(maxY, bounds.y + bounds.height);
  });
  
  // 添加足够的内边距，确保边缘不被裁剪
  const padding = 40;
  
  return {
    width: maxX + padding,
    height: maxY + padding,
  };
}

function generateSVG(
  diagram: ParsedDiagram,
  positions: Map<string, NodePosition>,
  groupBounds: Map<string, GroupBounds>,
  bounds: { width: number; height: number }
): string {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="0 0 ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet">`;
  
  // 样式
  svg += `<style>
    .node-rect { fill: #1e96ed; stroke: #1565c0; stroke-width: 2; }
    .node-text { fill: white; font-family: sans-serif; font-size: 14px; text-anchor: middle; dominant-baseline: middle; user-select: none; }
    .edge-line { stroke: #666; stroke-width: 2; fill: none; marker-end: url(#arrowhead); }
    .edge-label { fill: #666; font-family: sans-serif; font-size: 12px; text-anchor: middle; user-select: none; }
    .group-rect { fill: #f5f5f5; stroke: #999; stroke-width: 2; stroke-dasharray: 5,5; }
    .group-label { fill: #333; font-family: sans-serif; font-size: 16px; font-weight: bold; user-select: none; }
  </style>`;
  
  // 箭头定义
  svg += `<defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <polygon points="0 0, 10 3, 0 6" fill="#666" />
    </marker>
  </defs>`;
  
  // 绘制分组背景
  groupBounds.forEach((bounds, groupId) => {
    svg += `<rect class="group-rect" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" rx="8" />`;
    svg += `<text class="group-label" x="${bounds.x + 10}" y="${bounds.y + 25}">${escapeHtml(bounds.label)}</text>`;
  });
  
  // 绘制边
  diagram.edges.forEach(edge => {
    const fromPos = positions.get(edge.from);
    const toPos = positions.get(edge.to);
    
    if (fromPos && toPos) {
      const x1 = fromPos.x + fromPos.width;
      const y1 = fromPos.y + fromPos.height / 2;
      const x2 = toPos.x;
      const y2 = toPos.y + toPos.height / 2;
      
      svg += `<line class="edge-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`;
      
      if (edge.label) {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        
        // 添加白色背景
        const labelWidth = edge.label.length * 7;
        svg += `<rect x="${midX - labelWidth/2}" y="${midY - 10}" width="${labelWidth}" height="20" fill="white" />`;
        svg += `<text class="edge-label" x="${midX}" y="${midY + 4}">${escapeHtml(edge.label)}</text>`;
      }
    }
  });
  
  // 绘制节点
  diagram.nodes.forEach(node => {
    const pos = positions.get(node.id);
    if (pos) {
      svg += `<rect class="node-rect" x="${pos.x}" y="${pos.y}" width="${pos.width}" height="${pos.height}" rx="8" />`;
      svg += `<text class="node-text" x="${pos.x + pos.width/2}" y="${pos.y + pos.height/2}">${escapeHtml(node.label)}</text>`;
    }
  });
  
  svg += '</svg>';
  
  return svg;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

