import type { DiagramModel } from '../../types/graph';

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutResult {
  nodes: Map<string, PositionedNode>;
  width: number;
  height: number;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;
const HORIZONTAL_GAP = 160;
const VERTICAL_GAP = 80;

export const layeredLayout = (diagram: DiagramModel): LayoutResult => {
  const levels = computeLevels(diagram);
  const levelMap = new Map<string, number>(levels.entries());
  const maxLevel = Math.max(0, ...Array.from(levelMap.values()));
  const levelBuckets = new Map<number, string[]>();
  diagram.nodes.forEach(node => {
    const level = levelMap.get(node.id) ?? 0;
    const bucket = levelBuckets.get(level) ?? [];
    bucket.push(node.id);
    levelBuckets.set(level, bucket);
  });

  const positioned = new Map<string, PositionedNode>();
  levelBuckets.forEach((ids, level) => {
    ids.forEach((id, index) => {
      const x = level * (NODE_WIDTH + HORIZONTAL_GAP);
      const y = index * (NODE_HEIGHT + VERTICAL_GAP);
      positioned.set(id, {
        id,
        x,
        y,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });
  });

  const width = (maxLevel + 1) * (NODE_WIDTH + HORIZONTAL_GAP);
  const maxNodesInLevel = Math.max(
    1,
    ...Array.from(levelBuckets.values()).map(bucket => bucket.length)
  );
  const height = maxNodesInLevel * (NODE_HEIGHT + VERTICAL_GAP);

  return {
    nodes: positioned,
    width,
    height,
  };
};

const computeLevels = (diagram: DiagramModel) => {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, Set<string>>();

  diagram.nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, new Set());
  });

  diagram.edges.forEach(edge => {
    if (!adjacency.has(edge.from)) {
      adjacency.set(edge.from, new Set());
    }
    adjacency.get(edge.from)?.add(edge.to);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) {
      queue.push(id);
    }
  });

  const levelMap = new Map<string, number>();
  while (queue.length > 0) {
    const id = queue.shift()!;
    const level = levelMap.get(id) ?? 0;
    adjacency.get(id)?.forEach(target => {
      const nextLevel = Math.max(levelMap.get(target) ?? 0, level + 1);
      levelMap.set(target, nextLevel);
      const nextDegree = (inDegree.get(target) ?? 0) - 1;
      inDegree.set(target, nextDegree);
      if (nextDegree <= 0) {
        queue.push(target);
      }
    });
  }

  diagram.nodes.forEach(node => {
    if (!levelMap.has(node.id)) {
      levelMap.set(node.id, 0);
    }
  });

  return levelMap;
};

