/**
 * 🔧 P2 优化：文档合并 Worker 客户端
 *
 * 提供简洁的 API 来调用 Worker 中的合并操作。
 * 支持自动回退到主线程处理（当 Worker 不可用时）。
 */

import { getWorkerUrl } from '@yunke/env/worker';
import { OpClient } from '@toeverything/infra/op';
import { DebugLogger } from '@yunke/debug';
import {
  applyUpdate,
  Doc as YDoc,
  encodeStateAsUpdate,
  transact,
} from 'yjs';

import type { MergeWorkerOps } from './merge-worker-ops';

// 统一日志管理
const logger = new DebugLogger('yunke:merge-worker-client');

// Worker 实例（单例）
let workerClient: OpClient<MergeWorkerOps> | null = null;
let rawWorkerInstance: Worker | null = null; // 🔧 P1 修复：保存原始 Worker 引用，用于 terminate
let workerInitFailed = false;

// 性能统计
interface MergeStats {
  workerMerges: number;
  fallbackMerges: number;
  totalMergeTime: number;
  lastMergeTime: number;
}

const stats: MergeStats = {
  workerMerges: 0,
  fallbackMerges: 0,
  totalMergeTime: 0,
  lastMergeTime: 0,
};

/**
 * Base64 解码为 Uint8Array（回退用）
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
 * Uint8Array 编码为 Base64（回退用）
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
 * 主线程合并实现（回退方案）
 */
function mergeUpdatesOnMainThread(base64Updates: string[]): string {
  const validUpdates = base64Updates.filter(
    u => u && typeof u === 'string' && u.length > 0
  );

  if (validUpdates.length === 0) {
    return uint8ArrayToBase64(new Uint8Array([0, 0]));
  }

  if (validUpdates.length === 1) {
    return validUpdates[0];
  }

  const yDoc = new YDoc();
  try {
    transact(yDoc, () => {
      for (const base64 of validUpdates) {
        try {
          const update = base64ToUint8Array(base64);
          if (update.byteLength > 0) {
            applyUpdate(yDoc, update);
          }
        } catch (error) {
          logger.warn('主线程应用更新失败', error);
        }
      }
    });

    return uint8ArrayToBase64(encodeStateAsUpdate(yDoc));
  } finally {
    // 🔧 P1 修复：释放 YDoc 资源，避免内存泄漏
    yDoc.destroy();
  }
}

/**
 * 获取或创建 Worker 客户端
 */
function getWorkerClient(): OpClient<MergeWorkerOps> | null {
  if (workerInitFailed) {
    return null;
  }

  if (workerClient) {
    return workerClient;
  }

  try {
    // 检查 Worker 支持
    if (typeof Worker === 'undefined') {
      logger.warn('当前环境不支持 Web Worker');
      workerInitFailed = true;
      return null;
    }

    const workerUrl = getWorkerUrl('merge-update');
    const rawWorker = new Worker(workerUrl);
    rawWorkerInstance = rawWorker; // 🔧 P1 修复：保存原始引用

    workerClient = new OpClient<MergeWorkerOps>(rawWorker);
    logger.info('Worker 客户端已初始化');

    return workerClient;
  } catch (error) {
    logger.warn('Worker 初始化失败，将使用主线程', error);
    workerInitFailed = true;
    return null;
  }
}

/**
 * 合并多个 Yjs 更新（自动选择 Worker 或主线程）
 *
 * @param base64Updates - Base64 编码的更新数组
 * @returns Promise<string> - Base64 编码的合并结果
 */
export async function mergeUpdates(base64Updates: string[]): Promise<string> {
  const startTime = performance.now();

  try {
    const client = getWorkerClient();

    if (client) {
      // 使用 Worker
      const result = await client.call('mergeUpdates', base64Updates);
      stats.workerMerges++;
      stats.lastMergeTime = performance.now() - startTime;
      stats.totalMergeTime += stats.lastMergeTime;
      return result;
    }
  } catch (error) {
    logger.warn('Worker 调用失败，回退到主线程', error);
  }

  // 回退到主线程
  const result = mergeUpdatesOnMainThread(base64Updates);
  stats.fallbackMerges++;
  stats.lastMergeTime = performance.now() - startTime;
  stats.totalMergeTime += stats.lastMergeTime;

  return result;
}

