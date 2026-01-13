import { Badge } from '@yunke/admin/components/ui/badge';
import { Button } from '@yunke/admin/components/ui/button';
import { ScrollArea } from '@yunke/admin/components/ui/scroll-area';
import { Separator } from '@yunke/admin/components/ui/separator';
import { get } from 'lodash-es';
import { useCallback, useEffect, useMemo, lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Header } from '../header';
import { useNav } from '../nav/context';
import {
  ALL_CONFIG_DESCRIPTORS,
  ALL_SETTING_GROUPS,
  type AppConfig,
  type ConfigType,
} from './config';
import { type ConfigInputProps, ConfigRow } from './config-input-row';
import { useAppConfig } from './use-app-config';

const ServerSettingsPage = lazy(() => import('./server').then(m => ({ default: m.Component })));
const SecurityMonitoringPage = lazy(() => import('./security').then(m => ({ default: m.SecurityMonitoring })));
const AuthSettingsPage = lazy(() => import('./auth').then(m => ({ default: m.Component })));
const OAuthSettingsPage = lazy(() => import('./oauth').then(m => ({ default: m.Component })));
const StorageSettingsPage = lazy(() => import('./storages').then(m => ({ default: m.Component })));
const MailerSettingsPage = lazy(() => import('./mailer').then(m => ({ default: m.Component })));
const CopilotSettingsPage = lazy(() => import('./copilot').then(m => ({ default: m.Component })));
const PaymentSettingsPage = lazy(() => import('./payment').then(m => ({ default: m.Component })));
const ThrottleSettingsPage = lazy(() => import('./throttle').then(m => ({ default: m.Component })));

const normalizeType = (raw?: ConfigType | string): ConfigInputProps['type'] => {
  switch (raw) {
    case 'Boolean':
      return 'Boolean';
    case 'Number':
      return 'Number';
    case 'Enum':
      return 'Enum';
    case 'JSON':
    case 'Object':
    case 'Array':
      return 'JSON';
    case 'String':
    default:
      return 'String';
  }
};

