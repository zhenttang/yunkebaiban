import { DebugLogger } from '@yunke/debug';
import { Unreachable } from '@yunke/env/constant';
import { replaceIdMiddleware } from '@blocksuite/yunke/shared/adapters';
import type { YunkeTextAttributes } from '@blocksuite/yunke/shared/types';
import type { DeltaInsert } from '@blocksuite/yunke/store';
import { Slice, Text, Transformer } from '@blocksuite/yunke/store';
import { ObjectPool, Service } from '@toeverything/infra';
import { combineLatest, map } from 'rxjs';

import { initDocFromProps } from '../../../blocksuite/initialization';
import { getYUNKEWorkspaceSchema } from '../../workspace';
import type { Doc } from '../entities/doc';
import { DocRecordList } from '../entities/record-list';
import { DocCreated, DocInitialized } from '../events';
import type { DocCreateMiddleware } from '../providers/doc-create-middleware';
import { DocScope } from '../scopes/doc';
import type { DocPropertiesStore } from '../stores/doc-properties';
import type { DocsStore } from '../stores/docs';
import type { DocCreateOptions } from '../types';
import { DocService } from './doc';

const logger = new DebugLogger('DocsService');

export class DocsService extends Service {
  list = this.framework.createEntity(DocRecordList);

  pool = new ObjectPool<string, Doc>({
    onDelete(obj) {
      obj.scope.dispose();
    },
  });

  /**
   * Get all property values of a property, used for search
   *
   * Results may include docs in trash or deleted docs
   * Legacy property data such as old `journal` will not be included in the values
   */
  propertyValues$(propertyKey: string) {
    return combineLatest([
      this.store.watchDocIds(),
      this.docPropertiesStore.watchPropertyAllValues(propertyKey),
    ]).pipe(
      map(([docIds, propertyValues]) => {
        const result = new Map<string, string | undefined>();
        for (const docId of docIds) {
          result.set(docId, propertyValues.get(docId));
        }
        return result;
      })
    );
  }

  /**
   * used for search
   */
  allDocsCreatedDate$() {
    return this.store.watchAllDocCreateDate();
  }

  /**
   * used for search
   */
  allDocsUpdatedDate$() {
    return this.store.watchAllDocUpdatedDate();
  }

  allDocsTagIds$() {
    return this.store.watchAllDocTagIds();
  }

  allDocIds$() {
    return this.store.watchDocIds();
  }

  allNonTrashDocIds$() {
    return this.store.watchNonTrashDocIds();
  }

  allTrashDocIds$() {
    return this.store.watchTrashDocIds();
  }

  constructor(
    private readonly store: DocsStore,
    private readonly docPropertiesStore: DocPropertiesStore,
    private readonly docCreateMiddlewares: DocCreateMiddleware[]
  ) {
    super();
  }

  loaded(docId: string) {
    const exists = this.pool.get(docId);
    if (exists) {
      return { doc: exists.obj, release: exists.release };
    }
    return null;
  }

  open(docId: string) {
    const docRecord = this.list.doc$(docId).value;
    
    if (!docRecord) {
      console.error('❌ [DocsService.open] 文档记录未找到:', docId);
      throw new Error('文档记录未找到');
    }
    
    const blockSuiteDoc = this.store.getBlockSuiteDoc(docId);
    
    // 严格检查：确保 blockSuiteDoc 不是 null 或 undefined
    if (!blockSuiteDoc) {
      console.error('❌ [DocsService.open] BlockSuite 文档未找到:', {
        docId,
        blockSuiteDoc,
        workspace: !!this.store.workspaceService.workspace,
        docCollection: !!this.store.workspaceService.workspace?.docCollection,
      });
      throw new Error(`文档未找到: ${docId}`);
    }

    const exists = this.pool.get(docId);
    if (exists) {
      return { doc: exists.obj, release: exists.release };
    }

    const docScope = this.framework.createScope(DocScope, {
      docId,
      blockSuiteDoc,
      record: docRecord,
    });

    try {
      blockSuiteDoc.load();
    } catch (e) {
      console.error('❌ [DocsService.open] 加载文档失败:', {
        docId,
        error: e,
      });
      logger.error('加载文档失败', {
        docId,
        error: e,
      });
    }

    const doc = docScope.get(DocService).doc;

    doc.scope.emitEvent(DocInitialized, doc);

    const { obj, release } = this.pool.put(docId, doc);

    return { doc: obj, release };
  }

