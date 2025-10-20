import { createSpan } from '../types/source-span';
import type {
  Diagnostic,
  ParseDslOptions,
} from '../types/graph';

const KEYWORDS = new Set([
  'diagram',
  'node',
  'group',
  'component',
  'use',
  'import',
  'layout',
  'theme',
  'style',
  'when',
  'label',
  'type',
  'icon',
  'color',
  'width',
  'height',
  'note',
  'data',
]);

type TokenType =
  | 'braceL'
  | 'braceR'
  | 'parenL'
  | 'parenR'
  | 'comma'
  | 'colon'
  | 'arrow'
  | 'identifier'
  | 'keyword'
  | 'string'
  | 'number'
  | 'color'
  | 'newline'
  | 'eof';

interface Token {
  type: TokenType;
  value?: string;
  numeric?: number;
  line: number;
  column: number;
}

export interface DslDocument {
  imports: ImportDeclaration[];
  components: ComponentDeclaration[];
  diagrams: DiagramDeclaration[];
  diagnostics: Diagnostic[];
}

export interface ImportDeclaration {
  loc: ReturnType<typeof createSpan>;
  path: string;
}

export interface ComponentDeclaration {
  loc: ReturnType<typeof createSpan>;
  name: string;
  params: string[];
  body: Statement[];
}

export interface DiagramDeclaration {
  loc: ReturnType<typeof createSpan>;
  title: string;
  id: string;
  body: Statement[];
}

export type Statement =
  | NodeStatement
  | GroupStatement
  | EdgeStatement
  | UseStatement
  | LayoutStatement
  | ThemeStatement
  | NoteStatement
  | StyleStatement
  | DataStatement;

export interface BaseStatement {
  loc: ReturnType<typeof createSpan>;
}

export interface NodeStatement extends BaseStatement {
  kind: 'node';
  id: string;
  options: NodeOptions;
}

export interface NodeOptions {
  label?: string;
  type?: string;
  icon?: string;
  color?: string;
  style?: string[];
  width?: number;
  height?: number;
  note?: string;
  data?: Record<string, unknown>;
}

export interface GroupStatement extends BaseStatement {
  kind: 'group';
  id: string;
  label?: string;
  style?: string[];
  body: Statement[];
}

export interface EdgeStatement extends BaseStatement {
  kind: 'edge';
  from: string;
  to: string;
  arrow: '->' | '=>' | '~>';
  label?: string;
  condition?: string;
  style?: string[];
  note?: string;
}

export interface UseStatement extends BaseStatement {
  kind: 'use';
  name: string;
  args: string[];
}

export interface LayoutStatement extends BaseStatement {
  kind: 'layout';
  mode: 'horizontal' | 'vertical' | 'grid' | 'swimlane';
  values: string[];
}

export interface ThemeStatement extends BaseStatement {
  kind: 'theme';
  theme: string;
}

export interface NoteStatement extends BaseStatement {
  kind: 'note';
  target: string;
  text: string;
}

export interface StyleStatement extends BaseStatement {
  kind: 'style';
  target: string;
  styles: string[];
}

export interface DataStatement extends BaseStatement {
  kind: 'data';
  target: string;
  payload: Record<string, unknown>;
}

export interface DslParseResult {
  document: DslDocument;
  durationMs: number;
}

const now = () =>
  typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();

export const parseDsl = (options: ParseDslOptions): DslParseResult => {
  const start = now();
  const lexer = new Lexer(options.source);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens);
  const document = parser.parseDocument();
  document.diagnostics.push(...lexer.diagnostics);
  return {
    document,
    durationMs: now() - start,
  };
};

class Lexer {
  private index = 0;
  private line = 1;
  private column = 1;

  diagnostics: Diagnostic[] = [];

