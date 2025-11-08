# 完整权限体系分析报告

## 1. 认证流程分析

### 1.1 登录流程

#### 前端登录流程

**入口**：`AuthService.signInWithCode()` / `AuthService.signInPassword()` / `AuthService.signInMagicLink()`

**流程**：
1. 用户输入凭据（邮箱+验证码/密码/魔法链接）
2. `AuthService` 调用 `AuthStore.signInWithCode()` 等方法
3. `AuthStore` 调用 `AuthProvider.signInWithCode()` 等方法
4. `AuthProvider` 发送 HTTP 请求到后端 `/api/auth/sign-in-with-code` 等接口
5. 后端返回 JWT token 和用户信息
6. 前端存储 token：
   - `AuthStore.setStoredTokens(token, refreshToken)`
   - 存储到 `GlobalState`（核心模块）
   - 同时存储到 `localStorage`（兼容管理员模块）

**Token 存储位置**：
```typescript
// baibanfront/packages/frontend/core/src/modules/cloud/stores/auth.ts
setStoredTokens(token: string, refreshToken: string) {
  // 存储到GlobalState（核心模块）
  this.globalState.set(`${this.serverService.server.id}-auth-token`, token);
  this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, refreshToken);
  
  // 同时存储到localStorage（兼容管理员模块）
  localStorage.setItem('yunke-admin-token', token);
  localStorage.setItem('yunke-admin-refresh-token', refreshToken);
}
```

#### 后端登录流程

**入口**：`AuthController.signInWithCode()` / `AuthController.signIn()` / `AuthController.signInWithMagicLink()`

**流程**：
1. 接收登录请求
2. **登录保护检查**（仅验证码登录）：
   - `LoginProtectionService.checkLoginAllowed()` - 检查是否允许登录
   - 检查账号是否被锁定
   - 检查是否需要验证码
3. **验证凭据**：
   - 验证码登录：`AuthService.signInWithVerificationCode()`
   - 密码登录：`AuthService.signIn()`
   - 魔法链接登录：`AuthService.signInWithMagicLink()`
4. **生成 JWT Token**：
   - `AuthService.generateJwtToken(userId)` - 生成访问令牌（7天有效期）
   - `AuthService.generateRefreshToken(userId)` - 生成刷新令牌（30天有效期）
5. **返回响应**：
   - 用户信息
   - Access Token
   - Refresh Token
   - 过期时间

