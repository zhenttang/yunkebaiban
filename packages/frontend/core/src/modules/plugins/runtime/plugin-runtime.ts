import { notify } from '@yunke/component';

import type { PluginRecord } from '../types';

type WorkerCallMessage = {
  type: 'call';
  requestId: string;
  method: string;
  args?: unknown;
};

export class PluginRuntime {
  private worker: Worker | null = null;
  private objectUrl: string | null = null;
  private readonly storagePrefix: string;

  constructor(private readonly record: PluginRecord) {
    this.storagePrefix = `yunke:plugin:${record.manifest.id}:`;
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

  private dispatchHostCall(method: string, args: unknown) {
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
        localStorage.setItem(this.storagePrefix + payload.key, payload.value);
        return null;
      }
      case 'storage.remove': {
        const key = args as string;
        localStorage.removeItem(this.storagePrefix + key);
        return null;
      }
      case 'doc.getSnapshot': {
        console.warn('[plugins] doc.getSnapshot 尚未实现');
        return null;
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
