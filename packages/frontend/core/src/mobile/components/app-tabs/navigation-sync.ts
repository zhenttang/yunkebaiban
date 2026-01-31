/**
 * 底部导航状态同步服务
 * 实现路由变化和底部导航状态的双向同步
 */

import { GlobalCacheService } from '@yunke/core/modules/storage';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';

const ACTIVE_TAB_KEY = 'activeAppTabId';

/**
 * 根据路径推断底部导航标签ID
 */
function getTabIdFromPath(pathname: string, currentTabId?: string): string | null {
  console.log(`[NavigationSync] 分析路径: ${pathname}, 当前标签: ${currentTabId}`);
  
  // 移除 basename，只保留相对路径
  const relativePath = pathname.replace(/^\/workspace\/[^/]+/, '') || '/';
  
  // 精确映射 - 这些页面应该立即切换标签
  const exactMatches: Record<string, string> = {
    '/': 'home',
    '/home': 'home',
    '/all': 'all',
    '/collection': 'all',
    '/tag': 'all',
    '/trash': 'all',
  };
  
  if (exactMatches[relativePath]) {
    console.log(`[NavigationSync] 精确匹配: ${relativePath} → ${exactMatches[relativePath]}`);
    return exactMatches[relativePath];
  }
  
  // 日记页面检查
  if (pathname.includes('/journal') || pathname.includes('/today') || pathname.includes('/今天')) {
    console.log(`[NavigationSync] 日记页面: ${relativePath} → journal`);
    return 'journal';
  }
  
  // 🔧 文档页面智能处理
  if (relativePath.startsWith('/') && relativePath.length > 1) {
    // 这是一个文档页面
    
    // 如果当前没有活跃标签，设置为 home
    if (!currentTabId || currentTabId === 'home') {
      console.log(`[NavigationSync] 文档页面，设置为 home: ${relativePath}`);
      return 'home';
    }
    
    // 如果当前标签是 new，说明用户刚创建了文档，保持 new 状态一段时间
    if (currentTabId === 'new') {
      console.log(`[NavigationSync] 刚创建的文档页面，保持 new 状态: ${relativePath}`);
      return null; // 保持当前状态
    }
    
    // 如果当前标签是 journal，检查是否真的是日记页面
    if (currentTabId === 'journal') {
      console.log(`[NavigationSync] 可能的日记页面，保持 journal 状态: ${relativePath}`);
      return null; // 保持当前状态
    }
    
    // 其他情况，保持当前状态（避免打断用户的工作流）
    console.log(`[NavigationSync] 文档页面，保持当前状态 ${currentTabId}: ${relativePath}`);
    return null;
  }
  
  // 默认情况
  console.log(`[NavigationSync] 未知页面，设置为 home: ${relativePath}`);
  return 'home';
}

/**
 * 底部导航同步 Hook
 * 监听 workbench 路由变化，自动同步底部导航状态
 */
export const useNavigationSync = () => {
  const workbench = useService(WorkbenchService).workbench;
  const globalCache = useService(GlobalCacheService).globalCache;
  const location = useLiveData(workbench.location$);
  
  // 使用 ref 追踪是否是用户主动的底部导航点击
  const userTriggeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!location?.pathname) return;

    // 如果是用户主动点击底部导航导致的路由变化，跳过同步
    if (userTriggeredRef.current) {
      console.log(`[NavigationSync] 跳过用户触发的路由变化: ${location.pathname}`);
      return;
    }

    const currentTabId = globalCache.get(ACTIVE_TAB_KEY) as string;
    const expectedTabId = getTabIdFromPath(location.pathname, currentTabId);
    
    if (expectedTabId === null) {
      // 保持当前状态
      console.log(`[NavigationSync] 保持当前标签状态: ${currentTabId}`);
      return;
    }

    if (expectedTabId !== currentTabId) {
      console.log(`[NavigationSync] 同步导航状态: ${location.pathname} → ${expectedTabId} (之前: ${currentTabId})`);
      globalCache.set(ACTIVE_TAB_KEY, expectedTabId);
    }
  }, [location?.pathname, globalCache]);

  // 提供标记用户点击的方法
  return {
    markUserNavigation: () => {
      console.log(`[NavigationSync] 标记用户主动导航`);
      userTriggeredRef.current = true;
      
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // 500ms 后重置标记
      timerRef.current = setTimeout(() => {
        userTriggeredRef.current = false;
        console.log(`[NavigationSync] 重置用户导航标记`);
      }, 500);
    }
  };
};