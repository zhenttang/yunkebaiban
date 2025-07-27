import { Service, LiveData } from '@toeverything/infra';
import { Observable, from, map, shareReplay } from 'rxjs';

import type { DocsService } from '../../doc';
import type { 
  EmbeddedContentItem, 
  EmbeddedContentType,
  EmbeddedContentSearchOptions,
  EmbeddedContentMetadata 
} from '../types/embedded-content';

export class EmbeddedContentIndexService extends Service {
  private readonly _index = new Map<string, EmbeddedContentItem>();
  private readonly _isIndexing$ = new LiveData<boolean>(false);
  private readonly _lastIndexTime$ = new LiveData<number>(0);

  constructor(private readonly docsService: DocsService) {
    super();
    this.initializeIndex();
  }

  get isIndexing$(): LiveData<boolean> {
    return this._isIndexing$;
  }

  get lastIndexTime$(): LiveData<number> {
    return this._lastIndexTime$;
  }

  private async initializeIndex(): Promise<void> {
    this._isIndexing$.next(true);
    
    try {
      await this.rebuildIndex();
    } catch (error) {
      console.error('Failed to initialize embedded content index:', error);
    } finally {
      this._isIndexing$.next(false);
      this._lastIndexTime$.next(Date.now());
    }
  }

  async rebuildIndex(): Promise<void> {
    console.log('[EmbeddedContentIndex] Starting to rebuild index...');
    this._index.clear();
    
    const docs = this.docsService.list.docs$.value;
    console.log(`[EmbeddedContentIndex] Found ${docs.length} docs to scan`);
    
    for (const doc of docs.slice(0, 3)) { // 只扫描前3个文档来减少日志
      try {
        await this.indexDoc(doc.id);
      } catch (error) {
        console.error(`Failed to index doc ${doc.id}:`, error);
      }
    }
    
    console.log(`[EmbeddedContentIndex] Index rebuilt with ${this._index.size} embedded items`);
  }

  async indexDoc(docId: string): Promise<void> {
    const doc = this.docsService.list.doc$(docId).value;
    if (!doc) return;

    console.log(`[EmbeddedContentIndex] Indexing doc: ${docId}`);

    // 这里需要访问BlockSuite的文档结构来扫描嵌入块
    const embeddedBlocks = await this.scanDocForEmbeddedContent(docId);
    
    console.log(`[EmbeddedContentIndex] Found ${embeddedBlocks.length} embedded blocks in doc ${docId}`);
    
    for (const block of embeddedBlocks) {
      this._index.set(block.id, block);
      console.log(`[EmbeddedContentIndex] Indexed ${block.type} block: ${block.title || block.url}`);
    }
  }

  private async scanDocForEmbeddedContent(docId: string): Promise<EmbeddedContentItem[]> {
    const embeddedItems: EmbeddedContentItem[] = [];
    
    try {
      console.log(`[EmbeddedContentIndex] Scanning doc ${docId} for embedded content...`);
      
      // 获取文档实例
      const docRef = this.docsService.open(docId);
      if (!docRef.doc.blockSuiteDoc.ready) {
        docRef.doc.blockSuiteDoc.load();
      }
      
      // 等待文档加载完成
      const disposePriorityLoad = docRef.doc.addPriorityLoad(10);
      await docRef.doc.waitForSyncReady();
      
      const doc = docRef.doc.blockSuiteDoc.doc;
      if (!doc) {
        console.log(`[EmbeddedContentIndex] No BlockSuite doc found for ${docId}`);
        disposePriorityLoad();
        return embeddedItems;
      }

      console.log(`[EmbeddedContentIndex] BlockSuite doc loaded for ${docId}`, doc);

      // 递归扫描所有块
      const scanBlocks = (blocks: any[]) => {
        for (const block of blocks) {
          console.log(`[EmbeddedContentIndex] Checking block: ${block.flavour} (${block.id})`);
          
          const embeddedItem = this.extractEmbeddedContent(block, docId);
          if (embeddedItem) {
            embeddedItems.push(embeddedItem);
            console.log(`[EmbeddedContentIndex] Found embedded block: ${embeddedItem.type} - ${embeddedItem.title || embeddedItem.url}`);
          }
          
          // 递归扫描子块
          if (block.children && block.children.length > 0) {
            scanBlocks(Array.from(block.children));
          }
        }
      };

      // 获取所有块并开始扫描
      const blocks = doc.getBlocks();
      console.log(`[EmbeddedContentIndex] Found ${blocks.length} blocks total`);
      
      for (const block of blocks) {
        console.log(`[EmbeddedContentIndex] Checking block: ${block.flavour} (${block.id})`);
        
        const embeddedItem = this.extractEmbeddedContent(block, docId);
        if (embeddedItem) {
          embeddedItems.push(embeddedItem);
          console.log(`[EmbeddedContentIndex] Found embedded block: ${embeddedItem.type} - ${embeddedItem.title || embeddedItem.url}`);
        }
      }

      // 释放资源
      disposePriorityLoad();
      
    } catch (error) {
      console.error(`Error scanning doc ${docId}:`, error);
    }
    
    return embeddedItems;
  }

  private async getDocBlocks(docId: string): Promise<any[]> {
    // 这个方法已被 scanDocForEmbeddedContent 替代
    return [];
  }

