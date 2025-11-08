# 403 错误分析：正常行为 vs 异常

## 分析结论

经过代码分析，**这些 403 错误是正常的权限检查行为，不是异常**。

### 为什么是正常行为？

1. **前端已正确处理**
   - 两个接口的前端代码都捕获了 403 错误
   - 错误被静默处理，不影响用户体验
   - 返回合理的默认状态（未分享/未公开）

2. **后端权限检查符合预期**
   - 403 是 HTTP 标准的状态码，表示"禁止访问"
   - 这是安全机制的正常表现
   - 确保只有有权限的用户才能访问资源

3. **业务逻辑正确**
   - 文档未分享到社区 → 返回 403（正常）
   - 文档未公开 → 返回 403（正常）
   - 用户权限不足 → 返回 403（正常）

## 错误类型分类

### 1. 社区文档接口 403

**接口**：`GET /api/community/workspaces/{workspaceId}/docs/{docId}`

**可能的原因**：
- ✅ **文档未分享到社区**（最常见，正常行为）
- ✅ **用户权限不足**（正常行为）
- ✅ **用户未认证**（正常行为）

**前端处理**：
```typescript
// community-share-button.tsx
catch (error) {
  console.warn('获取社区分享状态失败', error);
  setIsShared(false); // ✅ 静默处理，设置为未分享状态
}
```

**判断**：✅ **正常行为** - 文档可能没有分享到社区，这是预期的业务场景

### 2. 文档分享接口 403

**接口**：`GET /api/workspaces/{workspaceId}/docs/{docId}`

**可能的原因**：
- ✅ **文档未公开**（最常见，正常行为）
- ✅ **用户权限不足**（正常行为）
- ✅ **文档不存在**（正常行为）

**前端处理**：
```typescript
// share.ts
if (res.status === 403 || res.status === 404) {
  return {
    public: false, // ✅ 静默处理，返回未公开状态
    mode: 'page',
    defaultRole: DocRole.None,
  };
}
```

**判断**：✅ **正常行为** - 文档可能不是公开的，这是预期的业务场景

## 统一错误码方案

### 后端错误码枚举

已创建 `ErrorCode` 枚举，包含以下权限相关错误码：

```java
// 权限相关错误 (403)
FORBIDDEN                          // 访问被拒绝 - 通用权限错误
COMMUNITY_DOC_ACCESS_DENIED       // 社区文档访问权限不足
DOC_NOT_SHARED_TO_COMMUNITY        // 文档未分享到社区
DOC_ACCESS_DENIED                 // 文档访问权限不足
DOC_NOT_PUBLIC                    // 文档未公开
WORKSPACE_ACCESS_DENIED           // 工作空间访问权限不足
```

### 统一响应格式

**更新后的 ApiResponse**：
```json
{
  "success": false,
  "code": "COMMUNITY_DOC_ACCESS_DENIED",
  "message": "您没有权限访问此社区文档",
  "data": null,
  "timestamp": 1234567890
}
```

### 前端统一处理

前端可以根据 `code` 字段进行统一处理：

```typescript
// 示例：统一错误处理
if (response.code === 'COMMUNITY_DOC_ACCESS_DENIED') {
  // 文档未分享到社区，静默处理
  setIsShared(false);
} else if (response.code === 'DOC_NOT_PUBLIC') {
  // 文档未公开，静默处理
  return { public: false, ... };
} else if (response.code === 'UNAUTHORIZED') {
  // 未认证，需要登录
  redirectToLogin();
}
```

## 改进建议

### 1. 区分不同的权限失败原因

**当前问题**：`canUserViewCommunityDoc` 只返回 `true/false`，无法区分失败原因

**改进方案**：
```java
// 返回更详细的信息
public Mono<PermissionCheckResult> canUserViewCommunityDoc(...) {
    if (docOpt.isEmpty()) {
        return Mono.just(PermissionCheckResult.notShared());
    }
    if (!canView) {
        return Mono.just(PermissionCheckResult.insufficientPermission());
    }
    return Mono.just(PermissionCheckResult.allowed());
}
```

### 2. 使用更合适的 HTTP 状态码

**建议**：
- 文档未分享到社区 → 返回 **404**（资源不存在）而不是 403
- 文档未公开 → 返回 **403**（权限不足）✅ 正确
- 用户未认证 → 返回 **401**（未认证）而不是 403

### 3. 前端统一错误处理

创建统一的错误处理工具：

```typescript
// error-handler.ts
export function handleApiError(error: ApiError) {
  switch (error.code) {
    case 'COMMUNITY_DOC_ACCESS_DENIED':
    case 'DOC_NOT_SHARED_TO_COMMUNITY':
      // 静默处理，不显示错误提示
      return { handled: true, silent: true };
    
    case 'UNAUTHORIZED':
    case 'AUTH_EXPIRED':
      // 需要登录
      redirectToLogin();
      return { handled: true, silent: false };
    
    default:
      // 显示错误提示
      showErrorToast(error.message);
      return { handled: true, silent: false };
  }
}
```

## 总结

### ✅ 这些 403 是正常行为

1. **不是 bug**：这是权限检查的正常结果
2. **前端已处理**：错误被静默处理，不影响用户体验
3. **符合安全规范**：确保只有有权限的用户才能访问资源

### ✅ 已实施的改进

1. **统一错误码枚举** (`ErrorCode.java`)
   - 包含所有权限相关的错误码
   - 包含认证、资源不存在等错误码

2. **统一响应格式** (`ApiResponse.java`)
   - 添加 `code` 字段
   - 提供便捷的错误响应方法

3. **权限检查结果类** (`PermissionCheckResult.java`)
   - 区分不同的权限失败原因
   - 返回对应的错误码和原因描述

4. **后端代码更新**
   - `CommunityController` 使用统一错误码
   - `CommunityServiceImpl` 区分不同的失败原因
   - 返回精确的错误码（`DOC_NOT_SHARED_TO_COMMUNITY` vs `COMMUNITY_DOC_ACCESS_DENIED`）

5. **前端代码更新**
   - 解析响应中的错误码
   - 根据错误码静默处理权限错误
   - 减少不必要的日志输出

### 📝 后续优化建议

1. **使用更合适的 HTTP 状态码**
   - 文档未分享到社区 → 返回 **404**（资源不存在）而不是 403
   - 文档未公开 → 返回 **403**（权限不足）✅ 正确
   - 用户未认证 → 返回 **401**（未认证）而不是 403

2. **前端统一错误处理工具**
   - 创建统一的错误处理函数
   - 根据错误码自动决定是否显示错误提示

3. **扩展错误码**
   - 根据实际需求添加更多错误码
   - 覆盖所有业务场景
