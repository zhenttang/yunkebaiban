# 论坛实现细节（前端）

> 关联架构与功能文档：  
> - 架构：`文档/功能文档/forum.md`、`文档/架构文档/frontend-overview.md`  
> - 功能：`文档/功能文档/论坛/*`
>
> 本文从实现角度串起：`forum-api.ts` + `mock-db.ts` + 各页面组件的调用链。

---

## 1. API 封装与 Mock 数据

### 1.1 forum-api.ts：统一 API 出口

- 文件：`packages/frontend/core/src/desktop/pages/workspace/forum/forum-api.ts`

关键特性：

- 使用 `USE_FORUM_MOCK` 切换“本地 Mock”与“真实后端”：

```ts
const API_BASE_URL = '/api/forum';
const USE_FORUM_MOCK = true;

import { mockDB, paginate, nextPostId, nextReplyId, nextDraftId, nextAttachmentId } from './mock-db';
```

- `request<T>(endpoint, options)`：
  - 构造 `API_BASE_URL + endpoint`；
  - 从 `localStorage` 中读取 `yunke-admin-token` 或 `yunke-access-token` 注入 `Authorization` 头；
  - 自动设置 `Content-Type: application/json`（除非 body 是 `FormData`）；
  - 统一处理非 2xx 响应，解析错误 body 并抛出 `Error(message)`；
  - 对 204 响应返回 `undefined`，对其他响应返回 `result.data ?? result`。

- 所有对后端的调用都以 `listForums/getForum/createPost/getPost/getPostReplies/...` 为前缀，内部根据 `USE_FORUM_MOCK` 决定使用 `mockDB` 还是请求真实 API。

### 1.2 mock-db.ts：内存数据库

- 文件：`packages/frontend/core/src/desktop/pages/workspace/forum/mock-db.ts`

主要内容：

- `mockDB` 对象：
  - `forums: ForumDTO[]`：板块列表（支持 children 形成树形结构）；
  - `posts: PostDTO[]`：帖子集合；
  - `replies: ReplyDTO[]`：回复集合；
  - `tags: TagDTO[]`：标签集合；
  - `postTags: Map<string, number[]>`：帖子与标签的关联；
  - `attachments: AttachmentDTO[]`：附件集合；
  - `notifications: NotificationDTO[]`：通知集合；
  - `reports: ReportDTO[]`：举报集合；
  - `collections: { userId, postId, collectedAt }[]`：收藏记录；
  - `drafts: DraftDTO[]`：草稿集合；
  - 其他辅助字段如 `currentUserId` 等。

- 初始化函数：
  - 构造多个论坛板块（公告/更新/技术讨论/社区交流等），包括层级关系；
  - 构造标签列表（公告/更新/前端/后端/...）；
  - 使用 `newPost` 工具函数为各板块生成示例帖子，并填充 `mockDB.posts`；
  - 为帖子分配标签、附件、回复、收藏、通知、举报等模拟数据。

- `paginate(list, page, size)`：
  - 简单的数组分页工具，返回 `{ content, totalElements, totalPages, number }`；
  - 被多数 `get*` 列表 API 使用。

> 这种 `USE_FORUM_MOCK + mockDB` 的设计，使得论坛在本地开发时完全依赖前端模拟数据也能跑通完整流程，同时预留与真实后端接口对接的路径。

---

## 2. 板块与帖子列表：首页与板块详情

### 2.1 论坛首页：板块树（/forum）

- 文件：`forum-home/index.tsx`

实现要点：

- 通过 `listForums()` 拉取板块树（`ForumDTO[]`，包含 children）；
- 使用 `ForumTreeNode` 组件递归渲染：
  - 展示板块图标、名称、描述、帖子/主题数、最后活跃时间；
  - 支持展开/折叠、键盘 Enter/Space 打开板块；
  - 点击板块跳转到 `/forum/:forumId`（板块详情页）。
- 提供本地搜索：

```ts
const [query, setQuery] = useState('');
const filteredForums = forums.filter(f =>
  (f.name + (f.description || '')).toLowerCase().includes(query.toLowerCase())
);
```

### 2.2 板块详情页（/forum/:forumId）

- 文件：`forum-detail/index.tsx`

实现要点：

- 读取 `forumId` 参数，调用：
  - `getForum(id)`：板块基础信息；
  - `getForumStats(id)`：统计信息（帖子数、主题数、今日发帖、活跃用户数）；
  - `getForumPosts(id, page, size)`：分页帖子列表。

- 帖子列表每行展示：
  - 标题（前置 `[置顶]` / `[精华]` 文案取决于 `isSticky/isEssence`）；
  - 作者、日期、浏览数、回复数；
  - 点击跳转 `/forum/:forumId/post/:postId`。

