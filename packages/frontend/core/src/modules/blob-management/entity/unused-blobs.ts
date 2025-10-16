import type { ListedBlobRecord } from '@affine/nbstore';
import {
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { fileTypeFromBuffer } from 'file-type';
import { catchError, switchMap, tap, timeout } from 'rxjs';

import type { DocsSearchService } from '../../docs-search';
import type { WorkspaceService } from '../../workspace';
import type { WorkspaceFlavoursService } from '../../workspace/services/flavours';

interface HydratedBlobRecord extends ListedBlobRecord, Disposable {
  url: string;
  extension?: string;
  type?: string;
}

export class UnusedBlobs extends Entity {
  constructor(
    private readonly flavoursService: WorkspaceFlavoursService,
    private readonly workspaceService: WorkspaceService,
    private readonly docsSearchService: DocsSearchService
  ) {
    super();
  }

  isLoading$ = new LiveData(false);
  unusedBlobs$ = new LiveData<ListedBlobRecord[]>([]);
  error$ = new LiveData<Error | null>(null);

  // 30秒的超时时间，避免无限等待
  private readonly TIMEOUT_MS = 30000;

  readonly revalidate = effect(
    switchMap(() =>
      fromPromise(async () => {
        // 清除之前的错误
        this.error$.setValue(null);
        try {
          return await this.getUnusedBlobs();
        } catch (err) {
          console.error('获取未使用的blobs失败:', err);
          const error = err instanceof Error ? err : new Error(String(err));
          this.error$.setValue(error);
          return [];
        }
      }).pipe(
        timeout(this.TIMEOUT_MS), // 添加超时处理
        tap(data => {
          // 只有在没有错误的情况下才更新数据
          if (this.error$.value === null) {
            this.unusedBlobs$.setValue(data);
          }
        }),
        catchError(err => {
          console.error('加载未使用的blobs时出错:', err);
          const error = err instanceof Error ? err : new Error('加载失败，请稍后重试');
          this.error$.setValue(error);
          this.unusedBlobs$.setValue([]);
          return [];
        }),
        onStart(() => {
          this.isLoading$.setValue(true);
          // 开始新的加载时清除错误
          this.error$.setValue(null);
        }),
        onComplete(() => this.isLoading$.setValue(false))
      )
    )
  );

  private get flavourProvider() {
    return this.flavoursService.flavours$.value.find(
      f => f.flavour === this.workspaceService.workspace.flavour
    );
  }

  async listBlobs() {
    try {
      const provider = this.flavourProvider;
      if (!provider) {
        console.warn('Flavour provider 未找到，跳过 blob 列举');
        return [];
      }
      const blobs = await provider.listBlobs(
        this.workspaceService.workspace.id
      );
      return blobs ?? [];
    } catch (err) {
      console.error('列举blobs失败:', err);
      throw err;
    }
  }

  async getBlob(blobKey: string) {
    try {
      const provider = this.flavourProvider;
      if (!provider) {
        console.warn(`Flavour provider 未找到，无法获取 blob ${blobKey}`);
        return null;
      }
      const blob = await provider.getWorkspaceBlob(
        this.workspaceService.workspace.id,
        blobKey
      );
      return blob ?? null;
    } catch (err) {
      console.error(`获取blob ${blobKey}失败:`, err);
      throw err;
    }
  }

  async deleteBlob(blob: string, permanent: boolean) {
    try {
      const provider = this.flavourProvider;
      if (!provider) {
        throw new Error('Flavour provider 未找到，无法删除 blob');
      }
      await provider.deleteBlob(
        this.workspaceService.workspace.id,
        blob,
        permanent
      );
    } catch (err) {
      console.error(`删除blob ${blob}失败:`, err);
      throw err;
    }
  }

  async getUnusedBlobs(abortSignal?: AbortSignal) {
    // 创建超时控制
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new Error('操作超时'));
    }, this.TIMEOUT_MS);

    // 合并信号源
    const mergedSignal = abortSignal 
      ? new AbortController()
      : timeoutController;
    
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => mergedSignal.abort(abortSignal.reason));
      timeoutController.signal.addEventListener('abort', () => mergedSignal.abort(timeoutController.signal.reason));
    }

    try {
      // Wait for both sync and indexing to complete with timeout
      try {
        const syncPromise = this.workspaceService.workspace.engine.doc.waitForSynced();
        // 使用Promise.race给同步过程添加超时控制
        await Promise.race([
          syncPromise,
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('同步超时')), 10000);
          })
        ]);
      } catch (syncErr) {
        console.warn('同步过程失败或超时，继续执行:', syncErr);
        // 同步失败不应该阻止整个流程，继续执行
      }

      // 索引过程添加超时
      try {
        await Promise.race([
          this.docsSearchService.indexer.waitForCompleted(mergedSignal.signal),
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('索引超时')), 10000);
          })
        ]);
      } catch (indexErr) {
        console.warn('索引过程失败或超时，继续执行:', indexErr);
        // 索引失败不应该阻止整个流程，继续执行
      }

      const [blobs, usedBlobs] = await Promise.all([
        this.listBlobs(),
        this.getUsedBlobs(),
      ]);

      // ignore the workspace avatar
      const workspaceAvatar = this.workspaceService.workspace.avatar$.value;

      return (
        blobs?.filter(
          blob => !usedBlobs.includes(blob.key) && blob.key !== workspaceAvatar
        ) ?? []
      );
    } catch (err) {
      console.error('getUnusedBlobs方法出错:', err);
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async getUsedBlobs(): Promise<string[]> {
    try {
    const result = await this.docsSearchService.indexer.aggregate(
      'block',
      {
        type: 'boolean',
        occur: 'must',
        queries: [
          {
            type: 'exists',
            field: 'blob',
          },
        ],
      },
      'blob',
      {
        pagination: {
          limit: Number.MAX_SAFE_INTEGER,
        },
      }
    );

    return result.buckets.map(bucket => bucket.key);
    } catch (err) {
      console.error('获取已使用的blobs失败:', err);
      return [];
    }
  }

  async hydrateBlob(
    record: ListedBlobRecord,
    abortSignal?: AbortSignal
  ): Promise<HydratedBlobRecord | null> {
    try {
    const blob = await this.getBlob(record.key);

    if (!blob || abortSignal?.aborted) {
      return null;
    }

    const fileType = await fileTypeFromBuffer(await blob.arrayBuffer());

    if (abortSignal?.aborted) {
      return null;
    }

    const mime = record.mime || fileType?.mime || '未知';
    const url = URL.createObjectURL(new Blob([blob], { type: mime }));
    // todo(@pengx17): the following may not be sufficient
    const extension = fileType?.ext;
    const type = extension ?? (mime?.startsWith('text/') ? 'txt' : '未知');
    return {
      ...record,
      url,
      extension,
      type,
      mime,
      [Symbol.dispose]: () => {
        URL.revokeObjectURL(url);
      },
    };
    } catch (err) {
      console.error(`水化blob ${record.key}失败:`, err);
      return null;
    }
  }
}
