/**
 * 🔧 P2 优化：文档合并 Web Worker
 *
 * 在独立线程中执行 Yjs 合并操作，避免阻塞主线程。
 * 支持单文档合并和批量合并两种模式。
 */

import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';
import {
  applyUpdate,
  Doc as YDoc,
  encodeStateAsUpdate,
  transact,
} from 'yjs';

import type { MergeWorkerOps } from './merge-worker-ops';

// Worker 环境的简化日志器（统一格式）
const workerLogger = {
  prefix: '[yunke:merge-worker]',
  info: (...args: unknown[]) => console.log(workerLogger.prefix, ...args),
  warn: (...args: unknown[]) => console.warn(workerLogger.prefix, ...args),
  error: (...args: unknown[]) => console.error(workerLogger.prefix, ...args),
};

// 创建操作消费者
const consumer = new OpConsumer<MergeWorkerOps>(
  globalThis as MessageCommunicapable
);

/**
 * Base64 解码为 Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uint8Array 编码为 Base64
 */
function uint8ArrayToBase64(array: Uint8Array): string {
  let binary = '';
  const len = array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}

/**
 * 合并多个 Yjs 更新
 */
function mergeYjsUpdates(updates: Uint8Array[]): Uint8Array {
  if (updates.length === 0) {
    return new Uint8Array([0, 0]); // 空更新
  }
  if (updates.length === 1) {
    return updates[0];
  }

  const yDoc = new YDoc();
  try {
    transact(yDoc, () => {
      for (const update of updates) {
        if (update.byteLength > 0) {
          try {
            applyUpdate(yDoc, update);
          } catch (error) {
            workerLogger.warn('应用更新失败，跳过:', error);
          }
        }
      }
    });

    return encodeStateAsUpdate(yDoc);
  } finally {
    // 🔧 P1 修复：释放 YDoc 资源，避免 Worker 中内存持续增长
    yDoc.destroy();
  }
}

/**
 * 注册操作：合并多个更新
 */
consumer.register('mergeUpdates', (base64Updates: string[]) => {
  try {
    // 过滤空更新
    const validUpdates = base64Updates.filter(
      u => u && typeof u === 'string' && u.length > 0
    );

    if (validUpdates.length === 0) {
      return uint8ArrayToBase64(new Uint8Array([0, 0]));
    }

    // 解码 Base64
    const updates = validUpdates.map(base64ToUint8Array);

    // 合并
    const merged = mergeYjsUpdates(updates);

    // 编码返回
    return uint8ArrayToBase64(merged);
  } catch (error) {
    workerLogger.error('mergeUpdates 失败:', error);
    return uint8ArrayToBase64(new Uint8Array([0, 0]));
  }
});

/**
 * 注册操作：批量合并多个文档的更新
 */
consumer.register(
  'batchMergeUpdates',
  (docs: Array<{ docId: string; updates: string[] }>) => {
    const results: Array<{ docId: string; merged: string; error?: string }> = [];

    for (const doc of docs) {
      try {
        const validUpdates = doc.updates.filter(
          u => u && typeof u === 'string' && u.length > 0
        );

        if (validUpdates.length === 0) {
          results.push({
            docId: doc.docId,
            merged: uint8ArrayToBase64(new Uint8Array([0, 0])),
          });
          continue;
        }

        const updates = validUpdates.map(base64ToUint8Array);
        const merged = mergeYjsUpdates(updates);

        results.push({
          docId: doc.docId,
          merged: uint8ArrayToBase64(merged),
        });
      } catch (error) {
        results.push({
          docId: doc.docId,
          merged: uint8ArrayToBase64(new Uint8Array([0, 0])),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return results;
  }
);

/**
 * 注册操作：验证更新数据
 */
consumer.register('validateUpdate', (base64Update: string) => {
  try {
    if (!base64Update || typeof base64Update !== 'string') {
      return { valid: false, size: 0, error: '无效的输入' };
    }

    const binary = base64ToUint8Array(base64Update);
    const size = binary.byteLength;

    // 检查是否为空更新
    if (size === 0 || (size === 2 && binary[0] === 0 && binary[1] === 0)) {
      return { valid: true, size };
    }

    // 尝试应用到临时文档来验证
    const testDoc = new YDoc();
    try {
      applyUpdate(testDoc, binary);
      return { valid: true, size };
    } finally {
      // 🔧 P1 修复：释放 YDoc 资源
      testDoc.destroy();
    }
  } catch (error) {
    return {
      valid: false,
      size: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

/**
 * 注册操作：获取更新统计信息
 */
consumer.register('getUpdateStats', (base64Updates: string[]) => {
  const validUpdates = base64Updates.filter(
    u => u && typeof u === 'string' && u.length > 0
  );

  if (validUpdates.length === 0) {
    return {
      count: 0,
      totalSize: 0,
      averageSize: 0,
      maxSize: 0,
    };
  }

  const sizes = validUpdates.map(u => {
    try {
      return base64ToUint8Array(u).byteLength;
    } catch {
      return 0;
    }
  });

  const totalSize = sizes.reduce((a, b) => a + b, 0);
  const maxSize = Math.max(...sizes);

  return {
    count: validUpdates.length,
    totalSize,
    averageSize: Math.round(totalSize / validUpdates.length),
    maxSize,
  };
});

// Worker 就绪标记
workerLogger.info('文档合并 Worker 已启动');
