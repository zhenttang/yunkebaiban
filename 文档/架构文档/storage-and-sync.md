# 存储与同步架构（nbstore / Worker / 本地与云）

> 关联目录与模块：
> - 前端 nbstore Worker：`packages/frontend/apps/web/src/nbstore.worker.ts`
> - 工作空间引擎（文档/附件存储与同步）：`packages/frontend/core/src/modules/workspace-engine/*`
> - 工作空间封装：`packages/frontend/core/src/modules/workspace/*`
> - 全局状态与缓存：`packages/frontend/core/src/modules/storage/*`
> - 公共 nbstore 包：`packages/common/nbstore`（通过 `@yunke/nbstore` 引入）

本篇从架构视角说明文档与附件在前端是如何存储、同步以及与后端交互的。

---

## 1. 存储与同步的整体格局

### 1.1 三层视角

从前端角度，文档/附件的存储和同步可以分为三层：

- 应用层（Workspace / Doc / BlockSuite）：
  - 通过 `DocsService`、BlockSuite 文档 store、工作空间模块等访问文档；
  - 不直接关心存储介质（IndexedDB / SQLite / Cloud）。
- 引擎层（workspace-engine）：
  - 将“工作空间”和“文档/附件存储”绑定到 nbstore 引擎；
  - 根据运行环境（Web / Electron / Mobile / Cloud）选择不同的存储实现和同步策略；
  - 负责拉取/推送文档增量更新，处理 Yjs 文档同步。
- 存储层（nbstore + Worker）：
  - 通过 `@yunke/nbstore` 提供统一的 `DocStorage` / `BlobStorage` / “同步存储”接口；
  - 在浏览器中使用 IndexedDB + Worker/SharedWorker 作为本地存储与执行环境；
  - 在 Electron/移动端使用 SQLite 存储。

### 1.2 nbstore 的角色

`@yunke/nbstore` 是 Yunke 前端的统一存储抽象：

- 提供抽象接口：
  - `DocStorage`：面向文档（YDoc 更新）的存储；
  - `BlobStorage`：面向附件文件的存储；
  - `DocSyncStorage` / `BlobSyncStorage`：带同步能力的存储（支持与远端服务同步状态）。
- 提供多种实现：
  - IndexedDB 实现（`idb` / `idb/v1`）；
  - SQLite 实现（桌面/移动端）；
  - Cloud 存储实现（`cloud` 模块）。
- 通过 Worker 客户端接口（`@yunke/nbstore/worker/client`）与前端主线程通信。

> 简单理解：应用通过 workspace-engine 调用 nbstore，nbstore 再选择合适的后端（IndexedDB/SQLite/Cloud）完成读写和同步。

---

## 2. 浏览器端 nbstore Worker 架构

### 2.1 nbstore.worker.ts：Worker 启动脚本

位置：`packages/frontend/apps/web/src/nbstore.worker.ts`

核心逻辑：

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

- `StoreManagerConsumer`：
  - 来自 nbstore，用于在 Worker 中注册一组存储实现；
  - 这里注册了：
    - IndexedDB v2 存储（`idbStorages`）；
    - IndexedDB v1 存储（兼容旧版本数据结构）；
    - BroadcastChannel 存储（用于跨 Tab 同步）；
  - 云存储明确不在 Worker 中处理，而是由主线程管理。

### 2.2 Worker 与 SharedWorker 模式

Worker 脚本同时兼容 Worker 与 SharedWorker 两种模式：

```ts
if ('onconnect' in globalThis) {
  // SharedWorker 模式
  (globalThis as any).onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    consumer.bindConsumer(new OpConsumer<WorkerManagerOps>(port));
  };
} else {
  // 普通 Worker
  consumer.bindConsumer(
    new OpConsumer<WorkerManagerOps>(globalThis as MessageCommunicapable)
  );
}
```

- 当环境支持 SharedWorker 时：
  - 所有 Tab 可以共享一个 nbstore Worker 实例；
  - 通过 `MessagePort` 与每个 Tab 通信；
  - 减少重复初始化开销并利于跨 Tab 协同。
- 否则：
  - 每个 Tab 使用各自的 Worker；
  - 同样通过 `OpConsumer` 实例与 nbstore 交互。

> 这一层与应用无直接耦合，只要主线程通过 `@yunke/nbstore/worker/client` 提供的接口接入即可。

