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
import { ExternalStorageService } from '@yunke/core/modules/external-storage';
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
  const [appConfig, setAppConfig] = useAppConfigStorage();
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
  const externalStorageService = useServiceOptional(ExternalStorageService);
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
  
  // 外部存储配置
  type ExternalStorageType = 'local' | 's3' | 'oss' | 'webdav';
  const [externalStorageType, setExternalStorageType] = useState<ExternalStorageType>(() => {
    return (appConfig.externalStorage?.type as ExternalStorageType) || 'local';
  });
  const [externalStorageConfig, setExternalStorageConfig] = useState<Record<string, string>>(() => {
    return appConfig.externalStorage?.config || {};
  });
  const [externalStorageTesting, setExternalStorageTesting] = useState(false);
  const [externalStorageStatus, setExternalStorageStatus] = useState<'connected' | 'disconnected' | 'pending'>('disconnected');
  const [syncUploading, setSyncUploading] = useState(false);
  const [syncDownloading, setSyncDownloading] = useState(false);
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

  // 外部存储配置处理
  
  // L-10 修复：移除冗余条件（type 参数是新值，永远 !== 旧值）
  const handleExternalStorageTypeChange = useCallback((type: ExternalStorageType) => {
    setExternalStorageType(type);
    setExternalStorageStatus('disconnected');
    // 切换类型时清空配置
    setExternalStorageConfig({});
  }, []);

  const handleExternalStorageConfigChange = useCallback((key: string, value: string) => {
    setExternalStorageConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleTestExternalStorage = useCallback(async () => {
    setExternalStorageTesting(true);
    setExternalStorageStatus('pending');
    
    try {
      let result: { success: boolean; message: string };
      
      // 桌面端优先使用 desktopApi，Web 端使用 ExternalStorageService
      if (BUILD_CONFIG.isElectron && desktopApi?.handler?.externalStorage?.testConnection) {
        result = await desktopApi.handler.externalStorage.testConnection(
          externalStorageType,
          externalStorageConfig
        );
      } else if (externalStorageService) {
        result = await externalStorageService.testConnectionWithConfig(
          externalStorageType,
          externalStorageConfig
        );
      } else {
        throw new Error('外部存储 API 不可用');
      }
      
      if (result.success) {
        setExternalStorageStatus('connected');
        notify.success({ title: '连接测试成功', message: result.message });
      } else {
        setExternalStorageStatus('disconnected');
        notify.error({ title: '连接测试失败', message: result.message });
      }
    } catch (error) {
      setExternalStorageStatus('disconnected');
      notify.error({ title: '连接测试失败', message: String(error) });
    } finally {
      setExternalStorageTesting(false);
    }
  }, [desktopApi, externalStorageService, externalStorageType, externalStorageConfig]);

  const handleSaveExternalStorage = useCallback(async () => {
    if (externalStorageType !== 'local' && externalStorageStatus !== 'connected') {
      notify.warning({ title: '请先测试连接' });
      return;
    }
    
    try {
      // 保存到 appConfig（桌面端）
      setAppConfig({
        ...appConfig,
        externalStorage: {
          type: externalStorageType,
          config: externalStorageType === 'local' ? {} : externalStorageConfig,
        },
      });
      
      // 同时保存到 ExternalStorageService（Web 端）
      if (externalStorageService) {
        externalStorageService.saveConfig({
          type: externalStorageType,
          config: externalStorageType === 'local' ? {} : externalStorageConfig,
        });
      }
      
      notify.success({ 
        title: '存储配置已保存', 
        message: BUILD_CONFIG.isElectron ? '重启应用后生效' : '配置已生效'
      });
      
      // 桌面端询问是否重启
      if (BUILD_CONFIG.isElectron) {
        openConfirmModal({
          title: '需要重启应用',
          description: '存储配置已保存，需要重启应用才能生效。',
          confirmText: '立即重启',
          cancelText: '稍后重启',
          onConfirm: async () => {
            if (desktopApi?.handler?.ui?.restartApp) {
              await desktopApi.handler.ui.restartApp();
            }
          },
        });
      }
    } catch (error) {
      notify.error({ title: '保存失败', message: String(error) });
    }
  }, [appConfig, desktopApi, externalStorageConfig, externalStorageService, externalStorageStatus, externalStorageType, openConfirmModal, setAppConfig]);

  // 上传到云端 - 统一使用 Yjs 快照格式，实现全平台互通
  const handleSyncToCloud = useCallback(() => {
    // 统一使用 externalStorageService，它会处理 Yjs 数据的导出
    if (!externalStorageService?.isConfigured) {
      notify.error({ title: '请先配置并测试外部存储连接' });
      return;
    }
    
    openConfirmModal({
      title: '上传到云端',
      description: '确定要将本地数据上传到云端吗？这将覆盖云端已有的数据。数据使用统一格式，支持桌面端和 Web 端互通。',
      confirmText: '确认上传',
      cancelText: '取消',
      confirmButtonOptions: {
        variant: 'primary',
      },
      onConfirm: async () => {
        setSyncUploading(true);
        try {
          // 统一使用 Yjs 快照格式，实现全平台互通
          // 传入 docStorage 以确保从存储读取完整数据
          const docStorage = workspace.engine?.doc?.storage;
          const result = await externalStorageService.syncWorkspaceToCloud(
            workspace.docCollection,
            workspace.id,
            docStorage
          );
          
          if (result.success) {
            notify.success({ title: '上传成功', message: result.message });
          } else {
            notify.error({ title: '上传失败', message: result.message });
          }
        } catch (error) {
          notify.error({ title: '上传失败', message: String(error) });
        } finally {
          setSyncUploading(false);
        }
      },
    });
  }, [externalStorageService, openConfirmModal, workspace]);

  // 从云端下载 - 统一使用 Yjs 快照格式，实现全平台互通
  const handleSyncFromCloud = useCallback(async () => {
    // 统一使用 externalStorageService
    if (!externalStorageService?.isConfigured) {
      notify.error({ title: '请先配置并测试外部存储连接' });
      return;
    }
    
    // 先检查云端是否有当前工作区的数据
    setSyncDownloading(true);
    try {
      const cloudResult = await externalStorageService.getCloudWorkspaces();
      
      if (!cloudResult.success) {
        notify.error({ title: '检查云端数据失败', message: cloudResult.message });
        setSyncDownloading(false);
        return;
      }
      
      const currentWorkspaceInCloud = cloudResult.workspaces?.find(w => w.id === workspace.id);
      
      if (!currentWorkspaceInCloud) {
        // 当前工作区在云端没有数据，显示云端列表供选择
        setSyncDownloading(false);
        setCloudWorkspaces(cloudResult.workspaces || []);
        
        if ((cloudResult.workspaces?.length || 0) === 0) {
          notify.warning({ title: '云端暂无数据', message: '请先从桌面端或其他设备上传数据' });
        } else {
          notify.warning({ 
            title: '当前工作区在云端没有数据', 
            message: `云端有 ${cloudResult.workspaces?.length} 个其他工作区，请从下方列表选择下载` 
          });
        }
        return;
      }
      
      // 当前工作区在云端有数据，显示确认弹窗
      setSyncDownloading(false);
      openConfirmModal({
        title: '从云端下载',
        description: `确定要从云端下载当前工作区 "${workspace.id}" 的数据吗？\n\n云端数据：${(currentWorkspaceInCloud.size / 1024).toFixed(1)} KB，更新于 ${new Date(currentWorkspaceInCloud.lastModified).toLocaleString()}\n\n这将覆盖本地已有的数据。建议先备份本地数据。`,
        confirmText: '确认下载',
        cancelText: '取消',
        confirmButtonOptions: {
          variant: 'warning',
        },
        onConfirm: async () => {
          setSyncDownloading(true);
          try {
            const result = await externalStorageService.syncWorkspaceFromCloud(
              workspace.docCollection,
              workspace.id
            );
            
            if (result.success) {
              notify.success({ title: '下载成功', message: result.message });
              setTimeout(() => {
                openConfirmModal({
                  title: '下载完成',
                  description: BUILD_CONFIG.isElectron 
                    ? '数据已导入，建议重启应用以确保所有更改生效。'
                    : '数据已导入，建议刷新页面以确保所有更改生效。',
                  confirmText: BUILD_CONFIG.isElectron ? '立即重启' : '刷新页面',
                  cancelText: '稍后处理',
                  onConfirm: async () => {
                    if (BUILD_CONFIG.isElectron && desktopApi?.handler?.ui?.restartApp) {
                      await desktopApi.handler.ui.restartApp();
                    } else {
                      window.location.reload();
                    }
                  },
                });
              }, 300);
            } else {
              notify.error({ title: '下载失败', message: result.message });
            }
          } catch (error) {
            notify.error({ title: '下载失败', message: String(error) });
          } finally {
            setSyncDownloading(false);
          }
        },
      });
    } catch (error) {
      notify.error({ title: '检查云端数据失败', message: String(error) });
      setSyncDownloading(false);
    }
  }, [desktopApi, externalStorageService, openConfirmModal, workspace]);

  // 云端工作区列表
  const [cloudWorkspaces, setCloudWorkspaces] = useState<Array<{ id: string; size: number; lastModified: string }>>([]);
  const [cloudWorkspacesLoading, setCloudWorkspacesLoading] = useState(false);
  const [selectedCloudWorkspace, setSelectedCloudWorkspace] = useState<string | null>(null);

  // 查看云端数据 - 显示统一格式的快照
  const handleViewCloudData = useCallback(async () => {
    if (!externalStorageService) {
      notify.error({ title: '功能不可用' });
      return;
    }
    
    setCloudWorkspacesLoading(true);
    try {
      const result = await externalStorageService.getCloudWorkspaces();
      
      if (result.success && result.workspaces) {
        setCloudWorkspaces(result.workspaces);
        if (result.workspaces.length === 0) {
          notify.warning({ title: '云端暂无数据' });
        }
      } else {
        notify.error({ title: '获取失败', message: result.message });
      }
    } catch (error) {
      notify.error({ title: '获取失败', message: String(error) });
    } finally {
      setCloudWorkspacesLoading(false);
    }
  }, [externalStorageService]);

  // 下载指定云端工作区
  const handleDownloadCloudWorkspace = useCallback((cloudWorkspaceId: string) => {
    if (!externalStorageService?.isConfigured) {
      notify.error({ title: '请先配置并测试外部存储连接' });
      return;
    }
    
    const isSameWorkspace = cloudWorkspaceId === workspace.id;
    
    openConfirmModal({
      title: '下载云端工作区',
      description: isSameWorkspace 
        ? `确定要下载云端工作区 "${cloudWorkspaceId}" 的数据吗？\n这将覆盖当前工作区的数据。建议先备份本地数据。`
        : `确定要将云端工作区 "${cloudWorkspaceId}" 的数据导入到当前工作区吗？\n\n注意：当前工作区 ID 为 "${workspace.id}"，与云端工作区 ID 不同。导入后数据将合并到当前工作区。`,
      confirmText: '确认下载',
      cancelText: '取消',
      confirmButtonOptions: {
        variant: 'warning',
      },
      onConfirm: async () => {
        setSyncDownloading(true);
        setSelectedCloudWorkspace(cloudWorkspaceId);
        try {
          // 使用指定的云端工作区 ID 下载
          const result = await externalStorageService.syncWorkspaceFromCloud(
            workspace.docCollection,
            cloudWorkspaceId  // 使用选择的云端工作区 ID
          );
          
          if (result.success) {
            notify.success({ title: '下载成功', message: result.message });
            // 刷新云端列表
            setCloudWorkspaces([]);
            // 提示刷新/重启
            setTimeout(() => {
              openConfirmModal({
                title: '下载完成',
                description: BUILD_CONFIG.isElectron 
                  ? '数据已导入，建议重启应用以确保所有更改生效。'
                  : '数据已导入，建议刷新页面以确保所有更改生效。',
                confirmText: BUILD_CONFIG.isElectron ? '立即重启' : '刷新页面',
                cancelText: '稍后处理',
                onConfirm: async () => {
                  if (BUILD_CONFIG.isElectron && desktopApi?.handler?.ui?.restartApp) {
                    await desktopApi.handler.ui.restartApp();
                  } else {
                    window.location.reload();
                  }
                },
              });
            }, 300);
          } else {
            notify.error({ title: '下载失败', message: result.message });
          }
        } catch (error) {
          notify.error({ title: '下载失败', message: String(error) });
        } finally {
          setSyncDownloading(false);
          setSelectedCloudWorkspace(null);
        }
      },
    });
  }, [desktopApi, externalStorageService, openConfirmModal, workspace]);

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
        <>
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
        
        {/* 外部存储配置 */}
        <SettingWrapper title="外部存储（实验性）">
          <SettingRow
            name="存储位置"
            desc="选择数据保存的位置。使用外部存储后，数据将保存到您配置的云存储服务中。"
          />
          <div className={styles.externalStorageSection}>
            <div className={styles.storageTypeSelector}>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 'local'}
                onClick={() => handleExternalStorageTypeChange('local')}
              >
                <FolderIcon style={{ width: 16, height: 16 }} />
                本地
              </div>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 's3'}
                onClick={() => handleExternalStorageTypeChange('s3')}
              >
                S3
              </div>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 'oss'}
                onClick={() => handleExternalStorageTypeChange('oss')}
              >
                阿里云 OSS
              </div>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 'webdav'}
                onClick={() => handleExternalStorageTypeChange('webdav')}
              >
                WebDAV
              </div>
            </div>
            
            {externalStorageType === 's3' && (
              <div className={styles.storageConfigForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Endpoint</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="s3.amazonaws.com"
                    value={externalStorageConfig.endpoint || ''}
                    onChange={e => handleExternalStorageConfigChange('endpoint', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Bucket</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="my-bucket"
                    value={externalStorageConfig.bucket || ''}
                    onChange={e => handleExternalStorageConfigChange('bucket', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Region（可选）</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="us-east-1"
                    value={externalStorageConfig.region || ''}
                    onChange={e => handleExternalStorageConfigChange('region', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Access Key</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={externalStorageConfig.accessKey || ''}
                    onChange={e => handleExternalStorageConfigChange('accessKey', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Secret Key</label>
                  <input
                    type="password"
                    className={styles.formInputPassword}
                    placeholder="••••••••"
                    value={externalStorageConfig.secretKey || ''}
                    onChange={e => handleExternalStorageConfigChange('secretKey', e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    onClick={handleTestExternalStorage}
                    loading={externalStorageTesting}
                  >
                    测试连接
                  </Button>
                  {externalStorageStatus === 'connected' && (
                    <span className={styles.storageStatusConnected}>✓ 已连接</span>
                  )}
                  {externalStorageStatus === 'disconnected' && externalStorageConfig.endpoint && (
                    <span className={styles.storageStatusDisconnected}>✗ 未连接</span>
                  )}
                  <div style={{ flex: 1 }} />
                  <Button onClick={handleSaveExternalStorage}>
                    保存配置
                  </Button>
                </div>
              </div>
            )}
            
            {externalStorageType === 'oss' && (
              <div className={styles.storageConfigForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Endpoint</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="oss-cn-hangzhou.aliyuncs.com"
                    value={externalStorageConfig.endpoint || ''}
                    onChange={e => handleExternalStorageConfigChange('endpoint', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Bucket</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="my-bucket"
                    value={externalStorageConfig.bucket || ''}
                    onChange={e => handleExternalStorageConfigChange('bucket', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>AccessKey ID</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="LTAI5tExample"
                    value={externalStorageConfig.accessKeyId || ''}
                    onChange={e => handleExternalStorageConfigChange('accessKeyId', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>AccessKey Secret</label>
                  <input
                    type="password"
                    className={styles.formInputPassword}
                    placeholder="••••••••"
                    value={externalStorageConfig.accessKeySecret || ''}
                    onChange={e => handleExternalStorageConfigChange('accessKeySecret', e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    onClick={handleTestExternalStorage}
                    loading={externalStorageTesting}
                  >
                    测试连接
                  </Button>
                  {externalStorageStatus === 'connected' && (
                    <span className={styles.storageStatusConnected}>✓ 已连接</span>
                  )}
                  {externalStorageStatus === 'disconnected' && externalStorageConfig.endpoint && (
                    <span className={styles.storageStatusDisconnected}>✗ 未连接</span>
                  )}
                  <div style={{ flex: 1 }} />
                  <Button onClick={handleSaveExternalStorage}>
                    保存配置
                  </Button>
                </div>
              </div>
            )}
            
            {externalStorageType === 'webdav' && (
              <div className={styles.storageConfigForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>WebDAV URL</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://dav.example.com/yunke/"
                    value={externalStorageConfig.url || ''}
                    onChange={e => handleExternalStorageConfigChange('url', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>用户名</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="username"
                    value={externalStorageConfig.username || ''}
                    onChange={e => handleExternalStorageConfigChange('username', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>密码</label>
                  <input
                    type="password"
                    className={styles.formInputPassword}
                    placeholder="••••••••"
                    value={externalStorageConfig.password || ''}
                    onChange={e => handleExternalStorageConfigChange('password', e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    onClick={handleTestExternalStorage}
                    loading={externalStorageTesting}
                  >
                    测试连接
                  </Button>
                  {externalStorageStatus === 'connected' && (
                    <span className={styles.storageStatusConnected}>✓ 已连接</span>
                  )}
                  {externalStorageStatus === 'disconnected' && externalStorageConfig.url && (
                    <span className={styles.storageStatusDisconnected}>✗ 未连接</span>
                  )}
                  <div style={{ flex: 1 }} />
                  <Button onClick={handleSaveExternalStorage}>
                    保存配置
                  </Button>
                </div>
              </div>
            )}
            
            {externalStorageType === 'local' && (
              <div className={styles.storageConfigForm}>
                <div style={{ color: 'var(--yunke-text-secondary-color)', fontSize: 'var(--yunke-font-xs)' }}>
                  使用本地存储，数据保存在上方配置的全局数据目录中。
                </div>
                <div className={styles.formActions}>
                  <Button onClick={handleSaveExternalStorage}>
                    确认使用本地存储
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SettingWrapper>
        
        {/* 数据同步面板 - 仅在配置了外部存储时显示 */}
        {externalStorageStatus === 'connected' && externalStorageType !== 'local' && (
          <SettingWrapper title="数据同步">
            <SettingRow
              name="同步说明"
              desc="手动将本地数据上传到云端，或从云端下载数据到本地。上传会覆盖云端数据，下载会覆盖本地数据。"
            />
            <div className={styles.storageConfigForm}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={handleSyncToCloud}
                  disabled={syncUploading || syncDownloading}
                >
                  {syncUploading ? '上传中...' : '↑ 上传到云端'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSyncFromCloud}
                  disabled={syncUploading || syncDownloading}
                >
                  {syncDownloading ? '下载中...' : '↓ 从云端下载（当前工作区）'}
                </Button>
                <Button
                  variant="plain"
                  onClick={handleViewCloudData}
                  disabled={syncUploading || syncDownloading || cloudWorkspacesLoading}
                >
                  {cloudWorkspacesLoading ? '加载中...' : '查看云端数据'}
                </Button>
              </div>
              
              {/* 云端工作区列表 */}
              {cloudWorkspaces.length > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  border: '1px solid var(--yunke-border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '6px 10px', 
                    backgroundColor: 'var(--yunke-background-secondary-color)',
                    borderBottom: '1px solid var(--yunke-border-color)',
                    fontWeight: 500,
                    fontSize: '12px',
                    color: 'var(--yunke-text-secondary-color)'
                  }}>
                    云端工作区列表
                  </div>
                  {cloudWorkspaces.map((cw) => (
                    <div 
                      key={cw.id}
                      style={{ 
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--yunke-border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--yunke-hover-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontFamily: 'monospace',
                          color: cw.id === workspace.id ? 'var(--yunke-primary-color)' : 'inherit',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {cw.id}
                          {cw.id === workspace.id && <span style={{ marginLeft: 6, fontSize: '11px', color: 'var(--yunke-primary-color)' }}>（当前）</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--yunke-text-secondary-color)', marginTop: 1 }}>
                          {(cw.size / 1024).toFixed(1)} KB · {new Date(cw.lastModified).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="small"
                        style={{ marginLeft: 8, flexShrink: 0, fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => handleDownloadCloudWorkspace(cw.id)}
                        disabled={syncDownloading && selectedCloudWorkspace === cw.id}
                      >
                        {syncDownloading && selectedCloudWorkspace === cw.id ? '下载中...' : '下载'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                backgroundColor: 'var(--yunke-background-success-color, rgba(82, 196, 26, 0.1))', 
                borderRadius: '6px',
                fontSize: 'var(--yunke-font-xs)',
                color: 'var(--yunke-text-secondary-color)'
              }}>
                ✓ 全平台互通：使用统一的 Yjs 快照格式，桌面端和 Web 端可以共享同一份数据。
                <br />
                云端路径：yunke-workspaces/{'{workspaceId}'}/snapshot.json
              </div>
            </div>
          </SettingWrapper>
        )}
        </>
      ) : null}
      
      {/* Web/移动端外部存储配置 */}
      {!BUILD_CONFIG.isElectron && isLocalWorkspace && (
        <>
        <SettingWrapper title="外部存储（实验性）">
          <SettingRow
            name="存储位置"
            desc="选择数据保存的位置。使用外部存储后，数据将保存到您配置的云存储服务中。"
          />
          <div className={styles.externalStorageSection}>
            <div className={styles.storageTypeSelector}>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 'local'}
                onClick={() => handleExternalStorageTypeChange('local')}
              >
                <FolderIcon style={{ width: 16, height: 16 }} />
                本地
              </div>
              <div
                className={styles.storageTypeOption}
                data-active={externalStorageType === 's3'}
                onClick={() => handleExternalStorageTypeChange('s3')}
              >
                S3
              </div>
            </div>
            
            {externalStorageType === 's3' && (
              <div className={styles.storageConfigForm}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Endpoint</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://s3.amazonaws.com"
                    value={externalStorageConfig.endpoint || ''}
                    onChange={e => handleExternalStorageConfigChange('endpoint', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Bucket</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="my-bucket"
                    value={externalStorageConfig.bucket || ''}
                    onChange={e => handleExternalStorageConfigChange('bucket', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Region（可选）</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="us-east-1"
                    value={externalStorageConfig.region || ''}
                    onChange={e => handleExternalStorageConfigChange('region', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Access Key</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    value={externalStorageConfig.accessKey || ''}
                    onChange={e => handleExternalStorageConfigChange('accessKey', e.target.value)}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Secret Key</label>
                  <input
                    type="password"
                    className={styles.formInputPassword}
                    placeholder="••••••••"
                    value={externalStorageConfig.secretKey || ''}
                    onChange={e => handleExternalStorageConfigChange('secretKey', e.target.value)}
                  />
                </div>
                <div className={styles.formActions}>
                  <Button
                    variant="secondary"
                    onClick={handleTestExternalStorage}
                    loading={externalStorageTesting}
                  >
                    测试连接
                  </Button>
                  <span className={styles.storageStatusBadge} data-status={externalStorageStatus}>
                    {externalStorageStatus === 'connected' ? '✓ 已连接' : 
                     externalStorageStatus === 'pending' ? '测试中...' : '未连接'}
                  </span>
                  <Button onClick={handleSaveExternalStorage}>
                    保存配置
                  </Button>
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '8px 12px', 
                  backgroundColor: 'var(--yunke-background-warning-color, rgba(250, 173, 20, 0.1))', 
                  borderRadius: '6px',
                  fontSize: 'var(--yunke-font-xs)',
                  color: 'var(--yunke-text-secondary-color)'
                }}>
                  注意：S3 存储桶需要配置 CORS 规则，允许当前域名访问。
                </div>
              </div>
            )}
            
            {externalStorageType === 'local' && (
              <div className={styles.storageConfigForm}>
                <div style={{ color: 'var(--yunke-text-secondary-color)', fontSize: 'var(--yunke-font-xs)' }}>
                  使用本地存储，数据保存在浏览器 IndexedDB 中。
                </div>
              </div>
            )}
          </div>
        </SettingWrapper>
        
        {/* Web 端数据同步面板 */}
        {externalStorageStatus === 'connected' && externalStorageType !== 'local' && (
          <SettingWrapper title="数据同步">
            <SettingRow
              name="同步说明"
              desc="手动将本地数据上传到云端，或从云端下载数据到本地。上传会覆盖云端数据，下载会覆盖本地数据。"
            />
            <div className={styles.storageConfigForm}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button
                  variant="secondary"
                  onClick={handleSyncToCloud}
                  disabled={syncUploading || syncDownloading}
                >
                  {syncUploading ? '上传中...' : '↑ 上传到云端'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleSyncFromCloud}
                  disabled={syncUploading || syncDownloading}
                >
                  {syncDownloading ? '下载中...' : '↓ 从云端下载（当前工作区）'}
                </Button>
                <Button
                  variant="plain"
                  onClick={handleViewCloudData}
                  disabled={syncUploading || syncDownloading || cloudWorkspacesLoading}
                >
                  {cloudWorkspacesLoading ? '加载中...' : '查看云端数据'}
                </Button>
              </div>
              
              {/* 云端工作区列表 */}
              {cloudWorkspaces.length > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  border: '1px solid var(--yunke-border-color)',
                  borderRadius: '6px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    padding: '6px 10px', 
                    backgroundColor: 'var(--yunke-background-secondary-color)',
                    borderBottom: '1px solid var(--yunke-border-color)',
                    fontWeight: 500,
                    fontSize: '12px',
                    color: 'var(--yunke-text-secondary-color)'
                  }}>
                    云端工作区列表
                  </div>
                  {cloudWorkspaces.map((cw) => (
                    <div 
                      key={cw.id}
                      style={{ 
                        padding: '8px 10px',
                        borderBottom: '1px solid var(--yunke-border-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--yunke-hover-color)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ 
                          fontSize: '12px', 
                          fontFamily: 'monospace',
                          color: cw.id === workspace.id ? 'var(--yunke-primary-color)' : 'inherit',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {cw.id}
                          {cw.id === workspace.id && <span style={{ marginLeft: 6, fontSize: '11px', color: 'var(--yunke-primary-color)' }}>（当前）</span>}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--yunke-text-secondary-color)', marginTop: 1 }}>
                          {(cw.size / 1024).toFixed(1)} KB · {new Date(cw.lastModified).toLocaleString()}
                        </div>
                      </div>
                      <Button
                        variant="primary"
                        size="small"
                        style={{ marginLeft: 8, flexShrink: 0, fontSize: '12px', padding: '4px 10px' }}
                        onClick={() => handleDownloadCloudWorkspace(cw.id)}
                        disabled={syncDownloading && selectedCloudWorkspace === cw.id}
                      >
                        {syncDownloading && selectedCloudWorkspace === cw.id ? '下载中...' : '下载'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                backgroundColor: 'var(--yunke-background-success-color, rgba(82, 196, 26, 0.1))', 
                borderRadius: '6px',
                fontSize: 'var(--yunke-font-xs)',
                color: 'var(--yunke-text-secondary-color)'
              }}>
                ✓ 全平台互通：使用统一的 Yjs 快照格式，桌面端和 Web 端可以共享同一份数据。
                <br />
                云端路径：yunke-workspaces/{'{workspaceId}'}/snapshot.json
              </div>
            </div>
          </SettingWrapper>
        )}
        </>
      )}
      
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
