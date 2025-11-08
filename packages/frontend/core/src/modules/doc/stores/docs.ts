import type { DocMode } from '@blocksuite/yunke/model';
import type { DocMeta } from '@blocksuite/yunke/store';
import {
  Store,
  yjsGetPath,
  yjsObserve,
  yjsObserveDeep,
  yjsObservePath,
} from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { distinctUntilChanged, map, switchMap, timeout, catchError, of } from 'rxjs';
import { Array as YArray, Map as YMap, transact } from 'yjs';

import type { WorkspaceService } from '../../workspace';
import type { DocPropertiesStore } from './doc-properties';

export class DocsStore extends Store {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly docPropertiesStore: DocPropertiesStore
  ) {
    super();
  }

  getBlockSuiteDoc(id: string) {
    const workspace = this.workspaceService.workspace;
    
    // 防御性检查：确保workspace和docCollection存在
    if (!workspace) {
      console.error('❌ [DocsStore.getBlockSuiteDoc] workspace 未初始化');
      return null;
    }
    
    if (!workspace.docCollection) {
      console.error('❌ [DocsStore.getBlockSuiteDoc] docCollection 未初始化');
      return null;
    }
    
    const doc = workspace.docCollection.getDoc(id);
    if (!doc) {
      console.error('❌ [DocsStore.getBlockSuiteDoc] 文档未找到:', id);
      return null;
    }
    
    const store = doc.getStore({ id });
    if (!store) {
      console.error('❌ [DocsStore.getBlockSuiteDoc] 文档store未找到:', id);
      return null;
    }
    
    return store;
  }

  getBlocksuiteCollection() {
    return this.workspaceService.workspace.docCollection;
  }

  createDoc(docId?: string) {
    const id = docId ?? nanoid();

    console.log('📝 [DocsStore.createDoc] 开始创建文档:', {
      newDocId: id,
      workspaceId: this.workspaceService.workspace.id,
      rootYDocGuid: this.workspaceService.workspace.rootYDoc.guid
    });

    transact(
      this.workspaceService.workspace.rootYDoc,
      () => {
        const meta = this.workspaceService.workspace.rootYDoc.getMap('meta');
        let docs = meta.get('pages');

        if (!docs || !(docs instanceof YArray)) {
          console.warn('❌ [DocsStore.createDoc] pages YArray 不存在，自动创建！');
          docs = new YArray();
          meta.set('pages', docs);
        }

        console.log('📝 [DocsStore.createDoc] 添加到 pages YArray，当前文档数:', docs.length);
        docs.push([
          new YMap([
            ['id', id],
            ['title', ''],
            ['createDate', Date.now()],
            ['tags', new YArray()],
          ]),
        ]);
        console.log('✅ [DocsStore.createDoc] 添加成功，新文档数:', docs.length);
      },
      { force: true }
    );
    
    console.log('📝 [DocsStore.createDoc] transact 完成，返回 ID:', id);

    return id;
  }

  watchDocIds() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(yjsObserve),
      map(meta => {
        if (meta instanceof YArray) {
          return meta.map(v => v.get('id') as string);
        } else {
          return [];
        }
      })
    );
  }

  watchAllDocUpdatedDate() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(pages => yjsObservePath(pages, '*.updatedDate')),
      map(pages => {
        if (pages instanceof YArray) {
          return pages.map(v => ({
            id: v.get('id') as string,
            updatedDate: v.get('updatedDate') as number | undefined,
          }));
        } else {
          return [];
        }
      })
    );
  }

  watchAllDocTagIds() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(pages => yjsObservePath(pages, '*.tags')),
      map(pages => {
        if (pages instanceof YArray) {
          return pages.map(v => ({
            id: v.get('id') as string,
            tags: (() => {
              const tags = v.get('tags');
              if (tags instanceof YArray) {
                return tags.toJSON() as string[];
              }
              return (tags ?? []) as string[];
            })(),
          }));
        } else {
          return [];
        }
      })
    );
  }

  watchAllDocCreateDate() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(pages => yjsObservePath(pages, '*.createDate')),
      map(pages => {
        if (pages instanceof YArray) {
          return pages.map(v => ({
            id: v.get('id') as string,
            createDate: (v.get('createDate') ?? 0) as number,
          }));
        } else {
          return [];
        }
      })
    );
  }

  watchNonTrashDocIds() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(pages => yjsObservePath(pages, '*.trash')),
      map(meta => {
        if (meta instanceof YArray) {
          return meta
            .map(v => (v.get('trash') ? null : v.get('id')))
            .filter(Boolean) as string[];
        } else {
          return [];
        }
      })
    );
  }

  watchTrashDocIds() {
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(pages => yjsObservePath(pages, '*.trash')),
      map(meta => {
        if (meta instanceof YArray) {
          return meta
            .map(v => (v.get('trash') ? v.get('id') : null))
            .filter(Boolean) as string[];
        } else {
          return [];
        }
      })
    );
  }

  watchDocMeta(id: string) {
    let docMetaIndexCache = -1;
    return yjsGetPath(
      this.workspaceService.workspace.rootYDoc.getMap('meta'),
      'pages'
    ).pipe(
      switchMap(yjsObserve),
      map(meta => {
        if (meta instanceof YArray) {
          if (docMetaIndexCache >= 0) {
            const doc = meta.get(docMetaIndexCache);
            if (doc && doc.get('id') === id) {
              return doc as YMap<any>;
            }
          }

          // meta is YArray, `for-of` is faster then `for`
          let i = 0;
          for (const doc of meta) {
            if (doc && doc.get('id') === id) {
              docMetaIndexCache = i;
              return doc as YMap<any>;
            }
            i++;
          }
          return null;
        } else {
          return null;
        }
      }),
      switchMap(yjsObserveDeep),
      map(meta => {
        if (meta instanceof YMap) {
          return meta.toJSON() as Partial<DocMeta>;
        } else {
          return {};
        }
      })
    );
  }

  watchDocListReady() {
    
    return this.workspaceService.workspace.engine.doc
      .docState$(this.workspaceService.workspace.id)
      .pipe(
        map(state => {
          // 如果文档已加载且可用，即使同步状态未完成也认为就绪
          // 这解决了服务器模式下同步状态检查导致的无限等待问题
          const ready = state.synced || (state.ready && state.loaded);
          return ready;
        }),
        // 添加超时机制：如果5秒内没有同步完成，仍然允许继续
        timeout(5000),
        catchError(error => {
          // 超时时返回true，允许文档加载继续
          return of(true);
        })
      );
  }

  setDocMeta(id: string, meta: Partial<DocMeta>) {
    this.workspaceService.workspace.docCollection.meta.setDocMeta(id, meta);
  }

  setDocPrimaryModeSetting(id: string, mode: DocMode) {
    return this.docPropertiesStore.updateDocProperties(id, {
      primaryMode: mode,
    });
  }

  getDocPrimaryModeSetting(id: string) {
    return this.docPropertiesStore.getDocProperties(id)?.primaryMode;
  }

  watchDocPrimaryModeSetting(id: string) {
    return this.docPropertiesStore.watchDocProperties(id).pipe(
      map(config => config?.primaryMode),
      distinctUntilChanged((p, c) => p === c)
    );
  }

  waitForDocLoadReady(id: string) {
    return this.workspaceService.workspace.engine.doc.waitForDocLoaded(id);
  }

  addPriorityLoad(id: string, priority: number) {
    return this.workspaceService.workspace.engine.doc.addPriority(id, priority);
  }
}