/**
 * 批量合并多个文档的更新
 *
 * @param docs - 文档更新数组
 * @returns Promise - 合并结果数组
 */
export async function batchMergeUpdates(
  docs: Array<{ docId: string; updates: string[] }>
): Promise<Array<{ docId: string; merged: string; error?: string }>> {
  const startTime = performance.now();

  try {
    const client = getWorkerClient();

    if (client) {
      const result = await client.call('batchMergeUpdates', docs);
      stats.workerMerges += docs.length;
      stats.lastMergeTime = performance.now() - startTime;
      stats.totalMergeTime += stats.lastMergeTime;
      return result;
    }
  } catch (error) {
    logger.warn('Worker 批量调用失败，回退到主线程', error);
  }

  // 回退到主线程
  const results: Array<{ docId: string; merged: string; error?: string }> = [];

  for (const doc of docs) {
    try {
      const merged = mergeUpdatesOnMainThread(doc.updates);
      results.push({ docId: doc.docId, merged });
    } catch (error) {
      results.push({
        docId: doc.docId,
        merged: uint8ArrayToBase64(new Uint8Array([0, 0])),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stats.fallbackMerges += docs.length;
  stats.lastMergeTime = performance.now() - startTime;
  stats.totalMergeTime += stats.lastMergeTime;

  return results;
}

/**
 * 验证 Yjs 更新数据
 *
 * @param base64Update - Base64 编码的更新数据
 * @returns Promise - 验证结果
 */
export async function validateUpdate(
  base64Update: string
): Promise<{ valid: boolean; size: number; error?: string }> {
  try {
    const client = getWorkerClient();

    if (client) {
      return await client.call('validateUpdate', base64Update);
    }
  } catch (error) {
    logger.warn('Worker 验证失败，回退到主线程', error);
  }

  // 回退到主线程验证
  try {
    if (!base64Update || typeof base64Update !== 'string') {
      return { valid: false, size: 0, error: '无效的输入' };
    }

    const binary = base64ToUint8Array(base64Update);
    const size = binary.byteLength;

    if (size === 0 || (size === 2 && binary[0] === 0 && binary[1] === 0)) {
      return { valid: true, size };
    }

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
}

/**
 * 获取更新统计信息
 *
 * @param base64Updates - Base64 编码的更新数组
 * @returns Promise - 统计信息
 */
export async function getUpdateStats(base64Updates: string[]): Promise<{
  count: number;
  totalSize: number;
  averageSize: number;
  maxSize: number;
}> {
  try {
    const client = getWorkerClient();

    if (client) {
      return await client.call('getUpdateStats', base64Updates);
    }
  } catch (error) {
    logger.warn('Worker 统计失败，回退到主线程', error);
  }

  // 回退到主线程
  const validUpdates = base64Updates.filter(
    u => u && typeof u === 'string' && u.length > 0
  );

  if (validUpdates.length === 0) {
    return { count: 0, totalSize: 0, averageSize: 0, maxSize: 0 };
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
}

/**
 * 获取合并性能统计
 */
export function getMergeStats(): MergeStats & {
  workerAvailable: boolean;
  averageMergeTime: number;
} {
  const totalMerges = stats.workerMerges + stats.fallbackMerges;
  return {
    ...stats,
    workerAvailable: !workerInitFailed && workerClient !== null,
    averageMergeTime: totalMerges > 0 ? stats.totalMergeTime / totalMerges : 0,
  };
}

/**
 * 重置 Worker（用于测试或恢复）
 */
/**
 * 🔧 P1 修复：正确终止 Worker 线程
 * 旧实现只是设置 null，底层 Worker 线程不会被终止，导致资源泄漏
 */
export function resetWorker(): void {
  if (rawWorkerInstance) {
    try {
      rawWorkerInstance.terminate();
      logger.info('Worker 线程已终止');
    } catch {
      // ignore terminate errors
    }
    rawWorkerInstance = null;
  }
  workerClient = null;
  workerInitFailed = false;
}

/**
 * 检查 Worker 是否可用
 */
export function isWorkerAvailable(): boolean {
  return !workerInitFailed && (workerClient !== null || getWorkerClient() !== null);
}
