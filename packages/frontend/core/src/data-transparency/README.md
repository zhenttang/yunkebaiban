# 数据透明化系统

## 📖 概述

数据透明化系统是一个为AFFiNE云文档平台设计的完整解决方案，它让用户能够清楚地了解文档数据的存储位置、同步状态、完整性等信息。系统提供了直观的用户界面，让用户完全掌控自己的数据。

## 🎯 核心功能

### 数据位置透明化
- **本地存储状态**: 显示文档是否存储在本地IndexedDB中
- **云端存储状态**: 显示文档是否已同步到云端数据库
- **离线缓存状态**: 显示是否有离线操作待同步
- **存储大小信息**: 显示各个存储位置的数据大小

### 同步状态透明化
- **实时同步状态**: 显示文档的当前同步状态
- **同步进度**: 显示同步操作的进度百分比
- **离线操作队列**: 显示待同步的离线操作数量
- **同步历史**: 显示最后同步时间和状态

### 数据完整性透明化
- **完整性检查**: 检查数据是否完整无损
- **版本一致性**: 比较本地和云端版本是否一致
- **冲突检测**: 检测并显示数据冲突情况
- **数据校验**: 提供数据校验和信息

## 🏗️ 架构设计

```
┌─────────────────────┐
│   用户界面层 (UI)    │
├─────────────────────┤
│   React 组件        │
│   - DocumentDataTransparency
│   - WorkspaceDataTransparency
│   - DataTransparencyPanel
└─────────────────────┘
           │
┌─────────────────────┐
│   业务逻辑层 (BL)    │
├─────────────────────┤
│   React Hooks       │
│   - useDataTransparency
│   - useDocumentDataTransparency
└─────────────────────┘
           │
┌─────────────────────┐
│   服务层 (Service)   │
├─────────────────────┤
│   DataTransparencyService
│   - 全局状态管理
│   - 多工作空间支持
│   - 事件系统
└─────────────────────┘
           │
┌─────────────────────┐
│   核心检测层 (Core)  │
├─────────────────────┤
│   DataTransparencyDetector
│   - 数据状态检测
│   - 实时监控
│   - 事件发射
└─────────────────────┘
           │
┌─────────────────────┐
│   存储层 (Storage)   │
├─────────────────────┤
│   存储适配器         │
│   - IndexedDB
│   - Cloud Storage
│   - localStorage
└─────────────────────┘
```

## 🚀 快速开始

### 1. 安装依赖

```bash
# 这些依赖通常已经在项目中
npm install react socket.io-client
```

### 2. 基本使用

```typescript
import React from 'react';
import {
  DataTransparencyPanel,
  DEFAULT_DATA_TRANSPARENCY_CONFIG,
  DataTransparencyConfig,
} from '@/data-transparency';

const MyApp: React.FC = () => {
  const [config, setConfig] = useState<DataTransparencyConfig>(
    DEFAULT_DATA_TRANSPARENCY_CONFIG
  );

  return (
    <div>
      <h1>我的应用</h1>
      <DataTransparencyPanel
        workspaceId="your-workspace-id"
        config={config}
        onConfigChange={setConfig}
      />
    </div>
  );
};
```

### 3. 单个文档状态显示

```typescript
import React from 'react';
import {
  DocumentDataTransparency,
  getDataTransparencyService,
  DEFAULT_DATA_TRANSPARENCY_CONFIG,
} from '@/data-transparency';

const MyDocumentEditor: React.FC<{
  docId: string;
  workspaceId: string;
}> = ({ docId, workspaceId }) => {
  const detector = getDataTransparencyService(
    DEFAULT_DATA_TRANSPARENCY_CONFIG
  ).getDetector(workspaceId);

  return (
    <div>
      {/* 文档编辑器 */}
      <div className="document-editor">
        {/* 编辑器内容 */}
      </div>
      
      {/* 数据状态显示 */}
      <DocumentDataTransparency
        docId={docId}
        workspaceId={workspaceId}
        detector={detector}
        compact={true} // 紧凑模式
      />
    </div>
  );
};
```

### 4. 使用React Hook

```typescript
import React from 'react';
import {
  useDocumentDataTransparency,
  DEFAULT_DATA_TRANSPARENCY_CONFIG,
} from '@/data-transparency';

const MyComponent: React.FC<{
  docId: string;
  workspaceId: string;
}> = ({ docId, workspaceId }) => {
  const {
    documentInfo,
    loading,
    error,
    isSynced,
    isAvailableLocally,
    isAvailableInCloud,
    hasOfflineOperations,
    refresh,
  } = useDocumentDataTransparency(docId, workspaceId, DEFAULT_DATA_TRANSPARENCY_CONFIG);

  if (loading) return <div>检测数据状态...</div>;
  if (error) return <div>错误: {error}</div>;

  return (
    <div>
      <div>同步状态: {isSynced ? '✅ 已同步' : '⏳ 同步中'}</div>
      <div>本地存储: {isAvailableLocally ? '✅' : '❌'}</div>
      <div>云端存储: {isAvailableInCloud ? '✅' : '❌'}</div>
      <div>离线操作: {hasOfflineOperations ? '⚠️ 有待同步' : '✅ 无待同步'}</div>
      <button onClick={refresh}>刷新</button>
    </div>
  );
};
```