---

## 3. 工作空间引擎：选择存储实现与同步策略

工作空间引擎模块位于：`packages/frontend/core/src/modules/workspace-engine/*`。

### 3.1 WorkspaceFlavourProvider：工作区“风格”

接口定义：`modules/workspace/providers/flavour.ts`

```ts
export interface WorkspaceFlavourProvider {
  flavour: string;

  deleteWorkspace(id: string): Promise<void>;

  createWorkspace(
    initial: (docCollection: BSWorkspace, blobStorage: BlobStorage, docStorage: DocStorage) => Promise<void>
  ): Promise<WorkspaceMetadata>;

  workspaces$: LiveData<WorkspaceMetadata[]>;
  isRevalidating$?: LiveData<boolean>;
  revalidate?: () => void;

  getWorkspaceProfile(id: string, signal?: AbortSignal): Promise<WorkspaceProfileInfo | undefined>;
  getWorkspaceBlob(id: string, blob: string): Promise<Blob | null>;
  listBlobs(workspaceId: string): Promise<ListedBlobRecord[]>;
  deleteBlob(workspaceId: string, blob: string, permanent: boolean): Promise<void>;

  getEngineWorkerInitOptions(workspaceId: string): WorkerInitOptions;

  onWorkspaceInitialized?(workspace: Workspace): void;
}
```

- 不同实现（如 cloud/local/self-hosted 等）可以注册不同的 flavour，分别决定：
  - 工作区如何创建与删除；
  - 文档与附件如何存储与同步（使用何种 nbstore 存储实现）；
  - 如何初始化 workspace engine Worker；  
  - 如何访问/管理工作区中的附件。

### 3.2 WorkspaceFactoryService：创建 Workspace

`modules/workspace/services/factory.ts`：

```ts
export class WorkspaceFactoryService extends Service {
  constructor(private readonly flavoursService: WorkspaceFlavoursService) { super(); }

  create = async (
    flavour: string,
    initial: (docCollection: Workspace, blobFrontend: BlobStorage, docFrontend: DocStorage) => Promise<void> = () => Promise.resolve()
  ) => {
    const provider = this.flavoursService.flavours$.value.find(x => x.flavour === flavour);
    if (!provider) throw new Error(`未知的工作区类型：${flavour}`);
    const metadata = await provider.createWorkspace(initial);
    return metadata;
  };
}
```

- 逻辑：
  - 根据 `flavour` 找到对应的 `WorkspaceFlavourProvider`；
  - 调用 `provider.createWorkspace(initial)`，传入回调，在其中可对 `docCollection` 进行初始化（例如调用 `initDocFromProps` 创建基础文档结构）；
  - 返回 `WorkspaceMetadata`（工作区 ID、名称等）。

### 3.3 CloudWorkspaceFlavourProvider（云工作区）

在 `workspace-engine/impls/cloud.ts` 中，可以看到基于 `@yunke/nbstore` 的多种存储实现选择逻辑，例如：

- `DocStorageType` / `DocStorageV1Type`：选择文档存储；
- `BlobStorageType` / `BlobStorageV1Type`：选择附件存储；
- `DocSyncStorageType` / `BlobSyncStorageType`：选择同步存储；

环境判断示例（精简）：

```ts
DocStorageType = (() => {
  if (BUILD_CONFIG.isAndroid && Capacitor) return IndexedDBDocStorage;
  if (BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS) return SqliteDocStorage;
  return IndexedDBDocStorage;
})();

BlobStorageType = (() => {
  if (Android+Capacitor) return IndexedDBBlobStorage;
  if (Electron || iOS) return SqliteBlobStorage;
  return IndexedDBBlobStorage;
})();
```

- 架构含义：
  - Web / Mobile Web 使用 IndexedDB；
  - Electron / iOS 使用 SQLite；
  - Android 根据是否为 Capacitor 决定使用 IndexedDB 或 SQLite（当前代码偏向 IndexedDB）。

> 通过 flavour provider + 环境判断，工作空间引擎可以在不同平台上选择最合适的存储方式，而上层只是使用统一接口。

---

## 4. 全局状态与缓存存储

### 4.1 Storage 模块概览

位置：`packages/frontend/core/src/modules/storage/*`

