import { Service } from '@toeverything/infra';

import { WorkspaceEngine } from '../entities/engine';
import type { WorkspaceScope } from '../scopes/workspace';

export class WorkspaceEngineService extends Service {
  private _engine: WorkspaceEngine | null = null;
  get engine() {
    if (!this._engine) {
      // 🛡️ Android WebView专用：添加防御性检查
      console.log('🔧 [WorkspaceEngineService] 创建WorkspaceEngine');
      console.log('  - workspaceScope存在:', !!this.workspaceScope);
      console.log('  - workspaceScope.props存在:', !!this.workspaceScope?.props);
      console.log('  - openOptions存在:', !!this.workspaceScope?.props?.openOptions);
      console.log('  - engineWorkerInitOptions存在:', !!this.workspaceScope?.props?.engineWorkerInitOptions);
      
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
      
      console.log('✅ [WorkspaceEngineService] WorkspaceEngine创建成功');
    }
    return this._engine;
  }

  constructor(private readonly workspaceScope: WorkspaceScope) {
    super();
  }

  override dispose(): void {
    console.log('🧹 [WorkspaceEngineService] 开始清理');
    try {
      this._engine?.dispose();
      this._engine = null;
      console.log('✅ [WorkspaceEngineService] 清理成功');
    } catch (error) {
      console.error('❌ [WorkspaceEngineService] 清理失败:', error);
    }
    super.dispose();
  }
}
