import type {
  StoreClient,
  WorkerInitOptions,
} from '@affine/nbstore/worker/client';
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
    // 🛡️ Android WebView专用：增强防御性检查
    if (!this.client) {
      console.error('❌ [WorkspaceEngine.doc] 客户端未初始化');
      throw new Error('引擎未初始化');
    }
    
    if (!this.client.docFrontend) {
      console.error('❌ [WorkspaceEngine.doc] docFrontend未初始化');
      throw new Error('文档前端未初始化');
    }
    
    // 检查docFrontend是否有必要的方法
    const docFrontend = this.client.docFrontend;
    if (typeof docFrontend.addPriority !== 'function') {
      console.warn('⚠️ [WorkspaceEngine.doc] docFrontend缺少addPriority方法');
    }
    
    console.log('✅ [WorkspaceEngine.doc] 返回有效的docFrontend');
    return docFrontend;
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

    // 🛡️ Android WebView专用：添加防御性检查
    console.log('🚀 [WorkspaceEngine] 开始启动引擎');
    console.log('  - workspaceService存在:', !!this.workspaceService);
    console.log('  - workspace存在:', !!this.workspaceService?.workspace);
    console.log('  - props存在:', !!this.props);
    console.log('  - engineWorkerInitOptions存在:', !!this.props?.engineWorkerInitOptions);
    console.log('  - nbstoreService存在:', !!this.nbstoreService);
    
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
      store.blobFrontend.fullDownload('v1').catch(() => {
        // should never reach here
      });
      
      console.log('✅ [WorkspaceEngine] 引擎启动成功');
    } catch (error) {
      console.error('❌ [WorkspaceEngine] 引擎启动失败:', error);
      this.started = false; // 重置状态
      throw error;
    }
  }
}
