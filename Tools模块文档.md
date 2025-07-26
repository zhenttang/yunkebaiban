# Tools 工具链详细文档

## 模块概述

Tools 模块包含了项目的构建工具链、开发工具和自动化脚本。这些工具确保了项目的构建、部署、代码质量检查和开发体验的统一性。

## 工具链架构

```
tools/
├── @types/              # 类型定义
│   ├── build-config/   # 构建配置类型
│   └── env/            # 环境类型
├── changelog/          # 变更日志工具
├── cli/               # 命令行工具
├── commitlint/        # 提交信息检查
├── playstore-auto-bump/ # Play Store 自动版本更新
└── utils/             # 通用工具库
```

## 详细模块分析

### 1. CLI 命令行工具 (`tools/cli/`)

**功能**: 提供统一的命令行接口，管理项目的构建、开发和部署流程

#### 核心文件结构:
- `src/affine.ts` - Affine 主命令入口
- `src/build.ts` - 构建命令
- `src/bundle.ts` - 打包命令
- `src/dev.ts` - 开发服务器
- `src/clean.ts` - 清理命令
- `src/init.ts` - 初始化命令
- `src/run.ts` - 运行命令
- `src/command.ts` - 命令基类
- `src/context.ts` - 上下文管理
- `src/cert.ts` - 证书管理

#### Webpack 配置 (`src/webpack/`):
- `index.ts` - Webpack 主配置
- `cache-group.ts` - 缓存组配置
- `html-plugin.ts` - HTML 插件配置
- `s3-plugin.ts` - S3 上传插件
- `node-loader.js` - Node.js 加载器
- `error-handler.js` - 错误处理
- `types.ts` - Webpack 类型定义
- `template.html` - HTML 模板

#### 特点:
- **统一命令接口**: 通过 `yarn affine <command>` 统一管理
- **环境配置**: 支持多环境构建配置
- **插件化**: 模块化的 Webpack 配置
- **错误处理**: 完善的构建错误处理
- **性能优化**: 缓存和优化策略

#### 主要命令:
```bash
yarn affine dev      # 启动开发服务器
yarn affine build    # 构建生产版本
yarn affine bundle   # 打包应用
yarn affine clean    # 清理构建文件
yarn affine init     # 初始化项目
```

### 2. Utils 通用工具库 (`tools/utils/`)

**功能**: 提供构建过程中需要的通用工具和函数

#### 核心模块:
- `src/build-config.ts` - 构建配置管理
- `src/distribution.ts` - 分发管理
- `src/package.ts` - 包管理工具
- `src/workspace.ts` - 工作空间管理
- `src/yarn.ts` - Yarn 集成
- `src/logger.ts` - 日志工具
- `src/format.ts` - 格式化工具
- `src/path.ts` - 路径工具
- `src/process.ts` - 进程管理
- `src/types.ts` - 类型定义
- `src/workspace.gen.ts` - 工作空间生成

#### 特点:
- **配置管理**: 统一的构建配置接口
- **包管理**: Yarn workspaces 集成
- **路径处理**: 跨平台路径工具
- **日志系统**: 结构化日志输出
- **类型安全**: 完整的 TypeScript 支持

### 3. @Types 类型定义 (`tools/@types/`)

**功能**: 提供工具链相关的类型定义

#### Build Config (`@types/build-config/`):
- `__all.d.ts` - 构建配置类型
- `package.json` - 包配置

#### 特点:
- **类型安全**: 构建过程的类型检查
- **接口统一**: 标准化的配置接口
- **开发体验**: IDE 智能提示支持

### 4. Changelog 变更日志工具 (`tools/changelog/`)

**功能**: 自动生成项目变更日志

#### 核心文件:
- `index.js` - 主要逻辑
- `markdown.js` - Markdown 生成
- `package.json` - 包配置

#### 特点:
- **自动生成**: 基于 Git 提交生成变更日志
- **Markdown 格式**: 标准化的文档格式
- **版本管理**: 与版本发布流程集成

### 5. Commitlint 提交检查 (`tools/commitlint/`)

**功能**: 检查 Git 提交信息的格式规范

#### 特点:
- **提交规范**: 强制执行提交信息格式
- **自动化**: 与 Git hooks 集成
- **团队协作**: 统一的提交标准

### 6. Play Store 自动更新 (`tools/playstore-auto-bump/`)

**功能**: 自动管理 Android 应用的版本更新

#### 核心文件:
- `index.ts` - 主要逻辑
- `package.json` - 包配置
- `tsconfig.json` - TypeScript 配置

#### 特点:
- **自动版本**: 自动更新应用版本号
- **Store 集成**: 与 Google Play Store 集成
- **CI/CD**: 支持持续集成流程

## 工具链集成

### 1. 开发流程集成

#### 本地开发:
```bash
yarn affine dev          # 启动开发环境
yarn lint               # 代码检查
yarn typecheck          # 类型检查
yarn test               # 运行测试
```

#### 构建流程:
```bash
yarn affine build       # 构建应用
yarn affine bundle      # 打包发布
yarn package            # 生成安装包
```

### 2. 代码质量控制

#### Lint 配置:
- ESLint: JavaScript/TypeScript 代码检查
- Prettier: 代码格式化
- OxLint: 快速 Lint 检查
- Commitlint: 提交信息检查

#### Git Hooks:
- pre-commit: 提交前代码检查
- commit-msg: 提交信息格式检查
- pre-push: 推送前测试运行

### 3. 构建优化

#### 性能优化:
- **代码分割**: 按需加载模块
- **缓存策略**: 智能缓存管理
- **资源优化**: 图片和资源压缩
- **Tree Shaking**: 死代码消除

#### 多环境支持:
- 开发环境: 快速构建和热重载
- 测试环境: 测试优化配置
- 生产环境: 性能和体积优化

### 4. 部署自动化

#### 构建产物:
- Web 应用: 静态文件
- Desktop 应用: Electron 安装包
- Mobile 应用: APK/IPA 文件

#### 发布流程:
- 版本管理: 自动版本号更新
- 变更日志: 自动生成发布说明
- 资源上传: 自动上传到 CDN/Store

## 开发指南

### 1. 添加新命令

在 `tools/cli/src/` 下添加新的命令文件:

```typescript
// src/new-command.ts
import { Command } from './command';

export class NewCommand extends Command {
  async run() {
    // 命令实现
  }
}
```

### 2. 扩展构建配置

修改 `tools/utils/src/build-config.ts`:

```typescript
export interface BuildConfig {
  // 添加新的配置选项
  newOption: string;
}
```

### 3. 添加工具函数

在 `tools/utils/src/` 下添加新的工具模块:

```typescript
// src/new-util.ts
export function newUtilFunction() {
  // 工具函数实现
}
```

## 技术特点

### 1. 统一工具链
- 所有构建操作通过统一的 CLI 接口
- 标准化的配置和流程
- 一致的开发体验

### 2. 类型安全
- 完整的 TypeScript 支持
- 构建配置的类型检查
- 开发时的智能提示

### 3. 性能优化
- 增量构建和缓存
- 并行处理和优化
- 资源压缩和优化

### 4. 可扩展性
- 模块化的架构设计
- 插件化的构建系统
- 易于添加新工具和命令

### 5. 自动化程度高
- 自动版本管理
- 自动测试和检查
- 自动部署和发布

这个工具链设计体现了现代前端项目的最佳实践，既保证了开发效率，又确保了代码质量和部署可靠性。