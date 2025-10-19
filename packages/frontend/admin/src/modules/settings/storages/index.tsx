import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@yunke/admin/components/ui/tabs';

import { Header } from '../../header';
import { StorageProviders } from './components/storage-providers';
import { StorageUsageCard } from './components/storage-usage';
import { FileManagement } from './components/file-management';
import { StorageCleanup } from './components/storage-cleanup';
import { StorageOverview } from './components/storage-overview';
import { StorageStatsProvider } from './hooks/storage-stats-context';

function StorageSettingsPage() {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <StorageStatsProvider>
      <div className="flex h-screen flex-1 flex-col">
        <Header 
          title="存储服务" 
          endFix={
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                存储配置和文件管理
              </span>
            </div>
          }
        />
        
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full flex-col gap-6 p-6">
            <StorageOverview />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
              <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent p-0">
                <TabsTrigger value="providers">提供商</TabsTrigger>
                <TabsTrigger value="usage">使用情况</TabsTrigger>
                <TabsTrigger value="files">文件管理</TabsTrigger>
                <TabsTrigger value="cleanup">清理</TabsTrigger>
              </TabsList>
              
              <div className="mt-6 flex-1 overflow-auto">
                <TabsContent value="providers" className="mt-0 space-y-6">
                  <StorageProviders />
                </TabsContent>
                
                <TabsContent value="usage" className="mt-0 space-y-6">
                  <StorageUsageCard />
                </TabsContent>
                
                <TabsContent value="files" className="mt-0 space-y-6">
                  <FileManagement />
                </TabsContent>
                
                <TabsContent value="cleanup" className="mt-0 space-y-6">
                  <StorageCleanup />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </StorageStatsProvider>
  );
}

export { StorageSettingsPage as Component };
