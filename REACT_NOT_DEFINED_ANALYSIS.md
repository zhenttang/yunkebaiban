# React is not defined 错误分析报告

## 错误信息
```
React is not defined
ReferenceError: React is not defined at s (http://localhost:8080/js/index.js:510012:151)
```

## 问题根源分析

### 1. React 版本不一致问题 ⚠️

**发现的版本冲突：**

- **根目录 `package.json`** (第128行)：
  ```json
  "resolutions": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  }
  ```

- **`packages/frontend/apps/web/package.json`** (第21-22行)：
  ```json
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
  ```

**问题：**
- Yarn resolutions 强制所有包使用 React 18.2.0
- 但 web 应用声明依赖 React 19.0.0
- 这导致版本不一致，可能在构建或运行时出现问题

### 2. JSX Transform 配置 ✅

**Webpack 配置正确：**

在 `tools/cli/src/webpack/index.ts` 第245行：
```typescript
transform: {
  react: { runtime: 'automatic' },  // ✅ 使用新的自动 JSX Transform
  // ...
}
```

**说明：**
- 使用 `runtime: 'automatic'` 意味着 JSX 会被转换为 `react/jsx-runtime` 的形式
- 正常情况下不需要显式导入 `React` 来使用 JSX
- 但是使用 `React.FC`、`React.Component` 等类型时仍需要导入 `React`

### 3. 代码中使用 React 的情况 ✅

**发现的文件：**

1. `packages/frontend/apps/web/src/components/save-status-indicator.tsx`
   - ✅ 正确导入：`import React, { useState, useEffect, ... } from 'react';`
   - ✅ 使用 `React.FC` 类型

2. `packages/frontend/apps/web/src/components/workspace-cloud-status.tsx`
   - ✅ 正确导入：`import React from 'react';`
   - ✅ 使用 `React.FC` 类型

3. `packages/frontend/apps/web/src/components/cloud-storage-status.tsx`
   - ✅ 正确导入：`import React from 'react';`
   - ✅ 使用 `React.FC` 类型

**结论：** 代码导入是正确的，问题不在代码本身。

### 4. 构建配置分析

**Webpack 配置位置：**
- `tools/cli/src/webpack/index.ts`
- 使用 `swc-loader` 进行转译
- React JSX Transform 配置为 `automatic`

**可能的问题：**

1. **版本冲突导致构建问题**
   - React 18.2.0 和 19.0.0 之间的 API 差异
   - 构建时可能使用了错误的 React 版本

2. **模块解析问题**
   - Webpack 可能没有正确解析 React 模块
   - React 可能被打包到错误的 chunk 中

3. **运行时加载问题**
   - React 可能没有在正确的时间点加载
   - 代码执行时 React 还未初始化

## 解决方案建议

### 方案 1：统一 React 版本（推荐）✅

**步骤：**

1. **统一使用 React 18.2.0**（保持与 resolutions 一致）
   ```json
   // packages/frontend/apps/web/package.json
   "dependencies": {
     "react": "18.2.0",
     "react-dom": "18.2.0"
   }
   ```

2. **更新类型定义**
   ```json
   "devDependencies": {
     "@types/react": "^18.2.0",
     "@types/react-dom": "^18.2.0"
   }
   ```

3. **重新安装依赖**
   ```bash
   yarn install
   ```

4. **清理构建缓存并重新构建**
   ```bash
   rm -rf node_modules/.cache
   rm -rf packages/frontend/apps/web/dist
   yarn build:web:dev
   ```

### 方案 2：更新 resolutions 到 React 19（如果确实需要 React 19）

**步骤：**

1. **更新根目录 resolutions**
   ```json
   // package.json
   "resolutions": {
     "react": "^19.0.0",
     "react-dom": "^19.0.0"
   }
   ```

2. **重新安装依赖**
   ```bash
   yarn install
   ```

3. **清理并重新构建**

### 方案 3：检查 Webpack 配置中的 React 外部化

**检查点：**

在 `tools/cli/src/webpack/index.ts` 中，确认 React 没有被错误地外部化（externals），导致运行时找不到。

