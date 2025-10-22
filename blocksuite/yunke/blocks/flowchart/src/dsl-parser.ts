/**
 * Yunke Flow DSL 解析器
 * 
 * 支持的语法：
 * - diagram "name" { ... }
 * - node id label "text"
 * - group id label "text" { ... }
 * - id1 -> id2 : "label"
 */

export interface ParsedNode {
  id: string;
  label: string;
  type?: string;
  group?: string;
}

export interface ParsedEdge {
  from: string;
  to: string;
  label?: string;
}

export interface ParsedDiagram {
  name: string;
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  groups: Map<string, { label: string; nodeIds: string[] }>;
}

export function parseDSL(dslCode: string): ParsedDiagram {
  const lines = dslCode.split('\n');
  const nodes: ParsedNode[] = [];
  const edges: ParsedEdge[] = [];
  const groups = new Map<string, { label: string; nodeIds: string[] }>();
  
  let diagramName = '未命名图表';
  let currentGroup: string | undefined;
  let braceLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 跳过空行和注释
    if (!line || line.startsWith('//') || line.startsWith('#')) {
      continue;
    }
    
    // 解析 diagram 声明
    const diagramMatch = line.match(/^diagram\s+"([^"]+)"\s*\{/);
    if (diagramMatch) {
      diagramName = diagramMatch[1];
      braceLevel++;
      continue;
    }
    
    // 解析 group 声明
    const groupMatch = line.match(/^group\s+(\w+)\s+label\s+"([^"]+)"\s*\{/);
    if (groupMatch) {
      const groupId = groupMatch[1];
      const groupLabel = groupMatch[2];
      currentGroup = groupId;
      groups.set(groupId, { label: groupLabel, nodeIds: [] });
      braceLevel++;
      continue;
    }
    
    // 解析右花括号
    if (line === '}') {
      braceLevel--;
      if (currentGroup && braceLevel === 1) {
        currentGroup = undefined;
      }
      continue;
    }
    
    // 解析 node 声明: node id label "text"
    const nodeLabelMatch = line.match(/^node\s+(\w+)\s+label\s+"([^"]+)"/);
    if (nodeLabelMatch) {
      const nodeId = nodeLabelMatch[1];
      const nodeLabel = nodeLabelMatch[2];
      nodes.push({
        id: currentGroup ? `${currentGroup}.${nodeId}` : nodeId,
        label: nodeLabel,
        group: currentGroup,
      });
      if (currentGroup) {
        groups.get(currentGroup)?.nodeIds.push(nodeId);
      }
      continue;
    }
    
    // 解析 node 声明（带类型）: node id type xxx label "text"
    const nodeTypeMatch = line.match(/^node\s+(\w+)\s+type\s+(\w+)\s+label\s+"([^"]+)"/);
    if (nodeTypeMatch) {
      const nodeId = nodeTypeMatch[1];
      const nodeType = nodeTypeMatch[2];
      const nodeLabel = nodeTypeMatch[3];
      nodes.push({
        id: currentGroup ? `${currentGroup}.${nodeId}` : nodeId,
        label: nodeLabel,
        type: nodeType,
        group: currentGroup,
      });
      if (currentGroup) {
        groups.get(currentGroup)?.nodeIds.push(nodeId);
      }
      continue;
    }
    
    // 解析简单 node: node id
    const simpleNodeMatch = line.match(/^node\s+(\w+)\s*$/);
    if (simpleNodeMatch) {
      const nodeId = simpleNodeMatch[1];
      nodes.push({
        id: currentGroup ? `${currentGroup}.${nodeId}` : nodeId,
        label: nodeId,
        group: currentGroup,
      });
      if (currentGroup) {
        groups.get(currentGroup)?.nodeIds.push(nodeId);
      }
      continue;
    }
    
    // 解析边: id1 -> id2 : "label"
    const edgeLabelMatch = line.match(/^([\w.]+)\s*(?:->|=>|~>)\s*([\w.]+)\s*:\s*"([^"]+)"/);
    if (edgeLabelMatch) {
      edges.push({
        from: edgeLabelMatch[1],
        to: edgeLabelMatch[2],
        label: edgeLabelMatch[3],
      });
      continue;
    }
    
    // 解析边（无标签）: id1 -> id2
    const edgeMatch = line.match(/^([\w.]+)\s*(?:->|=>|~>)\s*([\w.]+)\s*$/);
    if (edgeMatch) {
      edges.push({
        from: edgeMatch[1],
        to: edgeMatch[2],
      });
      continue;
    }
  }
  
  return {
    name: diagramName,
    nodes,
    edges,
    groups,
  };
}

