import type {
  StoreClient,
  WorkerInitOptions,
} from '@yunke/nbstore/worker/client';
import { Entity } from '@toeverything/infra';

import type { NbstoreService } from '../../storage';
import { WorkspaceEngineBeforeStart } from '../events';
import type { WorkspaceService } from '../services/workspace';

export class WorkspaceEngine extends Entity<{
  isSharedMode?: boolean;
  engineWorkerInitOptions: WorkerInitOptions;
}> {
  client?: StoreClient;
  started = false;

  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly nbstoreService: NbstoreService
  ) {
    super();
  }

  get doc() {
    if (!this.client) {
      throw new Error('引擎未初始化');
    }
    
    if (!this.client.docFrontend) {
      throw new Error('文档前端未初始化');
    }
    
    return this.client.docFrontend;
  }

  get blob() {
    if (!this.client) {
      throw new Error('引擎未初始化');
    }
    return this.client.blobFrontend;
  }

  get indexer() {
    if (!this.client) {
      throw new Error('引擎未初始化');
    }
    return this.client.indexerFrontend;
  }

  get awareness() {
    if (!this.client) {
      throw new Error('引擎未初始化');
    }
    return this.client.awarenessFrontend;
  }

  start() {
    if (this.started) {
      throw new Error('引擎已启动');
    }
    this.started = true;

    
    if (!this.props) {
      throw new Error('WorkspaceEngine props not initialized');
    }
    
    if (!this.props.engineWorkerInitOptions) {
      console.error('❌ [WorkspaceEngine] engineWorkerInitOptions未定义!');
      console.error('props:', this.props);
      throw new Error('WorkspaceEngine engineWorkerInitOptions not initialized');
    }
    
    if (!this.nbstoreService) {
      throw new Error('NbstoreService not initialized');
    }
    
    if (!this.workspaceService?.workspace) {
      throw new Error('WorkspaceService or workspace not initialized');
    }

    try {
      const { store, dispose } = this.nbstoreService.openStore(
        (this.props.isSharedMode ? 'shared:' : '') +
          `workspace:${this.workspaceService.workspace.flavour}:${this.workspaceService.workspace.id}`,
        this.props.engineWorkerInitOptions
      );
      this.client = store;
      this.disposables.push(dispose);
      this.eventBus.emit(WorkspaceEngineBeforeStart, this);

      const rootDoc = this.workspaceService.workspace.docCollection.doc;
      // priority load root doc
      this.doc.addPriority(rootDoc.guid, 100);
      this.doc.start();
      this.disposables.push(() => this.doc.stop());

      // fully migrate blobs from v1 to v2, its won't do anything if v1 storage is not exist
      // 🔧 Bug #15 修复：记录 v1 blob 迁移错误，便于调试
      store.blobFrontend.fullDownload('v1').catch((error) => {
        console.warn('[WorkspaceEngine] V1 blob 迁移失败:', error);
      });
    } catch (error) {
      this.started = false;
      throw error;
    }
  }
}
