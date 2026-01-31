import React, { createContext, useContext, type PropsWithChildren } from 'react';

interface NavigationSyncContextType {
  markUserNavigation: () => void;
}

const NavigationSyncContext = createContext<NavigationSyncContextType | null>(null);

export const NavigationSyncProvider = ({ 
  children, 
  markUserNavigation 
}: PropsWithChildren<{ markUserNavigation: () => void }>) => {
  return (
    <NavigationSyncContext.Provider value={{ markUserNavigation }}>
      {children}
    </NavigationSyncContext.Provider>
  );
};

export const useNavigationSyncContext = () => {
  const context = useContext(NavigationSyncContext);
  if (!context) {
    // 如果没有 context，返回空函数，不影响功能
    return { markUserNavigation: () => {} };
  }
  return context;
};