export function SettingsPage() {
  const { appConfig, update, save, patchedAppConfig, updates } = useAppConfig();
  const { module } = useParams<{ module?: string }>();
  const { setCurrentModule, currentModule } = useNav();
  const navigate = useNavigate();

  useEffect(() => {
    if (module) {
      setCurrentModule(module);
    } else if (ALL_SETTING_GROUPS.length > 0) {
      navigate(`/admin/settings/${ALL_SETTING_GROUPS[0].module}`, { replace: true });
    }
  }, [module, setCurrentModule, navigate]);

  const handleNavigateModule = useCallback(
    (target: string) => {
      navigate(`/admin/settings/${target}`);
      setCurrentModule(target);
    },
    [navigate, setCurrentModule]
  );

  const saveChanges = useCallback(() => {
    if (Object.keys(updates).length === 0) {
      return;
    }
    save();
  }, [save, updates]);

  const dirtyModules = useMemo(() => {
    return Object.keys(updates).reduce<Record<string, number>>((acc, key) => {
      const [moduleKey] = key.split('.');
      acc[moduleKey] = (acc[moduleKey] ?? 0) + 1;
      return acc;
    }, {});
  }, [updates]);

  const currentGroup = useMemo(
    () => ALL_SETTING_GROUPS.find(group => group.module === (module ?? currentModule)),
    [module, currentModule]
  );

  const pendingCount = Object.keys(updates).length;

  // 专用页面依然保持独立布局
  if (module === 'server') {
    return (
      <Suspense fallback={<EmptyFallback title="服务器设置" />}>
        <ServerSettingsPage />
      </Suspense>
    );
  }

  if (module === 'security') {
    return (
      <div className="flex h-screen overflow-hidden bg-slate-50/40">
        <div className="flex flex-1 flex-col">
          <Header title="安全监控" subtitle="实时监控恶意攻击、查看安全事件、管理IP封禁" />
          <div className="flex-1 overflow-auto">
            <div className="mx-auto max-w-7xl p-6">
              <Suspense fallback={<EmptyFallback title="安全监控" />}>
                <SecurityMonitoringPage />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (module === 'auth') {
    return (
      <Suspense fallback={<EmptyFallback title="认证授权" />}>
        <AuthSettingsPage />
      </Suspense>
    );
  }

  if (module === 'oauth') {
    return (
      <Suspense fallback={<EmptyFallback title="第三方登录" />}>
        <OAuthSettingsPage />
      </Suspense>
    );
  }

  if (module === 'storages') {
    return (
      <Suspense fallback={<EmptyFallback title="存储服务" />}>
        <StorageSettingsPage />
      </Suspense>
    );
  }

  if (module === 'mailer') {
    return (
      <Suspense fallback={<EmptyFallback title="邮件通知" />}>
        <MailerSettingsPage />
      </Suspense>
    );
  }

  if (module === 'copilot') {
    return (
      <Suspense fallback={<EmptyFallback title="AI Copilot" />}>
        <CopilotSettingsPage />
      </Suspense>
    );
  }

  if (module === 'payment') {
    return (
      <Suspense fallback={<EmptyFallback title="支付系统" />}>
        <PaymentSettingsPage />
      </Suspense>
    );
  }

  if (module === 'throttle') {
    return (
      <Suspense fallback={<EmptyFallback title="访问限流" />}>
        <ThrottleSettingsPage />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/40">
      <SettingsSidebar
        currentModule={module ?? currentModule}
        onNavigate={handleNavigateModule}
        dirtyModules={dirtyModules}
      />
      <div className="flex flex-1 flex-col">
        <Header
          title={currentGroup?.name ?? '设置'}
          subtitle={currentGroup ? `模块：${currentGroup.module}` : undefined}
          endFix={
            <div className="flex items-center gap-3">
              {pendingCount > 0 ? (
                <Badge variant="secondary">{pendingCount} 项待保存</Badge>
              ) : null}
              <Button
                type="button"
                size="sm"
                className="rounded-full px-4"
                onClick={saveChanges}
                disabled={pendingCount === 0}
              >
                保存更改
              </Button>
            </div>
          }
        />
        <div className="flex-1 overflow-hidden">
          <AdminPanel
            onUpdate={update}
            appConfig={appConfig}
            patchedAppConfig={patchedAppConfig}
          />
        </div>
      </div>
    </div>
  );
}

const EmptyFallback = ({ title }: { title: string }) => {
  return (
    <div className="flex h-screen flex-1 flex-col">
      <Header title={title} />
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    </div>
  );
};

const SettingsSidebar = ({
  currentModule,
  onNavigate,
  dirtyModules,
}: {
  currentModule?: string;
  onNavigate: (module: string) => void;
  dirtyModules: Record<string, number>;
}) => {
  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200/60 bg-white/70 pt-6 md:flex">
      <div className="px-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
        配置模块
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-2 pb-6">
        {ALL_SETTING_GROUPS.map(group => {
          const isActive = group.module === currentModule;
          const isDirty = dirtyModules[group.module];
          return (
            <button
              key={group.module}
              type="button"
              onClick={() => onNavigate(group.module)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary/10 text-primary-900 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{group.name}</span>
                {isDirty ? (
                  <Badge variant="outline" className="text-[10px]">
                    待保存
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-slate-400">/{group.module}</p>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

const AdminPanel = ({
  appConfig,
  patchedAppConfig,
  onUpdate,
}: {
  appConfig: AppConfig;
  patchedAppConfig: AppConfig;
  onUpdate: (path: string, value: any) => void;
}) => {
  const { currentModule } = useNav();
  const group = ALL_SETTING_GROUPS.find(group => group.module === currentModule);

  if (!group) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-slate-500">
        <div className="text-lg font-medium">模块未找到</div>
        <div className="text-sm">当前模块 "{currentModule}" 不存在或尚未配置。</div>
      </div>
    );
  }

  const { name, module, fields, operations } = group;

  const handleChange = useCallback(
    (path: string, value: any) => {
      onUpdate(path, value);
    },
    [onUpdate]
  );

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-6">
        <section className="rounded-xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
            <p className="text-sm text-slate-500">
              模块路径：
              <code className="ml-1 rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-600">
                {module}
              </code>
            </p>
            <p className="text-xs text-slate-400">
              共 {fields.length} 个可配置字段，可通过环境变量覆盖的项会显示提示。
            </p>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2" id={`config-module-${module}`}>
          {fields.map(field => {
            const baseKey = typeof field === 'string' ? field : field.key;
            const descriptor = ALL_CONFIG_DESCRIPTORS[module]?.[baseKey];
            const dottedPath =
              typeof field === 'string'
                ? field
                : `${field.key}${field.sub ? `.${field.sub}` : ''}`;
            const updatePath =
              typeof field === 'string'
                ? `${module}/${field}`
                : `${module}/${field.key}${field.sub ? `/${field.sub}` : ''}`;
            const displayPath = `${module}.${dottedPath}`;
            const originalValue = get(appConfig[module], dottedPath);
            const patchedValue = get(patchedAppConfig[module], dottedPath);
            const currentValue = patchedValue === undefined ? originalValue : patchedValue;

            const resolvedType = normalizeType(
              typeof field === 'string'
                ? descriptor?.type
                : field.type ?? descriptor?.type
            );

            const desc =
              (typeof field === 'string' ? descriptor?.desc : field.desc ?? descriptor?.desc) ??
              dottedPath;

            const envVar = descriptor?.env;
            const docsLink = descriptor?.link;

            const isFullWidth = resolvedType === 'JSON';

            if (resolvedType === 'Enum') {
              const rowProps: ConfigInputProps = {
                type: 'Enum',
                field: updatePath,
                displayPath,
                desc,
                value: currentValue,
                originalValue,
                onChange: handleChange,
                envVar,
                docsLink,
                options: (typeof field === 'string' ? [] : field.options) ?? [],
              };

              return (
                <div key={updatePath} className={isFullWidth ? 'md:col-span-2' : ''}>
                  <ConfigRow {...rowProps} />
                </div>
              );
            }

            const rowProps: ConfigInputProps = {
              type: resolvedType,
              field: updatePath,
              displayPath,
              desc,
              value: currentValue,
              originalValue,
              onChange: handleChange,
              envVar,
              docsLink,
            };

            return (
              <div key={updatePath} className={isFullWidth ? 'md:col-span-2' : ''}>
                <ConfigRow {...rowProps} />
              </div>
            );
          })}
        </div>

        {operations?.length ? (
          <div className="space-y-4">
            <Separator />
            <h3 className="text-sm font-semibold text-slate-700">快捷操作</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {operations.map(Operation => (
                <div
                  key={Operation.name}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <Operation appConfig={patchedAppConfig} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
};

export { SettingsPage as Component };
