import { DocsService } from '@yunke/core/modules/doc';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import type { DocMeta } from '@blocksuite/yunke/store';
import { Service } from '@toeverything/infra';

export interface DocSizeInfo {
  id: string;
  title: string;
  size: number;
  updatedDate?: Date;
}

/**
 * 文档大小服务 - 用于获取工作区文档的大小信息
 */
export class DocSizeService extends Service {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly docsService: DocsService
  ) {
    super();
  }

  /**
   * 获取当前工作区所有文档的大小信息
   */
  async getDocSizes(): Promise<DocSizeInfo[]> {
    const { workspace } = this.workspaceService;
    
    try {
      // 获取文档元数据列表
      const docMetas = workspace.docCollection.meta.docMetas.filter(meta => !meta.trash);
      
      // 从docCollection获取更新时间等meta信息
      const metas = docMetas.map((meta: DocMeta) => {
        return {
          id: meta.id,
          title: meta.title || 'Untitled',
          updatedDate: meta.updatedDate ? new Date(meta.updatedDate) : undefined
        };
      });

      // 计算文档大小（使用预估值 + blob引用）
      const docIdToBlobSizeMap = new Map<string, number>();
      
      // 先给所有文档设置一个基础大小
      docMetas.forEach((meta: DocMeta) => {
        // 设置预估基础大小，根据经验值：
        // - 工作区根文档约5KB
        // - 普通文档约2KB + 每个块约0.2KB（假设平均10个块）
        const baseSize = meta.id === workspace.id ? 5000 : 4000;
        docIdToBlobSizeMap.set(meta.id, baseSize);
      });
      
      // 尝试从indexer获取文档使用的blob信息
      try {
        // 获取所有可能的blob信息
        let blobs: {key: string, size: number}[] = [];
        // 尝试安全地获取blob列表
        try {
          // @ts-ignore - 忽略类型检查
          blobs = await workspace.engine.blob.list();
        } catch (err) {
          console.warn('无法获取blob列表:', err);
          return metas.map((meta) => ({
            ...meta,
            size: docIdToBlobSizeMap.get(meta.id) || 0
          })).sort((a, b) => 
            (b.updatedDate?.getTime() || 0) - (a.updatedDate?.getTime() || 0)
          );
        }
        
        // 如果indexer可用，获取blob到文档的映射
        const docContent = await workspace.engine.indexer.aggregate(
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
          'docId',
          {
            pagination: { 
              limit: 1000
            },
            hits: {
              pagination: { 
                limit: 100
              },
              fields: ['blob']
            }
          }
        );

        if (docContent && docContent.buckets) {
          docContent.buckets.forEach((bucket: any) => {
            const docId = bucket.key;
            const baseSize = docIdToBlobSizeMap.get(docId) || 0;
            
            // 收集该文档关联的所有blob
            const docBlobs: string[] = [];
            if (bucket.hits) {
              bucket.hits.forEach((hit: any) => {
                if (hit.blob) {
                  docBlobs.push(hit.blob);
                }
              });
            }
            
            // 计算blob大小
            let blobSize = 0;
            docBlobs.forEach((blobKey: string) => {
              const blob = blobs.find(b => b.key === blobKey);
              if (blob) {
                blobSize += blob.size;
              }
            });
            
            // 更新文档总大小 = 基础大小 + 引用的blobs
            docIdToBlobSizeMap.set(docId, baseSize + blobSize);
          });
        }
      } catch (err) {
        console.warn('从索引器获取blob使用情况失败：', err);
        // 继续使用基础大小
      }

      // 组合元数据和大小信息
      return metas.map((meta) => ({
        ...meta,
        size: docIdToBlobSizeMap.get(meta.id) || 0
      }))
      .sort((a, b) => (b.updatedDate?.getTime() || 0) - (a.updatedDate?.getTime() || 0)); // 按更新时间排序
    } catch (err) {
      console.error('获取文档大小失败：', err);
      throw err;
    }
  }
} 