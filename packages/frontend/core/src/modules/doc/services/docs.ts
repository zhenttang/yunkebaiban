import { DebugLogger } from '@affine/debug';
import { Unreachable } from '@affine/env/constant';
import { replaceIdMiddleware } from '@blocksuite/affine/shared/adapters';
import type { AffineTextAttributes } from '@blocksuite/affine/shared/types';
import type { DeltaInsert } from '@blocksuite/affine/store';
import { Slice, Text, Transformer } from '@blocksuite/affine/store';
import { ObjectPool, Service } from '@toeverything/infra';
import { combineLatest, map } from 'rxjs';

import { initDocFromProps } from '../../../blocksuite/initialization';
import { getAFFiNEWorkspaceSchema } from '../../workspace';
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
    console.log('📖 [DocsService.open] 开始打开文档:', docId);
    
    const docRecord = this.list.doc$(docId).value;
    console.log('📖 [DocsService.open] docRecord:', docRecord);
    
    if (!docRecord) {
      console.error('❌ [DocsService.open] 文档记录未找到:', docId);
      throw new Error('文档记录未找到');
    }
    
    const blockSuiteDoc = this.store.getBlockSuiteDoc(docId);
    console.log('📖 [DocsService.open] blockSuiteDoc:', blockSuiteDoc);
    
    if (!blockSuiteDoc) {
      console.error('❌ [DocsService.open] BlockSuite 文档未找到:', docId);
      throw new Error('文档未找到');
    }

    const exists = this.pool.get(docId);
    if (exists) {
      console.log('📖 [DocsService.open] 从池中获取已存在的文档:', docId);
      return { doc: exists.obj, release: exists.release };
    }

    console.log('📖 [DocsService.open] 创建新的文档实例:', docId);
    const docScope = this.framework.createScope(DocScope, {
      docId,
      blockSuiteDoc,
      record: docRecord,
    });

    try {
      blockSuiteDoc.load();
      console.log('✅ [DocsService.open] BlockSuite 文档加载成功');
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

    console.log('✅ [DocsService.open] 文档打开成功:', docId);
    return { doc: obj, release };
  }

  createDoc(options: DocCreateOptions = {}) {
    console.log('📝 [DocsService.createDoc] 开始创建文档:', options);
    
    for (const middleware of this.docCreateMiddlewares) {
      options = middleware.beforeCreate
        ? middleware.beforeCreate(options)
        : options;
    }
    
    console.log('📝 [DocsService.createDoc] 中间件处理后的选项:', options);
    
    const id = this.store.createDoc(options.id);
    console.log('📝 [DocsService.createDoc] 创建的文档ID:', id);
    
    const docStore = this.store.getBlockSuiteDoc(id);
    if (!docStore) {
      console.error('❌ [DocsService.createDoc] 创建文档失败，无法获取 BlockSuite 文档');
      throw new Error('创建文档失败');
    }

    console.log('📝 [DocsService.createDoc] BlockSuite 文档创建成功:', docStore);
    
    if (options.skipInit !== true) {
      initDocFromProps(docStore, options.docProps, options);
      console.log('📝 [DocsService.createDoc] 文档初始化完成');
    }
    
    const docRecord = this.list.doc$(id).value;
    console.log('📝 [DocsService.createDoc] 获取文档记录:', docRecord);
    
    if (!docRecord) {
      console.error('❌ [DocsService.createDoc] 无法获取文档记录, ID:', id);
      throw new Unreachable();
    }
    
    if (options.primaryMode) {
      docRecord.setPrimaryMode(options.primaryMode);
      console.log('📝 [DocsService.createDoc] 设置主要模式:', options.primaryMode);
    }
    
    if (options.isTemplate) {
      docRecord.setProperty('isTemplate', true);
      console.log('📝 [DocsService.createDoc] 设置为模板');
    }
    
    for (const middleware of this.docCreateMiddlewares) {
      middleware.afterCreate?.(docRecord, options);
      console.log('📝 [DocsService.createDoc] 执行 afterCreate 中间件');
    }
    
    docRecord.setCreatedAt(Date.now());
    docRecord.setUpdatedAt(Date.now());
    
    this.eventBus.emit(DocCreated, {
      doc: docRecord,
      docCreateOptions: options,
    });
    
    console.log('✅ [DocsService.createDoc] 文档创建完成:', id);
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
    ] as DeltaInsert<AffineTextAttributes>[]);
    const [frame] = doc.blockSuiteDoc.getBlocksByFlavour('affine:note');
    frame &&
      doc.blockSuiteDoc.addBlock(
        'affine:paragraph' as never, // TODO(eyhn): fix type
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
        schema: getAFFiNEWorkspaceSchema(),
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
        schema: getAFFiNEWorkspaceSchema(),
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
