import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@affine/admin/components/ui/accordion';
import { buttonVariants } from '@affine/admin/components/ui/button';
import { cn } from '@affine/admin/utils';
import { SettingsIcon } from '@blocksuite/icons/rc';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { cssVarV2 } from '@toeverything/theme/v2';
import { NavLink } from 'react-router-dom';

import { NormalSubItem } from './collapsible-item';
import { useNav } from './context';

// 基础设施相关的配置组
const INFRA_CONFIG_GROUPS = [
  {
    name: '服务器',
    module: 'server',
  },
  {
    name: '存储服务',
    module: 'storages',
  },
  {
    name: '通知服务',
    module: 'mailer',
  },
];

export const InfraItem = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { setCurrentModule } = useNav();

  if (isCollapsed) {
    return (
      <NavigationMenuPrimitive.Root
        className="flex-none relative"
        orientation="vertical"
      >
        <NavigationMenuPrimitive.List>
          <NavigationMenuPrimitive.Item>
            <NavigationMenuPrimitive.Trigger className="[&>svg]:hidden m-0 p-0">
              <NavLink
                to={'/admin/infra'}
                className={({ isActive }) => cn(
                  buttonVariants({
                    variant: 'ghost',
                    className: 'w-10 h-10',
                    size: 'icon',
                  }),
                  'transition-all duration-300 hover:translate-y-[-1px] rounded-xl',
                  isActive 
                    ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(66,153,225,0.3),0_1px_3px_rgba(66,153,225,0.1)] backdrop-blur-sm hover:bg-primary/15' 
                    : 'hover:bg-primary/5 hover:shadow-sm'
                )}
              >
                <SettingsIcon fontSize={20} />
              </NavLink>
            </NavigationMenuPrimitive.Trigger>
            <NavigationMenuPrimitive.Content>
              <ul
                className="border rounded-xl w-full flex flex-col p-1.5 min-w-[160px] max-h-[200px] overflow-y-auto shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(209, 213, 219, 0.4)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
              >
                {INFRA_CONFIG_GROUPS.map(group => (
                  <li key={group.module} className="flex">
                    <NavLink
                      to={`/admin/settings/${group.module}`}
                      className={({ isActive }) => cn(
                        buttonVariants({
                          variant: 'ghost',
                          className: 'p-2.5 rounded-lg text-[14px] w-full justify-start font-normal',
                        }),
                        'transition-all duration-300',
                        isActive 
                          ? 'bg-primary/10 text-primary shadow-inner'
                          : 'hover:bg-primary/5'
                      )}
                      onClick={() => setCurrentModule?.(group.module)}
                    >
                      {group.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuPrimitive.Content>
          </NavigationMenuPrimitive.Item>
        </NavigationMenuPrimitive.List>
        <NavigationMenuPrimitive.Viewport className="absolute z-10 left-11 top-0" />
      </NavigationMenuPrimitive.Root>
    );
  }

  return (
    <Accordion type="multiple" className="w-full overflow-hidden">
      <AccordionItem
        value="item-1"
        className="border-b-0 h-full flex flex-col gap-1 w-full"
      >
        <AccordionTrigger
          className={
            'flex items-center justify-between w-full px-2.5 py-2.5 my-0.5 rounded-xl transition-all duration-200 hover:bg-primary/5 [&[data-state=closed]>svg]:rotate-270 [&[data-state=open]>svg]:rotate-360 [&[data-state=open]]:bg-gradient-to-br [&[data-state=open]]:from-primary/5 [&[data-state=open]]:to-primary/10 [&[data-state=open]]:shadow-sm'
          }
        >
          <div className="flex items-center">
            <span className="flex items-center p-0.5 mr-2.5">
              <SettingsIcon fontSize={20} className="text-primary/90" />
            </span>
            <span className="font-medium">基础设施</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="h-full overflow-hidden w-full pb-0">
          <ScrollAreaPrimitive.Root
            className={cn('relative overflow-hidden w-full h-full')}
          >
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
              <div className="pl-2.5 pr-1 py-1.5 my-1 rounded-xl bg-gradient-to-br from-transparent to-primary/5 backdrop-blur-sm">
                {INFRA_CONFIG_GROUPS.map(group => (
                  <NormalSubItem
                    key={group.module}
                    module={group.module}
                    title={group.name}
                    changeModule={setCurrentModule}
                  />
                ))}
              </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollAreaPrimitive.ScrollAreaScrollbar
              className={cn(
                'flex touch-none select-none transition-colors',
                'h-full w-2 border-l border-l-transparent p-[1px]'
              )}
            >
              <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-primary/20" />
            </ScrollAreaPrimitive.ScrollAreaScrollbar>
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}; 