/**
 * 存储事件工具 — 用于跨模块发送存储错误通知
 * 消除 file-native-db.ts 和 cloud-storage 之间的重复定义
 */

export interface StorageErrorEvent {
  type:
    | 'write-failure'
    | 'data-loss'
    | 'offline-overflow'
    | 'storage-low'
    | 'integrity-error';
  message: string;
  details?: Record<string, unknown>;
}

/**
 * 发送存储错误通知
 * 通过 CustomEvent 在 window 上派发，任何监听 'yunke-storage-error' 的代码都会收到
 */
export function emitStorageError(error: StorageErrorEvent): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yunke-storage-error', { detail: error })
    );
  }
}
