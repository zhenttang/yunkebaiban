# 统一权限系统升级 - 待办事项清单

## ✅ 已完成的工作

### 1. 核心框架
- [x] 创建 `@RequireWorkspaceRole` 注解
- [x] 创建 `@RequireDocumentAccess` 注解
- [x] 创建 `UnifiedPermissionService` 服务
- [x] 创建 `PermissionCheckAspect` AOP切面
- [x] 创建 `PermissionUtil` 工具类
- [x] 完善 `PermissionCheckResult` 和 `ErrorCode`

### 2. Controller 更新
- [x] `CommunityController` - 5个方法已更新
- [x] `WorkspaceDocController` - 10+个方法已更新
- [x] `AuthController` - 使用 `PermissionUtil`

### 3. 服务层优化
- [x] `UserServiceImpl.getUserFeatures()` - 移除兼容性检查
- [x] `UnifiedPermissionServiceImpl` - 完善公开文档和社区文档检查逻辑

## 🔄 待迁移的 Controller

### 1. CollaborationController
**位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/controller/CollaborationController.java`

**需要更新的方法**:
- `getDocCollaborators()` - 使用 `@RequireDocumentAccess`
- `updateDocCollaborators()` - 使用 `@RequireDocumentAccess`
- `removeDocCollaborator()` - 使用 `@RequireDocumentAccess`

**当前状态**: 使用手动 `docService.hasDocAccess()` 检查

### 2. WorkspaceController
**位置**: `baibanhouduan/yunke-java-backend/src/main/java/com/yunke/backend/controller/WorkspaceController.java`

**需要更新的方法**:
- 多个方法使用 `workspaceManagementService.getUserWorkspaceRole()` 手动检查
- 需要根据具体业务逻辑决定使用 `@RequireWorkspaceRole` 还是保留手动检查

**当前状态**: 使用手动 `getUserWorkspaceRole()` 检查

## 📋 建议的后续工作

### 1. 测试
- [ ] 编写单元测试 for `UnifiedPermissionService`
- [ ] 编写集成测试 for AOP切面
- [ ] 测试 Mono 返回类型的权限检查
- [ ] 测试 byte[] 返回类型的权限检查

### 2. 文档完善
- [ ] 添加更多使用示例
- [ ] 添加迁移指南
- [ ] 添加常见问题解答

### 3. 性能优化
- [ ] 添加权限检查结果缓存
- [ ] 优化数据库查询（批量权限检查）
- [ ] 添加权限检查性能监控

### 4. 功能扩展
- [ ] 支持更多权限检查类型（如文件权限、API权限）
- [ ] 支持动态权限配置
- [ ] 支持权限继承和委托

### 5. 代码清理
- [ ] 移除旧的权限检查代码
- [ ] 统一错误处理
- [ ] 添加代码注释

## 🎯 优先级建议

### 高优先级（建议立即处理）
1. **迁移 CollaborationController** - 文档协作功能，使用频率高
2. **编写基础测试** - 确保权限检查功能正确

### 中优先级（近期处理）
3. **迁移 WorkspaceController** - 工作空间管理功能
4. **添加权限检查缓存** - 提升性能

### 低优先级（长期优化）
5. **功能扩展** - 根据实际需求
6. **性能优化** - 根据性能监控结果

## 📝 注意事项

1. **向后兼容**: 迁移时确保不影响现有功能
2. **测试覆盖**: 每个迁移的方法都需要测试
3. **错误处理**: 确保所有错误情况都被正确处理
4. **日志记录**: 添加适当的日志记录便于排查问题

## 🔍 检查清单

在迁移每个Controller前，请确认：
- [ ] 理解方法的业务逻辑
- [ ] 确定所需的权限级别
- [ ] 检查是否有特殊权限要求
- [ ] 确认返回类型（同步/异步/二进制）
- [ ] 编写测试用例
- [ ] 更新相关文档