**JWT Token 生成**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/util/JwtUtil.java
public String generateAccessToken(String userId) {
    Algorithm algorithm = Algorithm.HMAC256(jwtConfig.getSecret());
    String jti = UUID.randomUUID().toString();
    
    return JWT.create()
        .withIssuer(jwtConfig.getIssuer())
        .withSubject(userId)
        .withJWTId(jti)
        .withIssuedAt(new Date())
        .withExpiresAt(new Date(System.currentTimeMillis() + jwtConfig.getExpiration()))
        .withClaim("type", "access")
        .sign(algorithm);
}
```

### 1.2 Token 验证流程

#### 前端 Token 使用

**请求拦截**：`FetchService.fetch()`

**流程**：
1. 从存储中获取 token：`AuthStore.getStoredToken()`
2. 将 token 添加到请求头：`Authorization: Bearer ${token}`
3. 发送请求

**代码位置**：
```typescript
// baibanfront/packages/frontend/core/src/modules/cloud/services/fetch.ts
// Token 在请求时自动添加到 Authorization 头
```

#### 后端 Token 验证

**入口**：`JwtAuthenticationFilter.doFilterInternal()`

**流程**：
1. **跳过不需要认证的路径**：
   - `/api/auth/**` - 认证接口
   - `/api/health/**` - 健康检查
   - `/api/copilot/**` - Copilot API（临时开放）
   - `/static/**`, `/public/**` - 静态资源
2. **提取 Token**：
   - 从 `Authorization` 头提取：`Bearer ${token}`
   - 如果失败，尝试从 Cookie 提取（兼容旧系统）
3. **验证 Token**：
   - `JwtUtil.validateAccessToken(token)` - 验证访问令牌
   - 检查黑名单：`JwtBlacklistService.isBlacklisted(jti)`
4. **加载用户信息**：
   - `AuthService.findUserById(userId)` - 从数据库加载用户
   - `RoleService.getUserAuthorities(userId)` - 获取用户权限
5. **设置认证上下文**：
   - 创建 `AffineUserDetails`（包含用户信息和权限）
   - 创建 `UsernamePasswordAuthenticationToken`
   - 设置到 `SecurityContextHolder`

**代码位置**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/security/JwtAuthenticationFilter.java
if (userId != null && !hasExistingAuth) {
    Optional<User> userOpt = authService.findUserById(userId);
    if (userOpt.isPresent()) {
        User user = userOpt.get();
        List<GrantedAuthority> authorities = roleService.getUserAuthorities(userId);
        AffineUserDetails userDetails = new AffineUserDetails(user, authorities);
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
            userDetails, null, userDetails.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authToken);
    }
}
```

## 2. 权限体系架构

### 2.1 系统级权限（全局角色）

**角色定义**：
- `SUPER_ADMIN` - 超级管理员（所有权限，包括角色管理）
- `ADMIN` - 普通管理员（访问 admin 接口，无法管理角色）
- `MODERATOR` - 版主（论坛管理权限）
- `USER` - 普通用户（默认角色）

**权限检查**：
- **注解方式**：`@PreAuthorize("hasRole('ADMIN')")`
- **配置方式**：`SecurityConfig.filterChain()` - URL 路径权限配置

**代码位置**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/config/SecurityConfig.java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    // ...
)
```

### 2.2 工作空间级权限

**角色定义**：
- `OWNER` - 工作空间所有者（所有权限）
- `ADMIN` - 工作空间管理员（管理权限）
- `COLLABORATOR` - 协作者（编辑权限）
- `EXTERNAL` - 外部用户（只读权限）

**权限检查**：
- **服务层检查**：`WorkspaceManagementService.getUserWorkspaceRole(workspaceId, userId)`
- **业务逻辑检查**：在 Controller 或 Service 中手动检查

**代码位置**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/WorkspaceManagementService.java
Mono<WorkspaceRole> getUserWorkspaceRole(String workspaceId, String userId);
```

### 2.3 文档级权限

**权限类型**：
- `PUBLIC` - 公开（所有人可查看）
- `COLLABORATOR` - 协作者（工作空间协作者可查看）
- `ADMIN` - 管理员（工作空间管理员可查看）
- `CUSTOM` - 自定义（特定用户可查看）

**权限检查**：
- **社区文档权限**：`CommunityService.checkUserViewCommunityDocPermission()`
- **文档分享权限**：`WorkspaceDocController.getDoc()` - 检查文档是否公开

**代码位置**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/service/impl/CommunityServiceImpl.java
public Mono<PermissionCheckResult> checkUserViewCommunityDocPermission(
    String docId, String workspaceId, String userId) {
    // 检查用户是否认证
    if (userId == null || userId.isEmpty()) {
        return Mono.just(PermissionCheckResult.unauthorized());
    }
    
    // 检查工作空间角色
    return workspaceManagementService.getUserWorkspaceRole(workspaceId, userId)
        .flatMap(role -> {
            // 检查文档是否分享到社区
            Optional<WorkspaceDoc> docOpt = communityDocRepository.findCommunityDoc(docId, workspaceId);
            if (docOpt.isEmpty()) {
                return Mono.just(PermissionCheckResult.docNotSharedToCommunity());
            }
            
            // 检查用户角色是否有权限查看文档权限级别
            List<CommunityPermission> visiblePermissions = getUserVisiblePermissions(role.toString());
            boolean canView = visiblePermissions.contains(doc.getCommunityPermission());
            
            if (canView) {
                return Mono.just(PermissionCheckResult.allowed());
            } else {
                return Mono.just(PermissionCheckResult.insufficientPermission());
            }
        });
}
```

## 3. 权限检查点分析

### 3.1 前端权限检查

#### Token 存储和获取
- ✅ **正确**：Token 存储在 `GlobalState` 和 `localStorage`（双重存储）
- ✅ **正确**：Token 自动添加到请求头 `Authorization: Bearer ${token}`
- ⚠️ **潜在问题**：Token 存储在 `localStorage`，存在 XSS 风险

#### 会话验证
- ✅ **正确**：`AuthSession.revalidate()` - 定期验证会话
- ✅ **正确**：Token 过期时自动清除本地存储

**代码位置**：
```typescript
// baibanfront/packages/frontend/core/src/modules/cloud/stores/auth.ts
async fetchSession() {
  const token = this.getStoredToken();
  if (!token) {
    return { user: null };
  }
  
  const res = await this.fetchService.fetch('/api/auth/session', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (res.status === 401) {
    this.clearStoredTokens();
    return { user: null };
  }
}
```

### 3.2 后端权限检查

#### URL 路径权限配置

**当前配置**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/config/SecurityConfig.java
.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/auth/**").permitAll()           // ✅ 认证接口公开
    .requestMatchers("/api/health/**").permitAll()         // ✅ 健康检查公开
    .requestMatchers("/api/worker/**").permitAll()         // ✅ Worker接口公开
    .requestMatchers("/api/admin/**").hasRole("ADMIN")     // ✅ Admin接口需要ADMIN角色
    .requestMatchers("/api/workspaces/**").permitAll()     // ⚠️ 临时开放，需要修复
    .requestMatchers("/api/copilot/**").permitAll()        // ⚠️ 临时开放，需要修复
    .requestMatchers("/api/users/me/**").permitAll()       // ⚠️ 临时开放，需要修复
    .requestMatchers("/api/community/documents/**").permitAll() // ✅ 社区浏览公开
    .requestMatchers("/api/**").authenticated()            // ✅ 其他API需要认证
    .anyRequest().permitAll()                              // ✅ 其他请求放行
)
```

**问题分析**：
1. ⚠️ **`/api/workspaces/**` 临时开放** - 应该需要认证，权限检查在业务逻辑层
2. ⚠️ **`/api/copilot/**` 临时开放** - 应该需要认证
3. ⚠️ **`/api/users/me/**` 临时开放** - 应该需要认证

#### 方法级权限检查

**使用注解**：
```java
@PreAuthorize("hasRole('ADMIN')")
@PreAuthorize("hasRole('SUPER_ADMIN')")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
```

**代码位置**：
- `AdminController` - 所有方法都需要 `ADMIN` 角色
- `FeatureController` - 所有方法都需要 `ADMIN` 角色
- `RoleManagementController` - 需要 `SUPER_ADMIN` 角色

#### 业务逻辑层权限检查

**工作空间权限检查**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/modules/document/api/WorkspaceDocController.java
// 在 getDoc() 方法中检查文档访问权限
```

**社区文档权限检查**：
```java
// baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/controller/CommunityController.java
PermissionCheckResult permissionResult = communityService
    .checkUserViewCommunityDocPermission(docId, workspaceId, userId)
    .block();

if (permissionResult == null || !permissionResult.isAllowed()) {
    ErrorCode errorCode = permissionResult != null ? permissionResult.getErrorCode() : ErrorCode.COMMUNITY_DOC_ACCESS_DENIED;
    return ResponseEntity.status(403).body(errorJson);
}
```

## 4. 权限检查问题分析

### 4.1 ✅ 正确的权限检查

1. **JWT Token 验证**
   - ✅ Token 格式验证
   - ✅ Token 过期检查
   - ✅ Token 黑名单检查
   - ✅ 用户存在性检查

2. **系统级权限检查**
   - ✅ `@PreAuthorize` 注解正确使用
   - ✅ URL 路径权限配置正确（除了临时开放的接口）

3. **工作空间权限检查**
   - ✅ `getUserWorkspaceRole()` 正确实现
   - ✅ 角色权限映射正确

4. **社区文档权限检查**
   - ✅ 区分不同的失败原因
   - ✅ 返回统一的错误码

### 4.2 ⚠️ 潜在问题

1. **临时开放的接口**
   - ⚠️ `/api/workspaces/**` - 应该需要认证
   - ⚠️ `/api/copilot/**` - 应该需要认证
   - ⚠️ `/api/users/me/**` - 应该需要认证
   
   **建议**：移除 `permitAll()`，改为 `authenticated()`，权限检查在业务逻辑层进行

2. **Token 存储安全**
   - ⚠️ Token 存储在 `localStorage`，存在 XSS 风险
   
   **建议**：
   - 使用 `httpOnly` Cookie（需要后端支持）
   - 或者使用内存存储（刷新页面会丢失，但更安全）

3. **权限检查不一致**
   - ⚠️ 某些接口在 URL 配置层检查，某些在业务逻辑层检查
   
   **建议**：统一权限检查策略

4. **工作空间权限检查缺失**
   - ⚠️ `/api/workspaces/**` 接口没有统一的工作空间权限检查
   
   **建议**：创建统一的工作空间权限检查拦截器或 AOP

### 4.3 ❌ 需要修复的问题

1. **`/api/workspaces/**` 权限检查**
   - ❌ 当前：`permitAll()` - 所有请求都可以访问
   - ✅ 应该：`authenticated()` + 业务逻辑层检查工作空间权限

2. **`/api/copilot/**` 权限检查**
   - ❌ 当前：`permitAll()` - 所有请求都可以访问
   - ✅ 应该：`authenticated()` - 需要登录

3. **`/api/users/me/**` 权限检查**
   - ❌ 当前：`permitAll()` - 所有请求都可以访问
   - ✅ 应该：`authenticated()` - 需要登录

## 5. 权限检查流程图

```
用户请求
    ↓
前端：添加 Authorization 头（Bearer Token）
    ↓
后端：JwtAuthenticationFilter
    ├─ 跳过不需要认证的路径 → 直接放行
    └─ 需要认证的路径
        ├─ 提取 Token
        ├─ 验证 Token（JwtUtil.validateAccessToken）
        ├─ 检查黑名单
        ├─ 加载用户信息
        ├─ 加载用户权限（RoleService.getUserAuthorities）
        └─ 设置 SecurityContext
    ↓
SecurityConfig.filterChain
    ├─ URL 路径权限检查
    │   ├─ /api/admin/** → hasRole("ADMIN")
    │   ├─ /api/workspaces/** → permitAll() ⚠️ 应该改为 authenticated()
    │   └─ /api/** → authenticated()
    └─ 通过 → 继续处理
    ↓
Controller 方法
    ├─ @PreAuthorize 注解检查（方法级权限）
    └─ 业务逻辑层权限检查
        ├─ 工作空间权限检查（WorkspaceManagementService）
        └─ 文档权限检查（CommunityService）
    ↓
返回响应
```

## 6. 修复建议

### 6.1 立即修复

1. **修复临时开放的接口**
   ```java
   // SecurityConfig.java
   .requestMatchers("/api/workspaces/**").authenticated()  // 改为需要认证
   .requestMatchers("/api/copilot/**").authenticated()     // 改为需要认证
   .requestMatchers("/api/users/me/**").authenticated()    // 改为需要认证
   ```

2. **统一权限检查**
   - 创建统一的工作空间权限检查拦截器
   - 在业务逻辑层统一检查工作空间权限

### 6.2 长期优化

1. **Token 存储安全**
   - 考虑使用 `httpOnly` Cookie
   - 或者使用内存存储 + 定期刷新

2. **权限检查统一化**
   - 创建统一的权限检查框架
   - 统一错误响应格式（已实现）

3. **权限缓存**
   - 缓存用户权限信息，减少数据库查询
   - 权限变更时清除缓存

## 7. 总结

### ✅ 权限体系优点

1. **JWT Token 机制完善**
   - Token 生成、验证、刷新机制完整
   - 支持 Token 黑名单
   - Token 过期检查

2. **多层级权限体系**
   - 系统级权限（SUPER_ADMIN, ADMIN, MODERATOR, USER）
   - 工作空间级权限（OWNER, ADMIN, COLLABORATOR, EXTERNAL）
   - 文档级权限（PUBLIC, COLLABORATOR, ADMIN, CUSTOM）

3. **权限检查点完整**
   - URL 路径权限配置
   - 方法级权限注解
   - 业务逻辑层权限检查

### ⚠️ 需要改进的地方

1. **临时开放的接口需要修复**
2. **Token 存储安全性需要提升**
3. **权限检查需要统一化**

### 📝 建议

1. **立即修复**：移除临时开放的接口配置
2. **短期优化**：统一权限检查策略
3. **长期优化**：提升 Token 存储安全性，优化权限缓存

