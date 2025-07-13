import debug from 'debug';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const SESSION_KEY = 'affine:debug';

if (typeof window !== 'undefined') {
  // 如果URL搜索字符串包含`debug`，则启用调试日志
  // 例如 http://localhost:3000/?debug
  if (window.location.search.includes('debug')) {
    // 为当前会话启用调试日志
    // 由于浏览器在导航后可能会删除查询字符串，
    // 我们需要将调试标志存储在sessionStorage中
    sessionStorage.setItem(SESSION_KEY, 'true');
  }
  if (sessionStorage.getItem(SESSION_KEY) === 'true') {
    // 默认启用所有调试日志
    debug.enable('*');
    console.warn('调试日志已启用');
  }
  if (BUILD_CONFIG.debug) {
    debug.enable('*,-micromark');
    console.warn('调试日志已启用');
  }
}

export class DebugLogger {
  private readonly _debug: debug.Debugger;

  constructor(namespace: string) {
    this._debug = debug(namespace);
  }

  set enabled(enabled: boolean) {
    this._debug.enabled = enabled;
  }

  get enabled() {
    return this._debug.enabled;
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  log(level: LogLevel, message: string, ...args: any[]) {
    this._debug.log = console[level].bind(console);
    this._debug(`[${level.toUpperCase()}] ${message}`, ...args);
  }

  namespace(extra: string) {
    const currentNamespace = this._debug.namespace;
    return new DebugLogger(`${currentNamespace}:${extra}`);
  }
}
