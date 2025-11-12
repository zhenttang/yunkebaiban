# 分享功能代码位置分析报告

## 概述

本文档整理了前端和后端代码中与分享功能相关的所有文件和关键实现。

## 一、前端分享功能

### 1. 核心分享模块

#### 1.1 分享菜单组件
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-menu/view/share-menu/share-menu.tsx`
- **功能**: 分享菜单的主入口组件，包含分享、导出、邀请、成员管理等标签页
- **关键功能**:
  - 显示分享菜单界面
  - 处理本地和云端工作空间的分享逻辑
  - 权限控制和付费墙检查

#### 1.2 分享页面组件
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-menu/view/share-menu/share-page.tsx`
- **功能**: 分享菜单的主要内容页面
- **关键功能**:
  - 公开文档设置
  - 成员权限管理
  - 复制分享链接

#### 1.3 分享页面（公开访问页面）
- **位置**: `baibanfront/packages/frontend/core/src/desktop/pages/workspace/share/share-page.tsx`
- **功能**: 公开分享链接的访问页面
- **关键功能**:
  - 渲染公开分享的文档
  - 处理匿名用户身份
  - 支持只读和仅追加模式
  - 处理模板分享

#### 1.4 分享头部组件
- **位置**: `baibanfront/packages/frontend/core/src/desktop/pages/workspace/share/share-header.tsx`
- **功能**: 分享页面的头部导航

#### 1.5 分享底部组件
- **位置**: `baibanfront/packages/frontend/core/src/desktop/pages/workspace/share/share-footer.tsx`
- **功能**: 分享页面的底部信息

### 2. 分享数据管理

#### 2.1 分享信息实体
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-doc/entities/share-info.ts`
- **功能**: 分享信息的实体类，管理分享状态
- **关键方法**:
  - `revalidate()`: 重新验证分享信息
  - `enableShare(mode)`: 启用分享
  - `changeShare(mode)`: 更改分享模式
  - `disableShare()`: 禁用分享

#### 2.2 分享信息服务
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-doc/services/share-info.ts`
- **功能**: 分享信息的服务类

#### 2.3 分享存储
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-doc/stores/share.ts`
- **功能**: 分享数据的存储层，处理与后端的API交互
- **关键方法**:
  - `getShareInfoByDocId()`: 获取文档分享信息（通过HEAD请求读取权限）
  - `enableSharePage()`: 启用文档分享
  - `disableSharePage()`: 禁用文档分享

### 3. 社区分享功能

#### 3.1 分享到社区按钮
- **位置**: `baibanfront/packages/frontend/core/src/desktop/pages/workspace/detail-page/community-share-button.tsx`
- **功能**: 分享文档到工作空间社区的按钮组件
- **关键功能**:
  - 显示分享状态
  - 打开分享模态框
  - 取消分享

#### 3.2 分享到社区模态框
- **位置**: `baibanfront/packages/frontend/core/src/desktop/pages/workspace/detail-page/share-to-community-modal.tsx`
- **功能**: 分享文档到社区的模态框组件
- **关键功能**:
  - 设置分享标题和描述
  - 选择访问权限
  - 提交分享请求

#### 3.3 社区API服务
- **位置**: `baibanfront/packages/common/request/src/api-services/community-service.ts`
- **功能**: 社区相关的API调用服务
- **关键方法**:
  - `shareDocToCommunity()`: 分享文档到社区
  - `getCommunityDocs()`: 获取社区文档列表
  - `unshareDocFromCommunity()`: 取消社区分享
  - `updateCommunityPermission()`: 更新社区权限
  - `incrementViewCount()`: 增加浏览次数

### 4. 分享设置

#### 4.1 分享设置实体
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-setting/entities/share-setting.ts`
- **功能**: 分享设置的实体类

#### 4.2 分享设置服务
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-setting/services/share-setting.ts`
- **功能**: 分享设置的服务类

#### 4.3 分享设置存储
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-setting/stores/share-setting.ts`
- **功能**: 分享设置的存储层

### 5. 辅助组件

