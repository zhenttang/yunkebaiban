import {
  effect,
  Entity,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { truncate } from 'lodash-es';
import { map, of, switchMap, tap, throttleTime } from 'rxjs';

import type { DocsService } from '../../doc';
import type { DocDisplayMetaService } from '../../doc-display-meta';
import type { QuickSearchSession } from '../providers/quick-search-provider';
import type { QuickSearchItem } from '../types/item';
import type { 
  EmbeddedContentItem, 
  EmbeddedContentSearchResult,
  EmbeddedContentSearchOptions 
} from '../types/embedded-content';
import type { EmbeddedContentIndexService } from '../services/embedded-content-index';

export class EmbeddedContentQuickSearchSession
  extends Entity
  implements QuickSearchSession<'embedded-content', EmbeddedContentSearchResult['payload']>
{
  constructor(
    private readonly embeddedContentIndexService: EmbeddedContentIndexService,
    private readonly docsService: DocsService,
    private readonly docDisplayMetaService: DocDisplayMetaService
  ) {
    super();
  }

  private readonly isIndexerLoading$ = this.embeddedContentIndexService.isIndexing$;

  private readonly isQueryLoading$ = new LiveData(false);

  isLoading$ = LiveData.computed(get => {
    return get(this.isIndexerLoading$) || get(this.isQueryLoading$);
  });

  query$ = new LiveData('');

  items$ = new LiveData<QuickSearchItem<'embedded-content', EmbeddedContentSearchResult['payload']>[]>([]);

  query = effect(
    throttleTime<string>(500, undefined, {
      leading: false,
      trailing: true,
    }),
    switchMap((query: string) => {
      let out;
      if (!query || query.length < 2) {
        out = of([] as QuickSearchItem<'embedded-content', EmbeddedContentSearchResult['payload']>[]);
      } else {
        const searchOptions: EmbeddedContentSearchOptions = {
          includeDescription: true,
          includeCaption: true,
          maxResults: 10,
        };
        
        out = this.embeddedContentIndexService.search$(query, searchOptions).pipe(
          map((embeddedItems: EmbeddedContentItem[]) =>
            embeddedItems
              .map(item => {
                const docRecord = this.docsService.list.doc$(item.docId).value;
                if (!docRecord) return null;

                const { title: docTitle, icon } = 
                  this.docDisplayMetaService.getDocDisplayMeta(docRecord);

                return {
                  id: `embedded-content:${item.id}`,
                  source: 'embedded-content',
                  group: {
                    id: 'embedded-content',
                    label: {
                      i18nKey: 'com.yunke.quicksearch.group.embeddedcontent',
                      options: { query: truncate(query) },
                    },
                    score: 3,
                  },
                  label: {
                    title: item.title || item.url || 'Embedded Content',
                    subTitle: item.description || item.caption || `${item.type} in ${docTitle}`,
                  },
                  score: this.calculateScore(item, query),
                  icon: this.getEmbedTypeIcon(item.type),
                  timestamp: item.updatedAt,
                  payload: {
                    docId: item.docId,
                    blockId: item.id,
                    type: item.type,
                    title: item.title || item.url || 'Embedded Content',
                    description: item.description,
                    url: item.url,
                    metadata: item.metadata,
                  },
                } as QuickSearchItem<'embedded-content', EmbeddedContentSearchResult['payload']>;
              })
              .filter(Boolean) as QuickSearchItem<'embedded-content', EmbeddedContentSearchResult['payload']>[]
          )
        );
      }
      
      return out.pipe(
        tap((items: QuickSearchItem<'embedded-content', EmbeddedContentSearchResult['payload']>[]) => {
          this.items$.next(items);
          this.isQueryLoading$.next(false);
        }),
        onStart(() => {
          this.items$.next([]);
          this.isQueryLoading$.next(true);
        }),
        onComplete(() => {})
      );
    })
  );

  private calculateScore(item: EmbeddedContentItem, query: string): number {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    // 标题匹配
    if (item.title?.toLowerCase().includes(lowerQuery)) {
      score += 100;
    }
    
    // URL匹配
    if (item.url?.toLowerCase().includes(lowerQuery)) {
      score += 80;
    }
    
    // 描述匹配
    if (item.description?.toLowerCase().includes(lowerQuery)) {
      score += 60;
    }
    
    // 说明文字匹配
    if (item.caption?.toLowerCase().includes(lowerQuery)) {
      score += 40;
    }

    return score;
  }

  private getEmbedTypeIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'youtube': '🎥',
      'figma': '🎨',
      'github': '🐙',
      'loom': '📹',
      'iframe': '🌐',
      'html': '📄',
      'linked-doc': '🔗',
      'synced-doc': '🔄',
    };
    
    return iconMap[type] || '📎';
  }

  setQuery(query: string) {
    this.query$.next(query);
  }

  override dispose(): void {
    this.query.unsubscribe();
  }
}