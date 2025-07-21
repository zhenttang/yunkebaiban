/**
 * 修改自 useRefEffect https://github.com/jantimon/react-use-ref-effect/blob/master/src/index.tsx
 */
import { useDebugValue, useEffect, useState } from 'react';

// internalRef 用作引用，因此可以安全地在 effect 中使用
/* eslint-disable react-hooks/exhaustive-deps */

// `process.env.NODE_ENV !== 'production'` 条件由构建工具解析

const noop: (...args: any[]) => any = () => {};

/**
 * `useRefEffect` 返回一个可变的 ref 对象，用于连接 DOM 节点。
 *
 * 返回的对象将在组件的整个生命周期内保持。
 * 接受一个包含命令式、可能有副作用代码的函数。
 *
 * @param effect 可以返回清理函数的命令式函数
 * @param deps 如果存在，只有当 ref 或列表中的值发生变化时，effect 才会激活
 */
export const useRefEffect = <T>(
  effect: (element: T) => void | (() => void),
  dependencies: any[] = []
): React.RefCallback<T> & React.MutableRefObject<T | null> => {
  // 使用初始状态作为可变引用
  const internalRef = useState(() => {
    let currentValue = null as T | null;
    let cleanupPreviousEffect = noop as () => void;
    let currentDeps: any[] | undefined;
    /**
     * React.RefCallback
     */
    const setRefValue = (newElement: T | null) => {
      // 仅在依赖项或元素发生变化时执行：
      if (
        internalRef.dependencies_ !== currentDeps ||
        currentValue !== newElement
      ) {
        currentValue = newElement;
        currentDeps = internalRef.dependencies_;
        internalRef.cleanup_();
        if (newElement) {
          cleanupPreviousEffect = internalRef.effect_(newElement) || noop;
        }
      }
    };
    return {
      /** 执行 effect 的清理函数 */
      cleanup_: () => {
        cleanupPreviousEffect();
        cleanupPreviousEffect = noop;
      },
      ref_: Object.defineProperty(setRefValue, 'current', {
        get: () => currentValue,
        set: setRefValue,
      }),
    } as {
      cleanup_: () => void;
      ref_: React.RefCallback<T> & React.MutableRefObject<T | null>;
      // 这两个属性将在初始化后立即设置
      effect_: typeof effect;
      dependencies_: typeof dependencies;
    };
  })[0];

  // 在开发环境下在 React 开发工具中
  // 显示当前 ref 值
  if (BUILD_CONFIG.debug) {
    useDebugValue(internalRef.ref_.current);
  }

  // 保持对最新回调的引用
  internalRef.effect_ = effect;

  useEffect(
    () => {
      // 如果依赖项发生变化则运行 effect
      internalRef.ref_(internalRef.ref_.current);
      return () => {
        if (internalRef.dependencies_ === dependencies) {
          internalRef.cleanup_();
          internalRef.dependencies_ = [];
        }
      };
    }, // 保持对最新依赖项的引用
    (internalRef.dependencies_ = dependencies)
  );

  return internalRef.ref_;
};
