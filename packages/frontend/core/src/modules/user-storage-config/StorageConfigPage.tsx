import React, { useEffect, useState } from 'react';
import { UserStorageConfigService } from './service';
import {
  StorageProvider,
  STORAGE_PROVIDERS,
  type UserStorageConfig,
  type ProviderInfo,
} from './types';
import './StorageConfigPage.css';

export const StorageConfigPage: React.FC = () => {
  const [config, setConfig] = useState<UserStorageConfig>({
    enabled: false,
    provider: StorageProvider.LOCAL,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [stats, setStats] = useState<any>(null);

  // 加载配置
  useEffect(() => {
    loadConfig();
    loadStats();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await UserStorageConfigService.getConfig();
      if (data) {
        setConfig(data);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await UserStorageConfigService.getStats();
      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await UserStorageConfigService.saveConfig(config);
      setConfig(saved);
      alert('保存成功！');
    } catch (error) {
      alert('保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      const result = await UserStorageConfigService.testConfig(config);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : '测试失败',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除存储配置吗？删除后将使用系统默认配置。')) {
      return;
    }

    try {
      await UserStorageConfigService.deleteConfig();
      setConfig({
        enabled: false,
        provider: StorageProvider.LOCAL,
      });
      alert('配置已删除，将使用系统默认配置');
    } catch (error) {
      alert('删除失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const selectedProvider =
    STORAGE_PROVIDERS.find(p => p.value === config.provider) ||
    STORAGE_PROVIDERS[0];

  if (loading) {
    return <div className="storage-config-loading">加载中...</div>;
  }

  return (
    <div className="storage-config-page">
      <div className="storage-config-header">
        <h1>存储配置</h1>
        <p className="storage-config-subtitle">
          配置您的云存储供应商，所有上传的文件将保存到您指定的位置
        </p>
      </div>

      {/* 存储统计 */}
      {stats && (
        <div className="storage-stats-card">
          <h3>存储使用情况</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">文件总数</span>
              <span className="stat-value">{stats.totalFiles || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">存储空间</span>
              <span className="stat-value">{stats.usedQuota || '0 MB'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 配置表单 */}
      <div className="storage-config-form">
        {/* 启用开关 */}
        <div className="form-group">
          <label className="form-label">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={e => setConfig({ ...config, enabled: e.target.checked })}
            />
            <span>启用自定义存储配置</span>
          </label>
          <p className="form-help">
            关闭后将使用系统默认存储配置
          </p>
        </div>

        {config.enabled && (
          <>
            {/* 存储提供商选择 */}
            <div className="form-group">
              <label className="form-label">存储提供商</label>
              <div className="provider-grid">
                {STORAGE_PROVIDERS.map((provider: ProviderInfo) => (
                  <div
                    key={provider.value}
                    className={`provider-card ${
                      config.provider === provider.value ? 'selected' : ''
                    }`}
                    onClick={() => setConfig({ ...config, provider: provider.value })}
                  >
                    <div className="provider-icon">{provider.icon}</div>
                    <div className="provider-name">{provider.label}</div>
                    <div className="provider-desc">{provider.description}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 配置名称 */}
            <div className="form-group">
              <label className="form-label">配置名称（可选）</label>
              <input
                type="text"
                className="form-input"
                value={config.configName || ''}
                onChange={e => setConfig({ ...config, configName: e.target.value })}
                placeholder="例如：我的云存储"
              />
            </div>

            {/* 本地存储配置 */}
            {config.provider === StorageProvider.LOCAL && (
              <>
                <div className="form-group">
                  <label className="form-label">存储路径</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.localPath || ''}
                    onChange={e => setConfig({ ...config, localPath: e.target.value })}
                    placeholder="/var/storage/user_files"
                  />
                  <p className="form-help">留空使用默认路径</p>
                </div>
              </>
            )}

            {/* 云存储配置 */}
            {selectedProvider.requiresCloud && (
              <>
                <div className="form-group">
                  <label className="form-label">Bucket名称 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.bucket || ''}
                    onChange={e => setConfig({ ...config, bucket: e.target.value })}
                    placeholder="your-bucket-name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">区域 *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.region || ''}
                    onChange={e => setConfig({ ...config, region: e.target.value })}
                    placeholder={
                      config.provider === StorageProvider.COS
                        ? 'ap-beijing'
                        : 'us-east-1'
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Access Key ID *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.accessKeyId || ''}
                    onChange={e =>
                      setConfig({ ...config, accessKeyId: e.target.value })
                    }
                    placeholder="AKIAIOSFODNN7EXAMPLE"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Secret Access Key *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={config.secretAccessKey || ''}
                    onChange={e =>
                      setConfig({ ...config, secretAccessKey: e.target.value })
                    }
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">端点URL *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.endpoint || ''}
                    onChange={e => setConfig({ ...config, endpoint: e.target.value })}
                    placeholder={
                      config.provider === StorageProvider.COS
                        ? 'https://cos.ap-beijing.myqcloud.com'
                        : config.provider === StorageProvider.R2
                        ? 'https://xxxxx.r2.cloudflarestorage.com'
                        : 'https://s3.amazonaws.com'
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CDN URL前缀（可选）</label>
                  <input
                    type="text"
                    className="form-input"
                    value={config.publicUrlPrefix || ''}
                    onChange={e =>
                      setConfig({ ...config, publicUrlPrefix: e.target.value })
                    }
                    placeholder="https://cdn.example.com"
                  />
                  <p className="form-help">用于文件访问的公开URL前缀</p>
                </div>
              </>
            )}

            {/* 描述 */}
            <div className="form-group">
              <label className="form-label">描述（可选）</label>
              <textarea
                className="form-textarea"
                value={config.description || ''}
                onChange={e => setConfig({ ...config, description: e.target.value })}
                placeholder="说明这个配置的用途..."
                rows={3}
              />
            </div>

            {/* 测试结果 */}
            {testResult && (
              <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
                <strong>{testResult.success ? '✓ 测试成功' : '✗ 测试失败'}</strong>
                <p>{testResult.message}</p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="form-actions">
              <button
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={testing || saving}
              >
                {testing ? '测试中...' : '测试连接'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving || testing}
              >
                {saving ? '保存中...' : '保存配置'}
              </button>
              {config.id && (
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={saving || testing}
                >
                  删除配置
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* 验证状态 */}
      {config.verified && config.lastVerifiedAt && (
        <div className="verification-status">
          <span className="verify-badge">✓ 已验证</span>
          <span className="verify-time">
            最后验证: {new Date(config.lastVerifiedAt).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};