  constructor(private readonly input: string) {}

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (!this.eof()) {
      const ch = this.peek();
      if (ch === ' ' || ch === '\t' || ch === '\r') {
        this.advance();
        continue;
      }
      if (ch === '\n') {
        tokens.push(this.createToken('newline'));
        this.advanceLine();
        continue;
      }
      if (ch === '/' && this.peek(1) === '/') {
        this.skipLineComment();
        continue;
      }
      if (ch === '/' && this.peek(1) === '*') {
        this.skipBlockComment();
        continue;
      }
      if (ch === '{') {
        tokens.push(this.createToken('braceL', '{'));
        this.advance();
        continue;
      }
      if (ch === '}') {
        tokens.push(this.createToken('braceR', '}'));
        this.advance();
        continue;
      }
      if (ch === '(') {
        tokens.push(this.createToken('parenL', '('));
        this.advance();
        continue;
      }
      if (ch === ')') {
        tokens.push(this.createToken('parenR', ')'));
        this.advance();
        continue;
      }
      if (ch === ',') {
        tokens.push(this.createToken('comma', ','));
        this.advance();
        continue;
      }
      if (ch === ':') {
        tokens.push(this.createToken('colon', ':'));
        this.advance();
        continue;
      }
      if (ch === '-' && this.peek(1) === '>') {
        tokens.push(this.createToken('arrow', '->'));
        this.advance(2);
        continue;
      }
      if (ch === '=' && this.peek(1) === '>') {
        tokens.push(this.createToken('arrow', '=>'));
        this.advance(2);
        continue;
      }
      if (ch === '~' && this.peek(1) === '>') {
        tokens.push(this.createToken('arrow', '~>'));
        this.advance(2);
        continue;
      }
      if (ch === '#') {
        tokens.push(this.readColor());
        continue;
      }
      if (ch === '"') {
        tokens.push(this.readString());
        continue;
      }
      if (this.isDigit(ch)) {
        tokens.push(this.readNumber());
        continue;
      }
      if (this.isIdentifierStart(ch)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      this.diagnostics.push({
        severity: 'error',
        message: `无法识别的字符: ${ch}`,
        code: 'FC120',
        location: createSpan(this.line, this.column, this.line, this.column + 1),
      });
      this.advance();
    }
    tokens.push(this.createToken('eof'));
    return tokens;
  }

  private eof() {
    return this.index >= this.input.length;
  }

  private peek(offset = 0) {
    return this.input[this.index + offset];
  }

  private advance(count = 1) {
    this.index += count;
    this.column += count;
  }

  private advanceLine() {
    this.index += 1;
    this.line += 1;
    this.column = 1;
  }

  private createToken(type: TokenType, value?: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }

