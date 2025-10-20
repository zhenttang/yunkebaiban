export { FlowchartService } from './services/flowchart';
export type {
  BuildDiagramOptions,
  DiagramResult,
  FlowGraphResult,
  ParseCodeOptions,
  ParseDslOptions,
} from './types/graph';

import type { Framework } from '@toeverything/infra';

import { FlowchartService } from './services/flowchart';

export const configureFlowchartModule = (framework: Framework) => {
  framework.service(FlowchartService);
};

