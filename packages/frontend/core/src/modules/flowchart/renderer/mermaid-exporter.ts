import type { DiagramModel, FlowGraph } from '../types/graph';

export const flowGraphToMermaid = (graph: FlowGraph, direction: 'TD' | 'LR' = 'TD') => {
  const lines: string[] = [`graph ${direction}`];
  graph.nodes.forEach(node => {
    const { open, close } = getShapeForNode(node.kind);
    lines.push(`  ${escapeId(node.id)}${open}${formatLabel(node.label)}${close}`);
  });
  graph.edges.forEach(edge => {
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`  ${edge.from} -->${label} ${edge.to}`);
  });
  return lines.join('\n');
};

export const diagramToMermaid = (
  diagram: DiagramModel,
  direction: 'TD' | 'LR' = 'LR'
) => {
  const lines: string[] = [`graph ${direction}`];
  diagram.nodes.forEach(node => {
    lines.push(`  ${escapeId(node.id)}[${formatLabel(node.label)}]`);
  });
  diagram.edges.forEach(edge => {
    const label = edge.label ? `|${edge.label}|` : '';
    lines.push(`  ${escapeId(edge.from)} -->${label} ${escapeId(edge.to)}`);
  });
  return lines.join('\n');
};

const getShapeForNode = (kind: string) => {
  switch (kind) {
    case 'condition':
      return { open: '{', close: '}' };
    case 'loop':
      return { open: '(', close: ')' };
    case 'end':
      return { open: '[[', close: ']]' };
    default:
      return { open: '[', close: ']' };
  }
};

const formatLabel = (label: string) => label.replace(/\n/g, '<br/>');

const escapeId = (id: string) => id.replace(/[^a-zA-Z0-9_]/g, '_');
