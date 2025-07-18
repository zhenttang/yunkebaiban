/**
 * AFFiNE 界面修改示例
 * 
 * 这个文件展示了如何将数据透明化系统集成到AFFiNE的现有界面中
 * 包括具体的代码修改和界面效果展示
 */

import React, { useState, useEffect } from 'react';
import { DocumentStatusIndicator, WorkspaceDataPanel, DocumentDataTab, EditorStatusBar } from './affine-integration';

/**
 * 1. 文档详情页头部修改示例
 * 
 * 原始位置：/desktop/pages/workspace/detail-page/detail-page-header.tsx
 * 修改说明：在文档标题旁添加数据状态指示器
 */

// 原始代码结构（简化）
const OriginalDetailPageHeader = () => (
  <div className="detail-page-header">
    <div className="header-content">
      <h1 className="page-title">222222</h1>
      <div className="header-actions">
        <button>⭐</button>
        <button>🔗</button>
        <button>⚙️</button>
      </div>
    </div>
  </div>
);

// 修改后的代码结构
const ModifiedDetailPageHeader = ({ docId, workspaceId }) => (
  <div className="detail-page-header">
    <div className="header-content">
      <div className="title-section">
        <h1 className="page-title">222222</h1>
        {/* 🔥 新增：数据状态指示器 */}
        <DocumentStatusIndicator 
          docId={docId} 
          workspaceId={workspaceId} 
          className="title-status-indicator"
        />
      </div>
      <div className="header-actions">
        <button>⭐</button>
        <button>🔗</button>
        <button>⚙️</button>
      </div>
    </div>
  </div>
);

/**
 * 2. 工作空间侧边栏修改示例
 * 
 * 原始位置：/components/root-app-sidebar/index.tsx
 * 修改说明：在工作空间信息下方添加数据透明化面板
 */

// 原始侧边栏结构（简化）
const OriginalWorkspaceSidebar = () => (
  <div className="workspace-sidebar">
    <div className="workspace-header">
      <div className="workspace-info">
        <div className="workspace-name">New Workspace</div>
        <div className="connection-status">已连接云端 网剧同步</div>
      </div>
    </div>
    <div className="navigation-section">
      <nav className="nav-menu">
        <a href="#search">🔍 快速搜索</a>
        <a href="#all-docs">📄 全部文档</a>
        <a href="#journal">📅 日记</a>
        <a href="#reminders">🔔 提醒</a>
        <a href="#settings">⚙️ 设置</a>
      </nav>
    </div>
  </div>
);

// 修改后的侧边栏结构
const ModifiedWorkspaceSidebar = ({ workspaceId, isCollapsed = false }) => (
  <div className="workspace-sidebar">
    <div className="workspace-header">
      <div className="workspace-info">
        <div className="workspace-name">New Workspace</div>
        <div className="connection-status">已连接云端 网剧同步</div>
      </div>
      
      {/* 🔥 新增：数据透明化面板 */}
      <WorkspaceDataPanel 
        workspaceId={workspaceId} 
        isCollapsed={isCollapsed}
      />
    </div>
    
    <div className="navigation-section">
      <nav className="nav-menu">
        <a href="#search">🔍 快速搜索</a>
        <a href="#all-docs">📄 全部文档</a>
        <a href="#journal">📅 日记</a>
        <a href="#reminders">🔔 提醒</a>
        <a href="#settings">⚙️ 设置</a>
      </nav>
    </div>
  </div>
);

/**
 * 3. 右侧工具栏修改示例
 * 
 * 原始位置：/modules/workbench/view/sidebar/sidebar-container.tsx
 * 修改说明：在右侧工具栏添加数据透明化标签页
 */

