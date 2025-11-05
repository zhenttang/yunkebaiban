# 公开文档分享功能问题分析报告

## 问题概述

公开文档分享功能存在多个关键问题，导致功能无法正常工作。

## 一、关键问题分析

### 1. ❌ 路由配置错误（严重问题）

**位置**: `baibanfront/packages/frontend/core/src/desktop/router.tsx:58-61`

**问题**:
```typescript
{
  path: '/share/:workspaceId/:pageId',
  loader: ({ params }) => {
    return redirect(`/workspace/${params.workspaceId}/${params.pageId}`);
  },
},
```

**问题说明**:
- `/share/:workspaceId/:pageId` 路由被**重定向**到了 `/workspace/${workspaceId}/${pageId}`
- 这意味着分享页面**根本没有被正确路由**！
- 用户访问分享链接时，会被重定向到普通工作空间页面，而不是分享页面

**影响**:
- 分享链接无法正常访问
- 分享页面组件 (`SharePage`) 永远不会被渲染
- 匿名用户无法访问公开文档

**修复方案**:
应该将路由重定向改为实际渲染 `SharePage` 组件，或者移除重定向，让路由正常处理。

### 2. ❌ 分享链接生成错误

**位置**: `baibanfront/packages/frontend/core/src/components/hooks/yunke/use-share-url.ts:47`

**问题**:
```typescript
const url = new URL(`/workspace/${workspaceId}/${pageId}`, baseUrl);
```

**问题说明**:
- 生成的分享链接是 `/workspace/${workspaceId}/${pageId}`，而不是 `/share/${workspaceId}/${pageId}`
- 即使路由修复了，分享链接仍然指向错误路径

**修复方案**:
当文档是公开状态时，应该生成 `/share/${workspaceId}/${pageId}` 格式的链接。

### 3. ⚠️ setDocPublic 实现不完整

