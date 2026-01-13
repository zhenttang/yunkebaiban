# 插件系统设计（MVP）

## 目标
- 离线优先：插件包本地安装与运行，默认禁止网络访问
- 最小权限：仅暴露受控 Host API，默认只读
- 兼容现有扩展：复用现有 view/store/toolbar 扩展体系
- 可控可禁用：插件随时启停，不影响核心编辑能力

## 非目标（MVP）
- 插件市场/签名/付费体系
- 直接访问内部对象或 DOM
- 自定义 Block/Schema（计划在后续阶段）

## 现有基础
- 现有内部扩展统一注册入口：view/store 扩展集合
  - `blocksuite/yunke/all/src/extensions/view.ts`
  - `blocksuite/yunke/all/src/extensions/store.ts`
- UI/工具栏模块化扩展能力（可作为插件贡献点示例）
  - `blocksuite/yunke/gfx/brush/src/toolbar/configs/brush.ts`

## 架构概览
```
[Plugin Package]
      |
      v
[PluginManager] --- [PluginRegistry]
      |
      v
[PluginRuntime (Worker)] <--> [PluginBridge] <--> [HostAPI]
      |
      v
[Contributes: toolbar/command/panel]
```

### 模块职责
- PluginManager：安装/启用/禁用/卸载/升级
- PluginRegistry：索引 manifest，记录插件状态
- PluginRuntime：沙箱运行插件代码（MVP 使用 Worker）
- PluginBridge：消息桥接（postMessage + schema 校验）
- HostAPI：受控能力暴露（UI/命令/文档/存储）
- PermissionService：权限校验与用户授权弹窗

## 插件包结构
```
plugin.zip
  ├─ manifest.json
  ├─ main.js
  └─ assets/
```

## Manifest 设计（MVP）
```json
{
  "id": "com.demo.quick-tag",
  "name": "快速标签",
  "version": "0.1.0",
  "author": "Demo",
  "entry": "main.js",
  "engine": { "minVersion": "1.0.0", "apiVersion": "1" },
  "permissions": ["ui:toolbar", "command:register", "doc:read", "storage:local"],
  "contributes": {
    "toolbar": [{ "id": "quick-tag", "label": "快速标签", "icon": "tag" }],
    "command": [{ "id": "insert-tag", "label": "插入标签" }],
    "setting": [{ "id": "quick-tag", "label": "快速标签" }]
  }
}
```

### 字段说明（关键）
- `engine.apiVersion`：Host API 版本号
- `permissions`：权限声明（默认最小）
- `contributes`：声明可挂载的 UI/命令/设置项

## 权限模型（MVP）
- `ui:toolbar`：新增工具栏按钮
- `ui:panel`：新增侧边栏入口（MVP 可仅入口，面板 UI 由 Host 控制）
- `command:register`：注册命令
- `doc:read`：读取文档快照
- `doc:write`：写入文档（MVP 不开放）
- `storage:local`：插件私有存储
- `net:fetch`：网络访问（默认禁止）

## 生命周期
```
install -> enable -> activate(ctx)
                        |
                     deactivate()
                        |
disable -> uninstall
```

- `activate(ctx)`：注册命令/贡献点
- `deactivate()`：释放资源、取消订阅

## Host API（MVP）
```ts
interface PluginHostAPI {
  ui: {
    registerToolbarButton(def: { id: string; label: string; icon?: string; command: string }): void;
    showToast(message: string): void;
  };
  command: {
    register(def: { id: string; handler: () => void }): void;
    execute(id: string): void;
  };
  doc: {
    getSnapshot(options?: { scope?: 'page' | 'edgeless'; format?: 'json' | 'markdown' }): Promise<string | object>;
  };
  storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
  };
}
```

## 示例插件（MVP）
**manifest.json**
```json
{
  "id": "com.demo.quick-tag",
  "name": "快速标签",
  "version": "0.1.0",
  "author": "Demo",
  "entry": "main.js",
  "engine": { "minVersion": "1.0.0", "apiVersion": "1" },
  "permissions": ["ui:toolbar", "command:register", "doc:read"],
  "contributes": {
    "toolbar": [{ "id": "quick-tag", "label": "快速标签", "icon": "tag", "command": "insert-tag" }],
    "command": [{ "id": "insert-tag", "label": "插入标签" }]
  }
}
```

**main.js（MVP 支持 CommonJS 风格）**
```ts
exports.activate = (ctx) => {
  ctx.command.register({
    id: 'insert-tag',
    handler: async () => {
      const snapshot = await ctx.doc.getSnapshot({ format: 'json' });
      ctx.ui.showToast('已获取文档快照');
      // 后续扩展：基于 snapshot 生成标签建议
    },
  });
};
```

> 备注：当前运行时仅对 `export function activate` 做了简单兼容转换，
> 推荐插件入口先使用 CommonJS 风格，后续再升级为完整 ESM 支持。

## 运行时与隔离（MVP）
- Web 端：Web Worker
- Electron/桌面：Worker 或 sandboxed WebView
- 插件不得直接访问 DOM/内部对象，只能通过 Host API

## 升级路线
**Phase 1（MVP）**
- Toolbar/Command/Setting
- 文档只读快照
- 本地安装、无网络

**Phase 2**
- 自定义 Panel（iframe sandbox）
- `doc:write`（受控写入）

**Phase 3**
- 自定义 Block/Schema
- 插件市场/签名/审核

## 风险与控制
- 安全：权限白名单 + API 限制 + sandbox
- 兼容：API 版本化 + 插件兼容检查
- 性能：限制消息频率与资源占用
