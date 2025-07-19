import { buttonVariants } from '@affine/admin/components/ui/button';
import { cn } from '@affine/admin/utils';
import { 
  AccountIcon, 
  AiOutlineIcon, 
  SelfhostIcon, 
  SettingsIcon,
  DatabaseTableViewIcon,
  EmailIcon,
  LockIcon,
  PluginIcon,
  ProgressIcon,
  ComputerPanelIcon,
  CloudBubbleIcon
} from '@blocksuite/icons/rc';
import { cssVarV2 } from '@toeverything/theme/v2';
import { NavLink } from 'react-router-dom';

import { ServerVersion } from './server-version';
import { SettingsItem } from './settings-item';
import { SecurityItem } from './security-item';
import { InfraItem } from './infra-item';
import { MonitoringItem } from './monitoring-item';
import { UserDropdown } from './user-dropdown';
import { useNav } from './context';

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
  },
  storage: {
    from: 'from-orange-400/20',
    to: 'to-orange-500/30',
    activeBg: 'bg-gradient-to-br from-orange-50/80 to-orange-100/80',
    activeBorder: 'border-orange-200/50',
    activeText: 'text-orange-700',
    hoverBg: 'hover:bg-orange-50/50',
    iconBg: 'bg-orange-100/80',
    iconColor: 'text-orange-500',
    glow: 'shadow-[0_0_15px_rgba(249,115,22,0.3)]'
  },
  notification: {
    from: 'from-pink-400/20',
    to: 'to-pink-500/30',
    activeBg: 'bg-gradient-to-br from-pink-50/80 to-pink-100/80',
    activeBorder: 'border-pink-200/50',
    activeText: 'text-pink-700',
    hoverBg: 'hover:bg-pink-50/50',
    iconBg: 'bg-pink-100/80',
    iconColor: 'text-pink-500',
    glow: 'shadow-[0_0_15px_rgba(236,72,153,0.3)]'
  },
  oauth: {
    from: 'from-violet-400/20',
    to: 'to-violet-500/30',
    activeBg: 'bg-gradient-to-br from-violet-50/80 to-violet-100/80',
    activeBorder: 'border-violet-200/50',
    activeText: 'text-violet-700',
    hoverBg: 'hover:bg-violet-50/50',
    iconBg: 'bg-violet-100/80',
    iconColor: 'text-violet-500',
    glow: 'shadow-[0_0_15px_rgba(139,92,246,0.3)]'
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
  if (path.includes('storage')) return menuColors.storage;
  if (path.includes('notification')) return menuColors.notification;
  if (path.includes('oauth')) return menuColors.oauth;
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
  const { setCurrentModule } = useNav();

  // 从路径中提取模块名称
  const handleClick = () => {
    console.log('NavItem点击:', to);
    if (to.includes('/admin/settings/')) {
      const module = to.split('/admin/settings/')[1];
      if (module) {
        console.log('设置模块:', module);
        setCurrentModule(module);
      }
    }
  };

  if (isCollapsed) {
    return (
      <NavLink
        to={to}
        onClick={handleClick}
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
      onClick={handleClick}
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
        'flex flex-col py-3 justify-between h-full',
        isCollapsed && 'overflow-visible'
      )}
    >
      <nav
        className={cn(
          'flex flex-1 flex-col gap-2 px-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400',
          isCollapsed && 'items-center px-0 gap-2 overflow-visible'
        )}
        style={{
          // 为 Firefox 自定义滚动条样式
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        {/* 核心管理功能 */}
        <div className={cn(
          "space-y-1",
          !isCollapsed && "mb-2"
        )}>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-slate-400 px-2 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm z-10">核心功能</div>
          )}
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
        </div>

        {/* 基础设置 */}
        <div className={cn(
          "space-y-1",
          !isCollapsed && "mb-2"
        )}>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-slate-400 px-2 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm z-10">基础设置</div>
          )}
          <NavItem
            to="/admin/settings/server"
            icon={<ComputerPanelIcon fontSize={18} />}
            label="服务器设置"
            isCollapsed={isCollapsed}
            colorKey="settings"
          />
          <NavItem
            to="/admin/settings/auth"
            icon={<LockIcon fontSize={18} />}
            label="认证授权"
            isCollapsed={isCollapsed}
            colorKey="security"
          />
          <NavItem
            to="/admin/settings/oauth"
            icon={<PluginIcon fontSize={18} />}
            label="第三方登录"
            isCollapsed={isCollapsed}
            colorKey="oauth"
          />
        </div>

        {/* 服务集成 */}
        <div className={cn(
          "space-y-1",
          !isCollapsed && "mb-2"
        )}>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-slate-400 px-2 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm z-10">服务集成</div>
          )}
          <NavItem
            to="/admin/settings/storages"
            icon={<DatabaseTableViewIcon fontSize={18} />}
            label="存储服务"
            isCollapsed={isCollapsed}
            colorKey="storage"
          />
          <NavItem
            to="/admin/settings/mailer"
            icon={<EmailIcon fontSize={18} />}
            label="邮件通知"
            isCollapsed={isCollapsed}
            colorKey="notification"
          />
          <NavItem
            to="/admin/settings/copilot"
            icon={<AiOutlineIcon fontSize={18} />}
            label="AI配置"
            isCollapsed={isCollapsed}
            colorKey="ai"
          />
          <NavItem
            to="/admin/settings/payment"
            icon={<CloudBubbleIcon fontSize={18} />}
            label="支付系统"
            isCollapsed={isCollapsed}
            colorKey="oauth"
          />
        </div>

        {/* 监控运维 */}
        <div className={cn(
          "space-y-1",
          !isCollapsed && "mb-2"
        )}>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-slate-400 px-2 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm z-10">监控运维</div>
          )}
          <NavItem
            to="/admin/monitoring"
            icon={<ProgressIcon fontSize={18} />}
            label="系统监控"
            isCollapsed={isCollapsed}
            colorKey="monitoring"
          />
          <NavItem
            to="/admin/settings/throttle"
            icon={<ProgressIcon fontSize={18} />}
            label="访问限流"
            isCollapsed={isCollapsed}
            colorKey="monitoring"
          />
          <NavItem
            to="/admin/settings/job"
            icon={<SettingsIcon fontSize={18} />}
            label="任务管理"
            isCollapsed={isCollapsed}
            colorKey="monitoring"
          />
          <NavItem
            to="/admin/settings/metrics"
            icon={<ProgressIcon fontSize={18} />}
            label="性能监控"
            isCollapsed={isCollapsed}
            colorKey="monitoring"
          />
          <NavItem
            to="/admin/settings/indexer"
            icon={<ComputerPanelIcon fontSize={18} />}
            label="搜索索引"
            isCollapsed={isCollapsed}
            colorKey="monitoring"
          />
        </div>

        {/* 高级功能 */}
        <div className={cn(
          "space-y-1",
          !isCollapsed && "mb-4"
        )}>
          {!isCollapsed && (
            <div className="text-xs font-semibold text-slate-400 px-2 mb-2 sticky top-0 bg-white/80 backdrop-blur-sm z-10">高级功能</div>
          )}
          <SettingsItem isCollapsed={isCollapsed} />
        </div>
        
        {/* 系统信息 - 用 margin-top: auto 推到底部 */}
        <div className="mt-auto pt-4">
          <NavItem
            to="/admin/about"
            icon={<SelfhostIcon fontSize={18} />}
            label="关于"
            isCollapsed={isCollapsed}
            colorKey="about"
          />
        </div>
      </nav>
      
      <div
        className={cn(
          'flex gap-2 px-3 flex-col mt-4 pt-4 border-t border-slate-100',
          isCollapsed && 'items-center px-0 gap-1 border-t'
        )}
      >
        <UserDropdown isCollapsed={isCollapsed} />
        {isCollapsed ? null : <ServerVersion />}
      </div>
    </div>
  );
}
