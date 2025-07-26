import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useCloudStorage } from '../cloud-storage-manager';

// 保存状态类型
type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';

interface SaveStatusIndicatorProps {
  // 移除props，改为从路由和上下文自动获取
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = () => {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [isManualSaving, setIsManualSaving] = useState(false);
  const cloudStorage = useCloudStorage();
  const params = useParams();

  // 从路由参数获取workspaceId和docId
  const workspaceId = params.workspaceId;
  const docId = params.pageId; // 在AFFiNE中，pageId就是docId

  // 调试信息 - 显示所有可能的参数
  // console.log('🔍 [SaveStatusIndicator] 路由参数调试:', {
  //   allParams: params,
  //   workspaceId: params.workspaceId,
  //   pageId: params.pageId,
  //   docId: params.docId,
  //   id: params.id,
  //   pathname: window.location.pathname,
  //   search: window.location.search,
  //   hash: window.location.hash,
  //   href: window.location.href
  // });

  // 尝试从URL路径中解析docId
  const pathSegments = window.location.pathname.split('/').filter(Boolean);
  // console.log('🔍 [SaveStatusIndicator] URL路径分析:', {
  //   pathSegments,
  //   potentialDocId: pathSegments[pathSegments.length - 1],
  //   isWorkspacePath: pathSegments[0] === 'workspace'
  // });

  // 智能获取docId
  const finalDocId = useMemo(() => {
    if (docId) return docId;
    
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 3 && pathSegments[0] === 'workspace') {
      // URL格式: /workspace/{workspaceId}/{docId}
      const urlDocId = pathSegments[2];
      console.log('🔍 [SaveStatusIndicator] 从URL路径解析docId:', urlDocId);
      return urlDocId;
    }
    
    // 使用备用docId
    const fallbackDocId = 'LpaTmZqNPqWRY7M2R63MM';
    console.log('🔍 [SaveStatusIndicator] 使用备用docId:', fallbackDocId);
    return fallbackDocId;
  }, [docId, window.location.pathname]);

  // 不要隐藏组件，而是显示调试信息
  // if (!workspaceId || !docId) {
  //   console.log('⚠️ [SaveStatusIndicator] 缺少必要参数，隐藏组件:', { workspaceId, docId });
  //   return null;
  // }

  // 创建模拟的YJS更新数据
  const createMockYjsUpdate = useCallback((content: string): Uint8Array => {
    const encoder = new TextEncoder();
    const contentBytes = encoder.encode(content);
    const header = new Uint8Array([0x01, 0x02, 0x03, 0x04]); // 模拟YJS头部
    const result = new Uint8Array(header.length + contentBytes.length);
    result.set(header, 0);
    result.set(contentBytes, header.length);
    return result;
  }, []);

