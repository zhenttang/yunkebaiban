import type {
  BlockStatement,
  File,
  ForStatement,
  Statement,
  WhileStatement,
} from '@babel/types';

import type {
  Diagnostic,
  FlowEdge,
  FlowGraph,
  FlowGraphResult,
  FlowNode,
  ParseCodeOptions,
} from '../types/graph';
import { createSpan } from '../types/source-span';
import { parseCode } from '../parser/code-parser';

interface FlowSegment {
  entry: string | null;
  exits: string[];
}

export const transformCodeToGraph = (
  options: ParseCodeOptions
): FlowGraphResult => {
  const parseResult = parseCode(options);
  if (!parseResult.ast || parseResult.diagnostics.length > 0) {
    return {
      graph: emptyGraph(),
      diagnostics: parseResult.diagnostics,
      perf: {
        parseMs: parseResult.durationMs,
        transformMs: 0,
      },
    };
  }

  const builder = new FlowBuilder(parseResult.ast);
  const graph = builder.build();
  return {
    graph,
    diagnostics: [...parseResult.diagnostics, ...builder.diagnostics],
    perf: {
      parseMs: parseResult.durationMs,
      transformMs: builder.durationMs,
    },
  };
};

class FlowBuilder {
  nodes: FlowNode[] = [];
  edges: FlowEdge[] = [];
  diagnostics: Diagnostic[] = [];
  durationMs = 0;

  private idCounter = 0;
  private edgeCounter = 0;

  constructor(private readonly ast: File) {}

  build(): FlowGraph {
    const startTime = now();
    const start = this.addNode('start', 'Start');
    let exits: string[] = [start.id];

    const targetBlock = this.selectPrimaryBlock();
    if (targetBlock) {
      const segment = this.processStatements(targetBlock.body, exits);
      exits = segment.exits;
    } else {
      this.diagnostics.push({
        severity: 'warning',
        message: '未找到可用的代码块，输出空图',
        code: 'FC201',
      });
      exits = [start.id];
    }

    const end = this.addNode('end', 'End');
    exits.forEach(exitId => {
      if (exitId !== end.id) {
        this.addEdge(exitId, end.id, 'normal');
      }
    });

    this.durationMs = now() - startTime;
    return {
      nodes: this.nodes,
      edges: this.edges,
      meta: {
        source: 'code',
        diagnostics: this.diagnostics,
        entryNodeId: start.id,
      },
    };
  }

  private selectPrimaryBlock(): BlockStatement | null {
    for (const statement of this.ast.program.body) {
      if (statement.type === 'FunctionDeclaration' && statement.body) {
        return statement.body;
      }
      if (statement.type === 'ExportNamedDeclaration' && statement.declaration) {
        const decl = statement.declaration;
        if (decl.type === 'FunctionDeclaration' && decl.body) {
          return decl.body;
        }
      }
    }

    const fallback = this.ast.program.body.filter(
      node => node.type !== 'ImportDeclaration'
    );
    if (fallback.length === 0) {
      return null;
    }
    return {
      type: 'BlockStatement',
      body: fallback as Statement[],
      directives: [],
    } as BlockStatement;
  }

  private processStatements(statements: Statement[], incoming: string[]): FlowSegment {
    let currentExits = incoming;
    let entry: string | null = null;

    for (const statement of statements) {
      const segment = this.processStatement(statement, currentExits);
      if (!entry) {
        entry = segment.entry;
      }
      currentExits = segment.exits;
      if (currentExits.length === 0) {
        break;
      }
    }

    return { entry, exits: currentExits };
  }

  private processStatement(statement: Statement, incoming: string[]): FlowSegment {
    switch (statement.type) {
      case 'BlockStatement':
        return this.processStatements(statement.body, incoming);
      case 'IfStatement':
        return this.processIf(statement, incoming);
      case 'ForStatement':
      case 'WhileStatement':
      case 'DoWhileStatement':
        return this.processLoop(statement, incoming);
      case 'TryStatement':
        return this.processTry(statement, incoming);
      case 'ReturnStatement':
        return this.createLinearNode(
          'end',
          'return',
          statement.argument ? `return ${getExpressionPreview(statement.argument.type)}` : 'return',
          statement.loc,
          incoming,
          { terminate: true }
        );
      case 'ThrowStatement':
        return this.createLinearNode(
          'throw',
          'throw',
          'throw',
          statement.loc,
          incoming,
          { terminate: true }
        );
      default:
        return this.createLinearNode(
          'statement',
          'statement',
          getStatementLabel(statement),
          statement.loc,
          incoming
        );
    }
  }

