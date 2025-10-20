import { Service } from '@toeverything/infra';

import { transformCodeToGraph } from '../transform/code-to-graph';
import { transformDslToDiagram } from '../transform/dsl-to-diagram';
import type {
  BuildDiagramOptions,
  DiagramResult,
  FlowGraphResult,
  ParseCodeOptions,
  ParseDslOptions,
} from '../types/graph';
import type { WorkerRequest, WorkerResponse } from '../worker/messages';

export class FlowchartService extends Service {
  private worker: Worker | null = null;
  private readonly pending = new Map<
    string,
    {
      resolve: (value: FlowGraphResult | DiagramResult) => void;
      reject: (reason?: unknown) => void;
    }
  >();
  private requestCounter = 0;

  parseCode(options: ParseCodeOptions): Promise<FlowGraphResult> {
    return this.runWithWorker('parse-code', options) as Promise<FlowGraphResult>;
  }

  parseDSL(options: ParseDslOptions): Promise<DiagramResult> {
    return this.runWithWorker('parse-dsl', options) as Promise<DiagramResult>;
  }

  buildDiagram(options: BuildDiagramOptions): Promise<DiagramResult> {
    if (options.sourceType === 'code') {
      const payload: ParseCodeOptions = {
        source: options.source,
        language: options.language ?? 'ts',
      };
      return this.parseCode(payload).then(result =>
        this.convertGraphToDiagram(result)
      );
    }
    return this.runWithWorker('build-diagram', options) as Promise<DiagramResult>;
  }

  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }

  private runWithWorker(
    type: WorkerRequest['type'],
    payload: WorkerRequest['payload']
  ): Promise<FlowGraphResult | DiagramResult> {
    const worker = this.ensureWorker();
    if (!worker) {
      return Promise.resolve(this.runFallback(type, payload));
    }

    const id = `req-${++this.requestCounter}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, {
        resolve,
        reject,
      });
      const message: WorkerRequest = {
        type,
        id,
        payload: payload as WorkerRequest['payload'],
      } as WorkerRequest;
      worker.postMessage(message);
    });
  }

  private runFallback(
    type: WorkerRequest['type'],
    payload: WorkerRequest['payload']
  ): FlowGraphResult | DiagramResult {
    switch (type) {
      case 'parse-code':
        return transformCodeToGraph(payload as ParseCodeOptions);
      case 'parse-dsl':
        return transformDslToDiagram(payload as ParseDslOptions);
      case 'build-diagram':
        return transformDslToDiagram(payload as ParseDslOptions & {
          scope?: string;
          config?: BuildDiagramOptions['config'];
        });
      default:
        throw new Error(`Unsupported request type: ${type}`);
    }
  }

  private ensureWorker() {
    if (typeof Worker === 'undefined') {
      return null;
    }
    if (this.worker) {
      return this.worker;
    }
    try {
      this.worker = new Worker(
        new URL('../worker/flowchart.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.worker.addEventListener('message', event => {
        const message = event.data as WorkerResponse;
        const pending = this.pending.get(message.id);
        if (!pending) {
          return;
        }
        this.pending.delete(message.id);
        if (message.type === 'success') {
          pending.resolve(message.payload as FlowGraphResult | DiagramResult);
        } else {
          pending.reject(message.payload);
        }
      });
      this.worker.addEventListener('error', event => {
        this.pending.forEach(pending => pending.reject(event));
        this.pending.clear();
      });
    } catch (error) {
      console.warn('[FlowchartService] Worker 初始化失败，使用回退实现', error);
      this.worker = null;
    }
    return this.worker;
  }

  private convertGraphToDiagram(result: FlowGraphResult): DiagramResult {
    return {
      model: {
        id: 'code-flow',
        title: 'Code Flow',
        nodes: result.graph.nodes.map(node => ({
          id: node.id,
          label: node.label,
          type: node.kind,
          note: undefined,
          data: undefined,
          style: undefined,
          source: node.source,
        })),
        edges: result.graph.edges.map(edge => ({
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
  }
}
