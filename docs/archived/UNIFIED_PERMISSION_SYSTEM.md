# 统一权限系统升级文档

## 概述

本次升级统一了权限检查系统，提供了统一的权限检查框架，包括：

1. **统一的工作空间权限检查注解** (`@RequireWorkspaceRole`)
2. **统一的文档权限检查注解** (`@RequireDocumentAccess`)
3. **统一的权限检查服务** (`UnifiedPermissionService`)
4. **统一的权限工具类** (`PermissionUtil`)
5. **AOP切面自动权限检查** (`PermissionCheckAspect`)

## 核心组件

### 1. 权限检查注解

#### `@RequireWorkspaceRole`

用于检查用户在工作空间中的权限。

```java
@RequireWorkspaceRole(WorkspaceRole.ADMIN)
@GetMapping("/workspaces/{workspaceId}/docs")
public ResponseEntity<?> getDocs(@PathVariable String workspaceId) {
    // 自动检查用户是否有 ADMIN 权限
    // 如果没有权限，AOP 会自动返回 403 错误
}
```

**参数**：
- `value`: 所需的最低角色（默认 `COLLABORATOR`）
- `workspaceIdParam`: 工作空间ID参数名（默认 `workspaceId`）
- `allowPublic`: 是否允许公开访问（默认 `false`）

#### `@RequireDocumentAccess`

用于检查用户对文档的访问权限。

```java
@RequireDocumentAccess(allowPublic = true, allowCommunity = true)
@GetMapping("/workspaces/{workspaceId}/docs/{docId}")
public ResponseEntity<?> getDoc(
    @PathVariable String workspaceId,
    @PathVariable String docId
) {
    // 自动检查用户是否有文档访问权限
    // 支持公开文档和社区文档访问
}
```

**参数**：
- `docIdParam`: 文档ID参数名（默认 `docId`）
- `workspaceIdParam`: 工作空间ID参数名（默认 `workspaceId`）
- `allowPublic`: 是否允许公开访问（默认 `true`）
- `allowCommunity`: 是否允许社区文档访问（默认 `true`）

### 2. 统一权限检查服务

#### `UnifiedPermissionService`

提供统一的权限检查接口。

```java
@Service
public class MyService {
    @Autowired
    private UnifiedPermissionService permissionService;
    
    public Mono<PermissionCheckResult> checkPermission(String workspaceId, String userId) {
        return permissionService.checkWorkspacePermission(
            workspaceId, 
            userId, 
            WorkspaceRole.ADMIN
        );
    }
}
```

**主要方法**：
- `checkWorkspacePermission()`: 检查工作空间权限
- `checkDocumentAccess()`: 检查文档访问权限
- `checkCommunityDocumentAccess()`: 检查社区文档访问权限

### 3. 统一权限工具类

#### `PermissionUtil`

提供统一的权限查询方法。

```java
@Service
public class MyService {
    @Autowired
    private PermissionUtil permissionUtil;
    
    public void checkAdmin(String userId) {
        if (permissionUtil.isAdmin(userId)) {
            // 用户是管理员
        }
        
        List<String> features = permissionUtil.getUserFeatures(userId);
        // 获取用户功能列表
    }
}
```

**主要方法**：
- `getUserFeatures()`: 获取用户功能列表（统一入口）
- `isAdmin()`: 检查是否是管理员
- `isSuperAdmin()`: 检查是否是超级管理员

## 使用示例

### 示例1：工作空间权限检查

**旧方式**（需要手动检查）：
```java
@GetMapping("/workspaces/{workspaceId}/docs")
public Mono<ResponseEntity<?>> getDocs(@PathVariable String workspaceId) {
    String userId = getCurrentUserId();
    
    return workspaceManagementService.getUserWorkspaceRole(workspaceId, userId)
        .flatMap(role -> {
            if (role != WorkspaceRole.ADMIN && role != WorkspaceRole.OWNER) {
                return Mono.just(ResponseEntity.status(403).build());
            }
            // 业务逻辑
        });
}
```

**新方式**（使用注解，自动检查）：
```java
@RequireWorkspaceRole(WorkspaceRole.ADMIN)
@GetMapping("/workspaces/{workspaceId}/docs")
public Mono<ResponseEntity<?>> getDocs(@PathVariable String workspaceId) {
    // AOP 自动检查权限，无需手动检查
    // 业务逻辑
}
```

### 示例2：文档权限检查

**旧方式**（需要手动检查）：
```java
@GetMapping("/workspaces/{workspaceId}/docs/{docId}")
public ResponseEntity<?> getDoc(
    @PathVariable String workspaceId,
    @PathVariable String docId
) {
    String userId = getCurrentUserId();
    
    PermissionCheckResult result = communityService
        .checkUserViewCommunityDocPermission(docId, workspaceId, userId)
        .block();
    
    if (!result.isAllowed()) {
        return ResponseEntity.status(403).build();
    }
    // 业务逻辑
}
```