  createDoc(options: DocCreateOptions = {}) {
    
    for (const middleware of this.docCreateMiddlewares) {
      options = middleware.beforeCreate
        ? middleware.beforeCreate(options)
        : options;
    }
    
    
    const id = this.store.createDoc(options.id);
    
    const docStore = this.store.getBlockSuiteDoc(id);
    if (!docStore) {
      console.error('❌ [DocsService.createDoc] 创建文档失败，无法获取 BlockSuite 文档');
      throw new Error('创建文档失败');
    }

    
    if (options.skipInit !== true) {
      initDocFromProps(docStore, options.docProps, options);
    }
    
    const docRecord = this.list.doc$(id).value;
    
    if (!docRecord) {
      console.error('❌ [DocsService.createDoc] 无法获取文档记录, ID:', id);
      throw new Unreachable();
    }
    
    if (options.primaryMode) {
      docRecord.setPrimaryMode(options.primaryMode);
    }
    
    if (options.isTemplate) {
      docRecord.setProperty('isTemplate', true);
    }
    
    for (const middleware of this.docCreateMiddlewares) {
      middleware.afterCreate?.(docRecord, options);
    }
    
    docRecord.setCreatedAt(Date.now());
    docRecord.setUpdatedAt(Date.now());
    
    this.eventBus.emit(DocCreated, {
      doc: docRecord,
      docCreateOptions: options,
    });
    
    return docRecord;
  }

  async addLinkedDoc(targetDocId: string, linkedDocId: string) {
    const { doc, release } = this.open(targetDocId);
    const disposePriorityLoad = doc.addPriorityLoad(10);
    await doc.waitForSyncReady();
    disposePriorityLoad();
    const text = new Text([
      {
        insert: ' ',
        attributes: {
          reference: {
            type: 'LinkedPage',
            pageId: linkedDocId,
          },
        },
      },
    ] as DeltaInsert<YunkeTextAttributes>[]);
    const [frame] = doc.blockSuiteDoc.getBlocksByFlavour('yunke:note');
    frame &&
      doc.blockSuiteDoc.addBlock(
        'yunke:paragraph' as never, // TODO(eyhn): fix type
        { text },
        frame.id
      );
    release();
  }

  async changeDocTitle(docId: string, newTitle: string) {
    const { doc, release } = this.open(docId);
    const disposePriorityLoad = doc.addPriorityLoad(10);
    await doc.waitForSyncReady();
    disposePriorityLoad();
    doc.changeDocTitle(newTitle);
    release();
  }

  async duplicate(sourceDocId: string, _targetDocId?: string) {
    const targetDocId = _targetDocId ?? this.createDoc().id;

    // check if source doc is removed
    if (this.list.doc$(sourceDocId).value?.trash$.value) {
      console.warn(
        `Template doc(id: ${sourceDocId}) is removed, skip duplicate`
      );
      return targetDocId;
    }

    const { release: sourceRelease, doc: sourceDoc } = this.open(sourceDocId);
    const { release: targetRelease, doc: targetDoc } = this.open(targetDocId);
    await sourceDoc.waitForSyncReady();

    // duplicate doc content
    try {
      const sourceBsDoc = this.store.getBlockSuiteDoc(sourceDocId);
      const targetBsDoc = this.store.getBlockSuiteDoc(targetDocId);
      if (!sourceBsDoc) throw new Error('源文档未找到');
      if (!targetBsDoc) throw new Error('目标文档未找到');

      // clear the target doc (both surface and note)
      targetBsDoc.root?.children.forEach(child =>
        targetBsDoc.deleteBlock(child)
      );

      const collection = this.store.getBlocksuiteCollection();
      const transformer = new Transformer({
        schema: getYUNKEWorkspaceSchema(),
        blobCRUD: collection.blobSync,
        docCRUD: {
          create: (id: string) => {
            this.createDoc({ id });
            const store = collection.getDoc(id)?.getStore({ id });
            if (!store) {
              throw new Error('创建文档失败');
            }
            return store;
          },
          get: (id: string) => collection.getDoc(id)?.getStore({ id }) ?? null,
          delete: (id: string) => collection.removeDoc(id),
        },
        middlewares: [replaceIdMiddleware(collection.idGenerator)],
      });
      const slice = Slice.fromModels(sourceBsDoc, [
        ...(sourceBsDoc.root?.children ?? []),
      ]);
      const snapshot = transformer.sliceToSnapshot(slice);
      if (!snapshot) {
        throw new Error('创建快照失败');
      }
      await transformer.snapshotToSlice(
        snapshot,
        targetBsDoc,
        targetBsDoc.root?.id
      );
    } catch (e) {
      logger.error('复制文档失败', {
        sourceDocId,
        targetDocId,
        originalTargetDocId: _targetDocId,
        error: e,
      });
    } finally {
      sourceRelease();
      targetRelease();
    }

    // duplicate doc meta
    targetDoc.record.setMeta({
      tags: sourceDoc.meta$.value.tags,
    });

    // duplicate doc title
    const originalTitle = sourceDoc.title$.value;
    const lastDigitRegex = /\((\d+)\)$/;
    const match = originalTitle.match(lastDigitRegex);
    const newNumber = match ? parseInt(match[1], 10) + 1 : 1;
    const newPageTitle =
      originalTitle.replace(lastDigitRegex, '') + `(${newNumber})`;
    targetDoc.changeDocTitle(newPageTitle);

    // duplicate doc properties
    const properties = sourceDoc.getProperties();
    const removedProperties = ['id', 'isTemplate', 'journal'];
    removedProperties.forEach(key => {
      delete properties[key];
    });
    targetDoc.updateProperties(properties);

    return targetDocId;
  }

