# 登录后默认权限和权限统一性分析

## 1. 登录后的默认权限

### 1.1 ✅ 所有用户都有默认权限：`ROLE_USER`

**代码位置**：`RoleService.getUserAuthorities()`

```java
public List<GrantedAuthority> getUserAuthorities(String userId) {
    List<GrantedAuthority> authorities = new ArrayList<>();
    
    // ✅ 所有用户都有基本用户权限
    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
    
    // 从数据库获取用户的额外角色
    List<UserRole> userRoles = userRoleRepository.findActiveRolesByUserId(userId, LocalDateTime.now());
    
    if (userRoles.isEmpty()) {
        log.warn("⚠️  用户 {} 没有额外角色，仅具有基本用户权限 (ROLE_USER)", userId);
        return authorities; // 只返回 ROLE_USER
    }
    
    // 添加额外角色（SUPER_ADMIN, ADMIN, MODERATOR等）
    // ...
    
    return authorities;
}
```

**结论**：
- ✅ **所有用户登录后都有 `ROLE_USER` 权限**
- ✅ **这是默认权限，不需要在数据库中存储**
- ✅ **如果用户没有额外角色，就只有 `ROLE_USER`**

### 1.2 用户注册时的权限分配

**代码位置**：`AuthServiceImpl.register()`

```java
public Mono<AuthResult> register(String email, String password, String name) {
    // 创建新用户
    User newUser = User.builder()
            .id(UUID.randomUUID().toString())
            .email(email)
            .name(name)
            .password(passwordEncoder.encode(password))
            .emailVerifiedAt(LocalDateTime.now())
            .registered(true)
            .disabled(false)
            .enabled(true)
            .createdAt(LocalDateTime.now())
            .build();
    
    // 保存到数据库
    User savedUser = userRepository.save(newUser);
    
    // ❌ 注意：注册时不会自动分配角色
    // 用户只有默认的 ROLE_USER 权限
}
```

**结论**：
- ❌ **用户注册时不会自动分配任何角色**
- ✅ **只有默认的 `ROLE_USER` 权限（在 `getUserAuthorities()` 中自动添加）**

### 1.3 管理员角色的自动分配

**代码位置**：`RoleInitializationService.run()`

```java
@Override
@Transactional
public void run(String... args) {
    log.info("🔑 开始初始化管理员角色...");
    
    // 默认管理员邮箱列表
    private static final String[] DEFAULT_ADMIN_EMAILS = {
        "admin@example.com",
        "admin"
    };
    
    for (String email : DEFAULT_ADMIN_EMAILS) {
        User user = userService.findByEmail(email).block();
        
        if (user != null) {
            // 检查是否已有管理员角色
            if (roleService.isSuperAdmin(user.getId())) {
                continue;
            }
            
            // 分配超级管理员角色
            roleService.assignRole(
                user.getId(),
                UserRole.Role.SUPER_ADMIN,
                user.getId(),
                null // 永久有效
            );
        }
    }
}
```

**结论**：
- ✅ **系统启动时自动为特定邮箱分配 `SUPER_ADMIN` 角色**
- ✅ **只有 `admin@example.com` 和 `admin` 邮箱会被自动分配管理员角色**
- ✅ **其他用户需要手动分配角色**

### 1.4 权限继承规则

**代码位置**：`RoleService.getUserAuthorities()`

```java
// SUPER_ADMIN 自动拥有 ADMIN 权限
boolean hasSuperAdmin = authorities.stream()
        .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPER_ADMIN"));
boolean hasAdmin = authorities.stream()
        .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

if (hasSuperAdmin && !hasAdmin) {
    authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
    log.info("✅ 用户 {} 是 SUPER_ADMIN，自动添加 ROLE_ADMIN 权限", userId);
}
```

**结论**：
- ✅ **`SUPER_ADMIN` 自动拥有 `ADMIN` 权限**
- ✅ **权限继承是自动的，不需要在数据库中存储**

## 2. 权限统一性分析

### 2.1 ✅ 系统级权限是统一的

**权限获取入口**：`RoleService.getUserAuthorities()`

**调用链**：
```
JwtAuthenticationFilter.doFilterInternal()
    ↓
RoleService.getUserAuthorities(userId)
    ↓
UserRoleRepository.findActiveRolesByUserId()
    ↓
返回 List<GrantedAuthority>
    ↓
注入到 AffineUserDetails
    ↓
设置到 SecurityContext
```

