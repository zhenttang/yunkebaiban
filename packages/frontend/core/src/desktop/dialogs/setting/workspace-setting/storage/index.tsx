import { notify, useConfirmModal } from '@yunke/component';
import { Button } from '@yunke/component/ui/button';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { useAppConfigStorage } from '@yunke/core/components/hooks/use-app-config-storage';
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

  const canExport = !isTeam || isOwner;

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
            desc={storagePathDesc}
          >
            <Button
              size="small"
              variant="secondary"
              onClick={handleOpenStorageFolder}
              disabled={!storagePath || storagePathLoading || migrating}
            >
              打开文件夹
            </Button>
            {isOfflineEnabled ? null : (
              <>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleCopyStoragePath}
                  disabled={!storagePath || storagePathLoading || migrating}
                >
                  复制路径
                </Button>
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleMigrateStorage}
                  loading={migrating}
                  disabled={storagePathLoading}
                >
                  迁移位置
                </Button>
              </>
            )}
          </SettingRow>
        ) : null}
        {BUILD_CONFIG.isElectron && oldStoragePath ? (
          <SettingRow
            name={oldStorageName}
            desc={oldStoragePath}
          >
            <Button
              size="small"
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
              size="small"
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
    </>
  );
};
