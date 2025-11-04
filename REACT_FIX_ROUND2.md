# React is not defined 错误修复记录（第二次）

## 修复时间
2025年1月

## 修复的文件

已在以下 6 个关键文件中添加了 `import React from 'react';`：

1. ✅ `packages/frontend/core/src/components/page-list/virtualized-list.tsx`
   - 添加了 `import React from 'react';`
   - 这是 `VirtualizedList` 组件的主文件

2. ✅ `packages/frontend/core/src/components/page-list/page-group.tsx`
   - 添加了 `import React from 'react';`
   - 包含 `ItemGroupHeader` 和 `CollectionListItemRenderer` 组件

3. ✅ `packages/frontend/core/src/components/page-list/collections/collection-list-item.tsx`
   - 添加了 `import React from 'react';`
   - 包含 `CollectionListItem` 和 `CollectionListItemWrapper` 组件

4. ✅ `packages/frontend/core/src/components/page-list/operation-cell.tsx`
   - 添加了 `import React from 'react';`
   - 包含 `CollectionOperationCell` 等操作组件

5. ✅ `packages/frontend/core/src/components/page-list/page-header.tsx`
   - 添加了 `import React from 'react';`
   - 包含 `ListTableHeader` 组件

6. ✅ `packages/frontend/core/src/components/page-list/list.tsx`
   - 添加了 `import React from 'react';`
   - 包含 `ListInnerWrapper` 组件

## 修复原因

虽然项目使用了 `runtime: 'automatic'` JSX Transform，但在以下情况下仍需要显式导入 React：

1. **第三方库依赖**：`react-virtuoso` 等库可能在某些情况下需要 React 运行时可用
2. **代码分割**：在代码分割场景下，React 可能无法正确传递到所有模块
3. **打包配置**：某些打包配置可能导致 React 在某些模块中不可用

## 下一步

1. **清理构建缓存**：
   ```bash
   rm -rf packages/frontend/apps/web/dist
   rm -rf node_modules/.cache
   ```

2. **重新构建**：
   ```bash
   yarn build:web:dev
   ```

3. **测试**：
   - 访问 Collections 页面
   - 检查 `VirtualizedList` 组件是否正常渲染
   - 查看浏览器控制台是否还有 "React is not defined" 错误

## 如果问题仍然存在

如果添加了所有 React 导入后问题仍然存在，可能需要：

1. **检查打包配置**：
   - 确认 React 没有被外部化
   - 检查代码分割配置

2. **检查 source map**：
   - 使用 source map 定位 `index.js:509974:151` 对应的源代码
   - 确认是否有其他文件也需要修复

3. **检查第三方库**：
   - 确认 `react-virtuoso` 版本兼容
   - 检查是否有其他库冲突

4. **全局解决方案**：
   - 在入口文件中确保 React 被正确导入
   - 检查是否有全局变量配置问题

