import { notify } from '@yunke/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { Button } from '@yunke/component/ui/button';
import { Switch } from '@yunke/component/ui/switch';
import { useAppConfigStorage } from '@yunke/core/components/hooks/use-app-config-storage';
import { GlobalDialogService } from '@yunke/core/modules/dialogs';
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import { useService, useServiceOptional } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

const DEFAULT_OFFLINE_PATH_LABEL = '默认（应用数据目录）';

export const OfflineSettings = () => {
  const [config, setConfig] = useAppConfigStorage();
  const globalDialogService = useService(GlobalDialogService);
  const desktopApi = useServiceOptional(DesktopApiService);

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
      updateOfflineConfig({ enabled: checked });
      notify.info({
        title: '离线模式设置已更新',
        message: '重启应用后生效',
      });
    },
    [updateOfflineConfig]
  );

  const handleSelectPath = useCallback(async () => {
    if (!desktopApi?.handler?.dialog?.selectDBFileLocation) {
      notify.error({ title: '当前环境不支持选择目录' });
      return;
    }
    const result = await desktopApi.handler.dialog.selectDBFileLocation();
    if (result?.canceled || !result?.filePath) return;
    updateOfflineConfig({ dataPath: result.filePath });
    notify.success({
      title: '已更新离线数据目录',
      message: '重启应用后生效',
    });
  }, [desktopApi, updateOfflineConfig]);

  const handleClearPath = useCallback(() => {
    updateOfflineConfig({ dataPath: '' });
    notify.info({
      title: '已恢复默认数据目录',
      message: '重启应用后生效',
    });
  }, [updateOfflineConfig]);

  const handleCopyPath = useCallback(async () => {
    if (!offlineConfig.dataPath) return;
    try {
      await navigator.clipboard.writeText(offlineConfig.dataPath);
      notify.success({ title: '已复制离线数据目录' });
    } catch (error) {
      console.error(error);
      notify.error({ title: '复制失败，请手动复制' });
    }
  }, [offlineConfig.dataPath]);

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

  return (
    <>
      <SettingHeader
        title="离线模式"
        subtitle="用于无后端环境下的本地存储与数据管理。"
      />

      <SettingWrapper title="离线配置">
        <SettingRow
          name="启用离线模式"
          desc="启用后本地数据将存储在离线目录中，不依赖后端服务。"
        >
          <Switch checked={offlineConfig.enabled} onChange={handleToggleOffline} />
        </SettingRow>
        <SettingRow
          name="离线数据目录"
          desc={
            offlineConfig.dataPath
              ? `当前路径：${offlineConfig.dataPath}（本地工作区统一根目录）`
              : `当前路径：${DEFAULT_OFFLINE_PATH_LABEL}（本地工作区统一根目录）`
          }
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onClick={handleSelectPath}>选择文件夹</Button>
            <Button onClick={handleClearPath} variant="outline">
              恢复默认
            </Button>
            <Button
              onClick={handleCopyPath}
              variant="outline"
              disabled={!offlineConfig.dataPath}
            >
              复制路径
            </Button>
          </div>
        </SettingRow>
        <SettingRow
          name="重启应用"
          desc="修改离线设置后需要重启应用才能生效。"
        >
          <Button onClick={handleRestart} variant="outline">
            立即重启
          </Button>
        </SettingRow>
        <SettingRow
          name="创建本地工作区"
          desc="离线模式下的数据将以本地SQLite工作区保存。"
        >
          <Button onClick={handleCreateLocalWorkspace} variant="outline">
            创建本地工作区
          </Button>
        </SettingRow>
      </SettingWrapper>
    </>
  );
};
