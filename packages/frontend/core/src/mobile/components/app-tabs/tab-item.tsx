import { GlobalCacheService } from '@yunke/core/modules/storage';
import { LiveData, useLiveData, useService } from '@toeverything/infra';
import { type PropsWithChildren, useCallback, useEffect, useMemo } from 'react';

import { useNavigationSyncContext } from './navigation-context';
import { tabItem } from './styles.css';

export interface TabItemProps extends PropsWithChildren {
  id: string;
  label: string;
  onClick?: (isActive: boolean) => void;
}

const cacheKey = 'activeAppTabId';
let isInitialized = false;
export const TabItem = ({ id, label, children, onClick }: TabItemProps) => {
  const globalCache = useService(GlobalCacheService).globalCache;
  const { markUserNavigation } = useNavigationSyncContext();
  
  const activeTabId$ = useMemo(
    () => LiveData.from(globalCache.watch(cacheKey), 'home'),
    [globalCache]
  );
  const activeTabId = useLiveData(activeTabId$) ?? 'home';

  const isActive = id === activeTabId;

  const handleClick = useCallback(() => {
    console.log(`[TabItem] 点击标签: ${id}, 当前激活: ${isActive}`);
    
    // 🔧 如果已经是激活状态，不需要处理
    if (isActive) {
      console.log(`[TabItem] 标签 ${id} 已经是激活状态，跳过处理`);
      return;
    }
    
    // 🔧 标记用户主动导航，避免自动同步冲突
    markUserNavigation();
    
    // 🔧 立即更新状态，确保视觉反馈及时
    globalCache.set(cacheKey, id);
    
    // 🔧 调用点击回调（传入激活后的状态）
    onClick?.(false); // 传入 false 因为这是点击时的状态，点击后会变为 true
  }, [globalCache, id, isActive, onClick, markUserNavigation]);

  useEffect(() => {
    if (isInitialized) return;
    isInitialized = true;
    if (BUILD_CONFIG.isIOS || BUILD_CONFIG.isAndroid) {
      globalCache.set(cacheKey, 'home');
    }
  }, [globalCache]);

  return (
    <li
      className={tabItem}
      role="tab"
      aria-label={label}
      data-active={isActive}
      onClick={handleClick}
    >
      {children}
    </li>
  );
};
