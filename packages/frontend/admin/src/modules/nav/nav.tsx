import { buttonVariants } from '@affine/admin/components/ui/button';
import { cn } from '@affine/admin/utils';
import { AccountIcon, AiOutlineIcon, SelfhostIcon, SettingsIcon } from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { NavLink } from 'react-router-dom';

import { ServerVersion } from './server-version';
import { SettingsItem } from './settings-item';
import { SecurityItem } from './security-item';
import { InfraItem } from './infra-item';
import { MonitoringItem } from './monitoring-item';
import { UserDropdown } from './user-dropdown';

// 定义不同菜单项的颜色方案
const menuColors = {
  accounts: {
    from: 'from-blue-400/20',
    to: 'to-blue-500/30',
    activeBg: 'bg-gradient-to-br from-blue-50/80 to-blue-100/80',
    activeBorder: 'border-blue-200/50',
    activeText: 'text-blue-700',
    hoverBg: 'hover:bg-blue-50/50',
    iconBg: 'bg-blue-100/80',
    iconColor: 'text-blue-500',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]'
  },
  ai: {
    from: 'from-purple-400/20',
    to: 'to-purple-500/30',
    activeBg: 'bg-gradient-to-br from-purple-50/80 to-purple-100/80',
    activeBorder: 'border-purple-200/50',
    activeText: 'text-purple-700',
    hoverBg: 'hover:bg-purple-50/50',
    iconBg: 'bg-purple-100/80',
    iconColor: 'text-purple-500',
    glow: 'shadow-[0_0_15px_rgba(147,51,234,0.3)]'
  },
  settings: {
    from: 'from-green-400/20',
    to: 'to-emerald-500/30',
    activeBg: 'bg-gradient-to-br from-green-50/80 to-emerald-100/80',
    activeBorder: 'border-green-200/50',
    activeText: 'text-emerald-700',
    hoverBg: 'hover:bg-emerald-50/50',
    iconBg: 'bg-emerald-100/80',
    iconColor: 'text-emerald-500',
    glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]'
  },
  security: {
    from: 'from-red-400/20',
    to: 'to-red-500/30',
    activeBg: 'bg-gradient-to-br from-red-50/80 to-red-100/80',
    activeBorder: 'border-red-200/50',
    activeText: 'text-red-700',
    hoverBg: 'hover:bg-red-50/50',
    iconBg: 'bg-red-100/80',
    iconColor: 'text-red-500',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]'
  },
  infra: {
    from: 'from-amber-400/20',
    to: 'to-amber-500/30',
    activeBg: 'bg-gradient-to-br from-amber-50/80 to-amber-100/80',
    activeBorder: 'border-amber-200/50',
    activeText: 'text-amber-700',
    hoverBg: 'hover:bg-amber-50/50',
    iconBg: 'bg-amber-100/80',
    iconColor: 'text-amber-500',
    glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]'
  },
  monitoring: {
    from: 'from-cyan-400/20',
    to: 'to-cyan-500/30',
    activeBg: 'bg-gradient-to-br from-cyan-50/80 to-cyan-100/80',
    activeBorder: 'border-cyan-200/50',
    activeText: 'text-cyan-700',
    hoverBg: 'hover:bg-cyan-50/50',
    iconBg: 'bg-cyan-100/80',
    iconColor: 'text-cyan-500',
    glow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]'
  },
  about: {
    from: 'from-indigo-400/20',
    to: 'to-indigo-500/30',
    activeBg: 'bg-gradient-to-br from-indigo-50/80 to-indigo-100/80',
    activeBorder: 'border-indigo-200/50',
    activeText: 'text-indigo-700',
    hoverBg: 'hover:bg-indigo-50/50',
    iconBg: 'bg-indigo-100/80',
    iconColor: 'text-indigo-500',
    glow: 'shadow-[0_0_15px_rgba(99,102,241,0.3)]'
  }
};

// 根据路径获取菜单颜色
function getMenuColorsByPath(path: string) {
  if (path.includes('accounts')) return menuColors.accounts;
  if (path.includes('ai')) return menuColors.ai;
  if (path.includes('settings')) return menuColors.settings;
  if (path.includes('security')) return menuColors.security;
  if (path.includes('infra')) return menuColors.infra;
  if (path.includes('monitoring')) return menuColors.monitoring;
  if (path.includes('about')) return menuColors.about;
  return menuColors.accounts; // 默认值
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  colorKey: keyof typeof menuColors;
}

const NavItem = ({ icon, label, to, isCollapsed, colorKey }: NavItemProps) => {
  const colors = menuColors[colorKey];

  if (isCollapsed) {
    return (
      <NavLink
        to={to}
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
              {icon}
            </div>
          </>
        )}
      </NavLink>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        buttonVariants({
          variant: 'ghost',
        }),
        'justify-start flex-none text-sm font-medium px-3 py-2.5 rounded-xl transition-all duration-300 hover:translate-y-[-1px] border border-transparent relative overflow-hidden',
        isActive 
          ? `${colors.activeBg} ${colors.activeBorder} ${colors.activeText} ${colors.glow} relative z-10`
          : `hover:${colors.hoverBg} hover:border-slate-200/40 hover:shadow-sm`
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className={`absolute inset-0 opacity-20 blur-sm bg-gradient-to-br ${colors.from} ${colors.to}`}></div>
          )}
          <div className="relative z-10 flex items-center w-full">
            <div className={cn(
              "flex items-center justify-center p-1 mr-2.5 rounded-full w-5 h-5",
              isActive ? colors.iconBg : "bg-slate-100/70",
              isActive ? colors.iconColor : "text-slate-500"
            )}>
              {icon}
            </div>
            <span className={cn(
              isActive ? colors.activeText : "text-slate-700"
            )}>{label}</span>
          </div>
        </>
      )}
    </NavLink>
  );
};

interface NavProps {
  isCollapsed?: boolean;
}

export function Nav({ isCollapsed = false }: NavProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 py-3 justify-between flex-grow h-full overflow-hidden',
        isCollapsed && 'overflow-visible'
      )}
    >
      <nav
        className={cn(
          'flex flex-1 flex-col gap-2 px-3 flex-grow overflow-hidden',
          isCollapsed && 'items-center px-0 gap-2 overflow-visible'
        )}
      >
        <NavItem
          to="/admin/accounts"
          icon={<AccountIcon fontSize={18} />}
          label="账户管理"
          isCollapsed={isCollapsed}
          colorKey="accounts"
        />
        <NavItem
          to="/admin/ai"
          icon={<AiOutlineIcon fontSize={18} />}
          label="人工智能"
          isCollapsed={isCollapsed}
          colorKey="ai"
        />
        <SettingsItem isCollapsed={isCollapsed} />
        <SecurityItem isCollapsed={isCollapsed} />
        <InfraItem isCollapsed={isCollapsed} />
        <MonitoringItem isCollapsed={isCollapsed} />
        <NavItem
          to="/admin/about"
          icon={<SelfhostIcon fontSize={18} />}
          label="关于"
          isCollapsed={isCollapsed}
          colorKey="about"
        />
      </nav>
      <div
        className={cn(
          'flex gap-2 px-3 flex-col overflow-hidden mt-auto pt-4 border-t border-slate-100',
          isCollapsed && 'items-center px-0 gap-1 border-t'
        )}
      >
        <UserDropdown isCollapsed={isCollapsed} />
        {isCollapsed ? null : <ServerVersion />}
      </div>
    </div>
  );
}
