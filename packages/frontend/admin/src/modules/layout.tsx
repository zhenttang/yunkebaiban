import {
  ResizablePanel,
  ResizablePanelGroup,
} from '@yunke/admin/components/ui/resizable';
import { Separator } from '@yunke/admin/components/ui/separator';
import { TooltipProvider } from '@yunke/admin/components/ui/tooltip';
import { cn } from '@yunke/admin/utils';
import { cssVarV2 } from '@toeverything/theme/v2';
import { AlignJustifyIcon } from 'lucide-react';
import type { PropsWithChildren, ReactNode, RefObject } from 'react';
import { useCallback, useRef, useState, useEffect } from 'react';
import type { ImperativePanelHandle } from 'react-resizable-panels';

import { Button } from '../components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '../components/ui/sheet';
import { Logo } from './accounts/components/logo';
import { useMediaQuery } from './common';
import { NavContext } from './nav/context';
import { Nav } from './nav/nav';
import {
  PanelContext,
  type ResizablePanelProps,
  useRightPanel,
} from './panel/context';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../components/ui/command';
import { useNavigate } from 'react-router-dom';
import { AccountIcon, AiOutlineIcon, SelfhostIcon, SettingsIcon } from '@blocksuite/icons/rc';

export function Layout({ children }: PropsWithChildren) {
  const [rightPanelContent, setRightPanelContent] = useState<ReactNode>(null);
  const [leftPanelContent, setLeftPanelContent] = useState<ReactNode>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const rightPanelRef = useRef<ImperativePanelHandle>(null);
  const leftPanelRef = useRef<ImperativePanelHandle>(null);

  const [activeTab, setActiveTab] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('server');
  const [currentModule, setCurrentModule] = useState('server');
  const [openCommand, setOpenCommand] = useState(false);
  const navigate = useNavigate();

  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  
  // 在屏幕尺寸变化时处理面板状态
  useEffect(() => {
    // 如果从移动端切换到桌面端，确保侧边栏显示正常
    if (!isSmallScreen && leftPanelRef.current) {
      if (leftOpen) {
        leftPanelRef.current.expand();
      } else {
        leftPanelRef.current.collapse();
      }
    }
  }, [isSmallScreen, leftOpen]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpenCommand(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback(
    (command: () => unknown) => {
      setOpenCommand(false);
      command();
    },
    []
  );

  const handleLeftExpand = useCallback(() => {
    if (leftPanelRef.current?.getSize() === 0) {
      leftPanelRef.current?.resize(30);
    }
    setLeftOpen(true);
  }, [leftPanelRef]);

  const handleLeftCollapse = useCallback(() => {
    if (leftPanelRef.current?.getSize() !== 0) {
      leftPanelRef.current?.resize(0);
    }
    setLeftOpen(false);
  }, [leftPanelRef]);

  const openLeftPanel = useCallback(() => {
    handleLeftExpand();
    leftPanelRef.current?.expand();
    setLeftOpen(true);
  }, [handleLeftExpand]);

  const closeLeftPanel = useCallback(() => {
    handleLeftCollapse();
    leftPanelRef.current?.collapse();
    setLeftOpen(false);
  }, [handleLeftCollapse]);

  const toggleLeftPanel = useCallback(
    () =>
      leftPanelRef.current?.isCollapsed() ? openLeftPanel() : closeLeftPanel(),
    [openLeftPanel, closeLeftPanel]
  );

  const handleRightExpand = useCallback(() => {
    if (rightPanelRef.current?.getSize() === 0) {
      rightPanelRef.current?.resize(30);
    }
    setRightOpen(true);
  }, [rightPanelRef]);

  const handleRightCollapse = useCallback(() => {
    if (rightPanelRef.current?.getSize() !== 0) {
      rightPanelRef.current?.resize(0);
    }
    setRightOpen(false);
  }, [rightPanelRef]);

  const openRightPanel = useCallback(() => {
    handleRightExpand();
    rightPanelRef.current?.expand();
    setRightOpen(true);
  }, [handleRightExpand]);

  const closeRightPanel = useCallback(() => {
    handleRightCollapse();
    rightPanelRef.current?.collapse();
    setRightOpen(false);
  }, [handleRightCollapse]);

  const toggleRightPanel = useCallback(
    () =>
      rightPanelRef.current?.isCollapsed()
        ? openRightPanel()
        : closeRightPanel(),
    [closeRightPanel, openRightPanel]
  );

  return (
    <>
      <PanelContext.Provider
        value={{
          leftPanel: {
            isOpen: leftOpen,
            panelContent: leftPanelContent,
            setPanelContent: setLeftPanelContent,
            togglePanel: toggleLeftPanel,
            openPanel: openLeftPanel,
            closePanel: closeLeftPanel,
          },
          rightPanel: {
            isOpen: rightOpen,
            panelContent: rightPanelContent,
            setPanelContent: setRightPanelContent,
            togglePanel: toggleRightPanel,
            openPanel: openRightPanel,
            closePanel: closeRightPanel,
          },
        }}
      >
        <NavContext.Provider
          value={{
            activeTab,
            activeSubTab,
            currentModule,
            setActiveTab,
            setActiveSubTab,
            setCurrentModule,
          }}
        >
          <TooltipProvider delayDuration={0}>
            <div className="flex h-[100dvh] overflow-hidden bg-gradient-to-br from-background via-background to-background/95 fixed inset-0">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_rgba(var(--primary-rgb)/0.06),transparent_70%),radial-gradient(ellipse_at_bottom_left,_rgba(var(--secondary-rgb)/0.06),transparent_70%),radial-gradient(ellipse_at_top_left,_rgba(99,102,241,0.03),transparent_50%)] pointer-events-none z-0"></div>
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-mesh opacity-40 pointer-events-none z-0"></div>
              <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-[2px] pointer-events-none z-0 opacity-60"></div>
              <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background/30 to-transparent opacity-40 pointer-events-none z-0"></div>
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl opacity-30 animate-blob pointer-events-none"></div>
              <div className="absolute top-20 -right-20 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none"></div>
              <div className="absolute bottom-0 left-40 w-80 h-80 bg-green-500/5 rounded-full blur-3xl opacity-30 animate-blob animation-delay-4000 pointer-events-none"></div>
              <div className="absolute top-1/3 left-1/4 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl opacity-30 animate-blob animation-delay-3000 pointer-events-none"></div>
              <div className="absolute bottom-1/3 right-1/4 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl opacity-30 animate-blob animation-delay-5000 pointer-events-none"></div>
              
              {/* 移动端菜单按钮 */}
              {isSmallScreen && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="fixed top-6 left-1 p-0 h-8 w-8 z-50 bg-white/80 shadow-md rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:shadow-lg hover:bg-white/90 hover:scale-105 transition-all duration-300 btn-scale-flash"
                    >
                      <AlignJustifyIcon size={16} className="text-slate-700" />
                    </Button>
                  </SheetTrigger>
                  <SheetHeader className="hidden">
                    <SheetTitle>AFFiNE</SheetTitle>
                    <SheetDescription>
                      用于管理账户、AI、配置和设置的管理面板
                    </SheetDescription>
                  </SheetHeader>
                  <SheetContent side="left" className="p-0 backdrop-blur-xl bg-white/90 border-r shadow-lg colorful-container" withoutCloseButton>
                    <div className="flex flex-col w-full h-full">
                      <div className="flex h-[60px] items-center gap-2 px-4 text-base font-medium border-b border-slate-200/70">
                        <Logo />
                        <span className="font-semibold tracking-tight">AFFiNE</span>
                      </div>
                      <Nav />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
              
              <ResizablePanelGroup 
                direction="horizontal" 
                className="w-full relative z-10"
                autoSaveId="admin-layout"
              >
                {!isSmallScreen && (
                  <LeftPanel
                    panelRef={leftPanelRef as RefObject<ImperativePanelHandle>}
                    onExpand={handleLeftExpand}
                    onCollapse={handleLeftCollapse}
                  />
                )}
                <ResizablePanel 
                  id="1" 
                  order={1} 
                  minSize={50} 
                  defaultSize={isSmallScreen ? 100 : 50}
                  style={{
                    width: isSmallScreen ? '100%' : undefined,
                    minWidth: isSmallScreen ? '100%' : undefined,
                    maxWidth: isSmallScreen ? '100%' : undefined,
                  }}
                  className="relative"
                >
                  <div className="h-full overflow-hidden colorful-container">
                    {children}
                  </div>
                </ResizablePanel>
                {!isSmallScreen && (
                  <RightPanel
                    panelRef={rightPanelRef as RefObject<ImperativePanelHandle>}
                    onExpand={handleRightExpand}
                    onCollapse={handleRightCollapse}
                  />
                )}
              </ResizablePanelGroup>
              
              {/* 移动端右侧面板 */}
              {isSmallScreen && rightOpen && (
                <Sheet open={rightOpen} onOpenChange={(open) => open ? openRightPanel() : closeRightPanel()}>
                  <SheetContent side="right" className="p-0 backdrop-blur-xl bg-white/85 border-l shadow-lg colorful-container" withoutCloseButton>
                    {rightPanelContent}
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </TooltipProvider>
        </NavContext.Provider>
      </PanelContext.Provider>
      <CommandDialog open={openCommand} onOpenChange={setOpenCommand}>
        <CommandInput placeholder="输入命令或搜索..." />
        <CommandList>
          <CommandEmpty>未找到结果。</CommandEmpty>
          <CommandGroup heading="建议">
            <CommandItem onSelect={() => runCommand(() => navigate('/admin/accounts'))}>
              <AccountIcon className="mr-2 h-4 w-4" />
              <span>账户</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/admin/ai'))}>
              <AiOutlineIcon className="mr-2 h-4 w-4" />
              <span>AI</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate('/admin/settings'))}>
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>设置</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="常规">
            <CommandItem onSelect={() => runCommand(() => navigate('/admin/about'))}>
              <SelfhostIcon className="mr-2 h-4 w-4" />
              <span>关于</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

export const LeftPanel = ({
  panelRef,
  onExpand,
  onCollapse,
}: ResizablePanelProps) => {
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const isCollapsed = panelRef.current?.isCollapsed();

  // 移动端下的处理已移到主Layout组件中
  if (isSmallScreen) {
    return null;
  }

  return (
    <ResizablePanel
      id="0"
      order={0}
      ref={panelRef}
      defaultSize={15}
      maxSize={15}
      minSize={15}
      collapsible={true}
      collapsedSize={2}
      onExpand={onExpand}
      onCollapse={onCollapse}
      className={cn(
        isCollapsed ? 'min-w-[57px] max-w-[57px]' : 'min-w-56 max-w-56',
        'border-r h-dvh transition-all duration-300'
      )}
      style={{ overflow: 'visible' }}
    >
      <div
        className="flex flex-col max-w-56 h-full shadow-md bg-white/90 backdrop-blur-md relative z-10 colorful-container"
      >
        <div
          className={cn(
            'flex h-[60px] items-center px-4 text-base font-medium border-b border-slate-200/70',
            isCollapsed && 'justify-center px-2'
          )}
        >
          <span
            className={cn(
              'flex items-center p-0.5 mr-2',
              isCollapsed && 'justify-center px-2 mr-0'
            )}
          >
            <Logo />
          </span>
          {!isCollapsed && <span className="font-semibold tracking-tight">AFFiNE</span>}
        </div>
        <Nav isCollapsed={isCollapsed} />
      </div>
    </ResizablePanel>
  );
};

export const RightPanel = ({
  panelRef,
  onExpand,
  onCollapse,
}: ResizablePanelProps) => {
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const { panelContent, isOpen } = useRightPanel();
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        onExpand();
      } else {
        onCollapse();
      }
    },
    [onExpand, onCollapse]
  );

  // 移动端下的处理已移到主Layout组件中
  if (isSmallScreen) {
    return null;
  }

  return (
    <ResizablePanel
      id="2"
      order={2}
      ref={panelRef}
      defaultSize={0}
      maxSize={20}
      collapsible={true}
      collapsedSize={0}
      onExpand={onExpand}
      onCollapse={onCollapse}
      className="border-l max-w-96 shadow-md bg-white/90 backdrop-blur-md colorful-container"
    >
      {panelContent}
    </ResizablePanel>
  );
};
