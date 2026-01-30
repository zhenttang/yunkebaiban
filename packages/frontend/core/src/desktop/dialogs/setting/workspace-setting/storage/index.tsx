import { notify, useConfirmModal } from '@yunke/component';
import { Button } from '@yunke/component/ui/button';
import { Switch } from '@yunke/component/ui/switch';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { useAppConfigStorage } from '@yunke/core/components/hooks/use-app-config-storage';
import {
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from '@yunke/core/modules/cloud-storage';
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import { WorkspacePermissionService } from '@yunke/core/modules/permissions';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService, useServiceOptional } from '@toeverything/infra';
import {
  CloudWorkspaceIcon,
  DatabaseTableViewIcon,
  FolderIcon,
  ProgressIcon,
  RemoveFolderIcon,
  UploadIcon,
} from '@blocksuite/icons/rc';
import bytes from 'bytes';
import { useCallback, useEffect, useState } from 'react';

import { EnableCloudPanel } from '../preference/enable-cloud';
import { BlobManagementPanel } from './blob-management';
import { DocSizePanel } from './doc-size-panel';
import { DesktopExportPanel } from './export';
import { StorageViewer } from './storage-viewer';
import { WebExportPanel } from './web-export';
import { WorkspaceQuotaPanel } from './workspace-quota';
import * as styles from './style.css';