**代码位置**：
```java
// JwtAuthenticationFilter.java
List<GrantedAuthority> authorities = roleService.getUserAuthorities(userId);
AffineUserDetails userDetails = new AffineUserDetails(user, authorities);
UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
    userDetails, null, userDetails.getAuthorities());
SecurityContextHolder.getContext().setAuthentication(authToken);
```

**结论**：
- ✅ **系统级权限获取是统一的**
- ✅ **所有权限都通过 `RoleService.getUserAuthorities()` 获取**
- ✅ **权限信息存储在 `SecurityContext` 中，全局可用**

### 2.2 ⚠️ 工作空间级权限不是统一的

**权限获取入口**：`WorkspaceManagementService.getUserWorkspaceRole()`

**问题**：
- ❌ **工作空间权限检查分散在各个 Controller 和 Service 中**
- ❌ **没有统一的拦截器或 AOP 来检查工作空间权限**
- ❌ **每个接口都需要手动调用 `getUserWorkspaceRole()`**

**示例**：
```java
// CommunityServiceImpl.java
return workspaceManagementService.getUserWorkspaceRole(workspaceId, userId)
    .flatMap(role -> {
        // 手动检查权限
        // ...
    });

// WorkspaceDocController.java
// 某些方法中可能没有检查工作空间权限
```

**结论**：
- ⚠️ **工作空间权限检查不统一**
- ⚠️ **需要手动在每个接口中检查**
- ⚠️ **容易出现权限检查遗漏**

### 2.3 ⚠️ 文档级权限不是统一的

**权限检查入口**：
- `CommunityService.checkUserViewCommunityDocPermission()` - 社区文档权限
- `WorkspaceDocController.getDoc()` - 文档访问权限

**问题**：
- ❌ **文档权限检查逻辑分散**
- ❌ **不同的文档类型有不同的权限检查逻辑**
- ❌ **没有统一的文档权限检查框架**

**结论**：
- ⚠️ **文档权限检查不统一**
- ⚠️ **需要针对不同场景实现不同的权限检查逻辑**

### 2.4 ⚠️ Features 权限获取不统一

**多个入口**：
1. `UserService.getUserFeatures()` - 用户服务
2. `UserRoleService.getUserFeatures()` - 角色服务
3. `FeatureService.getUserFeatures()` - 功能服务
4. `SubscriptionService.getUserFeatures()` - 订阅服务

**代码位置**：
```java
// UserServiceImpl.getUserFeatures()
if (userRoleService != null) {
    List<String> features = userRoleService.getUserFeatures(userId);
    if (!features.isEmpty()) {
        return features;
    }
}

// UserRoleServiceImpl.getUserFeatures()
List<UserRole> roles = getUserRoles(userId);
List<String> features = roles.stream()
    .map(role -> role.getRole().getCode())
    .collect(Collectors.toList());

if (!features.contains("user")) {
    features.add("user");
}

if (isAdmin(userId)) {
    if (!features.contains("admin")) {
        features.add("admin");
    }
}
```

**问题**：
- ⚠️ **多个服务都提供 `getUserFeatures()` 方法**
- ⚠️ **逻辑可能不一致**
- ⚠️ **`UserService.getUserFeatures()` 有兼容性检查逻辑（检查邮箱是否包含admin）**

**结论**：
- ⚠️ **Features 权限获取不统一**
- ⚠️ **存在兼容性检查逻辑，可能产生不一致**

## 3. 权限检查流程

### 3.1 系统级权限检查流程

```
用户登录
    ↓
生成 JWT Token
    ↓
请求到达后端
    ↓
JwtAuthenticationFilter
    ↓
RoleService.getUserAuthorities(userId)
    ├─ 自动添加 ROLE_USER
    ├─ 从数据库查询用户角色
    ├─ SUPER_ADMIN 自动添加 ADMIN
    └─ 返回权限列表
    ↓
注入到 SecurityContext
    ↓
SecurityConfig.filterChain()
    ├─ URL 路径权限检查（hasRole("ADMIN")）
    └─ @PreAuthorize 注解检查
    ↓
Controller 方法执行
```

### 3.2 工作空间权限检查流程

```
Controller 方法
    ↓
手动调用 WorkspaceManagementService.getUserWorkspaceRole()
    ↓
从数据库查询 workspace_user_roles 表
    ↓
返回 WorkspaceRole (OWNER/ADMIN/COLLABORATOR/EXTERNAL)
    ↓
业务逻辑层检查权限
    ↓
返回结果
```

**问题**：
- ❌ **没有统一的拦截器**
- ❌ **需要手动在每个接口中检查**
- ❌ **容易出现遗漏**

