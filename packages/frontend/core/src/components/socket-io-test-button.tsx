import React from 'react';
import { getCurrentStore } from '@toeverything/infra';

/**
 * Socket.IO连接和文档保存测试组件
 */
export const SocketIOTestButton: React.FC = () => {
  const handleTestSocketIO = async () => {
    console.log('🧪 [Socket.IO测试] 开始测试按钮点击');
    
    try {
      // 获取当前存储实例
      const store = getCurrentStore();
      console.log('🧪 [Socket.IO测试] 获取到store:', store);
      
      // 尝试获取当前工作空间和文档
      const workspaces = store.getAll('workspace');
      console.log('🧪 [Socket.IO测试] 工作空间列表:', workspaces);
      
      if (workspaces.length === 0) {
        console.warn('🧪 [Socket.IO测试] 没有找到工作空间');
        alert('测试失败：没有找到工作空间');
        return;
      }
      
      const workspace = workspaces[0];
      console.log('🧪 [Socket.IO测试] 使用工作空间:', workspace);
      
      // 获取文档存储
      const docStorage = workspace.engine.doc.storages.find(s => s.storageType === 'cloud');
      console.log('🧪 [Socket.IO测试] 云文档存储:', docStorage);
      
      if (!docStorage) {
        console.warn('🧪 [Socket.IO测试] 没有找到云文档存储');
        alert('测试失败：没有找到云文档存储');
        return;
      }
      
      // 检查Socket.IO连接状态
      const connection = (docStorage as any).connection;
      const socket = connection?.inner?.socket;
      
      console.log('🧪 [Socket.IO测试] Socket连接信息:', {
        connection: !!connection,
        socket: !!socket,
        connected: socket?.connected,
        id: socket?.id
      });
      
      if (!socket?.connected) {
        console.warn('🧪 [Socket.IO测试] Socket未连接');
        alert('测试失败：Socket.IO未连接');
        return;
      }
      
      // 创建测试文档更新
      const testUpdate = {
        docId: 'test-doc-' + Date.now(),
        bin: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), // 测试数据
        timestamp: new Date()
      };
      
      console.log('🧪 [Socket.IO测试] 准备发送测试更新:', testUpdate);
      
      // 调用pushDocUpdate方法
      await docStorage.pushDocUpdate(testUpdate);
      
      console.log('🧪 [Socket.IO测试] 测试成功完成！');
      alert('✅ Socket.IO测试成功！请查看控制台和后端日志');
      
    } catch (error) {
      console.error('🧪 [Socket.IO测试] 测试失败:', error);
      alert(`❌ Socket.IO测试失败: ${error.message}`);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 9999,
      backgroundColor: '#007acc',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      cursor: 'pointer',
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
    }}>
      <button 
        onClick={handleTestSocketIO}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}
      >
        🧪 测试Socket.IO
      </button>
    </div>
  );
};