- 顶部“发帖”按钮：
  - 跳转 `/forum/:forumId/create-post`；
  - 对接发帖页面逻辑（见前面的发帖实现文档）。

---

## 3. 帖子详情与回复：post-detail

### 3.1 主数据加载

- 文件：`post-detail/index.tsx`

主要调用的 API：

- `getPost(postId)`：
  - 获取帖子主信息（标题、内容、作者、统计、置顶/精华/锁定状态等）；
  - Mock 模式下，根据 `mockDB.posts` 中的数据构造 `PostDTO`，并附加 `isLiked/isCollected` 标记。
- `getPostTags(postId)`：
  - 从 `mockDB.postTags` 获取标签 ID 数组，并映射为 `TagDTO[]`；
- `getPostAttachments(postId)`：
  - 从 `mockDB.attachments` 中筛选对应附件。
- `getPostReplies(postId, page, size)`：
  - 返回分页 `ReplyDTO` 列表，按 floor 排序。

### 3.2 点赞、收藏与回复

- 使用 `PostActions` 组件处理“点赞/取消点赞”和“收藏/取消收藏”：
  - `likePost/unlikePost`：
    - Mock 下更新 `mockDB.posts` 中 `likeCount` 和 `isLiked`；
  - `collectPost/uncollectPost`：
    - Mock 下修改 `mockDB.collections`，并更新 `collectCount` 与 `isCollected`。

- 回复区域：
  - `getPostReplies` 拉取回复列表；
  - `createReply` 创建新回复：
    - Mock 下新增 `ReplyDTO`，更新帖子 `replyCount` 和 `lastReplyAt`；
  - `likeReply/unlikeReply`：
    - 修改 `ReplyDTO.likeCount`，用于 UI 更新；
  - `markBestAnswer`：
    - 设置 `ReplyDTO.isBestAnswer = true`，用于展示“最佳答案”标记。

### 3.3 版主操作

- 调用 `stickyPost/essencePost/lockPost`：
  - Mock 下直接修改 `PostDTO` 对象的 `isSticky/isEssence/isLocked`；
  - 实际环境下分别调用 `/posts/{id}/sticky`、`/essence`、`/lock`；
  - 操作完成后刷新帖子详情，以同步状态。

---

## 4. 草稿与编辑历史

### 4.1 草稿 API 与数据流

- 草稿类型（simplified）：`DraftDTO`；
- API：
  - `saveDraft(data: CreateDraftRequest)`：
    - 若存在 `data.id`，则更新已存在草稿；
    - 否则创建新草稿，赋予 `nextDraftId()`；
  - `getMyDrafts(page, size)`：
    - 使用 `paginate(mockDB.drafts, page, size)`；
  - `getDraft(id)`：
    - 在 `mockDB.drafts` 中按 ID 查找；
  - `publishDraft(id)`：
    - 创建对应帖子（调用 `nextPostId` 等），并将草稿标记为已发布或删除（视具体实现）。

- 草稿列表页（`draft-list/index.tsx`）：
  - 使用 `getMyDrafts` 拉取分页草稿；
  - “继续编辑”按钮跳往 `/forum/{forumId}/create-post?draftId={id}`；
  - “发布”调用 `publishDraft`，成功后跳帖子的详情页；
  - “删除”调用 `deleteDraft`（如有）后刷新列表。

### 4.2 编辑历史 API

- 历史条目类型：`EditHistoryDTO`；
- API：
  - `getPostHistory(postId, page, size)`：
    - Mock 下简单返回两条虚拟历史记录（v1/v2）；
    - 实际环境下从后端 `/posts/{postId}/history` 拉取；
  - `getHistoryDetail(historyId)`：
    - Mock 下返回一条虚拟详情；
    - 实际环境下从 `/history/{historyId}` 拉取。

- 编辑历史页（`edit-history/index.tsx`）：
  - 同时调用 `getPost` 与 `getPostHistory`；
  - 将 `content` 按 `editedAt/createdAt` 倒序排序；
  - 展示版本号、编辑时间、编辑人、是否变更标题/内容等信息；
  - 点击“查看详情”时，如果当前项缺少完整内容，会调用 `getHistoryDetail` 并更新对应项；
  - 底部提供简单分页切换。

---

## 5. 标签与搜索

### 5.1 标签 API 与页面

- 标签类型：`TagDTO`；
- API：
  - `getPopularTags(limit)`：
    - Mock 下从 `mockDB.tags` 切片；
  - `getPostsByTag(tagId, page, size)`：
    - Mock 下根据 `mockDB.postTags` 中的映射筛选 `posts`。

- 标签帖子页：`tag-posts/index.tsx`：
  - 并行调用 `getPostsByTag(tagId, page, size)` 与 `getPopularTags()`；
  - 从热门标签中找当前标签名称；
  - 用 `PaginatedResponse<PostDTO>` 渲染帖子列表与分页。

