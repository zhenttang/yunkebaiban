export interface SourcePosition {
  line: number;
  column: number;
}

export interface SourceMapSpan {
  fileName?: string;
  start: SourcePosition;
  end: SourcePosition;
}

export const createSpan = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number,
  fileName?: string
): SourceMapSpan => ({
  fileName,
  start: { line: startLine, column: startColumn },
  end: { line: endLine, column: endColumn },
});

