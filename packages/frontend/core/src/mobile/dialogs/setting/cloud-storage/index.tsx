import { notify } from '@yunke/component';
import { ExternalStorageService } from '@yunke/core/modules/external-storage';
import type { S3Config } from '@yunke/core/modules/external-storage';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useLiveData, useService, useServiceOptional } from '@toeverything/infra';
import {
  DownloadIcon,
  UploadIcon,
} from '@blocksuite/icons/rc';
import { useCallback, useState, useEffect } from 'react';

// 存储类型定义
type ExternalStorageType = 'local' | 's3' | 'oss' | 'webdav';

import { SettingGroup } from '../group';
import * as styles from './styles.css';

interface StorageTypeOption {
  type: ExternalStorageType;
  label: string;
}

const STORAGE_TYPES: StorageTypeOption[] = [
  { type: 'local', label: '本地存储' },
  { type: 's3', label: 'S3/MinIO' },
  // { type: 'oss', label: '阿里云 OSS' },
  // { type: 'webdav', label: 'WebDAV' },
];

const S3ConfigForm = ({
  config,
  onChange,
}: {
  config: Partial<S3Config>;
  onChange: (config: Partial<S3Config>) => void;
}) => {
  return (
    <div className={styles.configForm}>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>服务地址 (Endpoint)</label>
        <input
          className={styles.input}
          type="text"
          placeholder="https://s3.amazonaws.com 或 MinIO 地址"
          value={config.endpoint || ''}
          onChange={e => onChange({ ...config, endpoint: e.target.value })}
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>存储桶 (Bucket)</label>
        <input
          className={styles.input}
          type="text"
          placeholder="your-bucket-name"
          value={config.bucket || ''}
          onChange={e => onChange({ ...config, bucket: e.target.value })}
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>区域 (Region，可选)</label>
        <input
          className={styles.input}
          type="text"
          placeholder="us-east-1"
          value={config.region || ''}
          onChange={e => onChange({ ...config, region: e.target.value })}
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Access Key</label>
        <input
          className={styles.input}
          type="text"
          placeholder="AKIAIOSFODNN7EXAMPLE"
          value={config.accessKey || ''}
          onChange={e => onChange({ ...config, accessKey: e.target.value })}
        />
      </div>
      <div className={styles.inputGroup}>
        <label className={styles.inputLabel}>Secret Key</label>
        <input
          className={styles.input}
          type="password"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          value={config.secretKey || ''}
          onChange={e => onChange({ ...config, secretKey: e.target.value })}
        />
      </div>
    </div>
  );
};

