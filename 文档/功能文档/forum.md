# 论坛与社区（功能 + 实现总览）

> 主要代码位置：
> - 工作空间内路由：`packages/frontend/core/src/desktop/workbench-router.ts`
>   - `/forum`：论坛首页（板块树）
>   - `/forum/:forumId`：板块详情与帖子列表
>   - `/forum/:forumId/post/:postId`：帖子详情
> - 页面目录：`packages/frontend/core/src/desktop/pages/workspace/forum/*`
>   - `forum-home`：论坛首页 & 板块树视图
>   - `forum-detail`：板块详情与帖子列表
>   - `post-detail`：帖子详情页
>   - 其他：发帖、草稿、标签页、搜索结果、通知、版主管理等
> - Forum API 与类型：`forum-api.ts`、`types.ts`、`mock-db.ts`

---

## 1. 论坛整体定位

### 1.1 在系统中的角色

- 为工作空间提供一个「社区/讨论区」子系统，用于：
  - 讨论产品使用问题、分享经验；
  - 对文档/模板等内容展开讨论（可通过链接/引用关联）；
  - 形成围绕工作空间的轻量社区。
- 与工作空间的关系：
  - 共用用户与权限体系（登录凭证、权限令牌从同一来源获取）；
  - 路由挂载在 workspace 下的 `workbench` 路由体系中（`/workspace/:workspaceId/forum...`）；
  - 可以在文档中嵌入指向论坛帖子的链接，或在帖子中附上文档链接。

### 1.2 功能构成

- 板块（Forum）：
  - 支持多级板块树结构（父子关系）；
  - 每个板块有名称、描述、图标、统计信息等；
  - 板块内包含多个主题/帖子。
- 帖子（Post）与回复（Reply）：
  - 帖子支持标题、内容、标签、附件等；
  - 回复构成楼层结构，并可支持楼中楼/最佳答案标记等；
  - 支持点赞、收藏、举报、版主管理等操作。
- 标签（Tag）与搜索：
  - 标签用于给帖子打分类标签；
  - 搜索支持按关键词/标签/板块等维度过滤。
- 通知（Notification）与积分（UserPoint）：
  - 用户收到回复、被 @、帖子被操作等会触发通知；
  - 用户行为可计入积分体系（视实现）。

---

## 2. 路由与页面结构

### 2.1 工作空间内的论坛路由

- 在 `workbench-router.ts` 中定义了论坛相关路由：

```ts
export const workbenchRoutes = [
  // ...
  {
    path: '/forum',
    lazy: () => import('./pages/workspace/forum/forum-home'),
  },
  {
    path: '/forum/:forumId',
    lazy: () => import('./pages/workspace/forum/forum-detail'),
  },
  {
    path: '/forum/:forumId/post/:postId',
    lazy: () => import('./pages/workspace/forum/post-detail'),
  },
  // ...
];
```

- 行为说明：
  - `/forum`：展示所有板块的树状视图，是用户进入论坛的默认入口；
  - `/forum/:forumId`：展示指定板块的简介与帖子列表；
  - `/forum/:forumId/post/:postId`：展示某个帖子的详情、回复与版主管理操作。

> 后续扩展的子路由（草稿、搜索、通知、用户主页等）会挂在相同路由空间内，具体实现位于 `forum` 目录下其他页面文件。

### 2.2 左侧导航入口

- 根应用侧边栏中有论坛入口按钮：
  - 组件：`packages/frontend/core/src/components/root-app-sidebar/forum-button.tsx`
  - 按钮点击后跳转到当前 workspace 下的 `/forum` 路径；
  - 通过 `location.pathname.includes('/forum')` 判断当前是否激活。

---

## 3. 数据模型与 API 层

### 3.1 DTO 类型定义

- 所有论坛相关数据类型定义在 `types.ts` 中，包括：
  - `ForumDTO`：板块信息（名称、描述、图标、统计、子板块列表等）；
  - `PostDTO`：帖子（标题、内容、作者、统计信息、置顶/精华/锁定状态等）；
  - `ReplyDTO`：回复（楼层号、是否最佳答案、点赞数等）；
  - `TagDTO`：标签（名称、描述、使用次数）；
  - `NotificationDTO`：通知（类型、是否已读、关联帖子/回复等）；
  - `DraftDTO`、`EditHistoryDTO`、`AttachmentDTO` 等辅助类型。

示例（简化）：

```ts
export interface ForumDTO {
  id: number;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  banner?: string;
  parentId?: number;
  displayOrder: number;
  postCount: number;
  topicCount: number;
  isActive: boolean;
  isPrivate: boolean;
  createdAt: string;
  updatedAt?: string;
  children?: ForumDTO[];
}
```

### 3.2 API 封装与 Mock 切换

- `forum-api.ts` 中封装了所有论坛相关的 API 调用：
  - `listForums()`、`getForum()`、`getForumPosts()` 等；
  - `createPost()`、`updatePost()`、`createReply()` 等；
  - `stickyPost()`、`essencePost()`、`lockPost()` 等版主管理操作；
  - `getPostTags()`、`getPostAttachments()` 等辅助查询；
  - `search()`、`getNotifications()` 等功能。

- 通过 `USE_FORUM_MOCK` 切换使用本地 mockDB 还是真实后端接口：

```ts
const API_BASE_URL = '/api/forum';
const USE_FORUM_MOCK = true; // 为 true 时使用 mock-db.ts 中的模拟数据
```

- 若 `USE_FORUM_MOCK` 为 true：
  - `listForums()` 从 `mockDB.forums` 中返回深拷贝；
  - `getForum()`、`getPost()` 等在内存结构中查找数据；
  - 创建/更新/删除等操作直接修改内存中的 `mockDB`。

> 这样的设计允许在没有后端的情况下完整体验论坛功能，同时保留与真实 REST API 对接的路径。

---

## 4. 文档结构与扩展方向

### 4.1 功能文档拆分

- 当前论坛功能文档拆分为：
  - `论坛概览.md`：论坛在系统中的定位与角色划分；
  - `浏览与导航.md` + 子文档：
    - `论坛首页与板块浏览.md`：对应 `forum-home/index.tsx`；
    - `帖子详情浏览.md`：对应 `post-detail/index.tsx`；
  - `帖子创作与管理.md` + 子文档：
    - `发帖流程.md`：发帖页面与数据提交流程；
    - `草稿与编辑历史.md`：草稿列表与帖子历史记录。
  - `标签与搜索.md` + 子文档：
    - `标签浏览与过滤.md`；
    - `搜索结果展示.md`。
  - `用户与收藏.md` + 子文档：
    - `用户主页视图.md`；
    - `收藏功能.md`。
  - `通知与管理.md` + 子文档：
    - `通知中心功能.md`；
    - `版主管理操作.md`。

### 4.2 接下来扩展的实现细节

- 对于每个功能小节，将逐步补充：
  - 对应页面组件（如 `forum-home/index.tsx`、`forum-detail/index.tsx`、`post-detail/index.tsx`）的结构说明；
  - API 调用链（哪些函数从 `forum-api.ts` 被调用、分页/过滤参数如何传递）；
  - 状态管理方式（`useState` / `useEffect` / 自定义 hooks）；
  - 与权限/角色（普通用户/版主/管理员）的关系。

> 这一文件作为论坛模块的顶层总览，后续所有子文档在此基础上继续“从功能到代码实现”的逐层展开。 
