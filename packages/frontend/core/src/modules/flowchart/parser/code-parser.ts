import { parse } from '@babel/parser';
import type { File } from '@babel/types';

import type {
  Diagnostic,
  ParseCodeOptions,
} from '../types/graph';
import { createSpan } from '../types/source-span';

export interface CodeParseResult {
  ast: File | null;
  diagnostics: Diagnostic[];
  durationMs: number;
}

const DEFAULT_PLUGINS: (ParseCodeOptions['features'][number] | 'typescript')[] = [
  'typescript',
  'asyncGenerators',
  'classProperties',
  'topLevelAwait',
];

const now = () =>
  typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();

export const parseCode = (options: ParseCodeOptions): CodeParseResult => {
  const start = now();
  try {
    const ast = parse(options.source, {
      sourceType: 'module',
      plugins: buildPlugins(options),
      allowAwaitOutsideFunction: true,
      allowImportExportEverywhere: true,
    });

    return {
      ast,
      diagnostics: [],
      durationMs: now() - start,
    };
  } catch (error) {
    const diagnostic: Diagnostic = {
      severity: 'error',
      message: error instanceof Error ? error.message : String(error),
      code: 'FC100',
      location: extractLocation(error),
    };
    return {
      ast: null,
      diagnostics: [diagnostic],
      durationMs: now() - start,
    };
  }
};

const buildPlugins = (options: ParseCodeOptions) => {
  const base = [...DEFAULT_PLUGINS];
  if (options.enableJSX) {
    base.push('jsx');
  }
  if (options.features) {
    base.push(...options.features);
  }
  return base;
};

const extractLocation = (error: unknown) => {
  if (
    error &&
    typeof error === 'object' &&
    'loc' in error &&
    error.loc &&
    typeof error.loc === 'object' &&
    'line' in error.loc &&
    'column' in error.loc
  ) {
    const { line, column } = error.loc as { line: number; column: number };
    return createSpan(line, column, line, column + 1);
  }
  return undefined;
};