  private processIf(statement: Statement & { type: 'IfStatement' }, incoming: string[]): FlowSegment {
    const conditionNode = this.addNode('condition', getConditionLabel(statement.test), statement.loc);
    incoming.forEach(id => this.addEdge(id, conditionNode.id, 'normal'));

    const consequent = this.processStatements(
      statement.consequent.type === 'BlockStatement'
        ? statement.consequent.body
        : [statement.consequent],
      [conditionNode.id]
    );
    consequent.entry && this.addEdge(conditionNode.id, consequent.entry, 'true', 'true');

    let alternateExits: string[] = [conditionNode.id];
    let alternateEntry: string | null = null;
    if (statement.alternate) {
      const alternate = this.processStatements(
        statement.alternate.type === 'BlockStatement'
          ? statement.alternate.body
          : [statement.alternate],
        [conditionNode.id]
      );
      alternate.entry && this.addEdge(conditionNode.id, alternate.entry, 'false', 'false');
      alternateExits = alternate.exits;
      alternateEntry = alternate.entry;
    }

    const exits = [...consequent.exits];
    if (statement.alternate) {
      exits.push(...alternateExits);
    } else {
      exits.push(conditionNode.id);
    }

    const joinNode = this.addNode('statement', 'Join');
    exits
      .filter(Boolean)
      .forEach(exit => {
        if (exit !== joinNode.id) {
          this.addEdge(exit, joinNode.id, 'normal');
        }
      });

    return {
      entry: conditionNode.id,
      exits: [joinNode.id],
    };
  }

  private processLoop(
    statement: ForStatement | WhileStatement | Statement & { type: 'DoWhileStatement' },
    incoming: string[]
  ): FlowSegment {
    if (statement.type === 'ForStatement' && statement.init) {
      const initSegment =
        statement.init.type === 'VariableDeclaration'
          ? this.createLinearNode(
              'statement',
              'statement',
              getStatementLabel(statement.init),
              statement.init.loc,
              incoming
            )
          : this.createLinearNode(
              'statement',
              'statement',
              'for init',
              statement.init.loc,
              incoming
            );
      incoming = initSegment.exits.length ? initSegment.exits : incoming;
    }

    const conditionLabel = getLoopLabel(statement);
    const loopNode = this.addNode('loop', conditionLabel, statement.loc);
    incoming.forEach(id => this.addEdge(id, loopNode.id, 'normal'));

    const bodyStatements = statement.body.type === 'BlockStatement'
      ? statement.body.body
      : [statement.body];

    const bodySegment = this.processStatements(bodyStatements, [loopNode.id]);
    bodySegment.entry && this.addEdge(loopNode.id, bodySegment.entry, 'true', 'true');

    let exitsAfterBody = bodySegment.exits;

    if (statement.type === 'ForStatement' && statement.update) {
      const updateSegment = this.createLinearNode(
        'statement',
        'statement',
        'for update',
        statement.update.loc,
        exitsAfterBody
      );
      exitsAfterBody = updateSegment.exits;
    }

    exitsAfterBody.forEach(exitId => this.addEdge(exitId, loopNode.id, 'loop'));

    const afterLoop = this.addNode('statement', 'After loop');
    this.addEdge(loopNode.id, afterLoop.id, 'false', 'false');

    return {
      entry: loopNode.id,
      exits: [afterLoop.id],
    };
  }

