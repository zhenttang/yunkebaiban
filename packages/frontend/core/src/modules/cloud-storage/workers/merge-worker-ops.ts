/**
 * 🔧 P2 优化：文档合并 Worker 操作类型定义
 *
 * 将耗时的 Yjs 合并操作移到 Web Worker 中执行，
 * 避免阻塞主线程，提升大文档的处理性能。
 */

import type { OpSchema } from '@toeverything/infra/op';

export interface MergeWorkerOps extends OpSchema {
  /**
   * 合并多个 Yjs 更新为单个更新
   * @param updates - Base64 编码的更新数组
   * @returns Base64 编码的合并结果
   */
  mergeUpdates: [string[], string];

  /**
   * 批量合并多个文档的更新
   * @param docs - 文档 ID 到更新数组的映射
   * @returns 文档 ID 到合并结果的映射
   */
  batchMergeUpdates: [
    Array<{ docId: string; updates: string[] }>,
    Array<{ docId: string; merged: string; error?: string }>,
  ];

  /**
   * 验证 Yjs 更新数据是否有效
   * @param update - Base64 编码的更新数据
   * @returns 验证结果
   */
  validateUpdate: [string, { valid: boolean; size: number; error?: string }];

  /**
   * 计算更新的统计信息（用于性能监控）
   * @param updates - Base64 编码的更新数组
   * @returns 统计信息
   */
  getUpdateStats: [
    string[],
    {
      count: number;
      totalSize: number;
      averageSize: number;
      maxSize: number;
    },
  ];
}
