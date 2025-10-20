/// <reference lib="webworker" />

import { transformCodeToGraph } from '../transform/code-to-graph';
import { transformDslToDiagram } from '../transform/dsl-to-diagram';
import type {
  BuildDiagramOptions,
  DiagramResult,
  FlowGraphResult,
} from '../types/graph';
import type { WorkerRequest, WorkerResponse } from './messages';

const ctx: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = event => {
  const message = event.data as WorkerRequest;
  void handleMessage(message);
};

const handleMessage = async (message: WorkerRequest) => {
  try {
    switch (message.type) {
      case 'parse-code': {
        const result = transformCodeToGraph(message.payload);
        postSuccess(message.id, result);
        break;
      }
      case 'parse-dsl': {
        const result = transformDslToDiagram(message.payload);
        postSuccess(message.id, result);
        break;
      }
      case 'build-diagram': {
        const result =
          message.payload.sourceType === 'code'
            ? buildDiagramFromCode(message.payload)
            : transformDslToDiagram(message.payload);
        postSuccess(message.id, result);
        break;
      }
      default:
        throw new Error(`未知的消息类型: ${(message as WorkerRequest).type}`);
    }
  } catch (error) {
    postError(message.id, error);
  }
};

const buildDiagramFromCode = (
  options: BuildDiagramOptions & { sourceType: 'code' }
) => {
  const graphResult = transformCodeToGraph({
    source: options.source,
    language: options.language ?? 'ts',
  });
  return graphToDiagram(graphResult);
};

const graphToDiagram = (result: FlowGraphResult): DiagramResult => {
  const { graph } = result;
  return {
    model: {
      id: 'code-flow',
      title: 'Code Flow',
      nodes: graph.nodes.map(node => ({
        id: node.id,
        label: node.label,
        note: undefined,
        type: node.kind,
        data: undefined,
        style: undefined,
        source: node.source,
      })),
      edges: graph.edges.map(edge => ({
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.label,
        condition: undefined,
        style: edge.kind !== 'normal' ? [edge.kind] : undefined,
      })),
      groups: [],
      meta: {
        source: 'code',
        diagnostics: result.diagnostics,
      },
    },
    diagnostics: result.diagnostics,
    perf: result.perf,
  };
};

const postSuccess = (id: string, payload: unknown) => {
  const message: WorkerResponse = {
    type: 'success',
    id,
    payload: payload as WorkerResponse['payload'],
  };
  postMessage(message);
};

const postError = (id: string, error: unknown) => {
  const message: WorkerResponse = {
    type: 'error',
    id,
    payload: {
      kind: 'InternalError',
      message: error instanceof Error ? error.message : String(error),
    },
  };
  postMessage(message);
};

export {}; // ensure module scope