- `providers/global.ts`：
  - 定义 `GlobalState`、`GlobalCache`、`GlobalSessionState` 这三类全局存储抽象；
  - 对应全局持久化状态、缓存以及会话级状态。
- `impls/storage.ts`：
  - 为上述抽象提供具体实现：
    - 本地存储（`LocalStorageGlobalState`、`LocalStorageGlobalCache`）；
    - 会话存储（`SessionStorageGlobalSessionState`）；
    - IndexedDB 实现（`IDBGlobalState`）用于更大规模状态存储。
- `services/nbstore.ts` 与 `providers/nbstore.ts`：
  - 封装 nbstore 的使用方式，将其集成到统一的 storage 模块中。

### 4.2 Storage 模块配置

`modules/storage/index.ts` 提供配置函数：

```ts
export const configureStorageModule = (framework: Framework) => {
  framework.service(GlobalStateService, [GlobalState]);
  framework.service(GlobalCacheService, [GlobalCache]);
  framework.service(GlobalSessionStateService, [GlobalSessionState]);
  framework.service(NbstoreService, [NbstoreProvider]);
};

export function configureLocalStorageStateStorageImpls(framework: Framework) {
  framework.impl(GlobalCache, LocalStorageGlobalCache);
  framework.impl(GlobalState, LocalStorageGlobalState);
  framework.impl(CacheStorage, IDBGlobalState);
}

export function configureCommonGlobalStorageImpls(framework: Framework) {
  framework.impl(GlobalSessionState, SessionStorageGlobalSessionState);
}
```

- 架构含义：
  - 全局配置和缓存也通过统一抽象 —— 不直接到处使用 `localStorage/sessionStorage`；
  - 可在不同环境下注入不同的存储实现（如将某些状态放到 IndexedDB 以降低 localStorage 压力）。

---

## 5. 文档同步与历史（概念视角）

> 文档历史在 BlockSuite 与后端协作共同完成，这里简要说明前端侧的角色。

### 5.1 Yjs 与 nbstore 协同

- BlockSuite 文档底层使用 Yjs（`Doc`、`Map`、`Array` 等）描述文档状态；
- nbstore 的 `DocStorage` / `DocSyncStorage` 负责：
  - 将 YDoc 的更新（update）持久化到本地存储（IndexedDB/SQLite）；
  - 根据需要向后端推送或从后端拉取增量更新；
  - 处理恢复、重连和多端同步场景。

在 `workspace-engine/impls/cloud.ts` 中可以看到对 Yjs 的使用，例如：

```ts
import {
  applyUpdate,
  encodeStateAsUpdate,
  Doc as YDoc,
  type Map as YMap,
  type Array as YArray,
} from 'yjs';
```

- 典型处理流程（概念）：
  - 初次打开文档时，从本地或云端获取当前 YDoc 状态；
  - 用户编辑时，YDoc 产生 update，nbstore 同步存储这些 update；
  - 定期或实时将 update 推送到后端，参与多端协同。

### 5.2 历史记录与快照（概念）

- 快照与历史记录的具体实现细节更多在后端与 nbstore 协作中完成；
- 前端主要负责：
  - 调用相应 API 获取历史快照列表（版本号、时间、编辑人等）；
  - 使用 BlockSuite 工具将某个历史版本加载为只读视图，并在用户选择恢复时提交回写请求；
  - 在 UI 中提供历史记录对话框（已在功能文档中详细描述）。

---

## 6. 小结与扩展方向

整体来看，Yunke 的存储与同步前端架构遵循以下原则：

- 通过 nbstore 抽象存储介质（IndexedDB/SQLite/Cloud），避免应用层与具体实现耦合；
- 在浏览器中使用 Worker/SharedWorker 处理 nbstore 操作，减少主线程阻塞并支持跨 Tab 协同；
- 使用 WorkspaceFlavourProvider 在不同平台和部署模式下选择合适的存储与同步策略；
- 将全局配置/缓存也通过统一 storage 模块管理，方便切换存储后端；
- 将文档历史与同步逻辑尽量放在 nbstore + 后端中处理，前端更多是“消费方”和“状态展示方”。

后续可以在此文档基础上进一步扩展：

- 针对每种 flavour（云/本地/自托管）的具体同步流程与安全策略；
- 与后端文档历史与权限模型的精确交互（例如历史快照与回滚的调用链）；  
- 针对 Electron/移动端的 SQLite 存储优化与离线策略。 

