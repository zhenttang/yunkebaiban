# React is not defined 错误调试指南

## 错误位置
```
at s (index.mjs:23:1)
at VirtualizedList
at VirtualizedCollectionList
```

## 浏览器调试步骤

### 1. 启用 Source Map

项目已配置了 source map：
- 开发模式：`cheap-module-source-map`
- 生产模式：`source-map`

### 2. 在浏览器中调试

#### 步骤 1：打开开发者工具
1. 按 `F12` 或右键 → "检查"
2. 打开 **Sources** 标签页

#### 步骤 2：定位错误位置
1. 在 Console 中点击错误堆栈中的 `index.mjs:23`
2. 或者在 Sources 面板中搜索 `index.mjs`
3. 找到第 23 行的代码

#### 步骤 3：查看对应的源代码
1. 如果 source map 正常工作，可以在 **Sources** 面板中看到原始源代码
2. 找到 `packages/frontend/core/src/components/page-list/virtualized-list.tsx`
3. 查看第 23 行附近的代码

#### 步骤 4：设置断点
1. 在 `virtualized-list.tsx` 中找到对应的函数
2. 点击行号设置断点
3. 刷新页面，代码会在断点处暂停

#### 步骤 5：检查作用域
1. 在断点暂停时，查看 **Scope** 面板
2. 检查是否有 `React` 变量
3. 检查 `this` 或其他上下文

### 3. 检查打包后的代码

如果 source map 不可用，可以直接查看打包后的代码：

#### 在浏览器中：
1. 打开 `http://localhost:8080/js/index.js`
2. 搜索 `509969` 附近的代码（根据错误堆栈）
3. 查看第 23 行附近的代码结构

#### 使用命令行：
```bash
# 查看打包后的文件
cd packages/frontend/apps/web/dist
# 查找相关的代码片段
grep -n "React" js/index.js | head -20
```

### 4. 关键检查点

在调试时，重点检查：

1. **`itemContentRenderer` 函数**（第183行）
   - 检查这个函数中是否有 React 引用
   - 检查返回的 JSX 是否正确转换

2. **`ListInner` 组件**（第162行）
   - 检查组件内部是否有 React 引用
   - 检查 `useMemo`、`useCallback` 等 hooks

3. **`PageListHeading` 组件**（第86行）
   - 检查这个组件是否有问题

4. **`Scroller` 组件**（第146行）
   - 检查 forwardRef 的使用

### 5. 临时调试方案

如果无法通过 source map 定位，可以尝试：

#### 方案 1：在 virtualized-list.tsx 中添加调试代码
```typescript
export const VirtualizedList = forwardRef<
  ItemListHandle,
  VirtualizedListProps<ListItem>
>(function VirtualizedList(props, ref) {
  // 添加调试代码
  console.log('VirtualizedList - React available:', typeof React !== 'undefined');
  console.log('VirtualizedList - React:', React);
  
  return (
    <ListProvider initialValues={[[listPropsAtom, props]]}>
      <ListInnerWrapper {...props} handleRef={ref}>
        <ListInner {...props} />
      </ListInnerWrapper>
    </ListProvider>
  );
});
```

#### 方案 2：检查 react-virtuoso 的使用
```typescript
const itemContentRenderer = useCallback(
  (_index: number, data: VirtuosoItem<ListItem>) => {
    console.log('itemContentRenderer - React available:', typeof React !== 'undefined');
    // ...
  },
  [props]
);
```

### 6. 可能的根本原因

基于错误堆栈分析，可能的原因：

1. **react-virtuoso 内部问题**
   - `react-virtuoso` 库可能在某些情况下需要 React 全局可用
   - 即使使用了 `runtime: 'automatic'`，库内部可能仍有 React 引用

2. **代码分割问题**
   - React 可能被分割到不同的 chunk 中
   - 加载顺序可能导致 React 在某些模块中不可用

3. **Webpack 配置问题**
   - 虽然配置了 `runtime: 'automatic'`，但可能在某些边界情况下失效
   - 可能需要确保 React 在所有相关模块中都可用

### 7. 建议的修复方案

如果通过调试发现是 `react-virtuoso` 的问题，可以尝试：

#### 方案 A：全局确保 React 可用（临时方案）
在入口文件 `packages/frontend/apps/web/src/index.tsx` 中：
```typescript
import React from 'react';
// 确保 React 在全局可用（仅用于调试）
if (typeof window !== 'undefined') {
  (window as any).React = React;
}
```

#### 方案 B：检查 react-virtuoso 版本
```bash
yarn list react-virtuoso
```

#### 方案 C：在 VirtualizedList 中使用不同的方式
如果问题确实是 `react-virtuoso`，可以考虑：
- 降级或升级 `react-virtuoso` 版本
- 使用替代的虚拟化库
- 直接使用 React 的虚拟化方案

### 8. 调试输出示例

在浏览器 Console 中运行以下代码，检查 React 的可用性：

```javascript
// 检查全局 React
console.log('window.React:', window.React);

// 检查模块中的 React
// 在 Sources 面板中找到 virtualized-list.tsx
// 在某个函数中设置断点，然后在 Console 中运行：
console.log('React in scope:', typeof React !== 'undefined');
```

### 9. 下一步行动

1. **立即行动**：
   - 在浏览器中打开 Sources 面板
   - 定位到 `index.mjs:23` 或对应的源代码位置
   - 设置断点并检查作用域

2. **如果找到问题**：
   - 记录具体是哪个函数/组件有问题
   - 记录 React 在作用域中的状态
   - 根据具体情况修复

3. **如果 source map 不可用**：
   - 查看打包后的代码结构
   - 分析第 23 行附近的代码
   - 理解代码是如何被转换的

### 10. 报告调试结果

如果找到问题，请提供：
- 具体是哪个函数/组件有问题
- React 在作用域中的状态（undefined 还是其他）
- 打包后的代码结构（如果能看到）
- 是否有其他相关的错误信息

这样可以帮助更精确地定位和修复问题。