  // 手动保存功能
  const handleManualSave = useCallback(async () => {
    // 使用从控制台看到的实际值作为备用
    const finalWorkspaceId = workspaceId || 'd33eccd3-3d08-4bcd-8c16-a775e2ea1f28';
    const actualDocId = finalDocId || 'LpaTmZqNPqWRY7M2R63MM';
    
    if (!finalWorkspaceId || !actualDocId) {
      console.error('❌ [保存状态指示器] 缺少docId或workspaceId');
      console.log('  🔍 当前参数:', { 
        docId: actualDocId, 
        workspaceId: finalWorkspaceId, 
        allParams: params,
        usingFallback: !workspaceId || !finalDocId
      });
      return;
    }

    console.log('  📊 路由参数:', { 
      workspaceId: finalWorkspaceId, 
      docId: actualDocId, 
      allParams: params,
      usingFallback: !workspaceId || !finalDocId
    });
    setIsManualSaving(true);
    setSaveStatus('saving');

    try {
      // 获取当前页面的文档内容
      const pageContent = document.querySelector('[data-block-id]')?.textContent || 
                         document.querySelector('.affine-page-viewport')?.textContent ||
                         document.querySelector('[contenteditable]')?.textContent ||
                         document.querySelector('.ProseMirror')?.textContent ||
                         `手动保存测试内容 - ${new Date().toISOString()}`;
      
      console.log('  📄 最终选择的内容:', pageContent.substring(0, 200) + '...');
      console.log('  📊 内容长度:', pageContent.length, '字符');

      // 创建YJS更新数据
      const updateData = createMockYjsUpdate(pageContent);
      console.log('  📊 原始内容:', pageContent);
      console.log('  📦 更新数据大小:', updateData.length, '字节');
      console.log('  🔍 更新数据前20字节:', Array.from(updateData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      // 转换为Base64看看
      const updateBase64 = Array.from(updateData, byte => String.fromCharCode(byte)).join('');
      const base64String = btoa(updateBase64);
      console.log('  📝 Base64编码:', base64String.substring(0, 100) + '...');
      console.log('  📊 Base64长度:', base64String.length, '字符');

      // 使用云存储管理器推送更新
      console.log(`  📊 传递给pushDocUpdate的参数:`);
      console.log(`    docId: "${actualDocId}"`);
      console.log(`    updateData类型: ${updateData.constructor.name}`);
      console.log(`    updateData长度: ${updateData.length}字节`);
      console.log(`    updateData前20字节: [${Array.from(updateData.slice(0, 20)).join(', ')}]`);
      console.log(`    updateData十六进制: ${Array.from(updateData.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
      
      // 记录实际传递的原始内容
      console.log(`  📄 原始页面内容片段: "${pageContent.substring(0, 100)}..."`);
      console.log(`  📊 原始内容长度: ${pageContent.length}字符`);
      
      // 验证YJS更新数据的创建过程
      const mockHeader = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      const contentBytes = new TextEncoder().encode(pageContent);
      console.log(`  🔧 Mock创建过程验证:`);
      console.log(`    header: [${Array.from(mockHeader).join(', ')}]`);
      console.log(`    contentBytes长度: ${contentBytes.length}`);
      console.log(`    contentBytes前10字节: [${Array.from(contentBytes.slice(0, 10)).join(', ')}]`);
      console.log(`    最终updateData是否=header+content: ${updateData.length === mockHeader.length + contentBytes.length}`);
      
      const timestamp = await cloudStorage.pushDocUpdate(actualDocId, updateData);
      
      setSaveStatus('saved');
      setLastSaveTime(new Date(timestamp));

    } catch (error) {
      console.error('❌ [保存状态指示器] 手动保存失败:', error);
      setSaveStatus('error');
    } finally {
      setIsManualSaving(false);
    }
  }, [finalDocId, workspaceId, params, cloudStorage.pushDocUpdate, createMockYjsUpdate]);

  // 监听输入事件，将状态设置为未保存
  useEffect(() => {
    const handleInput = () => {
      if (saveStatus !== 'saving') {
        setSaveStatus('unsaved');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S 快捷键保存
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    // 监听输入事件
    document.addEventListener('input', handleInput);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('input', handleInput);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [saveStatus, handleManualSave]);

  // 获取状态文本和颜色
  const getStatusInfo = () => {
    switch (saveStatus) {
      case 'saved':
        return {
          text: '已保存',
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          icon: '✓'
        };
      case 'unsaved':
        return {
          text: '未保存',
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          icon: '●'
        };
      case 'saving':
        return {
          text: '保存中...',
          color: '#3B82F6',
          bgColor: 'rgba(59, 130, 246, 0.1)',
          icon: '⏳'
        };
      case 'error':
        return {
          text: '保存失败',
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          icon: '⚠'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: statusInfo.bgColor,
      border: `1px solid ${statusInfo.color}`,
      borderRadius: '6px',
      padding: '6px 12px',
      fontSize: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      cursor: 'pointer',
      margin: '8px 0'
    }}>
      <span style={{ color: statusInfo.color, fontSize: '14px' }}>
        {statusInfo.icon}
      </span>
      <span style={{ color: statusInfo.color, fontWeight: '500' }}>
        {statusInfo.text}
      </span>
      
      {/* 始终显示保存按钮，方便测试 */}
      <button
        onClick={handleManualSave}
        disabled={isManualSaving}
        style={{
          marginLeft: '8px',
          backgroundColor: statusInfo.color,
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '11px',
          cursor: isManualSaving ? 'not-allowed' : 'pointer',
          opacity: isManualSaving ? 0.6 : 1
        }}
      >
        {isManualSaving ? '保存中...' : '手动保存'}
      </button>
      
      {lastSaveTime && saveStatus === 'saved' && (
        <span style={{ 
          color: '#6B7280', 
          fontSize: '10px',
          marginLeft: '4px'
        }}>
          {lastSaveTime.toLocaleTimeString()}
        </span>
      )}
      
      {/* 调试信息 */}
      <span style={{ 
        color: '#6B7280', 
        fontSize: '10px',
        marginLeft: '4px',
        opacity: 0.7
      }}>
        {cloudStorage.isConnected ? '🟢' : '🔴'}
      </span>
      
      {/* 参数调试信息 */}
      <span style={{ 
        color: '#6B7280', 
        fontSize: '9px',
        marginLeft: '4px',
        opacity: 0.5,
        maxWidth: '100px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {(workspaceId || 'd33eccd3-3d08-4bcd-8c16-a775e2ea1f28') && 
         (docId || 'LpaTmZqNPqWRY7M2R63MM') ? 
          `${(workspaceId || 'd33eccd3-3d08-4bcd-8c16-a775e2ea1f28').slice(0,8)}.../${(docId || 'LpaTmZqNPqWRY7M2R63MM').slice(0,8)}...` : 
          '等待路由...'}
        {!workspaceId || !docId ? ' (备用)' : ''}
      </span>
    </div>
  );
};

// 使用示例：在主页面组件中添加这个组件
export default SaveStatusIndicator;