import {
  parseDsl,
  type ComponentDeclaration,
  type DslDocument,
  type GroupStatement,
  type LayoutStatement,
  type NodeStatement,
  type Statement,
} from '../parser/dsl-parser';
import type {
  BuildDiagramOptions,
  DiagramEdge,
  DiagramGroup,
  DiagramModel,
  DiagramNode,
  DiagramNodeStyle,
  DiagramResult,
  Diagnostic,
  ParseDslOptions,
} from '../types/graph';

interface BuildContext {
  nodes: Map<string, DiagramNode>;
  groups: Map<string, DiagramGroup>;
  groupChildren: Map<string, Set<string>>;
  edges: DiagramEdge[];
  pending: Map<string, Partial<Pick<DiagramNode, 'note' | 'data' | 'style'>>>;
  diagnostics: Diagnostic[];
  layout?: LayoutStatement['mode'];
  layoutValues?: string[];
  theme?: string;
}

interface BuildOptions {
  scope?: string;
  config?: BuildDiagramOptions['config'];
}

export const transformDslToDiagram = (
  options: ParseDslOptions & BuildOptions
): DiagramResult => {
  const parseResult = parseDsl(options);
  const document = parseResult.document;

  if (document.diagrams.length === 0) {
    const diagnostic: Diagnostic = {
      severity: 'error',
      message: '未在 DSL 中找到 diagram 定义',
      code: 'FC301',
    };
    return {
      model: emptyDiagramModel(),
      diagnostics: [...document.diagnostics, diagnostic],
      perf: {
        parseMs: parseResult.durationMs,
        transformMs: 0,
      },
    };
  }

  const builder = new DiagramBuilder(document);
  const buildResult = builder.build(document.diagrams[0], options);

  return {
    model: buildResult.model,
    diagnostics: [
      ...document.diagnostics,
      ...buildResult.diagnostics,
    ],
    perf: {
      parseMs: parseResult.durationMs,
      transformMs: buildResult.durationMs,
    },
  };
};

class DiagramBuilder {
  private readonly componentMap: Map<string, ComponentDeclaration> = new Map();

  constructor(private readonly document: DslDocument) {
    for (const component of document.components) {
      this.componentMap.set(component.name, component);
    }
  }

  build(diagram: DslDocument['diagrams'][number], options: BuildOptions) {
    const start = now();
    const ctx: BuildContext = {
      nodes: new Map(),
      groups: new Map(),
      groupChildren: new Map(),
      edges: [],
      pending: new Map(),
      diagnostics: [],
    };

    const scope: BuildScope = {
      prefix: [],
      variables: {},
      callStack: [],
    };

    this.processStatements(diagram.body, ctx, scope, options);

    applyPendingAnnotations(ctx);
    validateEdges(ctx);

    const model: DiagramModel = {
      id: diagram.id,
      title: diagram.title,
      theme: options.config?.theme ?? ctx.theme,
      nodes: Array.from(ctx.nodes.values()),
      edges: ctx.edges,
      groups: Array.from(ctx.groups.values()).map(group => ({
        ...group,
        children: Array.from(ctx.groupChildren.get(group.id) ?? []),
      })),
      layout: ctx.layout
        ? {
            mode: ctx.layout,
            lanes: ctx.layout === 'swimlane' ? ctx.layoutValues : undefined,
            columns: ctx.layout === 'grid' && ctx.layoutValues?.length
              ? Number(ctx.layoutValues[0]) || undefined
              : undefined,
          }
        : undefined,
      meta: {
        source: 'dsl',
        diagnostics: ctx.diagnostics,
      },
    };

    return {
      model,
      diagnostics: ctx.diagnostics,
      durationMs: now() - start,
    };
  }

