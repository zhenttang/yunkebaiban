import React from 'react';
import { DeckTest } from '../deck-integration';

/**
 * Decker集成的简单测试页面
 * 可以在开发环境中使用来验证集成功能
 */
export const DeckIntegrationTestPage: React.FC = () => {
  return (
    <div style={{
      padding: '20px',
      minHeight: '100vh',
      backgroundColor: '#f8f9fa'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '32px',
          color: '#333'
        }}>
          🎨 Decker 白板集成测试
        </h1>
        
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#555' }}>
            集成状态检查
          </h2>
          <ul style={{ lineHeight: '1.6', color: '#666' }}>
            <li>✅ Decker文件已部署到 <code>/deck/index.html</code></li>
            <li>✅ PostMessage通信已配置</li>
            <li>✅ 白板集成组件已创建</li>
            <li>✅ 浮动按钮已添加到edgeless模式</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ marginBottom: '16px', color: '#555' }}>
            功能测试
          </h2>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            使用下面的组件测试Decker集成功能：
          </p>
          <DeckTest />
        </div>

        <div style={{
          marginTop: '32px',
          padding: '16px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #bbdefb'
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#1976d2' }}>
            💡 使用说明
          </h3>
          <div style={{ fontSize: '14px', color: '#1565c0', lineHeight: '1.5' }}>
            <p style={{ margin: '0 0 8px 0' }}>
              <strong>在白板中使用：</strong>
            </p>
            <ol style={{ margin: '0', paddingLeft: '20px' }}>
              <li>切换到edgeless（无限面板）模式</li>
              <li>查看右下角的紫色🎨浮动按钮</li>
              <li>点击按钮打开Decker绘画工具</li>
              <li>在Decker中创作内容并保存</li>
              <li>GIF会自动导出到白板中</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckIntegrationTestPage;