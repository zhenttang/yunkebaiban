import { SidebarIcon } from '@blocksuite/icons/rc';
import { CheckIcon, XIcon } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Breadcrumbs } from './breadcrumb';
import { useMediaQuery } from './common';
import { useLeftPanel } from './panel/context';

export const Header = ({
  title,
  endFix,
  subtitle,
}: {
  title: string;
  endFix?: React.ReactNode;
  subtitle?: string;
}) => {
  const { togglePanel } = useLeftPanel();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  return (
    <div className="sticky top-0 z-20 animate-fade-in border-b border-slate-200/40">
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent"></div>
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50"></div>
      
      <div className={`relative flex items-center gap-4 h-[70px] ${isSmallScreen ? 'pl-4 pr-4' : 'px-6'}`}>
        {isSmallScreen ? null : (
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-9 w-9 rounded-full hover:bg-slate-100/80 hover:shadow-sm transition-all duration-200 hover:scale-105 group"
            onClick={togglePanel}
          >
            <SidebarIcon width={22} height={22} className="text-slate-700 transition-transform group-hover:rotate-[15deg] duration-200" />
          </Button>
        )}
        {!isSmallScreen && <Separator orientation="vertical" className="h-6 bg-slate-200/60" />}
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{title}</h1>
          <Breadcrumbs />
        </div>
        {endFix && <div className="ml-auto">{endFix}</div>}
      </div>
    </div>
  );
};

export const RightPanelHeader = ({
  title,
  handleClose,
  handleConfirm,
  canSave,
  subtitle,
}: {
  title: string;
  handleClose: () => void;
  handleConfirm: () => void;
  canSave: boolean;
  subtitle?: string;
}) => {
  return (
    <div className="sticky top-0 z-10">
      <div className="absolute inset-0 bg-white/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] via-white/40 to-secondary/[0.01]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-300/40 to-transparent"></div>
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/50"></div>
      
      <div className="relative flex justify-between items-center h-[70px] px-6">
        <Button
          type="button"
          size="icon-sm"
          className="w-9 h-9 rounded-full transition-all duration-200 hover:scale-105 hover:bg-slate-100/70 group"
          variant="ghost"
          onClick={handleClose}
        >
          <XIcon size={18} className="text-slate-600 transition-transform group-hover:rotate-90 duration-300" />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-base font-medium text-slate-800">{title}</span>
          {subtitle && <p className="subtitle text-xs text-slate-500">{subtitle}</p>}
        </div>
        <Button
          type="submit"
          size="icon-sm"
          className={`w-9 h-9 rounded-full transition-all duration-300 hover:scale-105 ${canSave ? 'bg-primary/90 hover:bg-primary shadow-sm hover:shadow' : 'text-slate-400'} group`}
          variant={canSave ? "default" : "ghost"}
          onClick={handleConfirm}
          disabled={!canSave}
        >
          <CheckIcon size={18} className={`${canSave ? 'group-hover:scale-110 transition-transform duration-300' : ''}`} />
        </Button>
      </div>
      <Separator className="shadow-[0_1px_2px_rgba(0,0,0,0.03)] relative z-10" />
    </div>
  );
};