#### 5.1 复制链接按钮
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-menu/view/share-menu/copy-link-button.tsx`
- **功能**: 复制分享链接的按钮组件

#### 5.2 公开文档组件
- **位置**: `baibanfront/packages/frontend/core/src/modules/share-menu/view/share-menu/general-access/public-page-button.tsx`
- **功能**: 公开文档设置组件

## 二、后端分享功能

### 1. 文档公开API

#### 1.1 WorkspaceDocController - 文档公开接口
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java`
- **关键接口**:
  - `PUT /api/workspaces/{workspaceId}/docs/{docId}/public`: 设置文档公开状态
    - 方法: `setDocPublic()`
    - 请求体: `SetPublicRequest { isPublic: boolean }`
  - `GET /api/workspaces/{workspaceId}/docs/{docId}`: 获取文档（HEAD请求读取权限）
    - 响应头:
      - `permission-mode`: 权限模式（private/append-only）
      - `publish-mode`: 发布模式（page/edgeless）

### 2. 社区分享功能

#### 2.1 CommunityController
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/controller/CommunityController.java`
- **功能**: 社区分享功能的REST API控制器
- **关键接口**:
  - `POST /api/community/workspaces/{workspaceId}/docs/{docId}/share`: 分享文档到社区
    - 方法: `shareDocToCommunity()`
    - 请求体: `ShareToCommunityRequest { permission, title, description }`
  
  - `GET /api/community/workspaces/{workspaceId}/docs`: 获取社区文档列表
    - 方法: `getCommunityDocs()`
    - 查询参数: `page`, `size`, `search`
  
  - `DELETE /api/community/workspaces/{workspaceId}/docs/{docId}/share`: 取消社区分享
    - 方法: `unshareDocFromCommunity()`
  
  - `PUT /api/community/workspaces/{workspaceId}/docs/{docId}/permission`: 更新社区权限
    - 方法: `updateCommunityPermission()`
  
  - `POST /api/community/workspaces/{workspaceId}/docs/{docId}/view`: 增加浏览次数
    - 方法: `incrementViewCount()`
  
  - `GET /api/community/workspaces/{workspaceId}/docs/{docId}/access`: 检查访问权限
    - 方法: `checkDocAccess()`
  
  - `GET /api/community/workspaces/{workspaceId}/docs/{docId}`: 获取社区文档内容
    - 方法: `getCommunityDoc()`
    - 功能: 转发到WorkspaceDocController并检查权限

#### 2.2 CommunityService
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/CommunityService.java`
- **功能**: 社区服务的接口定义
- **关键方法**:
  - `shareDocToCommunity()`: 分享文档到社区
  - `getCommunityDocs()`: 获取社区文档列表
  - `unshareDocFromCommunity()`: 取消社区分享
  - `updateCommunityPermission()`: 更新社区权限
  - `incrementViewCount()`: 增加浏览次数
  - `canUserViewCommunityDoc()`: 检查用户是否可以查看社区文档

#### 2.3 CommunityServiceImpl
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/impl/CommunityServiceImpl.java`
- **功能**: 社区服务的实现类

#### 2.4 CommunityDocumentServiceImpl
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/impl/CommunityDocumentServiceImpl.java`
- **功能**: 社区文档服务的实现类

### 3. 实体类

#### 3.1 CommunityDocument
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/entity/CommunityDocument.java`
- **功能**: 社区文档实体类

#### 3.2 ShareToCommunityRequest
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/dto/ShareToCommunityRequest.java`
- **功能**: 分享到社区的请求DTO

#### 3.3 CommunityDocDto
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/dto/CommunityDocDto.java`
- **功能**: 社区文档DTO

### 4. 权限相关

#### 4.1 PermissionServiceImpl
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/impl/PermissionServiceImpl.java`
- **功能**: 权限服务实现，处理文档权限检查

#### 4.2 DocPermission
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/enums/DocPermission.java`
- **功能**: 文档权限枚举

#### 4.3 CommunityPermission
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/enums/CommunityPermission.java`
- **功能**: 社区权限枚举

## 三、分享功能流程

### 1. 公开文档分享流程

1. **启用分享**:
   - 前端: `ShareInfo.enableShare()` → `ShareStore.enableSharePage()`
   - API: `PUT /api/workspaces/{workspaceId}/docs/{docId}/public`
   - 后端: `WorkspaceDocController.setDocPublic()`