## 📚 API 文档

### 核心类型

```typescript
// 数据位置信息
interface DataLocation {
  location: 'local' | 'cloud' | 'both' | 'none';
  description: string;
  available: boolean;
  lastUpdated?: Date;
  size?: number;
}

// 同步状态信息
interface DataSyncStatus {
  status: 'synced' | 'pending' | 'failed' | 'conflict' | 'offline';
  description: string;
  lastSyncTime?: Date;
  progress?: number;
  error?: string;
}

// 数据完整性信息
interface DataIntegrity {
  status: 'intact' | 'corrupted' | 'partial' | 'missing';
  description: string;
  checkTime: Date;
  checksum?: string;
}

// 文档透明化信息
interface DocumentTransparencyInfo {
  docId: string;
  title: string;
  workspaceId: string;
  locations: {
    local: DataLocation;
    cloud: DataLocation;
    cache: DataLocation;
  };
  syncStatus: DataSyncStatus;
  integrity: DataIntegrity;
  offlineOperations: {
    count: number;
    operations: Array<{
      id: string;
      type: string;
      timestamp: Date;
      size: number;
    }>;
  };
  version: {
    local?: string;
    cloud?: string;
    isConsistent: boolean;
  };
  usage: {
    lastAccessed: Date;
    accessCount: number;
    editCount: number;
  };
}
```

### 配置选项

```typescript
interface DataTransparencyConfig {
  enabled: boolean;              // 是否启用数据透明化
  refreshInterval: number;       // 自动刷新间隔 (毫秒)
  showDetails: boolean;          // 是否显示详细信息
  showDebugInfo: boolean;        // 是否显示调试信息
  checkDepth: 'basic' | 'detailed' | 'comprehensive'; // 检查深度
}

// 默认配置
const DEFAULT_CONFIG: DataTransparencyConfig = {
  enabled: true,
  refreshInterval: 30000,        // 30秒
  showDetails: false,
  showDebugInfo: false,
  checkDepth: 'basic',
};
```

### 核心组件

#### DocumentDataTransparency
显示单个文档的数据透明化信息。

```typescript
interface DocumentDataTransparencyProps {
  docId: string;
  workspaceId: string;
  detector: DataTransparencyDetector;
  compact?: boolean;             // 是否使用紧凑模式
}
```

#### WorkspaceDataTransparency
显示整个工作空间的数据透明化信息。

```typescript
interface WorkspaceDataTransparencyProps {
  workspaceId: string;
  detector: DataTransparencyDetector;
}
```

#### DataTransparencyPanel
完整的数据透明化控制面板。

```typescript
interface DataTransparencyPanelProps {
  workspaceId: string;
  config: DataTransparencyConfig;
  onConfigChange: (config: DataTransparencyConfig) => void;
}
```

### React Hooks

#### useDataTransparency
用于管理工作空间级别的数据透明化状态。

```typescript
const useDataTransparency = (
  workspaceId: string,
  config: DataTransparencyConfig
) => {
  return {
    isInitialized: boolean;
    loading: boolean;
    error: string | null;
    workspaceInfo: WorkspaceTransparencyInfo | null;
    documentInfos: Map<string, DocumentTransparencyInfo>;
    refresh: () => Promise<void>;
    loadDocumentInfo: (docId: string) => Promise<DocumentTransparencyInfo>;
    loadWorkspaceInfo: () => Promise<void>;
    detector: DataTransparencyDetector;
    
    // 便捷方法
    getDocumentInfo: (docId: string) => DocumentTransparencyInfo | undefined;
    isDocumentSynced: (docId: string) => boolean;
    hasOfflineOperations: () => boolean;
    isCloudConnected: () => boolean;
    getSyncedDocumentsCount: () => number;
    getPendingDocumentsCount: () => number;
  };
};
```

#### useDocumentDataTransparency
用于管理单个文档的数据透明化状态。

```typescript
const useDocumentDataTransparency = (
  docId: string,
  workspaceId: string,
  config: DataTransparencyConfig
) => {
  return {
    documentInfo: DocumentTransparencyInfo | null;
    loading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    detector: DataTransparencyDetector;
    
    // 便捷方法
    isSynced: boolean;
    isAvailableLocally: boolean;
    isAvailableInCloud: boolean;
    hasOfflineOperations: boolean;
    isVersionConsistent: boolean;
    getSyncProgress: () => number;
    getIntegrityStatus: () => string;
  };
};
```

