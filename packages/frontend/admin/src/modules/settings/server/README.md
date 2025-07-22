// 服务器设置模块集成测试文档

## T3: 服务器设置模块开发完成

### ✅ 已完成功能

#### 后端API
- ✅ `GET /api/admin/server/config` - 获取服务器配置
- ✅ `PUT /api/admin/server/config` - 更新服务器配置
- ✅ `GET /api/admin/server/info` - 获取系统信息
- ✅ `GET /api/admin/server/status` - 获取服务器状态

#### 前端页面
- ✅ 服务器设置主页面 (`/admin/settings/server`)
- ✅ 系统信息卡片组件
- ✅ 基础设置表单组件
- ✅ 多标签页布局 (基础配置/系统信息/运行状态)
- ✅ 自定义Hook数据管理
- ✅ 表单验证和错误处理
- ✅ 响应式设计和加载状态

#### 功能特性
- ✅ 服务器基本信息配置 (名称、外部URL)
- ✅ 系统配置 (上传大小、会话超时、语言、时区)
- ✅ 功能开关 (用户注册、邀请码、维护模式)
- ✅ 系统信息展示 (版本、运行时、内存使用)
- ✅ 健康状态监控 (数据库、Redis、存储、邮件)
- ✅ 实时状态刷新
- ✅ 配置验证和保存
- ✅ 操作日志记录

### 🔧 技术实现

#### 后端技术栈
- Spring Boot 3.2 REST API
- Spring Security 权限验证
- JPA数据持久化
- 配置动态加载
- 系统信息收集
- 操作审计日志

#### 前端技术栈
- React 18 + TypeScript
- React Hook Form + Zod验证
- Radix UI + Tailwind CSS
- SWR数据管理
- 响应式设计
- 错误边界处理

### 📝 使用方法

#### 访问页面
1. 登录管理员账户
2. 点击左侧菜单 "服务器设置"
3. 或直接访问 `/admin/settings/server`

#### 功能操作
1. **基础配置**: 修改服务器名称、外部URL、系统配置
2. **系统信息**: 查看版本信息、运行时状态、系统资源
3. **运行状态**: 监控各组件健康状态、内存使用情况

#### API测试
```bash
# 获取服务器配置
curl -H "Authorization: Bearer {token}" \
     http://localhost:8080/api/admin/server/config

# 更新服务器配置
curl -X PUT \
     -H "Authorization: Bearer {token}" \
     -H "Content-Type: application/json" \
     -d '{"serverName":"My AFFiNE Server","enableSignup":true}' \
     http://localhost:8080/api/admin/server/config

# 获取系统信息
curl -H "Authorization: Bearer {token}" \
     http://localhost:8080/api/admin/server/info
```

### 🎯 数据源

#### 配置数据
- 数据库表: `app_config` (动态配置)
- 配置模块: `server`
- 实时加载: 支持配置热更新

#### 系统信息
- JVM运行时信息 (内存、启动时间、版本)
- 操作系统信息 (OS、架构、处理器)
- 组件健康状态 (数据库、Redis、存储、邮件)
- 应用程序信息 (版本、构建时间、Git提交)

### 🔒 权限控制
- 要求管理员权限 (`admin` feature)
- JWT认证验证
- 操作审计日志记录
- IP来源记录

### 🚀 部署说明

#### 前端
- 页面已集成到现有设置模块
- 懒加载优化
- 错误边界保护

#### 后端
- API已添加到现有控制器
- 服务实现已完成
- 数据库迁移不需要(使用现有表)

### ✨ 开发规范遵循
- ✅ 统一的错误处理
- ✅ 日志记录规范
- ✅ 代码注释完整
- ✅ TypeScript类型定义
- ✅ 响应式设计
- ✅ 可访问性支持
- ✅ 国际化准备

---

## 🎉 T3任务完成

服务器设置模块开发完成，已完全集成到AFFiNE Admin系统中。
用户可以通过直观的界面管理服务器配置，监控系统状态，确保系统稳定运行。