**位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/application/WorkspaceDocServiceImpl.java:458-473`

**问题**:
```java
public void setDocPublic(String docId, boolean isPublic) {
    // ...
    WorkspaceDoc current = doc.get();
    current.setPublic(isPublic);
    current.setUpdatedAt(Instant.now());
    // ❌ 没有设置 publicPermission 和 publicMode
    docRepository.save(current);
}
```

**问题说明**:
- `setDocPublic()` 方法只设置了 `isPublic` 字段
- 没有设置 `publicPermission`（read-only/append-only）和 `publicMode`（page/edgeless）
- 前端在设置 `append-only` 模式时，调用的是 `PUT /api/workspaces/{workspaceId}/docs/{docId}` 接口，但该接口可能没有正确处理

**影响**:
- 即使文档被设置为公开，`publicPermission` 和 `publicMode` 字段可能为 `null`
- 导致权限检查时无法正确识别文档的分享模式

### 4. ⚠️ 前端 enableSharePage 实现不完整

**位置**: `baibanfront/packages/frontend/core/src/modules/share-doc/stores/share.ts:60-98`

**问题**:
```typescript
async enableSharePage(
  workspaceId: string,
  pageId: string,
  docMode: PublicDocMode = 'page',
  signal?: AbortSignal
) {
  // 1) 设置公开
  await this.workspaceServerService.server.fetch(
    `/api/workspaces/${workspaceId}/docs/${pageId}/public`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: true }),
      signal,
    }
  );

  // 2) 如果希望仅追加，尝试设置公开权限（后端若未实现将忽略错误）
  if (docMode === 'append-only') {
    try {
      await this.workspaceServerService.server.fetch(
        `/api/workspaces/${workspaceId}/docs/${pageId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPublic: true, publicPermission: 'append-only' }),
          signal,
        }
      );
    } catch (e) {
      // 忽略，回退留在只读模式
      console.warn('设置AppendOnly失败，后端可能未实现该接口', e);
    }
  }
}
```

**问题说明**:
- 当 `docMode === 'append-only'` 时，尝试通过 `PUT /api/workspaces/{workspaceId}/docs/{docId}` 设置 `publicPermission`
- 但这个接口可能不支持设置 `publicPermission` 字段
- 错误被静默忽略，导致 `append-only` 模式无法设置

**检查后端接口**:
需要检查 `PUT /api/workspaces/{workspaceId}/docs/{docId}` 接口是否支持设置 `publicPermission` 字段。

### 5. ⚠️ HEAD 请求支持检查

**位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java:593`

**问题**:
- `getDoc()` 方法使用 `@GetMapping`，Spring 默认支持 HEAD 请求
- 但需要确认在 HEAD 请求时是否正确返回响应头 `permission-mode` 和 `publish-mode`

**检查点**:
- 前端在 `ShareStore.getShareInfoByDocId()` 中使用 HEAD 请求获取权限信息
- 如果后端不支持 HEAD 请求返回响应头，会回退到 GET 请求（但会下载文档内容，浪费资源）

### 6. ⚠️ 权限检查逻辑

**位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java:1602-1678`

**问题**:
```java
private DocPermissionInfo getDocPermissionInfo(String workspaceId, String docId, String userId) {
    // ...
    boolean isPublic = doc.getIsPublic() != null && doc.getIsPublic();
    
    if (isPublic) {
        // 检查 publicPermission
        if (doc.getPublicPermission() != null) {
            switch (doc.getPublicPermission()) {
                case "append-only":
                    permissionMode = "append-only";
                    break;
                case "read-only":
                default:
                    permissionMode = "read-only";
                    break;
            }
        } else {
            permissionMode = "read-only"; // 公开文档默认只读
        }
    } else {
        permissionMode = "private";
    }
    // ...
}
```

**问题说明**:
- 如果 `publicPermission` 为 `null`，默认返回 `read-only`
- 但前端在解析时，如果 `permissionMode` 为 `null`，会判断为 `private`（见 `share.ts:45`）

**前端解析逻辑**:
```typescript
const isPrivate = permissionMode === 'private' || permissionMode == null;
```

**潜在问题**:
- 如果后端返回 `permissionMode` 为 `null`，前端会错误地判断为私有
- 导致即使文档设置为公开，前端也无法正确识别

## 二、问题优先级

### 🔴 严重问题（必须修复）
1. **路由配置错误** - 分享页面无法访问
2. **分享链接生成错误** - 生成的链接指向错误路径

### 🟡 重要问题（应该修复）
3. **setDocPublic 实现不完整** - 无法设置分享模式
4. **enableSharePage 实现不完整** - append-only 模式无法设置

### 🟢 次要问题（需要验证）
5. **HEAD 请求支持** - 需要验证是否正确返回响应头
6. **权限检查逻辑** - 需要验证 null 值处理

## 三、修复建议

### 修复 1: 修复路由配置

**文件**: `baibanfront/packages/frontend/core/src/desktop/router.tsx`

**修改**:
```typescript
{
  path: '/share/:workspaceId/:pageId',
  lazy: () => import('./pages/workspace/share/share-page'),
  // 或者直接使用组件
  element: <SharePage />,
},
```

### 修复 2: 修复分享链接生成

**文件**: `baibanfront/packages/frontend/core/src/components/hooks/yunke/use-share-url.ts`

**修改**:
```typescript
export const generateUrl = ({
  baseUrl,
  workspaceId,
  pageId,
  blockIds,
  elementIds,
  mode,
  xywh,
  isPublic = false, // 新增参数
}: UseSharingUrl & { baseUrl: string; isPublic?: boolean }) => {
  try {
    // 如果是公开文档，使用 /share 路径
    const path = isPublic 
      ? `/share/${workspaceId}/${pageId}`
      : `/workspace/${workspaceId}/${pageId}`;
    const url = new URL(path, baseUrl);
    const search = toDocSearchParams({ mode, blockIds, elementIds, xywh });
    if (search?.size) url.search = search.toString();
    return url.toString();
  } catch (err) {
    console.error(err);
    return undefined;
  }
};
```

### 修复 3: 完善 setDocPublic 接口

**文件**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java`

**修改**:
```java
public record SetPublicRequest(
    boolean isPublic,
    String publicPermission, // 新增：read-only/append-only
    String publicMode        // 新增：page/edgeless
) {}

@PutMapping("/api/workspaces/{workspaceId}/docs/{docId}/public")
public ResponseEntity<Map<String, Object>> setDocPublic(
        @PathVariable String workspaceId,
        @PathVariable String docId,
        @RequestBody SetPublicRequest request,
        Authentication authentication) {
    // ...
    docService.setDocPublic(
        docId, 
        request.isPublic(),
        request.publicPermission(), // 新增
        request.publicMode()        // 新增
    );
    // ...
}
```

**文件**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/application/WorkspaceDocServiceImpl.java`

**修改**:
```java
public void setDocPublic(
    String docId, 
    boolean isPublic,
    String publicPermission, // 新增
    String publicMode        // 新增
) {
    // ...
    WorkspaceDoc current = doc.get();
    current.setPublic(isPublic);
    if (publicPermission != null) {
        current.setPublicPermission(publicPermission);
    }
    if (publicMode != null) {
        current.setPublicMode(publicMode);
    }
    current.setUpdatedAt(Instant.now());
    docRepository.save(current);
}
```

### 修复 4: 完善前端 enableSharePage

**文件**: `baibanfront/packages/frontend/core/src/modules/share-doc/stores/share.ts`

**修改**:
```typescript
async enableSharePage(
  workspaceId: string,
  pageId: string,
  docMode: PublicDocMode = 'page',
  signal?: AbortSignal
) {
  if (!this.workspaceServerService.server) {
    throw new Error('无服务器');
  }
  
  // 统一通过一个接口设置所有字段
  await this.workspaceServerService.server.fetch(
    `/api/workspaces/${workspaceId}/docs/${pageId}/public`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isPublic: true,
        publicPermission: docMode === 'append-only' ? 'append-only' : 'read-only',
        publicMode: docMode === 'edgeless' ? 'edgeless' : 'page',
      }),
      signal,
    }
  );
}
```

## 四、测试建议

### 测试步骤

1. **修复路由后测试**:
   - 设置文档为公开
   - 复制分享链接
   - 在匿名/无痕窗口打开链接
   - 验证是否能正常访问分享页面

2. **测试分享模式**:
   - 设置为只读模式，验证权限
   - 设置为 append-only 模式，验证权限
   - 验证 HEAD 请求是否正确返回响应头

3. **测试权限检查**:
   - 公开文档访问权限检查
   - 私有文档访问权限检查
   - 匿名用户访问权限检查

## 五、相关文件清单

### 前端文件
- `baibanfront/packages/frontend/core/src/desktop/router.tsx` - 路由配置
- `baibanfront/packages/frontend/core/src/components/hooks/yunke/use-share-url.ts` - 分享链接生成
- `baibanfront/packages/frontend/core/src/modules/share-doc/stores/share.ts` - 分享存储层
- `baibanfront/packages/frontend/core/src/modules/share-doc/entities/share-info.ts` - 分享信息实体
- `baibanfront/packages/frontend/core/src/desktop/pages/workspace/share/share-page.tsx` - 分享页面组件

### 后端文件
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java` - 文档控制器
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/application/WorkspaceDocServiceImpl.java` - 文档服务实现
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/WorkspaceDocService.java` - 文档服务接口
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/entity/WorkspaceDoc.java` - 文档实体

## 六、总结

公开文档分享功能的主要问题集中在：
1. **路由配置错误** - 导致分享页面无法访问（最严重）
2. **分享链接生成错误** - 链接指向错误路径
3. **后端实现不完整** - 无法设置分享模式和权限
4. **前端实现不完整** - append-only 模式设置失败

修复这些问题后，公开文档分享功能应该能够正常工作。