### 3.3 文档权限检查流程

```
Controller 方法
    ↓
手动调用权限检查方法
    ├─ CommunityService.checkUserViewCommunityDocPermission()
    └─ WorkspaceDocController.getDoc() 内部检查
    ↓
检查文档是否公开
    ↓
检查用户工作空间角色
    ↓
检查文档权限级别
    ↓
返回结果
```

**问题**：
- ❌ **权限检查逻辑分散**
- ❌ **不同场景有不同的检查逻辑**

## 4. 权限统一性问题总结

### 4.1 ✅ 统一的权限

1. **系统级权限（ROLE_USER, ROLE_ADMIN, ROLE_SUPER_ADMIN）**
   - ✅ 统一通过 `RoleService.getUserAuthorities()` 获取
   - ✅ 统一注入到 `SecurityContext`
   - ✅ 统一通过 `@PreAuthorize` 注解检查

2. **默认权限（ROLE_USER）**
   - ✅ 所有用户都有 `ROLE_USER` 权限
   - ✅ 不需要在数据库中存储
   - ✅ 自动添加到权限列表

### 4.2 ⚠️ 不统一的权限

1. **工作空间级权限**
   - ⚠️ 没有统一的拦截器
   - ⚠️ 需要手动在每个接口中检查
   - ⚠️ 容易出现权限检查遗漏

2. **文档级权限**
   - ⚠️ 权限检查逻辑分散
   - ⚠️ 不同场景有不同的检查逻辑

3. **Features 权限**
   - ⚠️ 多个服务都提供 `getUserFeatures()` 方法
   - ⚠️ 存在兼容性检查逻辑

## 5. 改进建议

### 5.1 统一工作空间权限检查

**建议**：创建统一的工作空间权限检查拦截器

```java
@Component
public class WorkspacePermissionInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, 
                           HttpServletResponse response, 
                           Object handler) {
        // 提取 workspaceId 从路径参数
        String workspaceId = extractWorkspaceId(request);
        
        // 获取当前用户ID
        String userId = getCurrentUserId();
        
        // 检查工作空间权限
        WorkspaceRole role = workspaceManagementService
            .getUserWorkspaceRole(workspaceId, userId)
            .block();
        
        // 根据角色决定是否允许访问
        // ...
    }
}
```

### 5.2 统一 Features 权限获取

**建议**：统一使用 `UserRoleService.getUserFeatures()`

```java
// 移除 UserService.getUserFeatures() 中的兼容性检查逻辑
// 统一使用 UserRoleService.getUserFeatures()
```

### 5.3 统一文档权限检查

**建议**：创建统一的文档权限检查框架

```java
public interface DocumentPermissionChecker {
    PermissionCheckResult checkPermission(String docId, String workspaceId, String userId);
}
```

## 6. 总结

### ✅ 登录后的默认权限

1. **所有用户都有 `ROLE_USER` 权限**
   - ✅ 这是默认权限，不需要在数据库中存储
   - ✅ 在 `RoleService.getUserAuthorities()` 中自动添加

2. **用户注册时不会自动分配角色**
   - ✅ 只有默认的 `ROLE_USER` 权限
   - ✅ 需要手动分配其他角色（ADMIN, SUPER_ADMIN等）

3. **特定邮箱会自动分配管理员角色**
   - ✅ `admin@example.com` 和 `admin` 邮箱会自动分配 `SUPER_ADMIN` 角色
   - ✅ 在系统启动时自动分配

### ✅ 权限统一性

1. **系统级权限是统一的**
   - ✅ 统一通过 `RoleService.getUserAuthorities()` 获取
   - ✅ 统一注入到 `SecurityContext`
   - ✅ 统一通过 `@PreAuthorize` 注解检查

2. **工作空间级权限不统一**
   - ⚠️ 需要手动在每个接口中检查
   - ⚠️ 容易出现权限检查遗漏

3. **文档级权限不统一**
   - ⚠️ 权限检查逻辑分散
   - ⚠️ 不同场景有不同的检查逻辑

4. **Features 权限不统一**
   - ⚠️ 多个服务都提供 `getUserFeatures()` 方法
   - ⚠️ 存在兼容性检查逻辑

### 📝 建议

1. **统一工作空间权限检查**：创建统一的拦截器或 AOP
2. **统一 Features 权限获取**：移除兼容性检查逻辑，统一使用 `UserRoleService`
3. **统一文档权限检查**：创建统一的文档权限检查框架