### 服务类

#### DataTransparencyService
全局的数据透明化服务管理器。

```typescript
class DataTransparencyService {
  // 获取全局实例
  static getInstance(config?: DataTransparencyConfig): DataTransparencyService;
  
  // 初始化服务
  async initialize(): Promise<void>;
  
  // 获取检测器
  getDetector(workspaceId: string): DataTransparencyDetector;
  
  // 获取透明化信息
  async getWorkspaceTransparencyInfo(workspaceId: string): Promise<WorkspaceTransparencyInfo>;
  async getDocumentTransparencyInfo(docId: string, workspaceId: string): Promise<DocumentTransparencyInfo>;
  
  // 批量操作
  async getMultipleDocumentTransparencyInfo(
    docIds: string[], 
    workspaceId: string
  ): Promise<Map<string, DocumentTransparencyInfo>>;
  
  // 全局摘要
  async getGlobalTransparencySummary(): Promise<GlobalSummary>;
  
  // 刷新操作
  async refreshAll(): Promise<void>;
  async refreshWorkspace(workspaceId: string): Promise<void>;
  
  // 配置管理
  updateConfig(newConfig: Partial<DataTransparencyConfig>): void;
  getConfig(): DataTransparencyConfig;
  
  // 统计信息
  getStatistics(): ServiceStatistics;
  
  // 生命周期
  destroy(): void;
}
```

## 🎨 自定义样式

系统提供了完整的CSS变量支持，您可以通过重写CSS变量来自定义样式：

```css
:root {
  --dt-primary-color: #1976d2;
  --dt-success-color: #4caf50;
  --dt-warning-color: #ff9800;
  --dt-error-color: #f44336;
  --dt-info-color: #2196f3;
  --dt-purple-color: #9c27b0;
  --dt-grey-color: #607d8b;
  --dt-border-color: #e0e0e0;
  --dt-background-color: #f5f5f5;
  --dt-text-color: #333;
  --dt-text-light: #666;
  --dt-border-radius: 8px;
  --dt-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
```

## 🔧 高级配置

### 自定义检测深度

```typescript
const advancedConfig: DataTransparencyConfig = {
  enabled: true,
  refreshInterval: 10000,      // 10秒刷新
  showDetails: true,
  showDebugInfo: true,
  checkDepth: 'comprehensive', // 全面检查
};
```

### 事件监听

```typescript
const service = getDataTransparencyService(config);

// 监听全局事件
service.on('initialized', () => {
  console.log('数据透明化服务已初始化');
});

service.on('global-refresh-completed', () => {
  console.log('全局刷新完成');
});

service.on('config-updated', (newConfig) => {
  console.log('配置已更新:', newConfig);
});

// 监听检测器事件
const detector = service.getDetector('workspace-id');
detector.on('data-status-changed', (event) => {
  console.log('数据状态变化:', event);
});

detector.on('sync-status-changed', (event) => {
  console.log('同步状态变化:', event);
});
```

## 🔍 故障排除

### 常见问题

1. **数据状态检测失败**
   - 检查网络连接
   - 确认工作空间ID正确
   - 检查IndexedDB权限

2. **同步状态不准确**
   - 检查云存储连接
   - 确认Socket.IO连接正常
   - 检查离线操作队列

3. **性能问题**
   - 调整刷新间隔
   - 使用紧凑模式
   - 减少检查深度

### 调试模式

```typescript
const debugConfig: DataTransparencyConfig = {
  enabled: true,
  refreshInterval: 5000,
  showDetails: true,
  showDebugInfo: true,    // 启用调试信息
  checkDepth: 'detailed',
};
```

## 📈 性能优化

### 最佳实践

1. **合理设置刷新间隔**: 根据应用需求调整刷新频率
2. **使用紧凑模式**: 在列表页面使用紧凑模式减少渲染开销
3. **按需加载**: 只在需要时显示详细信息
4. **事件驱动**: 依赖事件而非轮询更新状态

### 内存管理

```typescript
// 在组件卸载时清理资源
useEffect(() => {
  return () => {
    detector.destroy();
  };
}, []);
```

## 🤝 贡献指南

### 开发环境设置

1. 克隆仓库
2. 安装依赖: `npm install`
3. 启动开发服务器: `npm run dev`
4. 打开浏览器查看示例

### 代码规范

- 使用TypeScript
- 遵循React最佳实践
- 编写完整的类型定义
- 添加适当的注释

### 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage
```

## 📄 许可证

本项目采用MIT许可证。

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看文档和FAQ
2. 搜索已有的Issues
3. 创建新的Issue
4. 参与讨论

---

**数据透明化系统** - 让您的数据状态一目了然！