查看 `resolve.alias` 配置，确保 React 路径正确。

### 方案 4：检查代码中是否有隐式 React 使用

**需要检查：**

1. 是否有文件使用了 `React.xxx` 但没有导入 React
2. 是否有第三方库依赖特定版本的 React
3. 是否有代码通过 `window.React` 或其他全局变量访问 React

## 诊断步骤

### 1. 检查实际安装的 React 版本
```bash
cd packages/frontend/apps/web
yarn list react react-dom
```

### 2. 检查构建产物
```bash
# 查看构建后的文件，搜索 React 相关的导入
grep -r "react" packages/frontend/apps/web/dist/js/ | head -20
```

### 3. 检查浏览器控制台
- 打开浏览器开发者工具
- 查看 Network 标签，确认 React 库是否正确加载
- 查看 Console 标签，查看完整的错误堆栈

### 4. 检查 Source Map
- 查看错误位置 `index.js:510012:151` 对应的源代码
- 确认是哪段代码导致了问题

## 临时解决方案

如果问题紧急，可以尝试：

1. **确保 React 正确导入**
   - 在入口文件 `packages/frontend/apps/web/src/index.tsx` 顶部添加：
   ```typescript
   import React from 'react';
   ```

2. **检查 HTML 模板**
   - 确认 `index.html` 中没有手动引入 React 的 script 标签
   - 确认 React 是通过模块系统加载的

3. **检查模块解析**
   - 确认 `node_modules/react` 存在
   - 确认 webpack 的 `resolve` 配置正确

## 预期结果

解决后应该：
- ✅ 应用正常启动
- ✅ 没有 "React is not defined" 错误
- ✅ React 组件正常渲染
- ✅ 所有 React 相关的功能正常工作

## 相关文件

- `package.json` - 根目录配置
- `packages/frontend/apps/web/package.json` - Web 应用配置
- `tools/cli/src/webpack/index.ts` - Webpack 构建配置
- `packages/frontend/apps/web/src/index.tsx` - 应用入口文件

## 注意事项

⚠️ **React 19 的重大变化：**
- React 19 有一些破坏性变更
- 如果项目依赖的第三方库还未支持 React 19，可能会出现问题
- 建议先统一到 React 18.2.0，确保稳定性

⚠️ **构建缓存问题：**
- 修改依赖后一定要清理构建缓存
- `node_modules/.cache` 和 `dist` 目录都应该清理

---

## 修复完成记录 ✅

### 修复时间
2025年修复

### 已修复的文件

以下所有文件中的 React 版本已统一为 **18.2.0**：

1. ✅ `packages/frontend/apps/web/package.json`
   - `react`: `^19.0.0` → `18.2.0`
   - `react-dom`: `^19.0.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

2. ✅ `packages/frontend/apps/android/package.json`
   - `react`: `^19.0.0` → `18.2.0`
   - `react-dom`: `^19.0.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

3. ✅ `packages/frontend/apps/ios/package.json`
   - `react`: `^19.0.0` → `18.2.0`
   - `react-dom`: `^19.0.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

4. ✅ `packages/frontend/apps/mobile/package.json`
   - `react`: `^19.0.0` → `18.2.0`
   - `react-dom`: `^19.0.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

