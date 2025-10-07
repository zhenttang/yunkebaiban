import { type ReactNode, createContext, useContext } from 'react';

import { useStorageStats } from './use-storage-stats';

const StorageStatsContext = createContext<ReturnType<typeof useStorageStats> | null>(null);

interface StorageStatsProviderProps {
  readonly children: ReactNode;
}

export const StorageStatsProvider = ({ children }: StorageStatsProviderProps) => {
  const value = useStorageStats();

  return (
    <StorageStatsContext.Provider value={value}>
      {children}
    </StorageStatsContext.Provider>
  );
};

export const useStorageStatsContext = () => {
  const context = useContext(StorageStatsContext);

  if (!context) {
    throw new Error('useStorageStatsContext must be used within StorageStatsProvider');
  }

  return context;
};
