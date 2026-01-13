import type { DocMode, RootBlockModel } from '@blocksuite/yunke/model';
import { Entity } from '@toeverything/infra';
import { throttle } from 'lodash-es';
import type { Transaction } from 'yjs';

import type { DocProperties } from '../../db';
import type { WorkspaceService } from '../../workspace';
import type { DocScope } from '../scopes/doc';
import type { DocsStore } from '../stores/docs';

export class Doc extends Entity {
  constructor(
    public readonly scope: DocScope,
    private readonly store: DocsStore,
    private readonly workspaceService: WorkspaceService
  ) {
    super();

    // 防御性检查：确保 scope.props 存在
    if (!this.scope.props) {
      throw new Error(`DocScope props is undefined`);
    }

    // 防御性检查：确保blockSuiteDoc存在
    if (!this.scope.props.blockSuiteDoc) {
      throw new Error(`DocScope blockSuiteDoc is undefined for doc ${this.scope.props.docId}`);
    }

    // 防御性检查：确保record存在
    if (!this.scope.props.record) {
      throw new Error(`DocScope record is undefined for doc ${this.scope.props.docId}`);
    }

    const handleTransactionThrottled = throttle(
      (trx: Transaction) => {
        if (trx.local) {
          this.setUpdatedAt(Date.now());
        }
      },
      1000,
      {
        leading: true,
        trailing: true,
      }
    );
    this.yDoc.on('afterTransaction', handleTransactionThrottled);

    this.disposables.push(() => {
      this.yDoc.off('afterTransaction', handleTransactionThrottled);
      handleTransactionThrottled.cancel();
    });
  }

  /**
   * for convenience
   */
  get workspace() {
    return this.workspaceService.workspace;
  }

  get id() {
    return this.scope.props.docId;
  }

  // 使用 getter 确保在访问时 blockSuiteDoc 已经初始化
  public get yDoc() {
    if (!this.scope.props.blockSuiteDoc) {
      throw new Error(`DocScope blockSuiteDoc is undefined for doc ${this.scope.props.docId}`);
    }
    return this.scope.props.blockSuiteDoc.spaceDoc;
  }

  public get blockSuiteDoc() {
    if (!this.scope.props.blockSuiteDoc) {
      throw new Error(`DocScope blockSuiteDoc is undefined for doc ${this.scope.props.docId}`);
    }
    return this.scope.props.blockSuiteDoc;
  }

  // 使用 getter 确保在访问时 record 已经初始化
  public get record() {
    if (!this.scope.props) {
      throw new Error(`DocScope props is undefined for doc ${this.scope.props?.docId || 'unknown'}`);
    }
    if (!this.scope.props.record) {
      throw new Error(`DocScope record is undefined for doc ${this.scope.props.docId}`);
    }
    return this.scope.props.record;
  }

  // 使用 getter 延迟求值，确保 record 已经初始化
  get meta$() {
    return this.record.meta$;
  }

  get properties$() {
    return this.record.properties$;
  }

  get primaryMode$() {
    return this.record.primaryMode$;
  }

  get title$() {
    return this.record.title$;
  }

  get trash$() {
    return this.record.trash$;
  }

  get createdAt$() {
    return this.record.createdAt$;
  }

  get updatedAt$() {
    return this.record.updatedAt$;
  }

  get createdBy$() {
    return this.record.createdBy$;
  }

  get updatedBy$() {
    return this.record.updatedBy$;
  }

  setCreatedAt(createdAt: number) {
    this.record.setMeta({ createDate: createdAt });
  }

  setUpdatedAt(updatedAt: number) {
    this.record.setMeta({ updatedDate: updatedAt });
  }

  setCreatedBy(createdBy: string) {
    this.setProperty('createdBy', createdBy);
  }

  setUpdatedBy(updatedBy: string) {
    this.setProperty('updatedBy', updatedBy);
  }

  customProperty$(propertyId: string) {
    return this.record.customProperty$(propertyId);
  }

  setProperty(propertyId: string, value: string) {
    return this.record.setProperty(propertyId, value);
  }

  updateProperties(properties: Partial<DocProperties>) {
    return this.record.updateProperties(properties);
  }

  getProperties() {
    return this.record.getProperties();
  }

  setCustomProperty(propertyId: string, value: string) {
    return this.record.setCustomProperty(propertyId, value);
  }

  setPrimaryMode(mode: DocMode) {
    return this.record.setPrimaryMode(mode);
  }

  getPrimaryMode() {
    return this.record.getPrimaryMode();
  }

  togglePrimaryMode() {
    this.setPrimaryMode(
      (this.getPrimaryMode() === 'edgeless' ? 'page' : 'edgeless') as DocMode
    );
  }

  moveToTrash() {
    return this.record.moveToTrash();
  }

  restoreFromTrash() {
    return this.record.restoreFromTrash();
  }

  waitForSyncReady() {
    return this.store.waitForDocLoadReady(this.id);
  }

  addPriorityLoad(priority: number) {
    return this.store.addPriorityLoad(this.id, priority);
  }

  changeDocTitle(newTitle: string) {
    const pageBlock = this.blockSuiteDoc.getBlocksByFlavour('yunke:page').at(0)
      ?.model as RootBlockModel | undefined;
    if (pageBlock) {
      this.blockSuiteDoc.transact(() => {
        pageBlock.props.title.delete(0, pageBlock.props.title.length);
        pageBlock.props.title.insert(newTitle, 0);
      });
      this.record.setMeta({ title: newTitle });
    }
  }
}