2. **获取分享信息**:
   - 前端: `ShareInfo.revalidate()` → `ShareStore.getShareInfoByDocId()`
   - API: `HEAD /api/workspaces/{workspaceId}/docs/{docId}`
   - 后端: `WorkspaceDocController.getDoc()` (HEAD请求)
   - 响应头: `permission-mode`, `publish-mode`

3. **访问分享页面**:
   - 路由: `/share/{workspaceId}/{docId}`
   - 组件: `SharePage`
   - 功能: 匿名用户访问公开文档

### 2. 社区分享流程

1. **分享到社区**:
   - 前端: `ShareToCommunityModal` → `communityApi.shareDocToCommunity()`
   - API: `POST /api/community/workspaces/{workspaceId}/docs/{docId}/share`
   - 后端: `CommunityController.shareDocToCommunity()` → `CommunityService.shareDocToCommunity()`

2. **获取社区文档列表**:
   - 前端: `communityApi.getCommunityDocs()`
   - API: `GET /api/community/workspaces/{workspaceId}/docs`
   - 后端: `CommunityController.getCommunityDocs()`

3. **访问社区文档**:
   - API: `GET /api/community/workspaces/{workspaceId}/docs/{docId}`
   - 后端: `CommunityController.getCommunityDoc()` → 检查权限 → 转发到 `WorkspaceDocController.getDoc()`

## 四、关键API端点汇总

### 公开文档分享
- `PUT /api/workspaces/{workspaceId}/docs/{docId}/public` - 设置文档公开状态
- `HEAD /api/workspaces/{workspaceId}/docs/{docId}` - 获取文档权限信息
- `GET /api/workspaces/{workspaceId}/docs/{docId}` - 获取文档内容（公开访问）

### 社区分享
- `POST /api/community/workspaces/{workspaceId}/docs/{docId}/share` - 分享到社区
- `GET /api/community/workspaces/{workspaceId}/docs` - 获取社区文档列表
- `DELETE /api/community/workspaces/{workspaceId}/docs/{docId}/share` - 取消社区分享
- `PUT /api/community/workspaces/{workspaceId}/docs/{docId}/permission` - 更新社区权限
- `POST /api/community/workspaces/{workspaceId}/docs/{docId}/view` - 增加浏览次数
- `GET /api/community/workspaces/{workspaceId}/docs/{docId}/access` - 检查访问权限
- `GET /api/community/workspaces/{workspaceId}/docs/{docId}` - 获取社区文档内容

## 五、权限模式

### 1. 公开文档权限模式
- `private`: 私有（不公开）
- `append-only`: 仅追加模式（允许添加内容，但不可修改已有内容）
- `readonly`: 只读模式（默认公开模式）

### 2. 社区权限级别
- `PUBLIC`: 公开（所有工作空间成员可见）
- `COLLABORATOR`: 协作者（协作者及以上权限可见）
- `ADMIN`: 管理员（仅管理员和所有者可见）
- `CUSTOM`: 自定义（指定用户可见）

## 六、数据库表

### 1. CommunityDocument
- **位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/entity/CommunityDocument.java`
- **功能**: 存储社区分享的文档信息
- **字段**: docId, workspaceId, userId, permission, title, description, viewCount等

### 2. WorkspaceDoc
- **功能**: 存储工作空间文档，包含公开状态字段
- **字段**: isPublic, publicMode, publicPermission等

## 七、相关路由

### 前端路由
- `/share/{workspaceId}/{docId}` - 公开分享页面
- 分享菜单组件嵌入在文档详情页的头部菜单中

## 八、注意事项

1. **公开文档分享**和**社区分享**是两个不同的功能：
   - 公开文档分享：通过公开链接访问，支持匿名用户
   - 社区分享：分享到工作空间社区，需要工作空间成员权限

2. **权限检查**：
   - 公开文档通过响应头 `permission-mode` 和 `publish-mode` 传递权限信息
   - 社区文档通过 `CommunityService.canUserViewCommunityDoc()` 检查权限

3. **分享模式**：
   - 公开文档支持 `page` 和 `edgeless` 两种模式
   - 权限模式支持 `private`、`append-only`、`readonly`

4. **API调用**：
   - 前端通过 `ShareStore` 调用公开文档API
   - 前端通过 `CommunityService` 调用社区API
   - 后端统一通过 `CommunityController` 和 `WorkspaceDocController` 处理请求