// 原始右侧工具栏结构（简化）
const OriginalRightSidebar = () => (
  <div className="right-sidebar">
    <div className="sidebar-tabs">
      <button className="tab">基础块</button>
      <button className="tab">日期时间</button>
    </div>
    <div className="sidebar-content">
      <div className="block-tools">
        <button>📝 段落</button>
        <button>📋 一级标题</button>
        <button>📋 二级标题</button>
        <button>📋 三级标题</button>
        <button>• 项目符号列表</button>
        <button>1. 编号列表</button>
        <button>💬 引用</button>
        <button>💻 代码</button>
        <button>➖ 分隔线</button>
      </div>
    </div>
  </div>
);

// 修改后的右侧工具栏结构
const ModifiedRightSidebar = ({ docId, workspaceId }) => {
  const [activeTab, setActiveTab] = useState('basic-blocks');
  
  return (
    <div className="right-sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'basic-blocks' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic-blocks')}
        >
          基础块
        </button>
        <button 
          className={`tab ${activeTab === 'datetime' ? 'active' : ''}`}
          onClick={() => setActiveTab('datetime')}
        >
          日期时间
        </button>
        {/* 🔥 新增：数据透明化标签页 */}
        <DocumentDataTab
          docId={docId}
          workspaceId={workspaceId}
          isActive={activeTab === 'data-transparency'}
          onActivate={() => setActiveTab('data-transparency')}
        />
      </div>
      
      <div className="sidebar-content">
        {activeTab === 'basic-blocks' && (
          <div className="block-tools">
            <button>📝 段落</button>
            <button>📋 一级标题</button>
            <button>📋 二级标题</button>
            <button>📋 三级标题</button>
            <button>• 项目符号列表</button>
            <button>1. 编号列表</button>
            <button>💬 引用</button>
            <button>💻 代码</button>
            <button>➖ 分隔线</button>
          </div>
        )}
        
        {activeTab === 'datetime' && (
          <div className="datetime-tools">
            <button>📅 日期</button>
            <button>⏰ 时间</button>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 4. 编辑器区域修改示例
 * 
 * 原始位置：/components/page-detail-editor.tsx
 * 修改说明：在编辑器底部添加状态栏
 */

// 原始编辑器结构（简化）
const OriginalPageEditor = () => (
  <div className="page-editor">
    <div className="editor-content">
      <div className="document-content">
        <h1>222222</h1>
        <p>信息</p>
        <p>2222222222222244444444444</p>
        <p>22222244444444446666666666</p>
        <p>2222222</p>
        <p>22222222222</p>
        <p>22222222222222</p>
        <blockquote>1111111111111111111111111</blockquote>
        <p>333333rrrrrrrrrrr</p>
        <p>显示双向链接</p>
      </div>
    </div>
  </div>
);

// 修改后的编辑器结构
const ModifiedPageEditor = ({ docId, workspaceId }) => (
  <div className="page-editor">
    <div className="editor-content">
      <div className="document-content">
        <h1>222222</h1>
        <p>信息</p>
        <p>2222222222222244444444444</p>
        <p>22222244444444446666666666</p>
        <p>2222222</p>
        <p>22222222222</p>
        <p>22222222222222</p>
        <blockquote>1111111111111111111111111</blockquote>
        <p>333333rrrrrrrrrrr</p>
        <p>显示双向链接</p>
      </div>
    </div>
    
    {/* 🔥 新增：编辑器状态栏 */}
    <EditorStatusBar 
      docId={docId} 
      workspaceId={workspaceId}
      className="editor-status-bar"
    />
  </div>
);

/**
 * 5. 完整的界面集成示例
 * 
 * 展示所有组件如何协同工作
 */
const AFFiNEIntegrationDemo = () => {
  const [docId] = useState('222222');
  const [workspaceId] = useState('new-workspace');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="affine-app">
      {/* 左侧边栏 */}
      <aside className={`app-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <ModifiedWorkspaceSidebar 
          workspaceId={workspaceId} 
          isCollapsed={sidebarCollapsed}
        />
      </aside>

      {/* 主要内容区域 */}
      <main className="main-content">
        {/* 文档头部 */}
        <header className="document-header">
          <ModifiedDetailPageHeader 
            docId={docId} 
            workspaceId={workspaceId}
          />
        </header>

        {/* 编辑器和右侧工具栏 */}
        <div className="editor-container">
          <div className="editor-section">
            <ModifiedPageEditor 
              docId={docId} 
              workspaceId={workspaceId}
            />
          </div>
          
          <aside className="tools-sidebar">
            <ModifiedRightSidebar 
              docId={docId} 
              workspaceId={workspaceId}
            />
          </aside>
        </div>
      </main>
    </div>
  );
};

/**
 * 6. 实际效果演示
 * 
 * 展示不同数据状态下的界面效果
 */
const DataTransparencyEffectDemo = () => {
  const [mockDataState, setMockDataState] = useState({
    isSynced: true,
    isAvailableLocally: true,
    isAvailableInCloud: true,
    hasOfflineOperations: false,
    syncProgress: 100,
    connectionStatus: 'connected',
  });

  const simulateDataStates = () => {
    const states = [
      // 正常同步状态
      {
        isSynced: true,
        isAvailableLocally: true,
        isAvailableInCloud: true,
        hasOfflineOperations: false,
        syncProgress: 100,
        connectionStatus: 'connected',
        description: '✅ 完全同步状态'
      },
      // 同步中状态
      {
        isSynced: false,
        isAvailableLocally: true,
        isAvailableInCloud: false,
        hasOfflineOperations: false,
        syncProgress: 65,
        connectionStatus: 'syncing',
        description: '🔄 正在同步状态'
      },
      // 离线操作状态
      {
        isSynced: false,
        isAvailableLocally: true,
        isAvailableInCloud: true,
        hasOfflineOperations: true,
        syncProgress: 0,
        connectionStatus: 'offline',
        description: '⚠️ 有离线操作待同步'
      },
      // 仅本地状态
      {
        isSynced: false,
        isAvailableLocally: true,
        isAvailableInCloud: false,
        hasOfflineOperations: false,
        syncProgress: 0,
        connectionStatus: 'disconnected',
        description: '💾 仅本地存储'
      },
    ];

    let currentIndex = 0;
    const interval = setInterval(() => {
      setMockDataState(states[currentIndex]);
      currentIndex = (currentIndex + 1) % states.length;
    }, 3000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    const cleanup = simulateDataStates();
    return cleanup;
  }, []);

  return (
    <div className="effect-demo">
      <h3>数据透明化效果演示</h3>
      <p>当前状态：{mockDataState.description}</p>
      
      {/* 模拟文档标题区域 */}
      <div className="demo-section">
        <h4>文档标题区域效果</h4>
        <div className="demo-header">
          <h1>222222</h1>
          <div className="mock-status-indicator">
            <span className="status-icon">
              {mockDataState.hasOfflineOperations ? '⚠️' : 
               mockDataState.isSynced ? '✅' : '🔄'}
            </span>
            <span className="storage-indicators">
              {mockDataState.isAvailableLocally ? '📱' : ''}
              {mockDataState.isAvailableInCloud ? '☁️' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* 模拟侧边栏区域 */}
      <div className="demo-section">
        <h4>工作空间侧边栏效果</h4>
        <div className="demo-sidebar">
          <div className="workspace-info">
            <div className="workspace-name">New Workspace</div>
            <div className="connection-status">
              {mockDataState.connectionStatus === 'connected' ? 
                '✅ 已连接云端' : 
                '❌ 连接断开'}
            </div>
          </div>
          <div className="mock-data-panel">
            <div className="status-summary">
              <div className="status-item">
                <span>连接: {mockDataState.connectionStatus === 'connected' ? '✅' : '❌'}</span>
              </div>
              <div className="status-item">
                <span>同步: {mockDataState.isSynced ? '✅' : '⏳'}</span>
              </div>
              {mockDataState.hasOfflineOperations && (
                <div className="status-item warning">
                  <span>⚠️ 有待同步操作</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 模拟状态栏区域 */}
      <div className="demo-section">
        <h4>编辑器状态栏效果</h4>
        <div className="demo-statusbar">
          <div className="status-text">
            {mockDataState.hasOfflineOperations ? '有离线操作待同步' :
             mockDataState.isSynced ? '已保存到云端' :
             mockDataState.connectionStatus === 'syncing' ? '同步中...' :
             '仅本地存储'}
          </div>
          
          {!mockDataState.isSynced && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${mockDataState.syncProgress}%` }}
                />
              </div>
              <span>{mockDataState.syncProgress}%</span>
            </div>
          )}
          
          <div className="storage-indicators">
            {mockDataState.isAvailableLocally && <span>📱</span>}
            {mockDataState.isAvailableInCloud && <span>☁️</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 7. 集成指南
 */
const IntegrationGuide = () => (
  <div className="integration-guide">
    <h2>🚀 AFFiNE 数据透明化集成指南</h2>
    
    <div className="guide-section">
      <h3>步骤1：导入数据透明化组件</h3>
      <pre><code>{`
import {
  DocumentStatusIndicator,
  WorkspaceDataPanel,
  DocumentDataTab,
  EditorStatusBar,
  DataTransparencySettings,
} from '@affine/core/data-transparency/affine-integration';
      `}</code></pre>
    </div>

    <div className="guide-section">
      <h3>步骤2：修改文档头部组件</h3>
      <p>在 <code>detail-page-header.tsx</code> 中添加状态指示器：</p>
      <pre><code>{`
<div className="title-section">
  <h1 className="page-title">{title}</h1>
  <DocumentStatusIndicator 
    docId={docId} 
    workspaceId={workspaceId} 
  />
</div>
      `}</code></pre>
    </div>

    <div className="guide-section">
      <h3>步骤3：修改工作空间侧边栏</h3>
      <p>在 <code>root-app-sidebar/index.tsx</code> 中添加数据面板：</p>
      <pre><code>{`
<div className="workspace-header">
  <div className="workspace-info">
    {/* 现有内容 */}
  </div>
  <WorkspaceDataPanel 
    workspaceId={workspaceId} 
    isCollapsed={isCollapsed}
  />
</div>
      `}</code></pre>
    </div>

    <div className="guide-section">
      <h3>步骤4：添加右侧工具栏标签页</h3>
      <p>在 <code>sidebar-container.tsx</code> 中添加数据透明化标签：</p>
      <pre><code>{`
<div className="sidebar-tabs">
  {/* 现有标签 */}
  <DocumentDataTab
    docId={docId}
    workspaceId={workspaceId}
    isActive={activeTab === 'data-transparency'}
    onActivate={() => setActiveTab('data-transparency')}
  />
</div>
      `}</code></pre>
    </div>

    <div className="guide-section">
      <h3>步骤5：添加编辑器状态栏</h3>
      <p>在 <code>page-detail-editor.tsx</code> 中添加状态栏：</p>
      <pre><code>{`
<div className="page-editor">
  <div className="editor-content">
    {/* 编辑器内容 */}
  </div>
  <EditorStatusBar 
    docId={docId} 
    workspaceId={workspaceId}
  />
</div>
      `}</code></pre>
    </div>

    <div className="guide-section">
      <h3>步骤6：导入样式文件</h3>
      <p>在主样式文件中导入：</p>
      <pre><code>{`
@import "@affine/core/data-transparency/affine-integration.css";
      `}</code></pre>
    </div>
  </div>
);

export {
  AFFiNEIntegrationDemo,
  DataTransparencyEffectDemo,
  IntegrationGuide,
  ModifiedDetailPageHeader,
  ModifiedWorkspaceSidebar,
  ModifiedRightSidebar,
  ModifiedPageEditor,
};