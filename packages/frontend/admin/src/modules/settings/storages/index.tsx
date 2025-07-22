import { cn } from '@affine/admin/utils';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@affine/admin/components/ui/tabs';

import { Header } from '../../header';
import { StorageProviders } from './components/storage-providers';
import { StorageUsageCard } from './components/storage-usage';
import { FileManagement } from './components/file-management';
import { StorageCleanup } from './components/storage-cleanup';

function StorageSettingsPage() {
  const [activeTab, setActiveTab] = useState('providers');

  return (
    <div className="h-screen flex-1 flex-col flex">
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
        <div className="h-full p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="providers">提供商</TabsTrigger>
              <TabsTrigger value="usage">使用情况</TabsTrigger>
              <TabsTrigger value="files">文件管理</TabsTrigger>
              <TabsTrigger value="cleanup">清理</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 mt-6 overflow-auto">
              <TabsContent value="providers" className="mt-0">
                <div className="space-y-6">
                  <StorageProviders />
                </div>
              </TabsContent>
              
              <TabsContent value="usage" className="mt-0">
                <div className="space-y-6">
                  <StorageUsageCard />
                </div>
              </TabsContent>
              
              <TabsContent value="files" className="mt-0">
                <div className="space-y-6">
                  <FileManagement />
                </div>
              </TabsContent>
              
              <TabsContent value="cleanup" className="mt-0">
                <div className="space-y-6">
                  <StorageCleanup />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export { StorageSettingsPage as Component };