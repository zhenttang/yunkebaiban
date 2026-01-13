import { Switch } from '@yunke/admin/components/ui/switch';
import { cn } from '@yunke/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useState } from 'react';

import { Header } from '../header';

function AiPage() {
  const [enableAi, setEnableAi] = useState(false);

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header title="人工智能" />
      <ScrollAreaPrimitive.Root
        className={cn('relative overflow-hidden w-full')}
      >
        <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
          <div className="p-6 max-w-3xl mx-auto">
            <div className="text-[20px]">人工智能</div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[15px] font-medium mt-6">启用人工智能</p>
                <p className="text-sm text-muted-foreground mt-1">
                  目前不支持人工智能功能。自托管AI支持正在开发中。
                </p>
              </div>
              <Switch
                checked={enableAi}
                onCheckedChange={setEnableAi}
                disabled={true}
              />
            </div>
          </div>
          {/* <Prompts /> */}
        </ScrollAreaPrimitive.Viewport>
        <ScrollAreaPrimitive.ScrollAreaScrollbar
          className={cn(
            'flex touch-none select-none transition-colors',
            'h-full w-2.5 border-l border-l-transparent p-[1px]'
          )}
        >
          <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
        </ScrollAreaPrimitive.ScrollAreaScrollbar>
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    </div>
  );
}

export { AiPage as Component };
