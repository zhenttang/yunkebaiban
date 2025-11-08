# 403 错误统一错误码实现总结

## 分析结论

**这些 403 错误是正常的权限检查行为，不是异常。**

### 为什么是正常行为？

1. **前端已正确处理**
   - 错误被静默处理，不影响用户体验
   - 返回合理的默认状态（未分享/未公开）

2. **后端权限检查符合预期**
   - 403 是 HTTP 标准状态码，表示"禁止访问"
   - 这是安全机制的正常表现

3. **业务逻辑正确**
   - 文档未分享到社区 → 返回 403（正常）
   - 文档未公开 → 返回 403（正常）
   - 用户权限不足 → 返回 403（正常）

## 已实施的统一错误码方案

### 1. 后端错误码枚举 (`ErrorCode.java`)

创建了统一的错误码枚举，包含：

```java
// 权限相关错误 (403)
FORBIDDEN                          // 访问被拒绝 - 通用权限错误
COMMUNITY_DOC_ACCESS_DENIED       // 社区文档访问权限不足
DOC_NOT_SHARED_TO_COMMUNITY        // 文档未分享到社区
DOC_ACCESS_DENIED                 // 文档访问权限不足
DOC_NOT_PUBLIC                    // 文档未公开
WORKSPACE_ACCESS_DENIED           // 工作空间访问权限不足

// 认证相关错误 (401)
UNAUTHORIZED                       // 未认证
AUTH_EXPIRED                      // 认证过期
AUTH_FAILED                       // 认证失败

// 资源不存在 (404)
DOC_NOT_FOUND                     // 文档不存在
WORKSPACE_NOT_FOUND              // 工作空间不存在
USER_NOT_FOUND                   // 用户不存在

// 请求错误 (400)
BAD_REQUEST                       // 请求参数错误
INVALID_PERMISSION               // 无效的权限值

// 服务器错误 (500)
INTERNAL_ERROR                    // 服务器内部错误
SERVICE_UNAVAILABLE              // 服务不可用
```

### 2. 统一响应格式 (`ApiResponse.java`)

更新了 `ApiResponse` 类，添加 `code` 字段：

```java
{
  "success": false,
  "code": "COMMUNITY_DOC_ACCESS_DENIED",
  "message": "您没有权限访问此社区文档",
  "data": null,
  "timestamp": 1234567890
}
```

### 3. 权限检查结果类 (`PermissionCheckResult.java`)

创建了 `PermissionCheckResult` 类，用于区分不同的权限失败原因：

```java
// 允许访问
PermissionCheckResult.allowed()

// 文档未分享到社区
PermissionCheckResult.docNotSharedToCommunity()

// 权限不足
PermissionCheckResult.insufficientPermission()

// 用户未认证
PermissionCheckResult.unauthorized()
```

### 4. 后端代码更新

#### `CommunityController.java`
- 使用 `checkUserViewCommunityDocPermission()` 获取详细的权限检查结果
- 根据失败原因返回对应的错误码
- 使用统一的 `ApiResponse.error()` 方法

#### `CommunityServiceImpl.java`
- 新增 `checkUserViewCommunityDocPermission()` 方法
- 区分不同的失败原因：
  - 文档未分享到社区 → `DOC_NOT_SHARED_TO_COMMUNITY`
  - 权限不足 → `COMMUNITY_DOC_ACCESS_DENIED`
  - 用户未认证 → `UNAUTHORIZED`

### 5. 前端代码更新

#### `api.ts` (社区 API)
- 解析响应中的 `code` 字段
- 将错误码附加到错误对象上

#### `community-share-button.tsx`
- 根据错误码判断是否为权限错误
- 权限错误静默处理，不输出警告日志

#### `share.ts` (分享存储)
- 解析 403 响应的错误码
- 权限错误静默处理，减少日志噪音

## 错误码使用示例

### 后端返回错误响应

```java
// 文档未分享到社区
ApiResponse.error(ErrorCode.DOC_NOT_SHARED_TO_COMMUNITY)

// 权限不足
ApiResponse.error(ErrorCode.COMMUNITY_DOC_ACCESS_DENIED)

// 用户未认证
ApiResponse.error(ErrorCode.UNAUTHORIZED)
```

### 前端处理错误

```typescript
try {
  const response = await getCommunityDocStatus(workspaceId, docId);
} catch (error) {
  const errorCode = (error as any)?.code;
  
  // 权限错误静默处理
  if (errorCode === 'DOC_NOT_SHARED_TO_COMMUNITY' || 
      errorCode === 'COMMUNITY_DOC_ACCESS_DENIED') {
    setIsShared(false); // 静默处理
  } else {
    console.warn('获取社区分享状态失败', error); // 其他错误才记录
  }
}
```

## 改进效果

### 1. 统一的错误码
- ✅ 所有权限错误都有明确的错误码
- ✅ 前端可以根据错误码进行统一处理

### 2. 精确的错误信息
- ✅ 区分"文档未分享"和"权限不足"
- ✅ 前端可以针对不同错误码采取不同策略

### 3. 减少日志噪音
- ✅ 权限错误静默处理，不输出警告日志
- ✅ 只有真正的错误才会记录日志

### 4. 更好的错误处理
- ✅ 前端可以根据错误码决定是否显示错误提示
- ✅ 统一的错误处理逻辑

## 相关文件

### 后端
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/common/ErrorCode.java` (新建)
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/common/ApiResponse.java` (更新)
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/common/PermissionCheckResult.java` (新建)
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/controller/CommunityController.java` (更新)
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/CommunityService.java` (更新)
- `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/impl/CommunityServiceImpl.java` (更新)

### 前端
- `baibanfront/packages/frontend/core/src/desktop/pages/workspace/community/api.ts` (更新)
- `baibanfront/packages/frontend/core/src/desktop/pages/workspace/detail-page/community-share-button.tsx` (更新)
- `baibanfront/packages/frontend/core/src/modules/share-doc/stores/share.ts` (更新)

## 后续建议

1. **扩展错误码**：根据实际需求添加更多错误码
2. **统一错误处理**：创建前端统一错误处理工具函数
3. **HTTP 状态码优化**：考虑使用 404 表示资源不存在，401 表示未认证