  private processStatements(
    statements: Statement[],
    ctx: BuildContext,
    scope: BuildScope,
    options: BuildOptions
  ) {
    for (const statement of statements) {
      switch (statement.kind) {
        case 'node':
          this.handleNode(statement, ctx, scope);
          break;
        case 'group':
          this.handleGroup(statement, ctx, scope, options);
          break;
        case 'edge':
          this.handleEdge(statement, ctx, scope);
          break;
        case 'use':
          this.handleUse(statement, ctx, scope, options);
          break;
        case 'layout':
          ctx.layout = statement.mode;
          ctx.layoutValues = statement.values;
          break;
        case 'theme':
          ctx.theme = statement.theme;
          break;
        case 'note':
          this.enqueuePending(statement.target, ctx, scope, pending => {
            pending.note = interpolate(statement.text, scope.variables);
          });
          break;
        case 'style':
          this.enqueuePending(statement.target, ctx, scope, pending => {
            pending.style = [...new Set([...(pending.style ?? []), ...statement.styles])];
          });
          break;
        case 'data':
          this.enqueuePending(statement.target, ctx, scope, pending => {
            pending.data = deepInterpolate(statement.payload, scope.variables);
          });
          break;
        default:
          break;
      }
    }
  }

  private handleNode(statement: NodeStatement, ctx: BuildContext, scope: BuildScope) {
    const interpolatedId = interpolate(statement.id, scope.variables);
    const nodeId = resolveNodeId(interpolatedId, scope.prefix);
    const node: DiagramNode = {
      id: nodeId,
      label: statement.options.label
        ? interpolate(statement.options.label, scope.variables)
        : nodeId,
      type: statement.options.type
        ? interpolate(statement.options.type, scope.variables)
        : undefined,
      style: resolveStyle(statement.options, scope.variables),
      note: statement.options.note
        ? interpolate(statement.options.note, scope.variables)
        : undefined,
      data: statement.options.data
        ? deepInterpolate(statement.options.data, scope.variables)
        : undefined,
    };

    if (ctx.nodes.has(nodeId)) {
      ctx.diagnostics.push({
        severity: 'warning',
        message: `节点 ${nodeId} 重复定义，已覆盖先前定义`,
        code: 'FC310',
      });
    }

    ctx.nodes.set(nodeId, node);
    this.ensureGroupChild(scope, nodeId, ctx);
  }

  private handleGroup(
    statement: GroupStatement,
    ctx: BuildContext,
    scope: BuildScope,
    options: BuildOptions
  ) {
    const interpolatedId = interpolate(statement.id, scope.variables);
    const groupId = resolveNodeId(interpolatedId, scope.prefix, { isGroup: true });
    const label = statement.label
      ? interpolate(statement.label, scope.variables)
      : groupId;

    if (!ctx.groups.has(groupId)) {
      ctx.groups.set(groupId, {
        id: groupId,
        label,
        children: [],
        style: statement.style,
      });
      ctx.groupChildren.set(groupId, new Set());
      this.ensureGroupChild(scope, groupId, ctx);
    }

    scope.prefix.push(groupId);
    this.processStatements(statement.body, ctx, scope, options);
    scope.prefix.pop();
  }

  private handleEdge(statement: Statement & { kind: 'edge' }, ctx: BuildContext, scope: BuildScope) {
    const from = resolveNodeId(interpolate(statement.from, scope.variables), scope.prefix);
    const to = resolveNodeId(interpolate(statement.to, scope.variables), scope.prefix);
    const edge: DiagramEdge = {
      id: `edge-${ctx.edges.length + 1}`,
      from,
      to,
      label: statement.label ? interpolate(statement.label, scope.variables) : undefined,
      condition: statement.condition
        ? interpolate(statement.condition, scope.variables)
        : undefined,
      style: statement.style,
      note: statement.note ? interpolate(statement.note, scope.variables) : undefined,
    };
    ctx.edges.push(edge);
  }

  private handleUse(
    statement: Statement & { kind: 'use' },
    ctx: BuildContext,
    scope: BuildScope,
    options: BuildOptions
  ) {
    const component = this.componentMap.get(statement.name);
    if (!component) {
      ctx.diagnostics.push({
        severity: 'error',
        message: `未找到组件 ${statement.name}`,
        code: 'FC320',
      });
      return;
    }
    if (scope.callStack.includes(component.name)) {
      ctx.diagnostics.push({
        severity: 'error',
        message: `组件 ${component.name} 存在递归调用`,
        code: 'FC321',
      });
      return;
    }

    const variables = { ...scope.variables };
    component.params.forEach((param, index) => {
      variables[param] = statement.args[index] ?? '';
    });

    const childScope: BuildScope = {
      prefix: [...scope.prefix],
      variables,
      callStack: [...scope.callStack, component.name],
    };

    this.processStatements(component.body, ctx, childScope, options);
  }

