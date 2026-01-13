import type { SourceMapSpan } from '../types/source-span';

export type FlowNodeKind =
  | 'start'
  | 'statement'
  | 'condition'
  | 'loop'
  | 'end'
  | 'try'
  | 'catch'
  | 'finally'
  | 'throw';

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: string;
  source?: SourceMapSpan;
}

export type FlowEdgeKind =
  | 'normal'
  | 'true'
  | 'false'
  | 'loop'
  | 'exception'
  | 'finally';

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  kind: FlowEdgeKind;
  label?: string;
}

export interface FlowGraphMeta {
  source: 'code';
  diagnostics: Diagnostic[];
  entryNodeId: string;
}

export interface FlowGraph {
  nodes: FlowNode[];
  edges: FlowEdge[];
  meta: FlowGraphMeta;
}

export type DiagramNodeShape = 'rect' | 'diamond' | 'ellipse' | 'cylinder';

export interface DiagramNodeStyle {
  color?: string;
  icon?: string;
  shape?: DiagramNodeShape;
  styles?: string[];
}

export interface DiagramNode {
  id: string;
  label: string;
  type?: string;
  note?: string;
  data?: Record<string, unknown>;
  style?: DiagramNodeStyle;
  source?: SourceMapSpan;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: string;
  style?: string[];
  note?: string;
}

export interface DiagramGroup {
  id: string;
  label?: string;
  children: string[];
  style?: string[];
}

export interface DiagramLayoutHint {
  mode: 'horizontal' | 'vertical' | 'grid' | 'swimlane';
  lanes?: string[];
  columns?: number;
}

export interface DiagramModelMeta {
  source: 'dsl' | 'code';
  diagnostics: Diagnostic[];
}

export interface DiagramModel {
  id: string;
  title: string;
  theme?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  groups: DiagramGroup[];
  layout?: DiagramLayoutHint;
  meta: DiagramModelMeta;
}

export interface Diagnostic {
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: SourceMapSpan;
  code?: string;
}

export interface FlowGraphResult {
  graph: FlowGraph;
  diagnostics: Diagnostic[];
  perf: {
    parseMs: number;
    transformMs: number;
  };
}

export interface DiagramResult {
  model: DiagramModel;
  diagnostics: Diagnostic[];
  perf: {
    parseMs: number;
    transformMs: number;
    layoutMs?: number;
  };
}

export interface ParseCodeOptions {
  source: string;
  language: 'js' | 'ts';
  enableJSX?: boolean;
  features?: string[];
}

export interface ParseDslOptions {
  source: string;
  scope?: string;
}

export interface BuildDiagramOptions {
  sourceType: 'code' | 'dsl';
  source: string;
  language?: 'js' | 'ts';
  config?: {
    autoLayout?: boolean;
    theme?: string;
  };
}

export interface RenderResult {
  nodeCount: number;
  edgeCount: number;
  groups: number;
  bounds: { width: number; height: number };
}

