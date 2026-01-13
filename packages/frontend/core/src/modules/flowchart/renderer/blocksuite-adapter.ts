import type { DiagramModel } from '../types/graph';
import { layeredLayout } from './layout/layered-layout';

export interface RenderableNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: string;
}

export interface RenderableEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface RenderableDiagram {
  nodes: RenderableNode[];
  edges: RenderableEdge[];
  width: number;
  height: number;
}

export const buildRenderableDiagram = (diagram: DiagramModel): RenderableDiagram => {
  const layout = layeredLayout(diagram);
  const nodes = diagram.nodes.map(node => {
    const positioned = layout.nodes.get(node.id);
    const renderable: RenderableNode = {
      id: node.id,
      label: node.label,
      x: positioned?.x ?? 0,
      y: positioned?.y ?? 0,
      width: positioned?.width ?? 240,
      height: positioned?.height ?? 120,
      type: node.type,
    };
    return renderable;
  });

  const edges: RenderableEdge[] = diagram.edges.map(edge => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    label: edge.label ?? edge.condition,
  }));

  return {
    nodes,
    edges,
    width: layout.width,
    height: layout.height,
  };
};
