import { notify } from '@yunke/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { Button } from '@yunke/component/ui/button';
import { Switch } from '@yunke/component/ui/switch';
import { useAppConfigStorage } from '@yunke/core/components/hooks/use-app-config-storage';
import {
  isCloudSyncEnabled,
  setCloudSyncEnabled,
} from '@yunke/core/modules/cloud-storage';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { BackupService, type BackupInfo } from '@yunke/core/modules/backup/services';
import {
  clearOfflineRootHandle,
  getOfflineRootHandleName,
  isFileSystemAccessSupported,
  requestOfflineRootHandle,
} from '@yunke/core/modules/storage/offline-file-handle';
import { LiveData, useLiveData, useService, useServiceOptional } from '@toeverything/infra';
import { Cloud, HardDrive, FolderOpen } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export const OfflineSettings = () => {
  const [config, setConfig] = useAppConfigStorage();
  const globalDialogService = useService(GlobalDialogService);
  const desktopApi = useServiceOptional(DesktopApiService);
  const [offlineHandleName, setOfflineHandleName] = useState('');
  const supportsFileAccess = isFileSystemAccessSupported();
  
  // 🔧 云同步开关状态
  const [cloudSyncEnabledState, setCloudSyncEnabledState] = useState(() => isCloudSyncEnabled());
  const [cloudSyncPending, setCloudSyncPending] = useState(false);
  
  // 🔧 默认数据路径
  const [defaultDataPath, setDefaultDataPath] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  const offlineConfig = useMemo(
    () => ({
      enabled: false,
      dataPath: '',
      ...config.offline,
    }),
    [config.offline]
  );

  const updateOfflineConfig = useCallback(
    (patch: Partial<typeof offlineConfig>) => {
      setConfig({
        ...config,
        offline: {
          ...offlineConfig,
          ...patch,
        },
      });
    },
    [config, offlineConfig, setConfig]
  );

  const handleToggleOffline = useCallback(
    (checked: boolean) => {
      if (checked && !BUILD_CONFIG.isElectron && !supportsFileAccess) {
        notify.error({ title: '当前浏览器不支持离线目录选择' });
        return;
      }
      if (checked && !BUILD_CONFIG.isElectron && !offlineConfig.dataPath) {
        notify.error({ title: '请先选择离线数据目录' });
        return;
      }
      updateOfflineConfig({ enabled: checked });
      notify.success({
        title: '离线模式设置已更新',
        message: '重启应用后生效',
      });
    },
    [offlineConfig.dataPath, supportsFileAccess, updateOfflineConfig]
  );

  // 🔧 数据迁移处理 - 必须在 handleSelectPath 之前定义
  const handleMigrateData = useCallback(async (targetPath: string) => {
    if (!desktopApi?.handler?.workspace?.migrateAllDataToPath) {
      notify.error({ title: '当前环境不支持数据迁移' });
      return false;
    }
    
    setIsMigrating(true);
    try {
      const result = await desktopApi.handler.workspace.migrateAllDataToPath(targetPath);
      if (result.error) {
        notify.error({ title: '数据迁移失败', message: result.message || result.error });
        return false;
      }
      if (result.skipped) {
        notify.info({ title: result.message || '无需迁移' });
        return true;
      }
      notify.success({ title: '数据迁移成功', message: `已迁移到 ${result.toPath}` });
      return true;
    } catch (error) {
      console.error('数据迁移失败:', error);
      notify.error({ title: '数据迁移失败' });
      return false;
    } finally {
      setIsMigrating(false);
    }
  }, [desktopApi]);

  const handleSelectPath = useCallback(async () => {
    if (BUILD_CONFIG.isElectron && desktopApi?.handler?.dialog?.selectDBFileLocation) {
      const result = await desktopApi.handler.dialog.selectDBFileLocation();
      if (result?.canceled || !result?.filePath) return;
      
      // 询问是否迁移现有数据
      const shouldMigrate = window.confirm(
        '是否将现有数据迁移到新目录？\n\n' +
        '选择"确定"将复制所有现有数据到新位置。\n' +
        '选择"取消"仅更改存储位置（新数据将保存到新位置，现有数据保留在原位置）。'
      );
      
      if (shouldMigrate) {
        const migrated = await handleMigrateData(result.filePath);
        if (!migrated) return;
      }
      
      updateOfflineConfig({ dataPath: result.filePath });
      notify.success({
        title: '已更新离线数据目录',
        message: '重启应用后生效',
      });
      return;
    }
    if (!supportsFileAccess) {
      notify.error({ title: '当前环境不支持选择目录' });
      return;
    }
    const handle = await requestOfflineRootHandle();
    if (!handle) return;
    updateOfflineConfig({ dataPath: handle.name });
    setOfflineHandleName(handle.name);
    notify.success({
      title: '已更新离线数据目录',
      message: '重启应用后生效',
    });
  }, [desktopApi, supportsFileAccess, updateOfflineConfig, handleMigrateData]);

  const handleClearPath = useCallback(() => {
    updateOfflineConfig({ dataPath: '' });
    if (!BUILD_CONFIG.isElectron) {
      clearOfflineRootHandle().catch(console.error);
      setOfflineHandleName('');
    }
    notify.success({
      title: '已恢复默认数据目录',
      message: '重启应用后生效',
    });
  }, [updateOfflineConfig]);

  const handleCopyPath = useCallback(async () => {
    if (!offlineConfig.dataPath || !BUILD_CONFIG.isElectron) return;
    try {
      await navigator.clipboard.writeText(offlineConfig.dataPath);
      notify.success({ title: '已复制离线数据目录' });
    } catch (error) {
      console.error(error);
      notify.error({ title: '复制失败，请手动复制' });
    }
  }, [offlineConfig.dataPath]);

  // M-11 修复：添加取消标志，防止组件卸载后 setState
  useEffect(() => {
    if (BUILD_CONFIG.isElectron) return;
    let cancelled = false;
    getOfflineRootHandleName()
      .then(name => { if (!cancelled) setOfflineHandleName(name); })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [config.offline]);

  // 🔧 获取默认数据路径（M-11 修复：添加取消标志）
  useEffect(() => {
    if (!BUILD_CONFIG.isElectron || !desktopApi?.handler?.workspace?.getDefaultDataPath) return;
    let cancelled = false;
    desktopApi.handler.workspace.getDefaultDataPath()
      .then((result: { path: string; localPath: string }) => {
        if (!cancelled) setDefaultDataPath(result.path);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [desktopApi]);

  // 🔧 在资源管理器中打开数据目录
  const handleOpenDataFolder = useCallback(async () => {
    const pathToOpen = offlineConfig.dataPath || defaultDataPath;
    if (!pathToOpen) {
      notify.error({ title: '无法获取数据目录路径' });
      return;
    }
    try {
      if (desktopApi?.handler?.ui?.showItemInFolder) {
        await desktopApi.handler.ui.showItemInFolder(pathToOpen);
      } else {
        // 复制路径到剪贴板作为后备
        await navigator.clipboard.writeText(pathToOpen);
        notify.success({ title: '路径已复制到剪贴板', message: pathToOpen });
      }
    } catch (error) {
      console.error(error);
      notify.error({ title: '无法打开目录' });
    }
  }, [offlineConfig.dataPath, defaultDataPath, desktopApi]);

  const handleRestart = useCallback(async () => {
    if (!desktopApi?.handler?.ui?.restartApp) {
      notify.error({ title: '当前环境不支持重启' });
      return;
    }
    await desktopApi.handler.ui.restartApp();
  }, [desktopApi]);

  const handleCreateLocalWorkspace = useCallback(() => {
    globalDialogService.open('create-workspace', { serverId: 'local' });
  }, [globalDialogService]);

  // 🔧 云同步开关切换处理
  const handleToggleCloudSync = useCallback(
    async (checked: boolean) => {
      setCloudSyncPending(true);
      
      try {
        // 设置开关状态
        setCloudSyncEnabled(checked);
        setCloudSyncEnabledState(checked);
        
        notify.success({
          title: checked ? '云同步已开启' : '云同步已关闭',
          message: '重新加载页面后生效',
        });
        
        // 询问是否立即重新加载
        const shouldReload = window.confirm(
          checked
            ? '云同步已开启，本地数据将自动同步到云端。\n是否立即重新加载页面？'
            : '云同步已关闭，数据将仅保存在本地。\n是否立即重新加载页面？'
        );
        
        if (shouldReload) {
          window.location.reload();
        }
      } catch (error) {
        console.error('云同步开关切换失败:', error);
        notify.error({ title: '操作失败' });
        // 恢复状态
        setCloudSyncEnabledState(!checked);
      } finally {
        setCloudSyncPending(false);
      }
    },
    []
  );

  return (
    <>
      <SettingHeader
        title="数据同步设置"
        subtitle="管理数据的存储位置和同步方式。默认为离线模式，数据仅保存在本地。"
      />

      {/* 🔧 云同步开关 - 核心功能 */}
      <SettingWrapper title="云同步">
        <SettingRow
          name={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {cloudSyncEnabledState ? (
                <Cloud size={18} style={{ color: 'var(--yunke-brand-color)' }} />
              ) : (
                <HardDrive size={18} style={{ color: 'var(--yunke-text-secondary-color)' }} />
              )}
              <span>云同步</span>
            </div>
          }
          desc={
            cloudSyncEnabledState
              ? '已开启 - 数据自动同步到云端，支持多设备访问'
              : '已关闭 - 数据仅保存在本地（离线模式）'
          }
        >
          <Switch
            checked={cloudSyncEnabledState}
            onChange={handleToggleCloudSync}
            disabled={cloudSyncPending}
          />
        </SettingRow>
        
        {!cloudSyncEnabledState && (
          <SettingRow
            name=""
            desc="⚠️ 离线模式下，数据不会同步到云端。如需多设备访问或数据备份，请开启云同步。"
          />
        )}
        
        {cloudSyncEnabledState && (
          <SettingRow
            name=""
            desc="✅ 云同步已开启，您的数据将自动备份到云端，并可在多设备间同步。"
          />
        )}
      </SettingWrapper>

      <SettingWrapper title="离线存储配置">
        <SettingRow
          name="启用离线模式"
          desc="启用后本地数据将存储在离线目录中，不依赖后端服务。"
        >
          <Switch checked={offlineConfig.enabled} onChange={handleToggleOffline} />
        </SettingRow>
        <SettingRow
          name="数据存储位置"
          desc={
            <div>
              <div style={{ marginBottom: 4 }}>
                {BUILD_CONFIG.isElectron && offlineConfig.dataPath
                  ? `自定义路径：${offlineConfig.dataPath}`
                  : BUILD_CONFIG.isElectron && defaultDataPath
                  ? `默认路径：${defaultDataPath}`
                  : offlineHandleName
                  ? `当前路径：${offlineHandleName}`
                  : '默认路径：应用数据目录'
                }
              </div>
              <div style={{ fontSize: 12, color: 'var(--yunke-text-secondary-color)' }}>
                所有本地工作区的数据将保存在此目录下
              </div>
            </div>
          }
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button onClick={handleSelectPath} disabled={isMigrating}>
              {isMigrating ? '迁移中...' : '更改位置'}
            </Button>
            <Button onClick={handleClearPath} variant="secondary" disabled={isMigrating}>
              恢复默认
            </Button>
            <Button
              onClick={handleOpenDataFolder}
              variant="secondary"
              disabled={!defaultDataPath && !offlineConfig.dataPath}
              title="在文件管理器中打开"
            >
              <FolderOpen size={16} />
            </Button>
          </div>
        </SettingRow>
        <SettingRow
          name="重启应用"
          desc="修改离线设置后需要重启应用才能生效。"
        >
          <Button onClick={handleRestart} variant="secondary">
            立即重启
          </Button>
        </SettingRow>
        <SettingRow
          name="创建本地工作区"
          desc="离线模式下的数据将以本地SQLite工作区保存。"
        >
          <Button onClick={handleCreateLocalWorkspace} variant="secondary">
            创建本地工作区
          </Button>
        </SettingRow>
      </SettingWrapper>

      {/* 功能4: 本地存储管理 */}
      <LocalStorageManagement />

      {/* NEW-2: 数据备份管理 */}
      {BUILD_CONFIG.isElectron && <BackupSection />}
    </>
  );
};

// ====== 功能4: 本地存储管理组件 ======

const LocalStorageManagement = () => {
  const [storageInfo, setStorageInfo] = useState<{
    usage: number;
    quota: number;
    percentage: number;
  } | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const checkStorage = async () => {
      try {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          if (!cancelled) {
            const usage = estimate.usage ?? 0;
            const quota = estimate.quota ?? 0;
            setStorageInfo({
              usage,
              quota,
              percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0,
            });
          }
        }
      } catch {
        // 浏览器不支持 storage.estimate
      }
    };
    checkStorage();
    return () => { cancelled = true; };
  }, [isClearing]);

  const handleClearCache = useCallback(async () => {
    setIsClearing(true);
    try {
      // 清理 Service Worker 缓存
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
      notify.success({ title: '缓存已清理' });
    } catch (error) {
      notify.error({ title: '清理失败', message: String(error) });
    } finally {
      setIsClearing(false);
    }
  }, []);

  return (
    <SettingWrapper title="本地存储">
      <SettingRow
        name="存储使用量"
        desc={
          storageInfo
            ? `已使用 ${formatBytes(storageInfo.usage)} / ${formatBytes(storageInfo.quota)}（${storageInfo.percentage}%）`
            : '正在获取存储信息...'
        }
      >
        {storageInfo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200 }}>
            <div style={{
              flex: 1, height: 8, borderRadius: 4,
              backgroundColor: 'var(--yunke-background-tertiary-color)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${Math.min(storageInfo.percentage, 100)}%`,
                height: '100%', borderRadius: 4,
                backgroundColor: storageInfo.percentage > 80
                  ? 'var(--yunke-error-color)'
                  : storageInfo.percentage > 60
                    ? 'var(--yunke-warning-color)'
                    : 'var(--yunke-primary-color)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--yunke-text-secondary-color)', flexShrink: 0 }}>
              {storageInfo.percentage}%
            </span>
          </div>
        )}
      </SettingRow>
      <SettingRow
        name="清理缓存"
        desc="清理 Service Worker 缓存的静态资源。文档数据不受影响。"
      >
        <Button onClick={handleClearCache} variant="secondary" disabled={isClearing}>
          {isClearing ? '清理中...' : '清理缓存'}
        </Button>
      </SettingRow>
    </SettingWrapper>
  );
};

