/**
 * 离线功能降级守卫
 *
 * 用于需要网络连接的功能（AI、社区、论坛等），
 * 在离线时显示统一的「需要网络连接」提示，而非让功能静默失败。
 *
 * 用法：
 *   const { guardOnline, OfflineOverlay } = useOfflineGuard();
 *   // 方式一：守卫回调
 *   const handleAIClick = guardOnline(() => { startAI(); });
 *   // 方式二：覆盖组件
 *   return <>{OfflineOverlay}<MyComponent /></>;
 */
import { toast } from '@yunke/component';
import { useCallback } from 'react';

import { useSystemOnline } from './use-system-online';

/**
 * 需要网络的功能类型
 */
type OnlineFeature =
  | 'ai'
  | 'community'
  | 'forum'
  | 'template-gallery'
  | 'share'
  | 'cloud-sync'
  | 'login'
  | 'default';

const FEATURE_NAMES: Record<OnlineFeature, string> = {
  ai: 'AI 辅助',
  community: '社区',
  forum: '论坛',
  'template-gallery': '模板库',
  share: '分享',
  'cloud-sync': '云同步',
  login: '登录',
  default: '此功能',
};

/**
 * 离线功能守卫 Hook
 *
 * @param feature 功能类型，用于生成友好的提示文案
 * @returns guardOnline 守卫函数，isOnline 在线状态
 */
export function useOfflineGuard(feature: OnlineFeature = 'default') {
  const isOnline = useSystemOnline();

  /**
   * 包裹一个需要网络的回调函数
   * 离线时显示 toast 提示，不执行原始回调
   */
  const guardOnline = useCallback(
    <T extends (...args: any[]) => any>(callback: T): T => {
      return ((...args: Parameters<T>) => {
        if (!isOnline) {
          const name = FEATURE_NAMES[feature] || FEATURE_NAMES.default;
          toast(`${name}需要网络连接，请检查网络后重试`);
          return undefined;
        }
        return callback(...args);
      }) as T;
    },
    [isOnline, feature]
  );

  /**
   * 异步版本的守卫函数
   */
  const guardOnlineAsync = useCallback(
    <T extends (...args: any[]) => Promise<any>>(callback: T): T => {
      return (async (...args: Parameters<T>) => {
        if (!isOnline) {
          const name = FEATURE_NAMES[feature] || FEATURE_NAMES.default;
          toast(`${name}需要网络连接，请检查网络后重试`);
          return undefined;
        }
        return callback(...args);
      }) as T;
    },
    [isOnline, feature]
  );

  return {
    isOnline,
    guardOnline,
    guardOnlineAsync,
  };
}

/**
 * 检查是否在线的简单工具函数（非 Hook，可在任意上下文使用）
 */
export function checkOnlineOrToast(feature: OnlineFeature = 'default'): boolean {
  const online =
    typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!online) {
    const name = FEATURE_NAMES[feature] || FEATURE_NAMES.default;
    toast(`${name}需要网络连接，请检查网络后重试`);
  }
  return online;
}