### 5.2 搜索 API 与结果页

- 搜索类型：`SearchRequest`、`SearchResultDTO`；
- API：
  - `searchForum(data, page, size)`：
    - Mock 下在 `mockDB.forums` 和 `mockDB.posts` 简单做包含匹配，返回 `SearchResultDTO[]`；
  - `quickSearch(keyword, type, forumId?)`：
    - Mock 下调用 `searchForum({ keyword, type, forumId }, 0, 50)`；
    - 实际环境下 GET `/search?keyword=...&type=...&forumId=...`。

- 搜索结果页：`search-result/index.tsx`：
  - 从 URL 查询参数获取 `keyword`；
  - 调用 `quickSearch(keyword, 'ALL')`；
  - 将结果按 `type` 拆分为“帖子结果”和“板块结果”；
  - 使用 `highlight` 字段（HTML）渲染高亮片段，或用 `content` 截断显示摘要；
  - 点击帖子结果跳转 `/forum/{forumId}/post/{id}`，点击板块结果跳转 `/forum/{forumId || id}`。

---

## 6. 用户积分、收藏与通知

### 6.1 用户积分与签到

- 用户积分类型：`UserPointDTO`；
- API：
  - `getUserPoints(userId)`：
    - Mock 下返回构造好的积分记录，用于用户主页展示；
  - `signIn(userId)`：
    - Mock 下更新 `totalPoints/continuousSignInDays/lastSignInDate`。

- 用户主页：`user-profile/index.tsx`：
  - 加载 `UserPointDTO` 并展示总积分/等级/连续签到天数；
  - 根据 `lastSignInDate` 判断是否可以签到；
  - 调用 `signIn` 更新积分与连续签到记录。

### 6.2 收藏

- 收藏记录存在于 `mockDB.collections` 中：`{ userId, postId, collectedAt }`；
- API：
  - `collectPost/uncollectPost`：
    - 更新帖子上的 `collectCount/isCollected` 字段，并维护 `mockDB.collections`；
  - `getMyCollections(page, size)`：
    - Mock 下对当前用户的 `collections` 进行分页，并将每条记录映射为 `{ post: PostDTO, collectedAt }`。

- “我的收藏”页：`my-collections/index.tsx`：
  - 列出收藏帖子及收藏时间；
  - 提供“取消收藏”按钮，调用 `uncollectPost` 后刷新列表。

### 6.3 通知与举报

- 通知类型：`NotificationDTO`；
- API：
  - `getNotifications(page, size, type?)`；
  - `getUnreadCount()`；
  - `markAsRead(notificationId)`；
  - `markAllAsRead()`.

- 通知中心页：`notifications/index.tsx`：
  - 使用 TabKey（ALL/MENTION/REPLY/LIKE/MOD） + `tabToTypes` 映射后端通知类型；
  - 对单类型 Tab 直接通过 `type` 后端过滤，多类型 Tab 则在前端过滤；
  - 渲染类型标签、标题、摘要、时间，并在点击时跳转到对应帖子或板块。

- 举报类型：`ReportDTO`；
- API：
  - `getPendingReports()`；
  - `getMyReports(userId)`；
  - `handleReport(id, { status, handleNote })`.

- 版主面板：`moderator-panel/index.tsx`：
  - 将 `reports` 划分为待处理/已处理列表；
  - 使用“通过/拒绝”按钮调用 `handleReport`，处理完后刷新列表；
  - 展示举报目标、原因、描述、举报人、处理人、处理时间和备注。

---

## 7. 小结：论坛前端的实现形态

- 绝大多数论坛功能（板块/帖子/回复/草稿/收藏/通知/举报）都通过 `forum-api.ts` 封装，Mock 与真实后端仅在 `USE_FORUM_MOCK` 分支中切换；
- `mock-db.ts` 提供了完整的内存数据结构，使前端在无后端服务情况下也能跑通所有页面与交互；  
- 各页面组件（home/detail/post-detail/create-post/draft-list/edit-history/tag-posts/search-result/notifications/moderator-panel/my-collections/user-profile）普遍模式是：
  1. 读取路由参数或查询参数；  
  2. 调用对应 API 拉取数据（通常 `Promise.all` 并行多个请求）；  
  3. 用简单的本地状态（`useState` + `useEffect`）管理加载/错误/分页；  
  4. 在交互操作（发帖、回复、点赞、收藏、处理举报）后重新调用 API 刷新视图。  

前端实现刻意保持“API 封装清晰、页面逻辑直观、Mock 与真实后端兼容”，方便后续根据实际后端接口替换 `request<T>` 分支或调整数据模型，而不需要大改页面层代码。 

