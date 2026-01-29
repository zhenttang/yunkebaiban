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
import {
  clearOfflineRootHandle,
  getOfflineRootHandleName,
  isFileSystemAccessSupported,
  requestOfflineRootHandle,
} from '@yunke/core/modules/storage/offline-file-handle';
import { useService, useServiceOptional } from '@toeverything/infra';
import { Cloud, HardDrive } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_OFFLINE_PATH_LABEL = '默认（应用数据目录）';

export const OfflineSettings = () => {
  const [config, setConfig] = useAppConfigStorage();
  const globalDialogService = useService(GlobalDialogService);
  const desktopApi = useServiceOptional(DesktopApiService);
  const [offlineHandleName, setOfflineHandleName] = useState('');
  const supportsFileAccess = isFileSystemAccessSupported();
  
  // 🔧 云同步开关状态
  const [cloudSyncEnabledState, setCloudSyncEnabledState] = useState(() => isCloudSyncEnabled());
  const [cloudSyncPending, setCloudSyncPending] = useState(false);

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

  const handleSelectPath = useCallback(async () => {
    if (BUILD_CONFIG.isElectron && desktopApi?.handler?.dialog?.selectDBFileLocation) {
      const result = await desktopApi.handler.dialog.selectDBFileLocation();
      if (result?.canceled || !result?.filePath) return;
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
  }, [desktopApi, supportsFileAccess, updateOfflineConfig]);

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

  useEffect(() => {
    if (BUILD_CONFIG.isElectron) return;
    getOfflineRootHandleName()
      .then(name => setOfflineHandleName(name))
      .catch(console.error);
  }, [config.offline]);

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
          name="离线数据目录"
          desc={
            (BUILD_CONFIG.isElectron ? offlineConfig.dataPath : offlineHandleName)
              ? `当前路径：${BUILD_CONFIG.isElectron ? offlineConfig.dataPath : offlineHandleName}（本地工作区统一根目录）`
              : `当前路径：${DEFAULT_OFFLINE_PATH_LABEL}（本地工作区统一根目录）`
          }
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleSelectPath}>选择文件夹</Button>
            <Button onClick={handleClearPath} variant="secondary">
              恢复默认
            </Button>
            <Button
              onClick={handleCopyPath}
              variant="secondary"
              disabled={!offlineConfig.dataPath || !BUILD_CONFIG.isElectron}
            >
              复制路径
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
    </>
  );
};
