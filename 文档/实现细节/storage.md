# 存储与同步实现细节（前端）

> 关联架构文档：`文档/架构文档/storage-and-sync.md`  
> 本文聚焦实现层面：具体模块、调用链与关键数据结构。

---

## 1. nbstore Worker：前端本地存储与执行环境

### 1.1 Worker 启动逻辑

- 文件：`packages/frontend/apps/web/src/nbstore.worker.ts`

```ts
import '@yunke/core/bootstrap/worker';
import { broadcastChannelStorages } from '@yunke/nbstore/broadcast-channel';
import { idbStorages } from '@yunke/nbstore/idb';
import { idbV1Storages } from '@yunke/nbstore/idb/v1';
import {
  StoreManagerConsumer,
  type WorkerManagerOps,
} from '@yunke/nbstore/worker/consumer';
import { type MessageCommunicapable, OpConsumer } from '@toeverything/infra/op';

const consumer = new StoreManagerConsumer([
  ...idbStorages,
  ...idbV1Storages,
  ...broadcastChannelStorages,
  // ...cloudStorages, // 云存储由主线程管理
]);
```

- 关键点：
  - 通过 `StoreManagerConsumer` 注册了一组存储实现：
    - IndexedDB v2：`idbStorages`；
    - IndexedDB v1：`idbV1Storages`（兼容旧数据结构）；
    - BroadcastChannel：`broadcastChannelStorages` 用于跨 Tab 同步；
  - 显式注释掉 `cloudStorages`，强调“云存储在主线程，由引擎层统一管理”。

### 1.2 Worker 与 SharedWorker 双模式

```ts
if ('onconnect' in globalThis) {
  // SharedWorker 模式
  (globalThis as any).onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // 普通 Worker 模式
  consumer.bindConsumer(
    new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable)
  );
}
```

- 实现细节：
  - 通过检查 `globalThis` 是否有 `onconnect` 判断当前脚本是否运行在 SharedWorker 中；
  - SharedWorker 模式下，中转函数从 `event.ports[0]` 取出 `MessagePort` 实例，并为其创建 `OpConsumer`；
  - 普通 Worker 模式下，直接把 `globalThis` 作为消息通道注入 `OpConsumer`；
  - 统一使用 `OpConsumer<WorkerManagerOps>` 来解码/处理主线程发来的操作指令。

---

## 2. WorkspaceEngine：存储实现选择与文档初始化

### 2.1 WorkspaceFlavourProvider 调用链

- 接口：`packages/frontend/core/src/modules/workspace/providers/flavour.ts`

```ts
export interface WorkspaceFlavourProvider {
  flavour: string;
  deleteWorkspace(id: string): Promise<void>;
  createWorkspace(
    initial: (docCollection: BSWorkspace, blobStorage: BlobStorage, docStorage: DocStorage) => Promise<void>
  ): Promise<WorkspaceMetadata>;
  workspaces$: LiveData<WorkspaceMetadata[]>;
  // ...
  getEngineWorkerInitOptions(workspaceId: string): WorkerInitOptions;
  onWorkspaceInitialized?(workspace: Workspace): void;
}
```

- 实现要点：
  - `createWorkspace(initial)` 负责创建空间 + 初始化文档集合；
  - `getEngineWorkerInitOptions` 提供给文档引擎 Worker 用的初始化参数（包括要使用的 nbstore Worker URL、工作区 ID 等）；
  - `onWorkspaceInitialized` 是一个可选 hook，用于工作区创建后进行额外配置。

### 2.2 WorkspaceFactoryService：创建工作区与初始文档

- 文件：`packages/frontend/core/src/modules/workspace/services/factory.ts`

```ts
export class WorkspaceFactoryService extends Service {
  constructor(private readonly flavoursService: WorkspaceFlavoursService) {
    super();
  }

  create = async (
    flavour: string,
    initial: (
      docCollection: Workspace,
      blobFrontend: BlobStorage,
      docFrontend: DocStorage
    ) => Promise<void> = () => Promise.resolve()
  ) => {
    const provider = this.flavoursService.flavours$.value.find(
      x => x.flavour === flavour
    );
    if (!provider) {
      throw new Error(`未知的工作区类型：${flavour}`);
    }
    const metadata = await provider.createWorkspace(initial);
    return metadata;
  };
}
```

- 实现细节：
  - 通过 `WorkspaceFlavoursService` 获取所有可用 `WorkspaceFlavourProvider`；
  - 使用 `flavour` 字符串匹配具体 provider；
  - 将 `initial` 回调传进去，让调用方在 `createWorkspace` 内部直接写 BlockSuite 文档（如调用 `initDocFromProps`）。

### 2.3 CloudWorkspaceFlavourProvider 中的存储选择（简略）

- 文件：`packages/frontend/core/src/modules/workspace-engine/impls/cloud.ts`

在该文件中，通过环境变量（`BUILD_CONFIG`）动态选择 nbstore 存储实现，例如：

```ts
DocStorageType = (() => {
  if (BUILD_CONFIG.isAndroid && Capacitor) return IndexedDBDocStorage;
  if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) {
    return SqliteDocStorage;
  }
  return IndexedDBDocStorage;
})();

BlobStorageType = (() => {
  if (Android+Capacitor) return IndexedDBBlobStorage;
  if (Electron || iOS) return SqliteBlobStorage;
  return IndexedDBBlobStorage;
})();
```

