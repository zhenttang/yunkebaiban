/**
 * 块命令样式对比和改进示例
 * 展示改进前后的视觉效果差异
 */

import React, { useState } from 'react';
import './block-command-comparison.css';

// 模拟的块命令数据
const mockCommands = [
  {
    id: 'paragraph',
    title: '段落',
    description: '转换为普通文本块',
    icon: '¶',
    shortcut: 'Ctrl+Alt+0',
  },
  {
    id: 'heading1',
    title: '一级标题',
    description: '转换为大号标题',
    icon: 'H1',
    shortcut: 'Ctrl+Alt+1',
  },
  {
    id: 'heading2',
    title: '二级标题',
    description: '转换为中号标题',
    icon: 'H2',
    shortcut: 'Ctrl+Alt+2',
  },
  {
    id: 'heading3',
    title: '三级标题',
    description: '转换为小号标题',
    icon: 'H3',
    shortcut: 'Ctrl+Alt+3',
  },
  {
    id: 'bullet-list',
    title: '项目符号列表',
    description: '转换为项目符号列表',
    icon: '•',
  },
  {
    id: 'numbered-list',
    title: '编号列表',
    description: '转换为编号列表',
    icon: '1.',
  },
  {
    id: 'quote',
    title: '引用',
    description: '转换为引用块',
    icon: '"',
  },
  {
    id: 'code',
    title: '代码',
    description: '转换为代码块',
    icon: '</>',
  },
];

/**
 * 原始块命令样式（突兀的设计）
 */