5. ✅ `packages/frontend/apps/electron-renderer/package.json`
   - `react`: `^19.0.0` → `18.2.0`
   - `react-dom`: `^19.0.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

6. ✅ `packages/frontend/core/package.json`
   - `react`: `19.1.0` → `18.2.0`
   - `react-dom`: `19.1.0` → `18.2.0`

7. ✅ `packages/frontend/component/package.json`
   - `peerDependencies.react`: `^19.0.0` → `^18.2.0`
   - `peerDependencies.react-dom`: `^19.0.0` → `^18.2.0`
   - `dependencies.react`: `19.1.0` → `18.2.0`
   - `dependencies.react-dom`: `19.1.0` → `18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`
   - `@types/react-dom`: `^19.0.2` → `^18.2.0`

8. ✅ `packages/frontend/i18n/package.json`
   - `react`: `^19.0.0` → `18.2.0`

9. ✅ `packages/frontend/routes/package.json`
   - `peerDependencies.react`: `^19.1.0` → `^18.2.0`

10. ✅ `packages/common/infra/package.json`
   - `dependencies.react`: `19.1.0` → `18.2.0`
   - `peerDependencies.react-dom`: `^19.0.0` → `^18.2.0`
   - `@types/react`: `^19.0.1` → `^18.2.0`

### 第二阶段修复：添加缺失的 React 导入

发现并修复了 **20+ 个文件**中使用了 `React.FC`、`React.ComponentType` 等但没有导入 React 的问题：

主要修复的文件：
- `packages/frontend/core/src/modules/workbench/view/route-container.tsx` - 使用 `React.ComponentType`
- `packages/frontend/core/src/mobile/dialogs/index.tsx` - 使用 `React.FC`
- `packages/frontend/core/src/desktop/dialogs/index.tsx` - 使用 `React.FC`
- `packages/frontend/core/src/mobile/pages/workspace/index.tsx` - 使用 `React.FC`
- 以及其他 16+ 个文件

### 第三阶段修复：修复导入顺序错误

修复了脚本自动添加导入时导致的语法错误（在多行 import 语句中间插入 React 导入）：

修复的文件：
- ✅ `packages/frontend/core/src/components/notification/list.tsx`
- ✅ `packages/frontend/core/src/components/workspace-property-types/date.tsx`
- ✅ `packages/frontend/core/src/desktop/pages/workspace/detail-page/detail-page-header.tsx`

### 第四阶段修复：添加缺失的 React 类型导入

发现并修复了 **8 个文件**中使用了 React 类型（如 `React.FC`、`React.ReactNode`、`React.Dispatch` 等）但没有导入的问题：

修复的文件：
- ✅ `packages/frontend/core/src/modules/workspace-indexer-embedding/view/embedding-progress.tsx` - 使用 `React.FC`
- ✅ `packages/frontend/core/src/components/hooks/use-block-suite-editor.ts` - 使用 `React.Dispatch`
- ✅ `packages/frontend/core/src/modules/quicksearch/types/item.ts` - 使用 `React.ReactNode`、`React.ComponentType`
- ✅ `packages/frontend/core/src/modules/workbench/view/sidebar/sidebar-header.tsx` - 使用 `React.ReactNode`、`React.CSSProperties`
- ✅ `packages/frontend/core/src/mobile/pages/workspace/detail/journal-date-picker/month.tsx` - 使用 `React.HTMLAttributes`
- ✅ `packages/frontend/core/src/components/system-property-types/index.ts` - 使用 `React.FC`、`React.SVGProps`
- ✅ `packages/frontend/core/src/components/workspace-property-types/index.ts` - 使用 `React.FC`、`React.SVGProps`
- ✅ `packages/frontend/core/src/desktop/components/navigation-panel/tree/types.ts` - 使用 `React.ReactNode`

**修复方法：** 在这些文件中添加 `import type React from 'react';`

### 下一步操作

修复完成后，需要执行以下命令来应用更改：

```bash
# 1. 清理旧的依赖和缓存
rm -rf node_modules
rm -rf packages/*/node_modules
rm -rf .yarn/cache

# 2. 重新安装依赖
yarn install

# 3. 清理构建产物
rm -rf packages/frontend/apps/web/dist
rm -rf packages/frontend/apps/*/dist

# 4. 重新构建（开发模式）
yarn build:web:dev

# 或者启动开发服务器
yarn dev
```

### 验证修复

修复后，请验证：
1. ✅ 所有包都使用 React 18.2.0（与 resolutions 一致）
2. ✅ 应用可以正常启动
3. ✅ 没有 "React is not defined" 错误
4. ✅ React 组件正常渲染

### 注意事项

- 如果仍有问题，检查是否有第三方库依赖特定版本的 React
- 确保所有依赖都已正确安装
- 如果使用 yarn PnP，可能需要重新生成 lockfile