- 关键点：
  - 同一套代码，可以在不同运行时（Web/Electron/Mobile）选择不同本地存储后端；
  - 所有 `DocStorageType` / `BlobStorageType` / `*SyncStorageType` 最终都是 nbstore 提供的类；
  - 云端同步逻辑（如 `CloudDocStorage`）在需要时被加载并组合到引擎中。

---

## 3. Global Storage 模块：全局状态与缓存

### 3.1 抽象提供者与服务

- 文件：`packages/frontend/core/src/modules/storage/index.ts`

```ts
export {
  CacheStorage,
  GlobalCache,
  GlobalSessionState,
  GlobalState,
} from './providers/global';
export { NbstoreProvider } from './providers/nbstore';
export {
  GlobalCacheService,
  GlobalSessionStateService,
  GlobalStateService,
} from './services/global';
export { NbstoreService } from './services/nbstore';
```

- `GlobalState`：
  - 抽象出“全局持久化状态”的存储（适合放用户偏好、配置等）；
- `GlobalCache`：
  - 抽象出“全局缓存”，可以是内存+持久化的轻量缓存层；
- `GlobalSessionState`：
  - 抽象出会话级状态（浏览器会话结束后可丢弃）。

每个抽象都有对应的 Service（`GlobalStateService` 等），通过依赖注入获得。

### 3.2 默认实现配置

`configureStorageModule(framework)` 中注册服务，而具体实现通过以下函数配置：

```ts
export function configureLocalStorageStateStorageImpls(framework: Framework) {
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(CacheStorage, IDBGlobalState);
}

export function configureCommonGlobalStorageImpls(framework: Framework) {
  framework.impl(GlobalSessionState, SessionStorageGlobalSessionState);
}
```

- 说明：
  - 全局状态和缓存默认落在：
    - `localStorage`（GlobalState/GlobalCache）；
    - `IndexedDB`（更大容量的 CacheStorage，供某些模块使用）；
    - `sessionStorage`（会话态状态）。

> 这样，业务模块不会在代码里到处直接使用 `localStorage`/`sessionStorage`，而是通过抽象服务访问，方便未来替换实现或集中管理。

---

## 4. 文档同步与 Yjs 交互（前端部分）

### 4.1 工作区引擎中的 Yjs 使用（示例级）

- 文件：`workspace-engine/impls/cloud.ts` 中引入：

```ts
import {
  applyUpdate,
  type Array as YArray,
  Doc as YDoc,
  encodeStateAsUpdate,
  type Map as YMap,
} from 'yjs';
```

- 常见使用模式（简要说明）：
  - `encodeStateAsUpdate(yDoc)`：将当前 YDoc 状态编码为增量更新（用于持久化或同步）；
  - `applyUpdate(yDoc, update)`：将某个 update 应用到现有 YDoc；
  - 这些调用一般由 nbstore 的存储实现或 workspace engine 中的同步逻辑驱动。

### 4.2 前端如何感知同步状态（概念）

- 工作区引擎通常会维护一些 LiveData，用于表示：
  - 文档是否已完成初次同步；
  - 当前是否有未同步更新（离线 / 暂存）；
  - 与云端的延迟或错误状态。
- UI 层可以通过 Hooks 或 Services 访问这些状态，在文档界面上展示：
  - “正在同步…” 状态；
  - “离线编辑，稍后同步”提示；
  - 同步错误及重试操作（视实现而定）。

> 具体 LiveData 字段和错误处理逻辑需要结合 workspace-engine 更完整的代码分析，这里只作为“如何承接 Yjs + nbstore 状态”的概念说明。

---

## 5. 与后端接口的责任分工

从实现细节上看，前端与后端在存储与同步上的分工大致为：

- 前端：
  - 通过 nbstore + Worker 管理本地存储与增量更新；
  - 使用 workspace-engine 选择本地存储类型并初始化工作区；
  - 在 UI 中展示同步/历史状态，并提供触发恢复/回滚等操作的入口。
- 后端：
  - 存储长期文档数据与历史快照；
  - 管理权限、协同编辑与冲突解决策略；
  - 提供专门的接口用于：
    - 拉取初始文档；
    - 上传/下载增量更新；
    - 查询与恢复历史版本；
    - 管理附件的云端存储与访问链接。

前端实现中，许多与后端相关的细节通过 `@yunke/nbstore/cloud`、`CloudBlobStorage`、`CloudDocStorage` 等类被封装，不直接暴露给应用层。

---

## 6. 实现侧的小结

结合架构文档与以上实现说明，可以总结前端存储与同步的关键点：

- Worker/SharedWorker + nbstore 负责本地 IO 与跨 Tab 协同，主线程只与 Worker 交换“操作指令”；
- workspace-engine 使用 flavour provider 为不同环境选择合适的存储实现，并在工作区创建时注入初始化逻辑；
- storage 模块统一了全局状态和缓存的使用方式，避免直接依赖浏览器 API；
- 文档同步与历史的大部分复杂逻辑在 nbstore 与后端中处理，前端的职责是“正确接线 + 提供 UI + 处理常见错误和状态提示”。

未来如需进一步深入，可以针对某个 flavour 或某种部署模式（如自托管云）单独写“同步流程详解”文档，追踪从某次编辑到最终云端落地的完整调用链。 

