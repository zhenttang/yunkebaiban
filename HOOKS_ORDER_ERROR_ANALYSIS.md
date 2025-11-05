# React Hooks 顺序错误分析报告

## 错误概述

**错误类型**: React Hooks 顺序违反规则
**错误位置**: `use-query.ts:65` 和 `common.ts:178` (useAdminAccess)
**根本原因**: 在条件语句中调用 Hook，导致 Hook 调用顺序在不同渲染间不一致

## 错误堆栈

```
Warning: React has detected a change in the order of Hooks called by AuthenticatedRoutes.
- 第45个Hook: 之前是 useEffect，现在是 useMemo

Uncaught TypeError: Cannot read properties of undefined (reading 'length')
    at use-query.ts:65:1
    at useAdminAccess (common.ts:178:1)
    at AuthenticatedRoutes (app.tsx:96:1)
```

## 问题根源分析

### 1. 违反 Hooks 规则

在 `common.ts` 的 `useAdminAccess` 函数中（第161-187行），存在**条件性 Hook 调用**：

```typescript
export function useAdminAccess(): {
  checking: boolean;
  allowed: boolean | null;
  error?: any;
} {
  const user = useCurrentUser();

  // ❌ 问题：条件性返回，导致 useQuery 不是每次都被调用
  if (user === undefined) {
    return { checking: true, allowed: null };
  }
  if (user === null) {
    return { checking: false, allowed: false };
  }

  // ✅ 这里的 useQuery 只在 user 有值时才调用
  const { data, error, isLoading } = useQuery(
    { query: serverConfigQuery },
    { suspense: false, shouldRetryOnError: false }
  );
  // ...
}
```

**问题说明**：
- 当 `user === undefined` 时：Hook 调用序列在第20个 `useState`（useCurrentUser内部）后结束
- 当 `user === null` 时：Hook 调用序列在第20个 `useState` 后结束
- 当 `user` 有值时：Hook 调用序列继续，包含 `useQuery` → `useMemo` → `useSWR` 等

这导致 React 在不同渲染间检测到 Hook 调用顺序不一致。

### 2. 具体错误位置

`use-query.ts:65` 处的 `useMemo` 是第45个 Hook，但在某些渲染中它变成了第45个（前面有 `useEffect`），而在其他渲染中它被跳过或位置不同。

```typescript
// use-query.ts:65
const configWithSuspense: SWRConfiguration = useMemo(
  () => ({
    suspense: true,
    ...config,
  }),
  [config]
);
```

**可能的运行时错误**：
- 当 `config` 为 `undefined` 时，`...config` 展开可能没问题
- 但 SWR 内部可能在检查 `config` 的某些属性（如 `fallbackData` 数组），如果为 `undefined` 并尝试读取 `.length` 就会报错

### 3. Hook 调用顺序变化

根据错误信息，Hook 顺序对比：

```
Previous render (user === undefined/null):
1-44: 各种 Hook（useMemo, useContext, useRef, useCallback, useLayoutEffect, useState...）
45: useEffect ❌

Next render (user 有值):
1-44: 同样的 Hook
45: useMemo ✅ (来自 useQuery)
```

## 解决方案

### 方案 1：始终调用 Hook，但条件控制参数（推荐）

```typescript
export function useAdminAccess(): {
  checking: boolean;
  allowed: boolean | null;
  error?: any;
} {
  const user = useCurrentUser();

  // ✅ 始终调用 useQuery，但通过 options 参数控制是否实际请求
  const shouldFetch = user !== undefined && user !== null;
  
  const { data, error, isLoading } = useQuery(
    shouldFetch
      ? { query: serverConfigQuery }
      : undefined, // 传入 undefined 会让 SWR 跳过请求
    { suspense: false, shouldRetryOnError: false }
  );

  // 用户信息还在加载
  if (user === undefined) {
    return { checking: true, allowed: null };
  }
  // 未登录
  if (user === null) {
    return { checking: false, allowed: false };
  }

  // 已登录的情况
  if (isLoading) return { checking: true, allowed: null };
  if (error) return { checking: false, allowed: false, error };
  if (data) return { checking: false, allowed: true };
  return { checking: false, allowed: false };
}
```

### 方案 2：拆分 Hook，使用条件渲染

将 `useAdminAccess` 拆分为两个 Hook：
- `useAdminAccessCheck` - 始终调用
- `useAdminAccessQuery` - 只在需要时调用

然后在组件层面使用条件渲染而不是条件 Hook。

### 方案 3：使用 useMemo/useCallback 包装条件逻辑

确保 Hook 调用顺序一致，但使用 `useMemo` 来条件性地返回值。

## 推荐修复

**立即修复**：采用方案 1，确保 `useQuery` 始终被调用，但通过传入 `undefined` 作为 `options` 参数来跳过实际的数据获取。

这样可以：
1. ✅ 保持 Hook 调用顺序一致
2. ✅ 避免条件性 Hook 调用
3. ✅ 保持代码逻辑清晰
4. ✅ 符合 React Hooks 规则

## 相关文件

- `baibanfront/packages/frontend/admin/src/modules/common.ts` (第161-187行)
- `baibanfront/packages/frontend/admin/src/use-query.ts` (第62-79行)
- `baibanfront/packages/frontend/admin/src/app.tsx` (第90-147行)

## 注意事项

1. **React Hooks 规则**：Hooks 必须在组件的顶层调用，不能在条件语句、循环或嵌套函数中调用
2. **一致性**：每次渲染时，Hook 必须按照相同的顺序调用
3. **条件控制**：如果需要条件逻辑，应该通过参数控制，而不是条件调用 Hook