  private ensureGroupChild(scope: BuildScope, nodeId: string, ctx: BuildContext) {
    if (scope.prefix.length === 0) {
      return;
    }
    const parentId = scope.prefix[scope.prefix.length - 1];
    const set = ctx.groupChildren.get(parentId) ?? new Set<string>();
    set.add(nodeId);
    ctx.groupChildren.set(parentId, set);
  }

  private enqueuePending(
    rawTarget: string,
    ctx: BuildContext,
    scope: BuildScope,
    mutator: (pending: Partial<Pick<DiagramNode, 'note' | 'data' | 'style'>>) => void
  ) {
    const target = resolveNodeId(interpolate(rawTarget, scope.variables), scope.prefix);
    const record = ctx.pending.get(target) ?? {};
    mutator(record);
    ctx.pending.set(target, record);
  }
}

type BuildScope = {
  prefix: string[];
  variables: Record<string, string>;
  callStack: string[];
};

const resolveNodeId = (id: string, prefix: string[]) => {
  if (id.includes('.')) {
    return id;
  }
  if (prefix.length === 0) {
    return id;
  }
  return [...prefix, id].join('.');
};

const resolveStyle = (
  options: NodeStatement['options'],
  variables: Record<string, string>
): DiagramNodeStyle | undefined => {
  if (!options.icon && !options.color && !options.style && !options.type) {
    return undefined;
  }
  return {
    icon: options.icon ? interpolate(options.icon, variables) : undefined,
    color: options.color ? interpolate(options.color, variables) : undefined,
    styles: options.style,
    shape: options.type === 'database'
      ? 'cylinder'
      : options.type === 'decision'
        ? 'diamond'
        : undefined,
  };
};

const interpolate = (value: string, variables: Record<string, string>) =>
  value.replace(/\$\{([^}]+)\}/g, (_, key) => variables[key.trim()] ?? '');

const deepInterpolate = <T>(value: T, variables: Record<string, string>): T => {
  if (Array.isArray(value)) {
    return value.map(item => deepInterpolate(item, variables)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = deepInterpolate(val, variables);
    }
    return result as unknown as T;
  }
  if (typeof value === 'string') {
    return interpolate(value, variables) as unknown as T;
  }
  return value;
};

const applyPendingAnnotations = (ctx: BuildContext) => {
  for (const [target, pending] of ctx.pending.entries()) {
    const node = ctx.nodes.get(target);
    if (!node) {
      ctx.diagnostics.push({
        severity: 'warning',
        message: `引用未定义节点 ${target}`,
        code: 'FC330',
      });
      continue;
    }
    if (pending.note) {
      node.note = pending.note;
    }
    if (pending.data) {
      node.data = { ...(node.data ?? {}), ...pending.data };
    }
    if (pending.style) {
      node.style = {
        ...(node.style ?? {}),
        styles: [...new Set([...(node.style?.styles ?? []), ...pending.style])],
      };
    }
  }
};

const validateEdges = (ctx: BuildContext) => {
  for (const edge of ctx.edges) {
    if (!ctx.nodes.has(edge.from)) {
      ctx.diagnostics.push({
        severity: 'warning',
        message: `连线起点 ${edge.from} 未定义`,
        code: 'FC331',
      });
    }
    if (!ctx.nodes.has(edge.to)) {
      ctx.diagnostics.push({
        severity: 'warning',
        message: `连线终点 ${edge.to} 未定义`,
        code: 'FC332',
      });
    }
  }
};

const emptyDiagramModel = (): DiagramModel => ({
  id: 'empty',
  title: 'Empty',
  nodes: [],
  edges: [],
  groups: [],
  meta: { source: 'dsl', diagnostics: [] },
});

const now = () =>
  typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