export const CloudStorageGroup = () => {
  const externalStorageService = useServiceOptional(ExternalStorageService);
  const workspaceService = useService(WorkspaceService);
  const workspace = workspaceService.workspace;
  const workspaceId = workspace.id;
  const workspaceName = useLiveData(workspace.name$) ?? 'workspace';
  
  // 存储类型
  const [storageType, setStorageType] = useState<ExternalStorageType>(() => {
    return externalStorageService?.type || 'local';
  });
  
  // S3 配置
  const [s3Config, setS3Config] = useState<Partial<S3Config>>(() => {
    const config = externalStorageService?.config;
    if (config?.type === 's3') {
      return config.config as S3Config;
    }
    return {};
  });
  
  // 状态
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  
  // 云端工作区列表
  const [cloudWorkspaces, setCloudWorkspaces] = useState<Array<{ id: string; size: number; lastModified: string }>>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // 检查是否已配置
  const isConfigured = externalStorageService?.isConfigured || false;
  
  // 验证配置是否完整
  const isS3ConfigValid = useCallback(() => {
    return !!(s3Config.endpoint && s3Config.bucket && s3Config.accessKey && s3Config.secretKey);
  }, [s3Config]);

  // 测试连接
  const handleTestConnection = useCallback(async () => {
    if (!externalStorageService) return;
    
    setTesting(true);
    setStatusMessage(null);
    
    try {
      const result = await externalStorageService.testConnectionWithConfig(storageType, s3Config as Record<string, string>);
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `测试失败: ${String(error)}`,
      });
    } finally {
      setTesting(false);
    }
  }, [externalStorageService, storageType, s3Config]);

  // 保存配置
  const handleSaveConfig = useCallback(async () => {
    if (!externalStorageService) return;
    
    setSaving(true);
    setStatusMessage(null);
    
    try {
      // 先测试连接
      const testResult = await externalStorageService.testConnectionWithConfig(storageType, s3Config as Record<string, string>);
      
      if (!testResult.success && storageType !== 'local') {
        setStatusMessage({
          type: 'error',
          message: `连接失败，无法保存: ${testResult.message}`,
        });
        return;
      }
      
      // 保存配置
      externalStorageService.saveConfig({
        type: storageType,
        config: storageType === 's3' ? s3Config as S3Config : {},
      });
      
      setStatusMessage({
        type: 'success',
        message: storageType === 'local' ? '已切换到本地存储' : '云存储配置已保存',
      });
      
      notify.success({ title: '配置已保存' });
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `保存失败: ${String(error)}`,
      });
    } finally {
      setSaving(false);
    }
  }, [externalStorageService, storageType, s3Config]);

  // 清除配置
  const handleClearConfig = useCallback(() => {
    if (!externalStorageService) return;
    
    externalStorageService.clearConfig();
    setStorageType('local');
    setS3Config({});
    setStatusMessage({
      type: 'info',
      message: '已清除云存储配置，切换到本地存储',
    });
    notify.success({ title: '配置已清除' });
  }, [externalStorageService]);

  // 上传到云端
  const handleUpload = useCallback(async () => {
    if (!externalStorageService || !workspace.docCollection) return;
    
    setUploading(true);
    setStatusMessage(null);
    
    try {
      const result = await externalStorageService.syncWorkspaceToCloud(
        workspace.docCollection,
        workspaceId
      );
      
      setStatusMessage({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      
      if (result.success) {
        notify.success({ title: '上传成功' });
        // 刷新云端工作区列表
        loadCloudWorkspaces();
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `上传失败: ${String(error)}`,
      });
    } finally {
      setUploading(false);
    }
  }, [externalStorageService, workspace.docCollection, workspaceId]);

  // 从云端下载
  const handleDownload = useCallback(async () => {
    if (!externalStorageService || !workspace.docCollection) return;
    
    setDownloading(true);
    setStatusMessage({ type: 'info', message: '正在检查云端数据...' });
    
    try {
      // 先检查云端是否有数据
      const cloudResult = await externalStorageService.getCloudWorkspaces();
      
      if (!cloudResult.success) {
        setStatusMessage({
          type: 'error',
          message: `无法获取云端列表: ${cloudResult.message}`,
        });
        return;
      }
      
      // 更新云端工作区列表
      setCloudWorkspaces(cloudResult.workspaces || []);
      
      // 检查当前工作区是否在云端存在
      const currentInCloud = cloudResult.workspaces?.find(w => w.id === workspaceId);
      
      if (!currentInCloud) {
        if ((cloudResult.workspaces?.length || 0) === 0) {
          setStatusMessage({
            type: 'info',
            message: '云端暂无任何工作区数据，请先上传数据到云端',
          });
        } else {
          setStatusMessage({
            type: 'info',
            message: `当前工作区 (${workspaceId}) 在云端不存在。云端有 ${cloudResult.workspaces?.length} 个其他工作区，可从列表中选择下载。`,
          });
        }
        return;
      }
      
      // 确认下载
      setStatusMessage({ type: 'info', message: '正在下载数据...' });
      
      const result = await externalStorageService.syncWorkspaceFromCloud(
        workspace.docCollection,
        workspaceId
      );
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: `${result.message}\n\n建议刷新页面以查看最新数据。`,
        });
        notify.success({ title: '下载成功', message: '请刷新页面查看更新' });
      } else {
        setStatusMessage({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `下载失败: ${String(error)}`,
      });
    } finally {
      setDownloading(false);
    }
  }, [externalStorageService, workspace.docCollection, workspaceId]);

  // 加载云端工作区列表
  const loadCloudWorkspaces = useCallback(async () => {
    if (!externalStorageService || !isConfigured) return;
    
    setLoadingWorkspaces(true);
    try {
      const result = await externalStorageService.getCloudWorkspaces();
      if (result.success && result.workspaces) {
        setCloudWorkspaces(result.workspaces);
      }
    } catch (error) {
      console.error('加载云端工作区列表失败:', error);
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [externalStorageService, isConfigured]);

  // 下载指定的云端工作区
  const handleDownloadSpecific = useCallback(async (cloudWorkspaceId: string) => {
    if (!externalStorageService || !workspace.docCollection) return;
    
    setDownloading(true);
    setStatusMessage({ type: 'info', message: `正在下载工作区 ${cloudWorkspaceId}...` });
    
    try {
      const result = await externalStorageService.syncWorkspaceFromCloud(
        workspace.docCollection,
        cloudWorkspaceId
      );
      
      if (result.success) {
        setStatusMessage({
          type: 'success',
          message: `${result.message}\n\n建议刷新页面以查看最新数据。`,
        });
        notify.success({ title: '下载成功', message: '请刷新页面查看更新' });
      } else {
        setStatusMessage({
          type: 'error',
          message: result.message,
        });
      }
    } catch (error) {
      setStatusMessage({
        type: 'error',
        message: `下载失败: ${String(error)}`,
      });
    } finally {
      setDownloading(false);
    }
  }, [externalStorageService, workspace.docCollection]);

  // 配置变更时加载云端列表
  useEffect(() => {
    if (isConfigured) {
      loadCloudWorkspaces();
    }
  }, [isConfigured, loadCloudWorkspaces]);

  if (!externalStorageService) {
    return null;
  }

  return (
    <SettingGroup title="云存储同步" className={styles.cloudStorageGroup}>
      {/* 存储类型选择 */}
      <div className={styles.storageTypeSelector}>
        {STORAGE_TYPES.map(option => (
          <button
            key={option.type}
            className={styles.storageTypeButton}
            data-active={storageType === option.type}
            onClick={() => setStorageType(option.type)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* S3 配置表单 */}
      {storageType === 's3' && (
        <S3ConfigForm config={s3Config} onChange={setS3Config} />
      )}

      {/* 本地存储说明 */}
      {storageType === 'local' && (
        <div className={styles.statusInfo}>
          当前使用本地存储（IndexedDB），数据仅保存在本设备上。
          选择云存储可以实现多设备数据同步。
        </div>
      )}

      {/* 操作按钮 */}
      {storageType !== 'local' && (
        <div className={styles.buttonGroup}>
          <button
            className={styles.secondaryButton}
            onClick={handleTestConnection}
            disabled={testing || !isS3ConfigValid()}
          >
            {testing ? '测试中...' : '测试连接'}
          </button>
          <button
            className={styles.primaryButton}
            onClick={handleSaveConfig}
            disabled={saving || !isS3ConfigValid()}
          >
            {saving ? '保存中...' : '保存配置'}
          </button>
        </div>
      )}

      {/* 清除配置按钮 */}
      {isConfigured && (
        <div className={styles.buttonGroupSecondary}>
          <button
            className={styles.dangerButton}
            onClick={handleClearConfig}
          >
            清除配置
          </button>
        </div>
      )}

      {/* 状态消息 */}
      {statusMessage && (
        <div
          className={
            statusMessage.type === 'success'
              ? styles.statusSuccess
              : statusMessage.type === 'error'
                ? styles.statusError
                : styles.statusInfo
          }
        >
          {statusMessage.message}
        </div>
      )}

      {/* 同步操作 */}
      {isConfigured && (
        <div className={styles.syncSection}>
          <div className={styles.syncTitle}>
            同步当前工作区：{workspaceName}
          </div>
          <div className={styles.syncButtons}>
            <button
              className={styles.syncButton}
              onClick={handleUpload}
              disabled={uploading || downloading}
            >
              <UploadIcon className={styles.syncIcon} />
              {uploading ? '上传中...' : '上传到云端'}
            </button>
            <button
              className={styles.syncButton}
              onClick={handleDownload}
              disabled={uploading || downloading}
            >
              <DownloadIcon className={styles.syncIcon} />
              {downloading ? '下载中...' : '从云端下载'}
            </button>
          </div>

          {/* 云端工作区列表 */}
          {cloudWorkspaces.length > 0 && (
            <div className={styles.cloudWorkspaceList}>
              <div className={styles.syncTitle}>云端已有的工作区（点击下载）</div>
              {cloudWorkspaces.map(ws => (
                <div key={ws.id} className={styles.cloudWorkspaceItem}>
                  <div className={styles.cloudWorkspaceInfo}>
                    <div className={styles.cloudWorkspaceName}>
                      {ws.id === workspaceId ? `${workspaceName} (当前)` : ws.id.substring(0, 12) + '...'}
                    </div>
                    <div className={styles.cloudWorkspaceMeta}>
                      {(ws.size / 1024).toFixed(1)} KB · {new Date(ws.lastModified).toLocaleString()}
                    </div>
                  </div>
                  <button
                    className={`${styles.secondaryButton} ${styles.downloadButton}`}
                    onClick={() => handleDownloadSpecific(ws.id)}
                    disabled={downloading}
                  >
                    {downloading ? '...' : '下载'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {cloudWorkspaces.length === 0 && !loadingWorkspaces && (
            <div className={styles.emptyState}>
              云端暂无工作区数据，点击"上传到云端"开始同步
            </div>
          )}

          {/* 刷新列表按钮 */}
          <button
            className={`${styles.secondaryButton} ${styles.refreshButton}`}
            onClick={loadCloudWorkspaces}
            disabled={loadingWorkspaces}
          >
            {loadingWorkspaces ? '刷新中...' : '刷新云端列表'}
          </button>

          {/* 调试信息 */}
          <button
            className={`${styles.secondaryButton} ${styles.debugButton}`}
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? '隐藏调试信息' : '显示调试信息'}
          </button>

          {showDebug && (
            <div className={`${styles.statusInfo} ${styles.debugInfo}`}>
              <div><strong>调试信息</strong></div>
              <div>工作区 ID: {workspaceId}</div>
              <div>存储类型: {storageType}</div>
              <div>已配置: {isConfigured ? '是' : '否'}</div>
              <div>S3 Endpoint: {s3Config.endpoint || '未配置'}</div>
              <div>S3 Bucket: {s3Config.bucket || '未配置'}</div>
              <div>云端工作区数: {cloudWorkspaces.length}</div>
              <div>云端路径: yunke-workspaces/{workspaceId}/snapshot.json</div>
            </div>
          )}
        </div>
      )}
    </SettingGroup>
  );
};
