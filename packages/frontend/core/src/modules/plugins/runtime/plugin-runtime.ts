import { notify } from '@yunke/component';
import { encodeStateAsUpdate } from 'yjs';

import type { PluginPermission, PluginRecord } from '../types';

type WorkerCallMessage = {
  type: 'call';
  requestId: string;
  method: string;
  args?: unknown;
};

/**
 * 🔧 P3 补全：文档快照选项
 */
export type DocSnapshotOptions = {
  /** 目标文档 ID，不指定则使用当前活动文档 */
  docId?: string;
  /** 是否包含子文档 */
  includeSubdocs?: boolean;
  /** 输出格式 */
  format?: 'base64' | 'binary';
};

/**
 * 🔧 P3 补全：文档快照结果
 */
export type DocSnapshotResult = {
  /** 文档 ID */
  docId: string;
  /** 文档标题 */
  title?: string;
  /** Yjs 更新数据（Base64 编码） */
  snapshot: string;
  /** 快照大小（字节） */
  size: number;
  /** 生成时间戳 */
  timestamp: number;
};

/**
 * 🔧 P3 补全：文档访问器接口
 */
export interface DocAccessor {
  /** 获取当前活动文档 ID */
  getActiveDocId(): string | null;
  /** 获取指定文档的 Yjs Doc 对象 */
  getYDoc(docId: string): import('yjs').Doc | null;
  /** 获取文档标题 */
  getDocTitle(docId: string): string | undefined;
}

// 🔧 安全修复：API 方法到权限的映射表
const PERMISSION_MAP: Record<string, PluginPermission> = {
  'ui.showToast': 'ui:toolbar',
  'command.register': 'command:register',
  'command.execute': 'command:register',
  'storage.get': 'storage:local',
  'storage.set': 'storage:local',
  'storage.remove': 'storage:local',
  'doc.getSnapshot': 'doc:read',
  'doc.write': 'doc:write',
  'net.fetch': 'net:fetch',
};

// 🔧 安全修复：存储配额限制（每个插件 5MB）
const STORAGE_QUOTA_BYTES = 5 * 1024 * 1024;

export class PluginRuntime {
  private worker: Worker | null = null;
  private objectUrl: string | null = null;
  private readonly storagePrefix: string;
  // H-5 修复：简单锁防止并发写入超配额
  private storageWriteLock = false;

  constructor(
    private readonly record: PluginRecord,
    private readonly docAccessor?: DocAccessor
  ) {
    this.storagePrefix = `yunke:plugin:${record.manifest.id}:`;
  }

  /**
   * 🔧 安全修复：检查插件是否具有调用指定 API 的权限
   */
  private checkPermission(method: string): void {
    const requiredPermission = PERMISSION_MAP[method];
    if (!requiredPermission) {
      // 未知方法，由 dispatchHostCall 处理
      return;
    }

    const hasPermission = this.record.manifest.permissions.includes(requiredPermission);
    if (!hasPermission) {
      const pluginId = this.record.manifest.id;
      console.error(
        `[plugins] 权限不足: 插件 "${pluginId}" 调用 "${method}" 需要 "${requiredPermission}" 权限`
      );
      throw new Error(`权限不足: 调用 "${method}" 需要 "${requiredPermission}" 权限`);
    }
  }