const OriginalSlashMenu: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="comparison-container">
      <h3>🔴 改进前：突兀的块命令样式</h3>
      <div className="original-slash-menu">
        <div className="original-menu-container">
          <div className="original-group-title">基础块</div>
          {mockCommands.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className={`original-menu-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="original-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="original-item-content">
                <div className="original-item-title">{item.title}</div>
                <div className="original-item-description">{item.description}</div>
              </div>
              {item.shortcut && (
                <div className="original-item-shortcut">{item.shortcut}</div>
              )}
            </div>
          ))}
          
          <div className="original-group-title">列表</div>
          {mockCommands.slice(4, 6).map((item, index) => (
            <div
              key={item.id}
              className={`original-menu-item ${index + 4 === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index + 4)}
            >
              <div className="original-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="original-item-content">
                <div className="original-item-title">{item.title}</div>
                <div className="original-item-description">{item.description}</div>
              </div>
            </div>
          ))}
          
          <div className="original-group-title">内容块</div>
          {mockCommands.slice(6, 8).map((item, index) => (
            <div
              key={item.id}
              className={`original-menu-item ${index + 6 === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index + 6)}
            >
              <div className="original-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="original-item-content">
                <div className="original-item-title">{item.title}</div>
                <div className="original-item-description">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="problems-list">
        <h4>❌ 存在的问题：</h4>
        <ul>
          <li>方形边角，不够现代化</li>
          <li>平面设计，缺乏层次感</li>
          <li>颜色单调，与系统不一致</li>
          <li>间距紧凑，视觉拥挤</li>
          <li>缺乏微交互效果</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * 改进后的块命令样式（与系统一致）
 */
const ImprovedSlashMenu: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="comparison-container">
      <h3>✅ 改进后：与系统一致的现代化设计</h3>
      <div className="improved-slash-menu">
        <div className="improved-menu-container">
          <div className="improved-group-title">基础块</div>
          {mockCommands.slice(0, 4).map((item, index) => (
            <div
              key={item.id}
              className={`improved-menu-item ${index === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="improved-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="improved-item-content">
                <div className="improved-item-title">{item.title}</div>
                <div className="improved-item-description">{item.description}</div>
              </div>
              {item.shortcut && (
                <div className="improved-item-shortcut">{item.shortcut}</div>
              )}
            </div>
          ))}
          
          <div className="improved-group-title">列表</div>
          {mockCommands.slice(4, 6).map((item, index) => (
            <div
              key={item.id}
              className={`improved-menu-item ${index + 4 === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index + 4)}
            >
              <div className="improved-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="improved-item-content">
                <div className="improved-item-title">{item.title}</div>
                <div className="improved-item-description">{item.description}</div>
              </div>
            </div>
          ))}
          
          <div className="improved-group-title">内容块</div>
          {mockCommands.slice(6, 8).map((item, index) => (
            <div
              key={item.id}
              className={`improved-menu-item ${index + 6 === selectedIndex ? 'selected' : ''}`}
              onMouseEnter={() => setSelectedIndex(index + 6)}
            >
              <div className="improved-item-icon">
                <span>{item.icon}</span>
              </div>
              <div className="improved-item-content">
                <div className="improved-item-title">{item.title}</div>
                <div className="improved-item-description">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="improvements-list">
        <h4>✨ 改进效果：</h4>
        <ul>
          <li>圆润边角，现代化设计</li>
          <li>卡片式布局，层次分明</li>
          <li>与右侧面板色彩一致</li>
          <li>宽松间距，视觉舒适</li>
          <li>微交互动画，体验流畅</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * 右侧面板参考设计
 * 展示系统原有的设计语言
 */
const RightPanelReference: React.FC = () => {
  return (
    <div className="comparison-container">
      <h3>📋 系统参考：右侧面板设计</h3>
      <div className="right-panel-reference">
        <div className="panel-header">
          <span className="panel-title">基础块</span>
          <button className="panel-collapse">—</button>
        </div>
        <div className="panel-content">
          <div className="panel-item">
            <span className="panel-item-icon">¶</span>
            <div className="panel-item-content">
              <div className="panel-item-title">段落</div>
              <div className="panel-item-description">转换为普通文本块</div>
            </div>
          </div>
          <div className="panel-item">
            <span className="panel-item-icon">H1</span>
            <div className="panel-item-content">
              <div className="panel-item-title">一级标题</div>
              <div className="panel-item-description">转换为大号标题</div>
            </div>
          </div>
          <div className="panel-item">
            <span className="panel-item-icon">H2</span>
            <div className="panel-item-content">
              <div className="panel-item-title">二级标题</div>
              <div className="panel-item-description">转换为中号标题</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="reference-notes">
        <h4>🎨 设计特点：</h4>
        <ul>
          <li>蓝色主题色 (#5B9CFF)</li>
          <li>12px 圆角设计</li>
          <li>卡片式悬浮效果</li>
          <li>柔和的阴影层次</li>
          <li>一致的间距规范</li>
        </ul>
      </div>
    </div>
  );
};

/**
 * 对比展示组件
 */
const BlockCommandComparison: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'before' | 'after' | 'reference'>('before');

  return (
    <div className="block-command-comparison">
      <div className="comparison-header">
        <h2>🎨 块命令样式一致性改进对比</h2>
        <p>展示如何让块命令与系统设计语言保持一致</p>
        
        <div className="comparison-tabs">
          <button
            className={`tab ${activeTab === 'before' ? 'active' : ''}`}
            onClick={() => setActiveTab('before')}
          >
            改进前
          </button>
          <button
            className={`tab ${activeTab === 'after' ? 'active' : ''}`}
            onClick={() => setActiveTab('after')}
          >
            改进后
          </button>
          <button
            className={`tab ${activeTab === 'reference' ? 'active' : ''}`}
            onClick={() => setActiveTab('reference')}
          >
            系统参考
          </button>
        </div>
      </div>

      <div className="comparison-content">
        {activeTab === 'before' && <OriginalSlashMenu />}
        {activeTab === 'after' && <ImprovedSlashMenu />}
        {activeTab === 'reference' && <RightPanelReference />}
      </div>

      <div className="implementation-guide">
        <h3>🛠️ 实现指南</h3>
        <div className="guide-steps">
          <div className="step">
            <h4>1. 更新设计令牌</h4>
            <p>使用统一的颜色、圆角、间距变量</p>
          </div>
          <div className="step">
            <h4>2. 改进容器样式</h4>
            <p>增加圆角、阴影，提升现代感</p>
          </div>
          <div className="step">
            <h4>3. 优化交互效果</h4>
            <p>添加悬浮动画和状态反馈</p>
          </div>
          <div className="step">
            <h4>4. 统一视觉层次</h4>
            <p>调整字体、颜色、间距一致性</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 具体的修改建议
 */
const ImplementationSuggestions: React.FC = () => {
  return (
    <div className="implementation-suggestions">
      <h3>📝 具体修改建议</h3>
      
      <div className="suggestion-section">
        <h4>1. 修改 slash-menu 样式文件</h4>
        <div className="code-block">
          <pre>{`
// 文件位置: /blocksuite/affine/widgets/slash-menu/src/styles.ts

// 原来的样式
.slash-menu {
  border-radius: 8px;
  box-shadow: var(--affine-overlay-shadow);
}

// 改进后的样式
.slash-menu {
  border-radius: 12px;                    // 更现代的圆角
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 12px;                          // 增加内边距
  width: 320px;                           // 增加宽度
}
          `}</pre>
        </div>
      </div>

      <div className="suggestion-section">
        <h4>2. 更新菜单项样式</h4>
        <div className="code-block">
          <pre>{`
// 菜单项容器
.menu-item {
  border-radius: 6px;                     // 圆润边角
  margin-bottom: 4px;                     // 增加项目间距
  transition: all 150ms ease;             // 流畅过渡
}

.menu-item:hover {
  transform: translateY(-1px);            // 微妙悬浮效果
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
          `}</pre>
        </div>
      </div>

      <div className="suggestion-section">
        <h4>3. 统一颜色变量</h4>
        <div className="code-block">
          <pre>{`
// 使用统一的设计令牌
:root {
  --affine-primary-blue: #5B9CFF;
  --affine-surface-hover: #F1F3F5;
  --affine-border-light: #F3F4F6;
  --affine-radius-lg: 12px;
  --affine-radius-md: 6px;
}
          `}</pre>
        </div>
      </div>
    </div>
  );
};

export {
  BlockCommandComparison,
  OriginalSlashMenu,
  ImprovedSlashMenu,
  RightPanelReference,
  ImplementationSuggestions,
};