  private extractEmbeddedContent(block: any, docId: string): EmbeddedContentItem | null {
    // 检查块类型是否为嵌入类型
    const embedTypes = [
      'affine:embed-iframe',
      'affine:embed-figma', 
      'affine:embed-youtube',
      'affine:embed-github',
      'affine:embed-loom',
      'affine:embed-html',
      'affine:embed-linked-doc',
      'affine:embed-synced-doc'
    ];

    if (!block.flavour || !embedTypes.includes(block.flavour)) {
      return null;
    }

    const type = this.getEmbedType(block.flavour);
    const metadata = this.extractMetadata(block, type);

    // 从BlockSuite块获取属性
    const props = block.props || {};

    return {
      id: block.id,
      docId: docId,
      type: type,
      url: props.url || '',
      title: props.title || null,
      description: props.description || null,
      caption: props.caption || null,
      metadata: metadata,
      createdAt: block.created || Date.now(),
      updatedAt: block.updated || Date.now(),
    };
  }

  private getEmbedType(flavour: string): EmbeddedContentType {
    const typeMap: Record<string, EmbeddedContentType> = {
      'affine:embed-iframe': 'iframe',
      'affine:embed-figma': 'figma',
      'affine:embed-youtube': 'youtube', 
      'affine:embed-github': 'github',
      'affine:embed-loom': 'loom',
      'affine:embed-html': 'html',
      'affine:embed-linked-doc': 'linked-doc',
      'affine:embed-synced-doc': 'synced-doc',
    };

    return typeMap[flavour] || 'iframe';
  }

  private extractMetadata(block: any, type: EmbeddedContentType): EmbeddedContentMetadata {
    const metadata: EmbeddedContentMetadata = {};
    const props = block.props || {};

    switch (type) {
      case 'youtube':
        metadata.videoId = props.videoId;
        metadata.creator = props.creator;
        metadata.creatorUrl = props.creatorUrl;
        metadata.thumbnailUrl = props.image;
        break;
        
      case 'github':
        if (props.url) {
          const match = props.url.match(/github\.com\/([^/]+)\/([^/]+)\/(issue|pull)s?\/(\d+)/);
          if (match) {
            metadata.owner = match[1];
            metadata.repository = match[2];
            metadata.issueNumber = match[4];
          }
        }
        break;
        
      case 'figma':
        if (props.url) {
          const match = props.url.match(/figma\.com\/file\/([^/]+)/);
          if (match) {
            metadata.figmaFileId = match[1];
          }
        }
        break;
        
      case 'loom':
        if (props.url) {
          const match = props.url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
          if (match) {
            metadata.loomId = match[1];
          }
        }
        break;
    }

    metadata.embedUrl = props.iframeUrl || props.url;
    
    return metadata;
  }

  search$(query: string, options: EmbeddedContentSearchOptions = {}): Observable<EmbeddedContentItem[]> {
    return from(this.searchSync(query, options)).pipe(
      shareReplay(1)
    );
  }

  private searchSync(query: string, options: EmbeddedContentSearchOptions = {}): EmbeddedContentItem[] {
    const lowerQuery = query.toLowerCase();
    const results: EmbeddedContentItem[] = [];

    for (const item of this._index.values()) {
      // 类型过滤
      if (options.types && !options.types.includes(item.type)) {
        continue;
      }

      // 搜索匹配
      let matches = false;

      // 搜索标题
      if (item.title?.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // 搜索URL
      if (item.url?.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // 搜索描述
      if (options.includeDescription && item.description?.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      // 搜索说明文字
      if (options.includeCaption && item.caption?.toLowerCase().includes(lowerQuery)) {
        matches = true;
      }

      if (matches) {
        results.push(item);
      }
    }

    // 按相关性排序
    results.sort((a, b) => this.calculateRelevance(b, lowerQuery) - this.calculateRelevance(a, lowerQuery));

    // 限制结果数量
    if (options.maxResults) {
      return results.slice(0, options.maxResults);
    }

    return results;
  }

  private calculateRelevance(item: EmbeddedContentItem, query: string): number {
    let score = 0;

    if (item.title?.toLowerCase().includes(query)) {
      score += 100;
    }

    if (item.url?.toLowerCase().includes(query)) {
      score += 80;
    }

    if (item.description?.toLowerCase().includes(query)) {
      score += 60;
    }

    if (item.caption?.toLowerCase().includes(query)) {
      score += 40;
    }

    return score;
  }

  // 监听文档变化并更新索引
  onDocumentUpdated(docId: string): void {
    this.indexDoc(docId).catch(error => {
      console.error(`Failed to update index for doc ${docId}:`, error);
    });
  }

  onDocumentDeleted(docId: string): void {
    // 删除相关的嵌入内容
    for (const [key, item] of this._index.entries()) {
      if (item.docId === docId) {
        this._index.delete(key);
      }
    }
  }

  getItem(itemId: string): EmbeddedContentItem | undefined {
    return this._index.get(itemId);
  }

  getAllItems(): EmbeddedContentItem[] {
    return Array.from(this._index.values());
  }

  getItemsByType(type: EmbeddedContentType): EmbeddedContentItem[] {
    return Array.from(this._index.values()).filter(item => item.type === type);
  }

  getItemsByDoc(docId: string): EmbeddedContentItem[] {
    return Array.from(this._index.values()).filter(item => item.docId === docId);
  }
}