  private processTry(statement: Statement & { type: 'TryStatement' }, incoming: string[]): FlowSegment {
    const tryNode = this.addNode('try', 'try', statement.block.loc ?? statement.loc);
    incoming.forEach(id => this.addEdge(id, tryNode.id, 'normal'));

    const tryBody = this.processStatements(statement.block.body, [tryNode.id]);

    const catchExits: string[] = [];
    if (statement.handler) {
      const catchNode = this.addNode(
        'catch',
        statement.handler.param
          ? `catch (${getExpressionPreview(statement.handler.param.type)})`
          : 'catch',
        statement.handler.loc ?? statement.loc
      );
      this.addEdge(tryNode.id, catchNode.id, 'exception', 'exception');
      const catchBody = this.processStatements(statement.handler.body.body, [catchNode.id]);
      catchExits.push(...catchBody.exits);
    }

    let exits = [...tryBody.exits, ...catchExits];

    if (statement.finalizer) {
      const finallyNode = this.addNode('finally', 'finally', statement.finalizer.loc ?? statement.loc);
      exits.forEach(exitId => this.addEdge(exitId, finallyNode.id, 'finally'));
      const finalSegment = this.processStatements(statement.finalizer.body, [finallyNode.id]);
      exits = finalSegment.exits;
    }

    return {
      entry: tryNode.id,
      exits,
    };
  }

  private createLinearNode(
    kind: FlowNode['kind'],
    label: string,
    loc: Statement['loc'] | undefined,
    incoming: string[],
    options?: { terminate?: boolean }
  ): FlowSegment {
    const node = this.addNode(kind, label, loc);
    incoming.forEach(id => this.addEdge(id, node.id, 'normal'));
    const exits = options?.terminate ? [] : [node.id];
    return { entry: node.id, exits };
  }

  private addNode(
    kind: FlowNode['kind'],
    label: string,
    loc?: Statement['loc']
  ): FlowNode {
    const id = `n${++this.idCounter}`;
    const node: FlowNode = {
      id,
      kind,
      label,
      source: loc ? convertLoc(loc) : undefined,
    };
    this.nodes.push(node);
    return node;
  }

  private addEdge(
    from: string,
    to: string,
    kind: FlowEdge['kind'],
    label?: string
  ) {
    const id = `e${++this.edgeCounter}`;
    this.edges.push({ id, from, to, kind, label });
  }
}

const getStatementLabel = (statement: Statement) => {
  switch (statement.type) {
    case 'ExpressionStatement':
      return simplifyExpression(statement.expression.type);
    case 'VariableDeclaration':
      return `let ${statement.declarations
        .map(decl =>
          'name' in decl.id && typeof decl.id.name === 'string'
            ? decl.id.name
            : 'var'
        )
        .join(', ')}`;
    case 'ReturnStatement':
      return 'return';
    case 'ThrowStatement':
      return 'throw';
    case 'BreakStatement':
      return 'break';
    case 'ContinueStatement':
      return 'continue';
    default:
      return statement.type;
  }
};

const simplifyExpression = (type: string) => {
  switch (type) {
    case 'CallExpression':
      return 'call';
    case 'AwaitExpression':
      return 'await';
    case 'AssignmentExpression':
      return 'assign';
    default:
      return type;
  }
};

const getConditionLabel = (test: Statement | { type: string }) => {
  switch (test.type) {
    case 'Identifier':
      return `if ${test.name}`;
    case 'BinaryExpression':
      return 'if condition';
    case 'LogicalExpression':
      return 'if condition';
    default:
      return 'if';
  }
};

const getLoopLabel = (
  statement: ForStatement | WhileStatement | Statement & { type: 'DoWhileStatement' }
) => {
  switch (statement.type) {
    case 'ForStatement':
      return 'for';
    case 'WhileStatement':
      return 'while';
    case 'DoWhileStatement':
      return 'do/while';
    default:
      return 'loop';
  }
};

const getExpressionPreview = (type: string) => {
  switch (type) {
    case 'Identifier':
      return 'identifier';
    case 'CallExpression':
      return 'call';
    default:
      return type;
  }
};

const convertLoc = (loc: { start: { line: number; column: number }; end: { line: number; column: number } }) =>
  createSpan(loc.start.line, loc.start.column, loc.end.line, loc.end.column);

const emptyGraph = (): FlowGraph => ({
  nodes: [],
  edges: [],
  meta: {
    source: 'code',
    diagnostics: [],
    entryNodeId: '',
  },
});

const now = () =>
  typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