**新方式**（使用注解，自动检查）：
```java
@RequireDocumentAccess(allowPublic = true, allowCommunity = true)
@GetMapping("/workspaces/{workspaceId}/docs/{docId}")
public ResponseEntity<?> getDoc(
    @PathVariable String workspaceId,
    @PathVariable String docId
) {
    // AOP 自动检查权限，无需手动检查
    // 业务逻辑
}
```

### 示例3：统一获取用户功能

**旧方式**（多个入口，可能不一致）：
```java
// 方式1
List<String> features = userService.getUserFeatures(userId);

// 方式2
List<String> features = userRoleService.getUserFeatures(userId);

// 方式3
List<String> features = featureService.getUserFeatures(userId);
```

**新方式**（统一入口）：
```java
@Autowired
private PermissionUtil permissionUtil;

List<String> features = permissionUtil.getUserFeatures(userId);
// 统一入口，自动选择最佳实现
```

## 迁移指南

### 步骤1：更新依赖注入

在需要使用权限检查的 Controller 或 Service 中注入 `PermissionUtil`：

```java
@RestController
@RequiredArgsConstructor
public class MyController {
    private final PermissionUtil permissionUtil;
    private final UnifiedPermissionService permissionService;
}
```

### 步骤2：替换手动权限检查

将手动权限检查替换为注解：

**替换前**：
```java
@GetMapping("/workspaces/{workspaceId}/docs")
public Mono<ResponseEntity<?>> getDocs(@PathVariable String workspaceId) {
    String userId = getCurrentUserId();
    return workspaceManagementService.getUserWorkspaceRole(workspaceId, userId)
        .flatMap(role -> {
            if (role != WorkspaceRole.ADMIN) {
                return Mono.just(ResponseEntity.status(403).build());
            }
            // 业务逻辑
        });
}
```

**替换后**：
```java
@RequireWorkspaceRole(WorkspaceRole.ADMIN)
@GetMapping("/workspaces/{workspaceId}/docs")
public Mono<ResponseEntity<?>> getDocs(@PathVariable String workspaceId) {
    // 业务逻辑
}
```

### 步骤3：统一使用 PermissionUtil

将所有 `getUserFeatures()` 调用替换为 `PermissionUtil.getUserFeatures()`：

**替换前**：
```java
List<String> features = userService.getUserFeatures(userId);
```

**替换后**：
```java
List<String> features = permissionUtil.getUserFeatures(userId);
```

## 权限检查流程

### 工作空间权限检查流程

```
请求到达 Controller
    ↓
AOP 拦截 @RequireWorkspaceRole 注解
    ↓
提取 workspaceId 和 userId
    ↓
调用 UnifiedPermissionService.checkWorkspacePermission()
    ↓
查询用户在工作空间中的角色
    ↓
检查角色是否满足要求
    ↓
允许访问 → 继续执行方法
拒绝访问 → 返回 403 错误
```

### 文档权限检查流程

```
请求到达 Controller
    ↓
AOP 拦截 @RequireDocumentAccess 注解
    ↓
提取 workspaceId、docId 和 userId
    ↓
调用 UnifiedPermissionService.checkDocumentAccess()
    ↓
检查工作空间权限
    ↓
检查文档是否公开（如果 allowPublic = true）
    ↓
检查是否是社区文档（如果 allowCommunity = true）
    ↓
允许访问 → 继续执行方法
拒绝访问 → 返回 403 错误
```

## 优势

### 1. 统一性
- ✅ 所有权限检查都通过统一的接口
- ✅ 统一的错误码和错误响应格式
- ✅ 统一的权限检查逻辑

### 2. 简洁性
- ✅ 使用注解，代码更简洁
- ✅ 无需手动编写权限检查代码
- ✅ AOP 自动处理权限检查

### 3. 可维护性
- ✅ 权限检查逻辑集中管理
- ✅ 修改权限检查逻辑只需修改一处
- ✅ 易于测试和调试

### 4. 可扩展性
- ✅ 易于添加新的权限检查类型
- ✅ 易于扩展权限检查逻辑
- ✅ 支持自定义权限检查规则

## 注意事项

1. **AOP 切面优先级**
   - AOP 切面在事务切面之前执行（`@Order(1)`）
   - 确保权限检查在业务逻辑之前执行

2. **Mono 返回类型支持**
   - AOP 切面目前主要支持同步方法
   - 对于 Mono 返回类型，需要在方法内部手动调用权限检查服务

3. **参数提取**
   - AOP 会自动从方法参数或路径变量中提取参数
   - 确保参数名与注解配置一致

4. **错误响应格式**
   - 权限检查失败时，AOP 会返回统一的错误响应格式
   - 使用 `ApiResponse` 和 `ErrorCode` 统一错误码

## 后续优化

1. **支持 Mono 返回类型**
   - 优化 AOP 切面以支持 Mono 返回类型
   - 支持响应式权限检查

2. **缓存优化**
   - 添加权限检查结果缓存
   - 减少数据库查询次数

3. **权限检查日志**
   - 添加详细的权限检查日志
   - 便于问题排查和审计

4. **权限检查性能优化**
   - 优化权限检查查询性能
   - 支持批量权限检查