  /**
   * Duplicate a doc from template
   * @param sourceDocId - the id of the source doc to be duplicated
   * @param _targetDocId - the id of the target doc to be duplicated, if not provided, a new doc will be created
   * @returns the id of the new doc
   */
  async duplicateFromTemplate(sourceDocId: string, _targetDocId?: string) {
    const targetDocId = _targetDocId ?? this.createDoc().id;

    // check if source doc is removed
    if (this.list.doc$(sourceDocId).value?.trash$.value) {
      console.warn(
        `Template doc(id: ${sourceDocId}) is removed, skip duplicate`
      );
      return targetDocId;
    }

    const { release: sourceRelease, doc: sourceDoc } = this.open(sourceDocId);
    const { release: targetRelease, doc: targetDoc } = this.open(targetDocId);
    await sourceDoc.waitForSyncReady();

    // duplicate doc content
    try {
      const sourceBsDoc = this.store.getBlockSuiteDoc(sourceDocId);
      const targetBsDoc = this.store.getBlockSuiteDoc(targetDocId);
      if (!sourceBsDoc) throw new Error('源文档未找到');
      if (!targetBsDoc) throw new Error('目标文档未找到');

      // clear the target doc (both surface and note)
      targetBsDoc.root?.children.forEach(child =>
        targetBsDoc.deleteBlock(child)
      );

      const collection = this.store.getBlocksuiteCollection();
      const transformer = new Transformer({
        schema: getYUNKEWorkspaceSchema(),
        blobCRUD: collection.blobSync,
        docCRUD: {
          create: (id: string) => {
            this.createDoc({ id });
            const store = collection.getDoc(id)?.getStore({ id });
            if (!store) {
              throw new Error('创建文档失败');
            }
            return store;
          },
          get: (id: string) => collection.getDoc(id)?.getStore({ id }) ?? null,
          delete: (id: string) => collection.removeDoc(id),
        },
        middlewares: [replaceIdMiddleware(collection.idGenerator)],
      });
      const slice = Slice.fromModels(sourceBsDoc, [
        ...(sourceBsDoc.root?.children ?? []),
      ]);
      const snapshot = transformer.sliceToSnapshot(slice);
      if (!snapshot) {
        throw new Error('创建快照失败');
      }
      await transformer.snapshotToSlice(
        snapshot,
        targetBsDoc,
        targetBsDoc.root?.id
      );
    } catch (e) {
      logger.error('复制文档失败', {
        sourceDocId,
        targetDocId,
        originalTargetDocId: _targetDocId,
        error: e,
      });
    } finally {
      sourceRelease();
      targetRelease();
    }

    // duplicate doc properties
    const properties = sourceDoc.getProperties();
    const removedProperties = ['id', 'isTemplate', 'journal'];
    removedProperties.forEach(key => {
      delete properties[key];
    });
    targetDoc.updateProperties(properties);

    return targetDocId;
  }
}
