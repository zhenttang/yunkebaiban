import { Service } from '@toeverything/infra';

import { WorkspaceEngine } from '../entities/engine';
import type { WorkspaceScope } from '../scopes/workspace';

export class WorkspaceEngineService extends Service {
  private _engine: WorkspaceEngine | null = null;
  get engine() {
    if (!this._engine) {
      
      if (!this.workspaceScope) {
        throw new Error('WorkspaceScope not initialized');
      }
      
      if (!this.workspaceScope.props) {
        throw new Error('WorkspaceScope props not initialized');
      }
      
      if (!this.workspaceScope.props.openOptions) {
        throw new Error('WorkspaceScope openOptions not initialized');
      }
      
      if (!this.workspaceScope.props.engineWorkerInitOptions) {
        console.error('❌ [WorkspaceEngineService] engineWorkerInitOptions未定义!');
        console.error('workspaceScope.props:', this.workspaceScope.props);
        throw new Error('WorkspaceScope engineWorkerInitOptions not initialized');
      }
      
      this._engine = this.framework.createEntity(WorkspaceEngine, {
        isSharedMode: this.workspaceScope.props.openOptions.isSharedMode,
        engineWorkerInitOptions:
          this.workspaceScope.props.engineWorkerInitOptions,
      });
    }
    return this._engine;
  }

  constructor(private readonly workspaceScope: WorkspaceScope) {
    super();
  }

  override dispose(): void {
    try {
      this._engine?.dispose();
      this._engine = null;
    } catch (error) {
      console.error('❌ [WorkspaceEngineService] 清理失败:', error);
    }
    super.dispose();
  }
}
