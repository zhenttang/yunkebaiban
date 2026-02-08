import {
  catchErrorInto,
  effect,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
  Service,
} from '@toeverything/infra';
import { switchMap, tap } from 'rxjs';

import type { DesktopApiService } from '../../desktop-api';
import type { WorkspacesService } from '../../workspace';
import { _addLocalWorkspace } from '../../workspace-engine';

type BackupWorkspaceResult = Awaited<
  ReturnType<DesktopApiService['handler']['workspace']['getBackupWorkspaces']>
>;

/**
 * NEW-2: 备份信息类型
 */
export interface BackupInfo {
  id: string;
  workspaceId: string;
  timestamp: number;
  size: number;
  filename: string;
  path: string;
}

export class BackupService extends Service {
  constructor(
    private readonly desktopApiService: DesktopApiService,
    private readonly workspacesService: WorkspacesService
  ) {
    super();
  }

  isLoading$ = new LiveData(false);
  error$ = new LiveData<any>(null);

  pageBackupWorkspaces$ = new LiveData<BackupWorkspaceResult | undefined>(
    undefined
  );

  // NEW-2: 数据库备份列表
  dbBackups$ = new LiveData<BackupInfo[]>([]);
  autoBackupEnabled$ = new LiveData(false);

  readonly revalidate = effect(
    switchMap(() =>
      fromPromise(async () => {
        return this.desktopApiService.handler.workspace.getBackupWorkspaces();
      }).pipe(
        tap(data => {
          this.pageBackupWorkspaces$.setValue(data);
        }),
        catchErrorInto(this.error$),
        onStart(() => this.isLoading$.setValue(true)),
        onComplete(() => this.isLoading$.setValue(false))
      )
    )
  );

  async recoverBackupWorkspace(dbPath: string) {
    const result =
      await this.desktopApiService.handler.dialog.loadDBFile(dbPath);
    if (result.workspaceId) {
      _addLocalWorkspace(result.workspaceId);
      this.workspacesService.list.revalidate();
    }
    return result.workspaceId;
  }

  async deleteBackupWorkspace(backupWorkspaceId: string) {
    await this.desktopApiService.handler.workspace.deleteBackupWorkspace(
      backupWorkspaceId
    );
    this.revalidate();
  }

  // ====== NEW-2: 数据库自动备份 API ======

  /**
   * 创建指定工作区的备份
   */
  async createBackup(workspaceId: string): Promise<BackupInfo | null> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('createBackup' in handler)) return null;
      const result = await (handler as any).createBackup(workspaceId);
      await this.refreshBackupList();
      return result;
    } catch (error) {
      console.error('[BackupService] createBackup failed:', error);
      return null;
    }
  }

  /**
   * 备份所有工作区
   */
  async createAllBackups(): Promise<{ succeeded: number; failed: number }> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('createAllBackups' in handler)) return { succeeded: 0, failed: 0 };
      const result = await (handler as any).createAllBackups();
      await this.refreshBackupList();
      return result;
    } catch (error) {
      console.error('[BackupService] createAllBackups failed:', error);
      return { succeeded: 0, failed: 0 };
    }
  }

  /**
   * 获取备份列表
   */
  async refreshBackupList(workspaceId?: string): Promise<BackupInfo[]> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('listBackups' in handler)) return [];
      const backups = await (handler as any).listBackups(workspaceId);
      this.dbBackups$.setValue(backups ?? []);
      return backups ?? [];
    } catch (error) {
      console.error('[BackupService] refreshBackupList failed:', error);
      return [];
    }
  }

  /**
   * 从备份恢复
   */
  async restoreFromBackup(
    backupId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('restoreFromBackup' in handler))
        return { success: false, error: '不支持' };
      return await (handler as any).restoreFromBackup(backupId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 删除备份
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('deleteBackup' in handler)) return false;
      const result = await (handler as any).deleteBackup(backupId);
      await this.refreshBackupList();
      return result;
    } catch (error) {
      console.error('[BackupService] deleteBackup failed:', error);
      return false;
    }
  }

  /**
   * 启动/停止自动备份
   */
  async setAutoBackup(enabled: boolean): Promise<void> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (enabled) {
        if ('startAutoBackup' in handler) await (handler as any).startAutoBackup();
      } else {
        if ('stopAutoBackup' in handler) await (handler as any).stopAutoBackup();
      }
      this.autoBackupEnabled$.setValue(enabled);
    } catch (error) {
      console.error('[BackupService] setAutoBackup failed:', error);
    }
  }

  /**
   * 查询自动备份状态
   */
  async refreshAutoBackupStatus(): Promise<void> {
    try {
      const handler = this.desktopApiService.handler.workspace;
      if (!('getAutoBackupStatus' in handler)) return;
      const status = await (handler as any).getAutoBackupStatus();
      this.autoBackupEnabled$.setValue(status?.enabled ?? false);
    } catch {
      // ignore
    }
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
