import { useState } from 'react';
import { useCloudStorage } from './cloud-storage-manager';

export const DocumentEditTest = () => {
  const { 
    isConnected, 
    storageMode, 
    pushDocUpdate, 
    pendingOperationsCount,
    offlineOperationsCount,
    syncOfflineOperations 
  } = useCloudStorage();
  const [docContent, setDocContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 模拟YJS更新数据
  const createMockYjsUpdate = (content: string): Uint8Array => {
    // 简单的模拟：将内容转换为Uint8Array
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
    // 创建一个简单的YJS风格的更新格式
    const header = new Uint8Array([0x01, 0x02, 0x03]); // 模拟头部
    const result = new Uint8Array(header.length + contentBytes.length);
    result.set(header, 0);
    result.set(contentBytes, header.length);
    return result;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const docId = 'test-doc-edit-' + Date.now();
      const yjsUpdate = createMockYjsUpdate(docContent);
      
      console.log('🧪 [文档编辑测试] 开始保存文档:', {
        docId,
        content: docContent,
        updateSize: yjsUpdate.length,
        storageMode,
        isConnected
      });

      const timestamp = await pushDocUpdate(docId, yjsUpdate);
      
      setLastSaveTime(new Date(timestamp));
      console.log('✅ [文档编辑测试] 保存成功:', timestamp);
      
    } catch (error) {
      console.error('❌ [文档编辑测试] 保存失败:', error);
      setSaveError(error instanceof Error ? error.message : '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncOffline = async () => {
    try {
      await syncOfflineOperations();
      console.log('✅ [文档编辑测试] 离线操作同步完成');
    } catch (error) {
      console.error('❌ [文档编辑测试] 离线操作同步失败:', error);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      width: '400px',
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      zIndex: 9997, // 比状态指示器低一层
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: '16px', 
        fontWeight: '600',
        color: '#374151'
      }}>
        📝 文档编辑测试
      </h3>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          marginBottom: '8px'
        }}>
          存储状态: 
          <span style={{
            color: storageMode === 'cloud' ? '#10b981' : '#f59e0b',
            fontWeight: '500',
            marginLeft: '4px'
          }}>
            {storageMode === 'cloud' ? '🟢 云存储' : '🟡 本地模式'}
          </span>
        </div>
      </div>

      <textarea
        value={docContent}
        onChange={(e) => setDocContent(e.target.value)}
        placeholder="在这里输入文档内容..."
        style={{
          width: '100%',
          height: '120px',
          padding: '8px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '14px',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box'
        }}
      />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '12px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={handleSave}
          disabled={isSaving || !docContent.trim()}
          style={{
            backgroundColor: !isSaving && docContent.trim() ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 16px',
            fontSize: '14px',
            cursor: !isSaving && docContent.trim() ? 'pointer' : 'not-allowed',
            fontWeight: '500'
          }}
        >
          {isSaving ? '保存中...' : '保存文档'}
        </button>

        {offlineOperationsCount > 0 && (
          <button
            onClick={handleSyncOffline}
            style={{
              backgroundColor: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            同步离线操作 ({offlineOperationsCount})
          </button>
        )}

        {lastSaveTime && (
          <span style={{
            fontSize: '12px',
            color: '#10b981'
          }}>
            ✅ {lastSaveTime.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* 状态信息 */}
      <div style={{
        marginTop: '12px',
        padding: '8px',
        backgroundColor: '#f9fafb',
        borderRadius: '4px',
        fontSize: '12px',
        color: '#6b7280'
      }}>
        <div>连接状态: {isConnected ? '✅ 已连接' : '❌ 未连接'}</div>
        <div>存储模式: {storageMode}</div>
        {pendingOperationsCount > 0 && (
          <div>排队操作: {pendingOperationsCount}</div>
        )}
        {offlineOperationsCount > 0 && (
          <div>离线操作: {offlineOperationsCount}</div>
        )}
      </div>

      {saveError && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#dc2626'
        }}>
          ❌ {saveError}
        </div>
      )}

      <div style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.4'
      }}>
        💡 提示：输入内容后点击"保存文档"，系统会通过Socket.IO将数据保存到Java后端数据库的三个表中。
      </div>
    </div>
  );
};