  /**
   * 🔧 安全修复：计算插件当前存储使用量
   */
  private getStorageUsage(): number {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.storagePrefix)) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
    return totalSize * 2; // UTF-16 编码，每个字符 2 字节
  }

  /**
   * 🔧 安全修复：检查存储配额
   */
  private checkStorageQuota(key: string, value: string): void {
    const newItemSize = (this.storagePrefix + key).length + value.length;
    const currentUsage = this.getStorageUsage();
    const projectedUsage = currentUsage + newItemSize * 2;

    if (projectedUsage > STORAGE_QUOTA_BYTES) {
      const pluginId = this.record.manifest.id;
      const quotaMB = (STORAGE_QUOTA_BYTES / 1024 / 1024).toFixed(1);
      console.error(
        `[plugins] 存储配额超限: 插件 "${pluginId}" 已使用 ${(currentUsage / 1024).toFixed(1)}KB，配额 ${quotaMB}MB`
      );
      throw new Error(`存储配额超限: 插件存储上限为 ${quotaMB}MB`);
    }
  }

  start() {
    if (typeof Worker === 'undefined') {
      console.warn('[plugins] Worker 不可用，已跳过运行时启动');
      return;
    }
    if (this.worker) return;

    const script = `
      const pending = new Map();
      const makeId = () => Math.random().toString(36).slice(2);
      const call = (method, args) => new Promise((resolve, reject) => {
        const requestId = makeId();
        pending.set(requestId, { resolve, reject });
        self.postMessage({ type: 'call', requestId, method, args });
      });
      const commandHandlers = new Map();
      const host = {
        ui: {
          showToast: (message) => call('ui.showToast', message),
        },
        command: {
          register: (def) => {
            if (def && def.handler) {
              commandHandlers.set(def.id, def.handler);
            }
            const payload = def ? { id: def.id, label: def.label } : def;
            return call('command.register', payload);
          },
          execute: (id) => call('command.execute', id),
        },
        doc: {
          getSnapshot: (options) => call('doc.getSnapshot', options),
        },
        storage: {
          get: (key) => call('storage.get', key),
          set: (key, value) => call('storage.set', { key, value }),
          remove: (key) => call('storage.remove', key),
        },
      };
      const normalizeSource = (source) => {
        if (source.includes('export function activate')) {
          const replaced = source.replace('export function activate', 'function activate');
          return replaced + '\\nexports.activate = activate;';
        }
        return source;
      };
      const executeEntry = (source) => {
        const exports = {};
        const module = { exports };
        const normalized = normalizeSource(source);
        const fn = new Function('exports', 'module', 'host', 'self', normalized);
        fn(exports, module, host, self);
        const activate = module.exports.activate || exports.activate || self.activate;
        if (typeof activate === 'function') {
          activate(host);
        }
      };
      self.onmessage = (event) => {
        const message = event.data || {};
        if (message.type === 'init') {
          if (message.entrySource) {
            try {
              executeEntry(message.entrySource);
            } catch (error) {
              self.postMessage({ type: 'error', id: message.id, message: String(error) });
            }
          }
          self.postMessage({ type: 'ready', id: message.id });
          return;
        }
        if (message.type === 'result') {
          const pendingItem = pending.get(message.requestId);
          if (!pendingItem) return;
          pending.delete(message.requestId);
          if (message.ok) {
            pendingItem.resolve(message.result);
          } else {
            pendingItem.reject(message.error);
          }
          return;
        }
        if (message.type === 'invoke') {
          const handler = commandHandlers.get(message.id);
          if (handler) {
            try {
              handler();
            } catch (error) {
              self.postMessage({ type: 'error', id: message.id, message: String(error) });
            }
          }
          return;
        }
        if (message.type === 'stop') {
          self.postMessage({ type: 'stopped', id: message.id });
          self.close();
        }
      };
    `;

    const blob = new Blob([script], { type: 'text/javascript' });
    this.objectUrl = URL.createObjectURL(blob);
    this.worker = new Worker(this.objectUrl);

    this.worker.onmessage = event => {
      const message = event.data || {};
      if (message.type === 'ready') {
        console.log(`[plugins] runtime ready: ${message.id}`);
        return;
      }
      if (message.type === 'error') {
        console.warn(`[plugins] runtime error: ${message.message}`);
        return;
      }
      if (message.type === 'call') {
        this.handleWorkerCall(message as WorkerCallMessage);
      }
    };

    this.worker.postMessage({
      type: 'init',
      id: this.record.manifest.id,
      entrySource: this.record.entrySource,
    });
  }

  invoke(commandId: string) {
    if (!this.worker) return;
    this.worker.postMessage({ type: 'invoke', id: commandId });
  }

  private async handleWorkerCall(message: WorkerCallMessage) {
    const { requestId, method, args } = message;
    try {
      const result = await this.dispatchHostCall(method, args);
      this.worker?.postMessage({ type: 'result', requestId, ok: true, result });
    } catch (error) {
      this.worker?.postMessage({
        type: 'result',
        requestId,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * 🔧 P3 补全：处理 doc.getSnapshot 请求
   */
  private handleDocGetSnapshot(options?: DocSnapshotOptions): DocSnapshotResult | null {
    if (!this.docAccessor) {
      console.warn('[plugins] doc.getSnapshot: DocAccessor 未配置');
      return null;
    }

    // 确定目标文档 ID
    const docId = options?.docId ?? this.docAccessor.getActiveDocId();
    if (!docId) {
      console.warn('[plugins] doc.getSnapshot: 无法确定目标文档 ID');
      return null;
    }

    // 获取 Yjs Doc 对象
    const yDoc = this.docAccessor.getYDoc(docId);
    if (!yDoc) {
      console.warn(`[plugins] doc.getSnapshot: 文档未找到 (docId: ${docId})`);
      return null;
    }

    try {
      // 生成快照
      const update = encodeStateAsUpdate(yDoc);
      
      // 转换为 Base64（插件 Worker 中无法直接传递 Uint8Array）
      const base64 = this.uint8ArrayToBase64(update);

      const result: DocSnapshotResult = {
        docId,
        title: this.docAccessor.getDocTitle(docId),
        snapshot: base64,
        size: update.byteLength,
        timestamp: Date.now(),
      };

      console.log(`[plugins] doc.getSnapshot: 成功生成快照 (docId: ${docId}, size: ${update.byteLength} bytes)`);
      return result;
    } catch (error) {
      console.error('[plugins] doc.getSnapshot: 生成快照失败', error);
      return null;
    }
  }

  /**
   * 🔧 P3 补全：Uint8Array 转 Base64
   */
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private dispatchHostCall(method: string, args: unknown) {
    // 🔧 安全修复：执行权限检查
    this.checkPermission(method);

    switch (method) {
      case 'ui.showToast': {
        const title =
          typeof args === 'string'
            ? args
            : (args as { title?: string; message?: string })?.title ??
              (args as { title?: string; message?: string })?.message ??
              '操作完成';
        notify.success({ title });
        return null;
      }
      case 'command.register': {
        const def = args as { id: string };
        if (!def?.id) {
          throw new Error('命令缺少 id');
        }
        return null;
      }
      case 'command.execute': {
        const id = args as string;
        if (this.worker) {
          this.worker.postMessage({ type: 'invoke', id });
          return null;
        }
        return null;
      }
      case 'storage.get': {
        const key = args as string;
        return localStorage.getItem(this.storagePrefix + key);
      }
      case 'storage.set': {
        const payload = args as { key: string; value: string };
        // H-5 修复：原子性检查配额 + 写入，防止并发超配额
        if (this.storageWriteLock) {
          throw new Error('存储写入冲突，请稍后重试');
        }
        this.storageWriteLock = true;
        try {
          this.checkStorageQuota(payload.key, payload.value);
          localStorage.setItem(this.storagePrefix + payload.key, payload.value);
        } finally {
          this.storageWriteLock = false;
        }
        return null;
      }
      case 'storage.remove': {
        const key = args as string;
        localStorage.removeItem(this.storagePrefix + key);
        return null;
      }
      case 'doc.getSnapshot': {
        return this.handleDocGetSnapshot(args as DocSnapshotOptions | undefined);
      }
      default:
        throw new Error(`未知方法: ${method}`);
    }
  }

  stop() {
    if (this.worker) {
      this.worker.postMessage({ type: 'stop', id: this.record.manifest.id });
      this.worker.terminate();
      this.worker = null;
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
