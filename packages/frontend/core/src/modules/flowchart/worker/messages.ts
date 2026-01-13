import type {
  BuildDiagramOptions,
  DiagramResult,
  FlowGraphResult,
  ParseCodeOptions,
  ParseDslOptions,
} from '../types/graph';

export type WorkerRequest =
  | {
      type: 'parse-code';
      id: string;
      payload: ParseCodeOptions;
    }
  | {
      type: 'parse-dsl';
      id: string;
      payload: ParseDslOptions;
    }
  | {
      type: 'build-diagram';
      id: string;
      payload: BuildDiagramOptions & { scope?: string };
    };

export type WorkerResponse =
  | {
      type: 'success';
      id: string;
      payload: FlowGraphResult | DiagramResult;
    }
  | {
      type: 'error';
      id: string;
      payload: WorkerError;
    };

export interface WorkerError {
  kind: 'ParserError' | 'TransformError' | 'LayoutError' | 'InternalError';
  message: string;
  diagnostics?: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    code?: string;
  }>;
}

