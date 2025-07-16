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

import { KNOWN_CONFIG_GROUPS, UNKNOWN_CONFIG_GROUPS } from '../settings/config';
import { NormalSubItem } from './collapsible-item';
import { useNav } from './context';

// 系统设置中保留的配置组 - 显示更多高级配置
const SYSTEM_CONFIG_GROUPS = [
  {
    name: '任务管理',
    module: 'job',
  },
  {
    name: '文档服务',
    module: 'doc',
  },
  {
    name: 'WebSocket',
    module: 'websocket',
  },
];

// 从UNKNOWN_CONFIG_GROUPS中筛选出所有实验性功能
const EXPERIMENTAL_CONFIG_GROUPS = UNKNOWN_CONFIG_GROUPS;

export const SettingsItem = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { setCurrentModule } = useNav();

  // 定义设置的颜色方案
  const colors = {
    from: 'from-green-400/20',
    to: 'to-emerald-500/30',
    activeBg: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80',
    activeBorder: 'border-green-200/50',
    activeText: 'text-emerald-700',
    hoverBg: 'hover:bg-emerald-50/50',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-600',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  };

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
                to={'/admin/settings'}
                className={({ isActive }) => cn(
                  buttonVariants({
                    variant: 'ghost',
                    className: 'w-10 h-10 relative overflow-hidden',
                    size: 'icon',
                  }),
                  'transition-all duration-300 hover:translate-y-[-1px] rounded-xl border border-transparent',
                  isActive 
                    ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeText} ${colors.glow} backdrop-blur-sm relative z-10`
                    : `hover:${colors.hoverBg} hover:border-slate-200/40 hover:shadow-sm`
                )}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className={`absolute inset-0 opacity-20 blur-sm bg-gradient-to-br ${colors.from} ${colors.to}`}></div>
                    )}
                    <div className={cn(
                      "relative z-10 flex items-center justify-center w-full h-full",
                      isActive && "animate-subtle-pulse"
                    )}>
                      <SettingsIcon fontSize={18} />
                    </div>
                  </>
                )}
              </NavLink>
            </NavigationMenuPrimitive.Trigger>
            <NavigationMenuPrimitive.Content>
              <ul
                className="border rounded-xl w-full flex flex-col p-1.5 min-w-[180px] max-h-[240px] overflow-y-auto shadow-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(209, 213, 219, 0.4)',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08), 0 1px 3px rgba(16, 185, 129, 0.1)',
                }}
              >
                {SYSTEM_CONFIG_GROUPS.map(group => (
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
                          ? 'bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 text-emerald-700 shadow-inner border-l-2 border-emerald-400/40'
                          : 'hover:bg-emerald-50/30'
                      )}
                      onClick={() => setCurrentModule?.(group.module)}
                    >
                      {group.name}
                    </NavLink>
                  </li>
                ))}
                <li className="flex border-t border-emerald-100/30 mt-1 pt-1">
                  <div className="text-xs font-medium text-emerald-600/70 px-2.5 py-1 w-full">实验功能</div>
                </li>
                {EXPERIMENTAL_CONFIG_GROUPS.map(group => (
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
                          ? 'bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 text-emerald-700 shadow-inner border-l-2 border-emerald-400/40'
                          : 'hover:bg-emerald-50/30'
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
            'flex items-center justify-between w-full px-2.5 py-2.5 my-0.5 rounded-xl transition-all duration-300 hover:bg-emerald-50/30 border border-transparent hover:border-slate-200/40 relative overflow-hidden [&[data-state=closed]>svg]:rotate-270 [&[data-state=open]>svg]:rotate-360 [&[data-state=open]]:bg-gradient-to-br [&[data-state=open]]:from-emerald-50/80 [&[data-state=open]]:to-emerald-100/60 [&[data-state=open]]:border-emerald-200/50 [&[data-state=open]]:text-emerald-700 [&[data-state=open]]:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
          }
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center p-1 mr-2.5 rounded-full w-5 h-5 bg-emerald-100/70 text-emerald-600">
              <SettingsIcon fontSize={18} />
            </div>
            <span className="font-medium">高级设置</span>
          </div>
        </AccordionTrigger>

        <AccordionContent className="h-full overflow-hidden w-full pb-0">
          <ScrollAreaPrimitive.Root
            className={cn('relative overflow-hidden w-full h-full')}
          >
            <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit] [&>div]:!block">
              <div className="pl-2.5 pr-1 py-1.5 my-1 rounded-xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/40 backdrop-blur-sm">
                {SYSTEM_CONFIG_GROUPS.map(group => (
                  <NormalSubItem
                    key={group.module}
                    module={group.module}
                    title={group.name}
                    changeModule={setCurrentModule}
                    activeClass="bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 text-emerald-700 shadow-inner border-l-2 border-emerald-400/40"
                    hoverClass="hover:bg-emerald-50/50"
                  />
                ))}
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger 
                      className="ml-8 py-2.5 px-2.5 rounded-lg [&[data-state=closed]>svg]:rotate-270 [&[data-state=open]>svg]:rotate-360 hover:bg-emerald-50/40 transition-all duration-300 [&[data-state=open]]:bg-emerald-50/60 text-emerald-700/80">
                      <span className="text-sm font-medium">实验功能</span>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1 py-1.5 bg-gradient-to-br from-emerald-50/40 to-emerald-100/30 rounded-lg ml-7 mr-1 my-1.5">
                      {EXPERIMENTAL_CONFIG_GROUPS.map(group => (
                        <NormalSubItem
                          key={group.module}
                          module={group.module}
                          title={group.name}
                          changeModule={setCurrentModule}
                          activeClass="bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 text-emerald-700 shadow-inner border-l-2 border-emerald-400/40"
                          hoverClass="hover:bg-emerald-50/50"
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollAreaPrimitive.Viewport>
            <ScrollAreaPrimitive.ScrollAreaScrollbar
              className={cn(
                'flex touch-none select-none transition-colors',
                'h-full w-2 border-l border-l-transparent p-[1px]'
              )}
            >
              <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-emerald-500/20" />
            </ScrollAreaPrimitive.ScrollAreaScrollbar>
            <ScrollAreaPrimitive.Corner />
          </ScrollAreaPrimitive.Root>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