export const WorkspaceSettingStorage = ({
  onCloseSetting,
}: {
  onCloseSetting: () => void;
}) => {
  const t = useI18n();
  const workspace = useService(WorkspaceService).workspace;
  const [appConfig] = useAppConfigStorage();
  const workspacePermissionService = useService(
    WorkspacePermissionService
  ).permission;
  const isTeam = useLiveData(workspacePermissionService.isTeam$);
  const isOwner = useLiveData(workspacePermissionService.isOwner$);
  const isLocalWorkspace = workspace.flavour === 'local';
  const isWebRuntime = BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb;
  const isOfflineEnabled = Boolean(appConfig.offline?.enabled);
  const showWebStorageInfo = isWebRuntime && isLocalWorkspace;
  const globalDialogService = useService(GlobalDialogService);
  const desktopApi = useServiceOptional(DesktopApiService);
  const workspaceName = useLiveData(workspace.name$) ?? 'workspace';
  const [storagePath, setStoragePath] = useState<string | null>(null);
  const [oldStoragePath, setOldStoragePath] = useState<string | null>(null);
  const [storagePathLoading, setStoragePathLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [storageUsage, setStorageUsage] = useState<number | null>(null);
  const [storageQuota, setStorageQuota] = useState<number | null>(null);
  const [storageEstimateLoading, setStorageEstimateLoading] = useState(false);
  const { openConfirmModal } = useConfirmModal();
  
  // 云同步开关状态
  const [cloudSyncEnabledState, setCloudSyncEnabledState] = useState(() => isCloudSyncEnabled());
  const [cloudSyncPending, setCloudSyncPending] = useState(false);
  
  // 全局数据目录
  const [globalDataPath, setGlobalDataPath] = useState<string | null>(null);
  const [globalDataPathLoading, setGlobalDataPathLoading] = useState(false);
  const [globalMigrating, setGlobalMigrating] = useState(false);
  const storageLocationTitle = isLocalWorkspace
    ? '保存位置：本地'
    : '保存位置：云端';
  const storageLocationDesc = isLocalWorkspace
    ? '数据写入本机存储（IndexedDB/SQLite），离线可用；可在此页启用云端同步。'
    : '数据写入云端服务器，需要联网；如需离线使用，请创建本地工作区。';
  const storageLocationName = (
    <div className={styles.rowTitle}>
      {isLocalWorkspace ? (
        <FolderIcon className={styles.rowIcon} />
      ) : (
        <CloudWorkspaceIcon className={styles.rowIcon} />
      )}
      <span>{storageLocationTitle}</span>
    </div>
  );
  const storageTypeName = (
    <div className={styles.rowTitle}>
      <DatabaseTableViewIcon className={styles.rowIcon} />
      <span>存储类型</span>
    </div>
  );
  const storageUsageName = (
    <div className={styles.rowTitle}>
      <ProgressIcon className={styles.rowIcon} />
      <span>存储占用</span>
    </div>
  );
  const storagePathName = (
    <div className={styles.rowTitle}>
      <FolderIcon className={styles.rowIcon} />
      <span>本地存储路径</span>
    </div>
  );
  const oldStorageName = (
    <div className={styles.rowTitle}>
      <RemoveFolderIcon className={styles.rowIcon} />
      <span>旧存储文件</span>
    </div>
  );
  const importWorkspaceName = (
    <div className={styles.rowTitle}>
      <UploadIcon className={styles.rowIcon} />
      <span>导入工作区</span>
    </div>
  );
  
  const cloudSyncName = (
    <div className={styles.rowTitle}>
      <CloudWorkspaceIcon className={styles.rowIcon} />
      <span>云同步</span>
    </div>
  );
  
  const globalDataPathName = (
    <div className={styles.rowTitle}>
      <FolderIcon className={styles.rowIcon} />
      <span>全局数据目录</span>
    </div>
  );

  const canExport = !isTeam || isOwner;
  
  // 云同步开关切换处理
  const handleToggleCloudSync = useCallback(
    async (checked: boolean) => {
      setCloudSyncPending(true);
      
      try {
        setCloudSyncEnabled(checked);
        setCloudSyncEnabledState(checked);
        
        openConfirmModal({
          title: checked ? '云同步已开启' : '云同步已关闭',
          description: checked
            ? '本地数据将同步到云端，需要重新加载页面生效。'
            : '数据将仅保存在本地，需要重新加载页面生效。',
          confirmText: '立即重新加载',
          cancelText: '稍后',
          onConfirm: () => {
            window.location.reload();
          },
        });
      } catch (error) {
        console.error('云同步开关切换失败:', error);
        notify.error({ title: '操作失败' });
        setCloudSyncEnabledState(!checked);
      } finally {
        setCloudSyncPending(false);
      }
    },
    [openConfirmModal]
  );
  
  // 获取全局数据目录
  useEffect(() => {
    if (!BUILD_CONFIG.isElectron) {
      console.log('[Storage] 非 Electron 环境，跳过获取全局数据目录');
      return;
    }
    
    console.log('[Storage] desktopApi:', desktopApi);
    console.log('[Storage] desktopApi.handler:', desktopApi?.handler);
    console.log('[Storage] desktopApi.handler.workspace:', desktopApi?.handler?.workspace);
    console.log('[Storage] getDefaultDataPath:', desktopApi?.handler?.workspace?.getDefaultDataPath);
    
    if (!desktopApi?.handler?.workspace?.getDefaultDataPath) {
      console.log('[Storage] getDefaultDataPath API 不可用');
      // 尝试使用当前工作区路径的父目录作为备选
      if (storagePath) {
        const parts = storagePath.split(/[/\\]/);
        // 找到 workspaces 目录
        const workspacesIndex = parts.findIndex(p => p === 'workspaces');
        if (workspacesIndex > 0) {
          const globalPath = parts.slice(0, workspacesIndex + 1).join('\\');
          console.log('[Storage] 从当前路径推断全局目录:', globalPath);
          setGlobalDataPath(globalPath);
        }
      }
      return;
    }
    
    let active = true;
    setGlobalDataPathLoading(true);
    console.log('[Storage] 开始调用 getDefaultDataPath...');
    
    desktopApi.handler.workspace
      .getDefaultDataPath()
      .then((result: { path: string; localPath: string }) => {
        console.log('[Storage] getDefaultDataPath 结果:', result);
        if (active) setGlobalDataPath(result.path);
      })
      .catch((error: Error) => {
        console.error('[Storage] getDefaultDataPath 失败:', error);
        if (active) setGlobalDataPath(null);
      })
      .finally(() => {
        if (active) setGlobalDataPathLoading(false);
      });
    return () => {
      active = false;
    };
  }, [desktopApi, storagePath]);
  
  // 修改全局数据目录
  const handleChangeGlobalDataPath = useCallback(async () => {
    console.log('[Storage] handleChangeGlobalDataPath 被调用');
    console.log('[Storage] dialog handlers:', desktopApi?.handler?.dialog);
    
    if (!desktopApi?.handler?.dialog?.selectDBFileLocation) {
      console.log('[Storage] selectDBFileLocation 不可用');
      notify.error({ title: '当前环境不支持选择目录' });
      return;
    }
    
    try {
      console.log('[Storage] 开始选择目录...');
      const result = await desktopApi.handler.dialog.selectDBFileLocation();
      console.log('[Storage] 选择结果:', result);
      
      if (result?.canceled || !result?.filePath) {
        console.log('[Storage] 用户取消选择');
        return;
      }
      
      // 询问是否迁移数据
      openConfirmModal({
        title: '更改全局数据目录',
        description: `新目录：${result.filePath}\n\n是否将现有数据迁移到新位置？选择"仅更改目录"将从新目录开始，现有数据保留在原位置。`,
        confirmText: '迁移数据',
        cancelText: '仅更改目录',
        onConfirm: async () => {
          console.log('[Storage] 开始迁移数据');
          console.log('[Storage] desktopApi.handler.workspace:', desktopApi?.handler?.workspace);
          console.log('[Storage] migrateAllDataToPath:', desktopApi?.handler?.workspace?.migrateAllDataToPath);
          
          // 迁移数据并更新配置
          const migrateFunc = desktopApi?.handler?.workspace?.migrateAllDataToPath;
          if (migrateFunc) {
            setGlobalMigrating(true);
            try {
              console.log('[Storage] 调用 migrateAllDataToPath:', result.filePath);
              const migrateResult = await migrateFunc(result.filePath);
              console.log('[Storage] 迁移结果:', migrateResult);
              
              if (migrateResult?.error) {
                notify.error({ title: '数据迁移失败', message: migrateResult.message || '未知错误' });
                setGlobalMigrating(false);
                return;
              }
              
              // 更新显示
              setGlobalDataPath(result.filePath + '\\workspaces');
              setGlobalMigrating(false);
              
              console.log('[Storage] 准备显示重启对话框');
              // 迁移成功，必须重启 - 延迟一点以确保之前的对话框已关闭
              setTimeout(() => {
                console.log('[Storage] 显示重启对话框');
                openConfirmModal({
                  title: '迁移完成，需要重启',
                  description: migrateResult.message || '数据已迁移到新目录，配置已更新。必须重启应用才能使用新位置。',
                  confirmText: '立即重启',
                  cancelText: '稍后重启',
                  onConfirm: async () => {
                    console.log('[Storage] 用户点击立即重启');
                    if (desktopApi?.handler?.ui?.restartApp) {
                      await desktopApi.handler.ui.restartApp();
                    } else {
                      notify.warning({ title: '请手动重启应用' });
                    }
                  },
                });
              }, 300);
            } catch (error) {
              console.error('数据迁移失败:', error);
              notify.error({ title: '数据迁移失败', message: String(error) });
              setGlobalMigrating(false);
            }
          } else {
            console.error('[Storage] migrateAllDataToPath 不可用');
            console.log('[Storage] 可用的 workspace handlers:', Object.keys(desktopApi?.handler?.workspace || {}));
            notify.error({ title: '迁移功能不可用', message: '请检查控制台日志' });
          }
        },
        onCancel: () => {
          // 仅更改目录，不迁移数据
          setGlobalDataPath(result.filePath);
          notify.success({ title: '目录已更改', message: '请手动重启应用使设置生效' });
        },
      });
    } catch (error) {
      console.error('[Storage] 选择目录失败:', error);
      notify.error({ title: '选择目录失败' });
    }
  }, [desktopApi, openConfirmModal]);
  
  // 打开全局数据目录
  const handleOpenGlobalDataFolder = useCallback(async () => {
    if (!globalDataPath) return;
    
    try {
      // 尝试使用 Electron API 打开目录
      if (desktopApi?.handler?.ui?.showItemInFolder) {
        await desktopApi.handler.ui.showItemInFolder(globalDataPath);
        return;
      }
      
      // 尝试使用 openExternal 打开目录（file:// 协议）
      if (desktopApi?.handler?.ui?.openExternal) {
        await desktopApi.handler.ui.openExternal(`file://${globalDataPath.replace(/\\/g, '/')}`);
        return;
      }
      
      // 回退：复制路径到剪贴板
      await navigator.clipboard.writeText(globalDataPath);
      notify.success({ title: '路径已复制到剪贴板，请手动打开' });
    } catch (error) {
      console.error('打开目录失败:', error);
      // 失败时复制路径
      try {
        await navigator.clipboard.writeText(globalDataPath);
        notify.success({ title: '路径已复制到剪贴板，请手动打开' });
      } catch {
        notify.error({ title: '无法打开目录' });
      }
    }
  }, [desktopApi, globalDataPath]);

  // 创建本地工作区
  const handleCreateLocalWorkspace = useCallback(() => {
    globalDialogService.open('create-workspace', { serverId: 'local' });
  }, [globalDialogService]);

  useEffect(() => {
    if (!BUILD_CONFIG.isElectron || !isLocalWorkspace) return;
    if (!desktopApi?.handler.workspace.getStoragePath) return;
    let active = true;
    setStoragePathLoading(true);
    desktopApi.handler.workspace
      .getStoragePath(workspace.flavour, 'workspace', workspace.id)
      .then(path => {
        if (active) setStoragePath(path);
      })
      .catch(error => {
        console.error(error);
        if (active) setStoragePath(null);
      })
      .finally(() => {
        if (active) setStoragePathLoading(false);
      });
    return () => {
      active = false;
    };
  }, [desktopApi, isLocalWorkspace, workspace.flavour, workspace.id]);

  useEffect(() => {
    if (!showWebStorageInfo) return;
    if (typeof navigator === 'undefined') return;
    if (!navigator.storage?.estimate) return;
    let active = true;
    setStorageEstimateLoading(true);
    navigator.storage
      .estimate()
      .then(estimate => {
        if (!active) return;
        setStorageUsage(estimate.usage ?? null);
        setStorageQuota(estimate.quota ?? null);
      })
      .catch(error => {
        console.error(error);
        if (active) {
          setStorageUsage(null);
          setStorageQuota(null);
        }
      })
      .finally(() => {
        if (active) setStorageEstimateLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showWebStorageInfo]);

  const storageUsageDesc = storageEstimateLoading
    ? '正在读取...'
    : storageUsage !== null
      ? `${bytes.format(storageUsage)}${
          storageQuota ? ` / ${bytes.format(storageQuota)}` : ''
        }（浏览器估算）`
      : '暂不可用（浏览器未提供存储估算）';
  const storagePathDesc =
    isOfflineEnabled && BUILD_CONFIG.isElectron
      ? '由离线模式统一管理，可在 通用 → 离线模式 中修改路径'
      : storagePathLoading
        ? '正在读取...'
        : storagePath ?? '暂不可用';

  const handleCopyStoragePath = useCallback(async () => {
    if (!storagePath) return;
    try {
      await navigator.clipboard.writeText(storagePath);
      notify.success({ title: '已复制存储路径' });
    } catch (error) {
      console.error(error);
      notify.error({ title: '复制失败，请手动复制路径' });
    }
  }, [storagePath]);

  const handleOpenStorageFolder = useCallback(async () => {
    if (!desktopApi?.handler.workspace.showStorageInFolder) return;
    try {
      await desktopApi.handler.workspace.showStorageInFolder(
        workspace.flavour,
        'workspace',
        workspace.id
      );
    } catch (error) {
      console.error(error);
      notify.error({ title: '打开文件夹失败' });
    }
  }, [desktopApi, workspace.flavour, workspace.id]);

  const handleMigrateStorage = useCallback(async () => {
    if (!desktopApi?.handler.dialog.selectDBFilePath) return;
    if (!desktopApi?.handler.workspace.migrateStoragePath) return;
    if (!desktopApi?.handler.ui.restartApp) return;
    const selection = await desktopApi.handler.dialog.selectDBFilePath(
      workspaceName,
      workspace.id
    );
    if (selection?.canceled || !selection?.filePath) return;
    const previousPath = storagePath;
    setMigrating(true);
    try {
      const result = await desktopApi.handler.workspace.migrateStoragePath(
        workspace.flavour,
        'workspace',
        workspace.id,
        selection.filePath
      );
      if (result?.filePath) {
        setStoragePath(result.filePath);
        if (previousPath && previousPath !== result.filePath) {
          setOldStoragePath(previousPath);
        }
        openConfirmModal({
          title: '迁移完成，需要重启',
          description: '已完成存储迁移，重启后将使用新路径。',
          confirmText: '立即重启',
          cancelText: '稍后重启',
          onConfirm: async () => {
            await desktopApi.handler.ui.restartApp();
          },
        });
      } else if (result?.error) {
        notify.error({ title: '迁移失败，请重试' });
      }
    } catch (error) {
      console.error(error);
      notify.error({ title: '迁移失败，请重试' });
    } finally {
      setMigrating(false);
    }
  }, [
    desktopApi,
    openConfirmModal,
    storagePath,
    workspace.flavour,
    workspace.id,
    workspaceName,
  ]);

  const handleCleanupOldStorage = useCallback(() => {
    if (!oldStoragePath) return;
    if (!desktopApi?.handler.workspace.deleteStorageFile) return;
    openConfirmModal({
      title: '删除旧存储文件',
      description: '删除后不可恢复，请确认已完成迁移。',
      confirmText: '删除',
      cancelText: '取消',
      confirmButtonOptions: { variant: 'error' },
      onConfirm: async () => {
        try {
          const result = await desktopApi.handler.workspace.deleteStorageFile(
            oldStoragePath
          );
          if (result?.deleted || result?.skipped) {
            setOldStoragePath(null);
            notify.success({ title: '已清理旧文件' });
          } else {
            notify.error({ title: '清理失败，请手动删除' });
          }
        } catch (error) {
          console.error(error);
          notify.error({ title: '清理失败，请手动删除' });
        }
      },
    });
  }, [desktopApi, oldStoragePath, openConfirmModal]);

  const handleImportWorkspace = useCallback(() => {
    globalDialogService.open('import-workspace', undefined);
  }, [globalDialogService]);
  return (
    <>
      <SettingHeader
        title={t['Storage']()}
        subtitle={t['com.yunke.settings.workspace.storage.subtitle']()}
      />
      
      {/* 云同步开关 - 仅桌面端本地工作区显示 */}
      {BUILD_CONFIG.isElectron && isLocalWorkspace ? (
        <SettingWrapper title="数据同步">
          <SettingRow
            name={cloudSyncName}
            desc={
              cloudSyncEnabledState
                ? '已开启：本地数据将自动同步到云端，支持多设备访问'
                : '已关闭：数据仅保存在本地，离线可用，更安全'
            }
          >
            <Switch
              checked={cloudSyncEnabledState}
              onChange={handleToggleCloudSync}
              disabled={cloudSyncPending}
            />
          </SettingRow>
        </SettingWrapper>
      ) : null}
      
      {/* 全局数据目录 - 所有工作区的存储根目录 */}
      {BUILD_CONFIG.isElectron ? (
        <SettingWrapper title="全局数据目录">
          <SettingRow
            name={globalDataPathName}
            desc="所有本地工作区的存储根目录，修改后需要重启应用"
          />
          <div className={styles.storagePathSection}>
            <div className={styles.storagePathDisplay}>
              {globalDataPathLoading ? '正在读取...' : (globalDataPath || '暂不可用')}
            </div>
            <div className={styles.storagePathButtons}>
              <Button
                size="default"
                variant="secondary"
                onClick={handleOpenGlobalDataFolder}
                disabled={!globalDataPath || globalDataPathLoading || globalMigrating}
              >
                打开文件夹
              </Button>
              <Button
                size="default"
                variant="secondary"
                onClick={handleChangeGlobalDataPath}
                loading={globalMigrating}
                disabled={globalDataPathLoading}
              >
                更改目录
              </Button>
            </div>
            {/* 迁移流程步骤说明 */}
            <div className={styles.migrationSteps}>
              <div className={styles.migrationStep}>
                <span className={styles.migrationStepNumber}>1</span>
                <span>选择新目录</span>
              </div>
              <span className={styles.migrationStepArrow}>→</span>
              <div className={styles.migrationStep}>
                <span className={styles.migrationStepNumber}>2</span>
                <span>迁移数据</span>
              </div>
              <span className={styles.migrationStepArrow}>→</span>
              <div className={styles.migrationStep}>
                <span className={styles.migrationStepNumber}>3</span>
                <span>重启生效</span>
              </div>
            </div>
          </div>
          <SettingRow
            name="创建本地工作区"
            desc="创建一个新的本地工作区，数据保存在本地 SQLite 数据库中"
          >
            <Button onClick={handleCreateLocalWorkspace} variant="secondary">
              新建工作区
            </Button>
          </SettingRow>
        </SettingWrapper>
      ) : null}
      
      <SettingWrapper>
        <SettingRow name={storageLocationName} desc={storageLocationDesc} />
        {showWebStorageInfo ? (
          <>
            <SettingRow
              name={storageTypeName}
              desc="浏览器 IndexedDB（离线可用，清理浏览器数据会丢失）"
            />
            <SettingRow
              name={storageUsageName}
              desc={storageUsageDesc}
            />
          </>
        ) : null}
        {BUILD_CONFIG.isElectron && isLocalWorkspace ? (
          <SettingRow
            name={storagePathName}
            desc={
              <>
                当前工作区的存储文件
                <br />
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--affine-text-secondary-color)' }}>
                  {storagePathLoading ? '正在读取...' : (storagePath || '暂不可用')}
                </span>
              </>
            }
          >
            <Button
              size="default"
              variant="secondary"
              onClick={handleOpenStorageFolder}
              disabled={!storagePath || storagePathLoading || migrating}
            >
              打开
            </Button>
          </SettingRow>
        ) : null}
        {BUILD_CONFIG.isElectron && oldStoragePath ? (
          <SettingRow
            name={oldStorageName}
            desc={oldStoragePath}
          >
            <Button
              size="default"
              variant="secondary"
              onClick={handleCleanupOldStorage}
            >
              清理旧文件
            </Button>
          </SettingRow>
        ) : null}
        {BUILD_CONFIG.isElectron ? (
          <SettingRow
            name={importWorkspaceName}
            desc="从本地 SQLite 文件导入工作区"
          >
            <Button
              size="default"
              variant="secondary"
              onClick={handleImportWorkspace}
            >
              导入
            </Button>
          </SettingRow>
        ) : null}
      </SettingWrapper>
      {workspace.flavour === 'local' ? (
        <>
          <EnableCloudPanel onCloseSetting={onCloseSetting} />{' '}
          {BUILD_CONFIG.isElectron ? (
            <div className={styles.sectionSpacing}>
              <SettingWrapper>
                <DesktopExportPanel workspace={workspace} />
              </SettingWrapper>
            </div>
          ) : null}
          {showWebStorageInfo ? (
            <div className={styles.sectionSpacing}>
              <SettingWrapper title="备份与导入">
                <WebExportPanel workspace={workspace} />
              </SettingWrapper>
            </div>
          ) : null}
        </>
      ) : (
        <>
            <SettingWrapper>
              <WorkspaceQuotaPanel />
            </SettingWrapper>

          {BUILD_CONFIG.isElectron && canExport && (
            <SettingWrapper>
              <DesktopExportPanel workspace={workspace} />
            </SettingWrapper>
          )}

          <SettingWrapper>
            <BlobManagementPanel />
          </SettingWrapper>
          
          <SettingWrapper>
            <DocSizePanel />
          </SettingWrapper>
        </>
      )}
      
      {/* 存储结构查看器 - 仅 Web 环境显示 */}
      {showWebStorageInfo ? (
        <div className={styles.sectionSpacing}>
          <StorageViewer />
        </div>
      ) : null}
    </>
  );
};
