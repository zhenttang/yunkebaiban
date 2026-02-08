/**
 * 🔧 P2 优化：文档合并 Worker 模块
 *
 * 导出 Worker 客户端 API，用于在 Web Worker 中执行大文档合并操作。
 */

export {
  mergeUpdates,
  batchMergeUpdates,
  validateUpdate,
  getUpdateStats,
  getMergeStats,
  resetWorker,
  isWorkerAvailable,
} from './merge-worker-client';

export type { MergeWorkerOps } from './merge-worker-ops';