  private skipLineComment() {
    while (!this.eof() && this.peek() !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment() {
    this.advance(2); // /*
    while (!this.eof()) {
      if (this.peek() === '*' && this.peek(1) === '/') {
        this.advance(2);
        break;
      }
      if (this.peek() === '\n') {
        this.advanceLine();
      } else {
        this.advance();
      }
    }
  }

  private readString(): Token {
    const startColumn = this.column;
    this.advance(); // opening quote
    let result = '';
    while (!this.eof()) {
      const ch = this.peek();
      if (ch === '"') {
        this.advance();
        break;
      }
      if (ch === '\\') {
        const next = this.peek(1);
        switch (next) {
          case 'n':
            result += '\n';
            break;
          case '"':
            result += '"';
            break;
          case '\\':
            result += '\\';
            break;
          default:
            result += next;
            break;
        }
        this.advance(2);
        continue;
      }
      result += ch;
      this.advance();
    }
    return {
      type: 'string',
      value: result,
      line: this.line,
      column: startColumn,
    };
  }

  private readNumber(): Token {
    const startColumn = this.column;
    let chars = '';
    while (!this.eof() && this.isDigit(this.peek())) {
      chars += this.peek();
      this.advance();
    }
    return {
      type: 'number',
      value: chars,
      numeric: Number(chars),
      line: this.line,
      column: startColumn,
    };
  }

  private readColor(): Token {
    const startColumn = this.column;
    let chars = '#';
    this.advance();
    while (!this.eof() && /[0-9A-Fa-f]/.test(this.peek())) {
      chars += this.peek();
      this.advance();
    }
    return {
      type: 'color',
      value: chars,
      line: this.line,
      column: startColumn,
    };
  }

  private readIdentifier(): Token {
    const startColumn = this.column;
    let value = '';
    while (!this.eof()) {
      const ch = this.peek();
      if (this.isIdentifierPart(ch)) {
        value += ch;
        this.advance();
        continue;
      }
      if (ch === '$' && this.peek(1) === '{') {
        const template = this.readTemplateExpression();
        value += template;
        continue;
      }
      break;
    }

    const lower = value.toLowerCase();
    if (KEYWORDS.has(lower as unknown as string)) {
      return {
        type: 'keyword',
        value: lower,
        line: this.line,
        column: startColumn,
      };
    }
    return {
      type: 'identifier',
      value,
      line: this.line,
      column: startColumn,
    };
  }

  private readTemplateExpression() {
    let content = '';
    this.advance(2); // ${
    while (!this.eof()) {
      const ch = this.peek();
      if (ch === '}') {
        this.advance();
        break;
      }
      content += ch;
      this.advance();
    }
    return `\${${content}}`;
  }

  private isIdentifierStart(ch: string) {
    return /[A-Za-z_@$]/.test(ch);
  }

  private isIdentifierPart(ch: string) {
    return /[A-Za-z0-9_.\-]/.test(ch);
  }

  private isDigit(ch: string) {
    return /[0-9]/.test(ch);
  }
}

class Parser {
  private index = 0;
  diagnostics: Diagnostic[] = [];

  constructor(private readonly tokens: Token[]) {}

  parseDocument(): DslDocument {
    const imports: ImportDeclaration[] = [];
    const components: ComponentDeclaration[] = [];
    const diagrams: DiagramDeclaration[] = [];

    while (!this.match('eof')) {
      this.skipNewlines();
      if (this.match('keyword', 'import')) {
        imports.push(this.parseImport());
        continue;
      }
      if (this.match('keyword', 'component')) {
        components.push(this.parseComponent());
        continue;
      }
      if (this.match('keyword', 'diagram')) {
        diagrams.push(this.parseDiagram());
        continue;
      }
      if (this.match('eof')) {
        break;
      }
      this.error('无法解析的语句');
      this.advance();
    }

    return {
      imports,
      components,
      diagrams,
      diagnostics: this.diagnostics,
    };
  }

  private parseImport(): ImportDeclaration {
    const keyword = this.consume('keyword', 'import');
    const pathToken = this.consume('string');
    return {
      path: pathToken.value ?? '',
      loc: createSpan(
        keyword.line,
        keyword.column,
        pathToken.line,
        pathToken.column + (pathToken.value?.length ?? 0)
      ),
    };
  }

  private parseComponent(): ComponentDeclaration {
    const keyword = this.consume('keyword', 'component');
    const nameTok = this.consumeIdentifier('组件名称缺失');
    const params: string[] = [];
    if (this.match('parenL')) {
      this.consume('parenL');
      if (!this.match('parenR')) {
        do {
          const param = this.consumeIdentifier('缺少参数名称');
          params.push(param.value ?? '');
        } while (this.tryConsume('comma'));
      }
      this.consume('parenR');
    }
    const body = this.parseBlockStatements();
    return {
      name: nameTok.value ?? '',
      params,
      body,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseDiagram(): DiagramDeclaration {
    const keyword = this.consume('keyword', 'diagram');
    const titleToken = this.consume('string');
    const id = slugify(titleToken.value ?? 'diagram');
    const body = this.parseBlockStatements();
    return {
      title: titleToken.value ?? 'Diagram',
      id,
      body,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseBlockStatements(): Statement[] {
    this.consume('braceL');
    const statements: Statement[] = [];
    while (!this.match('braceR') && !this.match('eof')) {
      this.skipNewlines();
      if (this.match('braceR')) {
        break;
      }
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        this.advance();
      }
      this.skipNewlines();
    }
    this.consume('braceR');
    return statements;
  }

  private parseStatement(): Statement | null {
    if (this.match('keyword', 'node')) {
      return this.parseNode();
    }
    if (this.match('keyword', 'group')) {
      return this.parseGroup();
    }
    if (this.match('identifier') || this.match('keyword')) {
      const look = this.peek();
      const lookAhead = this.peek(1);
      if (lookAhead?.type === 'arrow') {
        return this.parseEdge();
      }
    }
    if (this.match('keyword', 'use')) {
      return this.parseUse();
    }
    if (this.match('keyword', 'layout')) {
      return this.parseLayout();
    }
    if (this.match('keyword', 'theme')) {
      return this.parseTheme();
    }
    if (this.match('keyword', 'note')) {
      return this.parseNote();
    }
    if (this.match('keyword', 'style')) {
      return this.parseStyle();
    }
    if (this.match('keyword', 'data')) {
      return this.parseData();
    }
    this.error('未知的语句');
    return null;
  }

  private parseNode(): NodeStatement {
    const keyword = this.consume('keyword', 'node');
    const idToken = this.consumeIdentifier('缺少节点 ID');
    const options: NodeOptions = {};
    while (true) {
      this.skipNewlines();
      if (this.match('braceR') || this.match('newline') || this.peek()?.type === 'identifier' && this.peek(1)?.type === 'arrow') {
        break;
      }
      if (this.match('keyword', 'label')) {
        this.consume('keyword', 'label');
        options.label = this.consume('string').value ?? '';
        continue;
      }
      if (this.match('keyword', 'type')) {
        this.consume('keyword', 'type');
        options.type = this.consumeIdentifier('缺少类型').value ?? '';
        continue;
      }
      if (this.match('keyword', 'icon')) {
        this.consume('keyword', 'icon');
        options.icon = this.consumeIdentifier('缺少图标').value ?? '';
        continue;
      }
      if (this.match('keyword', 'color')) {
        this.consume('keyword', 'color');
        const token = this.consumeOneOf(['color', 'string']);
        options.color = token.value ?? '';
        continue;
      }
      if (this.match('keyword', 'style')) {
        this.consume('keyword', 'style');
        options.style = this.parseStyleList();
        continue;
      }
      if (this.match('keyword', 'width')) {
        this.consume('keyword', 'width');
        options.width = this.consume('number').numeric;
        continue;
      }
      if (this.match('keyword', 'height')) {
        this.consume('keyword', 'height');
        options.height = this.consume('number').numeric;
        continue;
      }
      if (this.match('keyword', 'note')) {
        this.consume('keyword', 'note');
        options.note = this.consume('string').value ?? '';
        continue;
      }
      if (this.match('keyword', 'data')) {
        this.consume('keyword', 'data');
        options.data = this.parseJsonBlock();
        continue;
      }
      break;
    }
    this.skipOptionalNewline();
    return {
      kind: 'node',
      id: idToken.value ?? '',
      options,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseGroup(): GroupStatement {
    const keyword = this.consume('keyword', 'group');
    const idToken = this.consumeIdentifier('缺少分组 ID');
    let label: string | undefined;
    let style: string[] | undefined;
    while (true) {
      this.skipNewlines();
      if (this.match('braceL')) {
        break;
      }
      if (this.match('keyword', 'label')) {
        this.consume('keyword', 'label');
        label = this.consume('string').value ?? '';
        continue;
      }
      if (this.match('keyword', 'style')) {
        this.consume('keyword', 'style');
        style = this.parseStyleList();
        continue;
      }
      break;
    }
    const body = this.parseBlockStatements();
    return {
      kind: 'group',
      id: idToken.value ?? '',
      label,
      style,
      body,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseEdge(): EdgeStatement {
    const from = this.consumeIdentifier('缺少起始节点');
    const arrow = this.consume('arrow');
    const to = this.consumeIdentifier('缺少目标节点');
    let label: string | undefined;
    let condition: string | undefined;
    let style: string[] | undefined;
    let note: string | undefined;
    while (true) {
      this.skipNewlines();
      if (this.match('newline') || this.match('braceR')) {
        break;
      }
      if (this.match('colon')) {
        this.consume('colon');
        label = this.consume('string').value ?? '';
        continue;
      }
      if (this.match('keyword', 'when')) {
        this.consume('keyword', 'when');
        condition = this.consumeExpression();
        continue;
      }
      if (this.match('keyword', 'style')) {
        this.consume('keyword', 'style');
        style = this.parseStyleList();
        continue;
      }
      if (this.match('keyword', 'note')) {
        this.consume('keyword', 'note');
        note = this.consume('string').value ?? '';
        continue;
      }
      break;
    }
    this.skipOptionalNewline();
    return {
      kind: 'edge',
      from: from.value ?? '',
      to: to.value ?? '',
      arrow: (arrow.value as EdgeStatement['arrow']) ?? '->',
      label,
      condition,
      style,
      note,
      loc: createSpan(from.line, from.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseUse(): UseStatement {
    const keyword = this.consume('keyword', 'use');
    const name = this.consumeIdentifier('缺少组件名称');
    const args: string[] = [];
    if (this.match('parenL')) {
      this.consume('parenL');
      if (!this.match('parenR')) {
        do {
          args.push(this.consumeExpression());
        } while (this.tryConsume('comma'));
      }
      this.consume('parenR');
    }
    this.skipOptionalNewline();
    return {
      kind: 'use',
      name: name.value ?? '',
      args,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseLayout(): LayoutStatement {
    const keyword = this.consume('keyword', 'layout');
    const modeToken = this.consumeIdentifier('缺少布局模式');
    const mode = normalizeLayoutMode(modeToken.value ?? 'horizontal');
    const values: string[] = [];
    while (!this.match('newline') && !this.match('braceR') && !this.match('eof')) {
      values.push(this.consumeExpression());
      if (!this.tryConsume('comma')) {
        break;
      }
    }
    this.skipOptionalNewline();
    return {
      kind: 'layout',
      mode,
      values,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseTheme(): ThemeStatement {
    const keyword = this.consume('keyword', 'theme');
    const token = this.consumeIdentifier('缺少主题名称');
    this.skipOptionalNewline();
    return {
      kind: 'theme',
      theme: token.value ?? '',
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseNote(): NoteStatement {
    const keyword = this.consume('keyword', 'note');
    const target = this.consumeIdentifier('缺少目标节点');
    const text = this.consume('string');
    this.skipOptionalNewline();
    return {
      kind: 'note',
      target: target.value ?? '',
      text: text.value ?? '',
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseStyle(): StyleStatement {
    const keyword = this.consume('keyword', 'style');
    const target = this.consumeIdentifier('缺少目标 ID');
    const styles = this.parseStyleList();
    this.skipOptionalNewline();
    return {
      kind: 'style',
      target: target.value ?? '',
      styles,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseData(): DataStatement {
    const keyword = this.consume('keyword', 'data');
    const target = this.consumeIdentifier('缺少目标 ID');
    const payload = this.parseJsonBlock();
    this.skipOptionalNewline();
    return {
      kind: 'data',
      target: target.value ?? '',
      payload,
      loc: createSpan(keyword.line, keyword.column, this.lastLine(), this.lastColumn()),
    };
  }

  private parseStyleList(): string[] {
    const values: string[] = [];
    do {
      const token = this.consumeIdentifier('缺少样式值');
      values.push(token.value ?? '');
    } while (this.tryConsume('comma'));
    return values;
  }

  private parseJsonBlock(): Record<string, unknown> {
    this.consume('braceL');
    let depth = 1;
    let content = '{';
    while (!this.match('eof') && depth > 0) {
      const token = this.peek();
      if (!token) {
        break;
      }
      if (token.type === 'braceL') {
        depth += 1;
      }
      if (token.type === 'braceR') {
        depth -= 1;
      }
      content += this.consumeRaw();
    }
    try {
      return JSON.parse(content);
    } catch (error) {
      this.error('无法解析 data JSON');
      return {};
    }
  }

  private consumeRaw(): string {
    const token = this.tokens[this.index];
    const value = token?.value ?? '';
    this.index += 1;
    return token.type === 'string' ? `"${value}"` : value;
  }

  private consumeExpression(): string {
    const token = this.peek();
    if (!token) {
      return '';
    }
    if (token.type === 'string') {
      this.index += 1;
      return token.value ?? '';
    }
    if (token.type === 'number') {
      this.index += 1;
      return token.value ?? '';
    }
    const identifier = this.consumeIdentifier('需要表达式');
    return identifier.value ?? '';
  }

  private consumeIdentifier(message: string) {
    if (this.match('identifier')) {
      return this.consume('identifier');
    }
    if (this.match('keyword')) {
      return this.consume('keyword');
    }
    this.error(message);
    return this.consume('identifier');
  }

  private consume(type: TokenType, value?: string): Token {
    const token = this.tokens[this.index];
    if (!token) {
      this.error(`期待 ${type} 但已到结尾`);
      return {
        type,
        value,
        line: this.lastLine(),
        column: this.lastColumn(),
      } as Token;
    }
    if (token.type !== type || (value && token.value !== value)) {
      this.error(`期待 ${value ?? type}，却得到 ${token.value ?? token.type}`);
    }
    this.index += 1;
    return token;
  }

  private consumeOneOf(types: TokenType[]): Token {
    const token = this.tokens[this.index];
    if (!token) {
      this.error(`期待 ${types.join(', ')} 却到结尾`);
      return {
        type: types[0],
        line: this.lastLine(),
        column: this.lastColumn(),
      } as Token;
    }
    if (!types.includes(token.type)) {
      this.error(`期待 ${types.join(', ')} 却得到 ${token.type}`);
    }
    this.index += 1;
    return token;
  }

  private tryConsume(type: TokenType, value?: string) {
    const token = this.tokens[this.index];
    if (!token) {
      return false;
    }
    if (token.type === type && (!value || token.value === value)) {
      this.index += 1;
      return true;
    }
    return false;
  }

  private skipNewlines() {
    while (this.match('newline')) {
      this.index += 1;
    }
  }

  private skipOptionalNewline() {
    if (this.match('newline')) {
      this.index += 1;
    }
  }

  private match(type: TokenType, value?: string) {
    const token = this.tokens[this.index];
    if (!token) {
      return false;
    }
    return token.type === type && (!value || token.value === value);
  }

  private peek(offset = 0) {
    return this.tokens[this.index + offset];
  }

  private lastLine() {
    const lastToken = this.tokens[Math.min(this.index, this.tokens.length - 1)];
    return lastToken?.line ?? 1;
  }

  private lastColumn() {
    const lastToken = this.tokens[Math.min(this.index, this.tokens.length - 1)];
    return lastToken?.column ?? 1;
  }

  private error(message: string) {
    const token = this.tokens[this.index];
    this.diagnostics.push({
      severity: 'error',
      message,
      code: 'FC130',
      location: token
        ? createSpan(token.line, token.column, token.line, token.column + 1)
        : undefined,
    });
  }

  private advance() {
    this.index += 1;
  }
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'diagram';

const normalizeLayoutMode = (
  value: string
): LayoutStatement['mode'] => {
  switch (value) {
    case 'vertical':
      return 'vertical';
    case 'grid':
      return 'grid';
    case 'swimlane':
      return 'swimlane';
    default:
      return 'horizontal';
  }
};