// ====== NEW-2: 备份管理组件 ======

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const emptyBackups = new LiveData<BackupInfo[]>([]);
const falseLD = new LiveData(false);

const BackupSection = () => {
  const backupService = useServiceOptional(BackupService);
  const backups = useLiveData(backupService?.dbBackups$ ?? emptyBackups);
  const autoBackupEnabled = useLiveData(backupService?.autoBackupEnabled$ ?? falseLD);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    if (!backupService) return;
    backupService.refreshBackupList();
    backupService.refreshAutoBackupStatus();
  }, [backupService]);

  const handleCreateBackup = useCallback(async () => {
    if (!backupService) return;
    setIsBackingUp(true);
    try {
      const result = await backupService.createAllBackups();
      if (result.succeeded > 0) {
        notify.success({ title: `已备份 ${result.succeeded} 个工作区` });
      } else {
        notify.warning({ title: '没有需要备份的工作区' });
      }
    } catch {
      notify.error({ title: '备份失败' });
    } finally {
      setIsBackingUp(false);
    }
  }, [backupService]);

  const handleToggleAutoBackup = useCallback(async (enabled: boolean) => {
    if (!backupService) return;
    await backupService.setAutoBackup(enabled);
    notify.success({
      title: enabled ? '已开启自动备份（每日）' : '已关闭自动备份',
    });
  }, [backupService]);

  const handleDeleteBackup = useCallback(async (backupId: string) => {
    if (!backupService) return;
    await backupService.deleteBackup(backupId);
    notify.success({ title: '备份已删除' });
  }, [backupService]);

  const handleRestoreBackup = useCallback(async (backupId: string) => {
    if (!backupService) return;
    const result = await backupService.restoreFromBackup(backupId);
    if (result.success) {
      notify.success({ title: '恢复成功，请重启应用' });
    } else {
      notify.error({ title: `恢复失败: ${result.error}` });
    }
  }, [backupService]);

  if (!backupService) return null;

  return (
    <SettingWrapper title="数据备份">
      <SettingRow
        name="自动备份"
        desc="每 24 小时自动备份所有工作区数据库，保留最近 7 份。"
      >
        <Switch
          checked={autoBackupEnabled}
          onChange={handleToggleAutoBackup}
        />
      </SettingRow>
      <SettingRow
        name="立即备份"
        desc="手动备份所有工作区的数据库文件。"
      >
        <Button
          onClick={handleCreateBackup}
          variant="secondary"
          disabled={isBackingUp}
        >
          {isBackingUp ? '备份中...' : '立即备份'}
        </Button>
      </SettingRow>
      {backups.length > 0 && (
        <SettingRow
          name={`备份记录（${backups.length} 份）`}
          desc="点击恢复可将工作区数据回滚到备份时的状态。"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflow: 'auto', width: '100%' }}>
            {backups.slice(0, 10).map(backup => (
              <div
                key={backup.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '4px 8px',
                  borderRadius: 4,
                  backgroundColor: 'var(--yunke-background-secondary-color)',
                  fontSize: 12,
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {formatDate(backup.timestamp)}
                </span>
                <span style={{ color: 'var(--yunke-text-secondary-color)', flexShrink: 0 }}>
                  {formatBytes(backup.size)}
                </span>
                <Button
                  onClick={() => handleRestoreBackup(backup.id)}
                  variant="secondary"
                  style={{ padding: '2px 8px', fontSize: 11, height: 24 }}
                >
                  恢复
                </Button>
                <Button
                  onClick={() => handleDeleteBackup(backup.id)}
                  variant="secondary"
                  style={{ padding: '2px 8px', fontSize: 11, height: 24, color: 'var(--yunke-error-color)' }}
                >
                  删除
                </Button>
              </div>
            ))}
          </div>
        </SettingRow>
      )}
    </SettingWrapper>
  );
};
