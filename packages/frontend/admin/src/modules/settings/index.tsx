import { Button } from '@affine/admin/components/ui/button';
import { ScrollArea } from '@affine/admin/components/ui/scroll-area';
import { get } from 'lodash-es';
import { CheckIcon } from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import { Header } from '../header';
import { useNav } from '../nav/context';
import {
  ALL_CONFIG_DESCRIPTORS,
  ALL_SETTING_GROUPS,
  type AppConfig,
} from './config';
import { type ConfigInputProps, ConfigRow } from './config-input-row';
import { useAppConfig } from './use-app-config';

export function SettingsPage() {
  const { appConfig, update, save, patchedAppConfig, updates } = useAppConfig();
  const { module } = useParams<{ module?: string }>();
  const { setCurrentModule } = useNav();
  const navigate = useNavigate();
  const disableSave = Object.keys(updates).length === 0;

  // 同步URL参数到context
  useEffect(() => {
    console.log('Settings组件 - URL参数module:', module);
    if (module) {
      console.log('设置currentModule为:', module);
      setCurrentModule(module);
    } else {
      // 如果没有模块参数，重定向到默认模块
      console.log('没有模块参数，重定向到server');
      navigate('/admin/settings/server', { replace: true });
    }
  }, [module, setCurrentModule, navigate]);

  const saveChanges = useCallback(() => {
    if (disableSave) {
      return;
    }
    save();
  }, [save, disableSave]);

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header
        title="设置"
        endFix={
          <Button
            type="submit"
            size="icon"
            className="w-7 h-7"
            variant="ghost"
            onClick={saveChanges}
            disabled={disableSave}
          >
            <CheckIcon size={20} />
          </Button>
        }
      />
      <AdminPanel
        onUpdate={update}
        appConfig={appConfig}
        patchedAppConfig={patchedAppConfig}
      />
    </div>
  );
}

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
  console.log('AdminPanel - currentModule:', currentModule);
  
  const group = ALL_SETTING_GROUPS.find(
    group => group.module === currentModule
  );
  
  console.log('AdminPanel - 找到的group:', group);

  if (!group) {
    console.log('AdminPanel - 没有找到group，可用的模块:', ALL_SETTING_GROUPS.map(g => g.module));
    return (
      <div className="flex flex-col h-full gap-5 py-5 px-6 w-full max-w-[800px] mx-auto">
        <div className="text-2xl font-semibold">模块未找到</div>
        <div className="text-gray-600">
          配置模块 "{currentModule}" 不存在或尚未配置。
        </div>
        <div className="text-sm text-gray-500">
          当前可用的配置模块：{ALL_SETTING_GROUPS.map(g => g.module).join(', ')}
        </div>
      </div>
    );
  }

  const { name, module, fields, operations } = group;

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col h-full gap-5 py-5 px-6 w-full max-w-[800px] mx-auto">
        <div className="text-2xl font-semibold">{name}</div>
        <div className="flex flex-col gap-10" id={`config-module-${module}`}>
          {fields.map(field => {
            let desc: string;
            let props: ConfigInputProps;
            if (typeof field === 'string') {
              const descriptor = ALL_CONFIG_DESCRIPTORS[module][field];
              desc = descriptor.desc;
              props = {
                field: `${module}/${field}`,
                desc,
                type: descriptor.type,
                options: [],
                defaultValue: get(appConfig[module], field),
                onChange: onUpdate,
              };
            } else {
              const descriptor = ALL_CONFIG_DESCRIPTORS[module][field.key];

              props = {
                field: `${module}/${field.key}${field.sub ? `/${field.sub}` : ''}`,
                desc: field.desc ?? descriptor.desc,
                type: field.type ?? descriptor.type,
                // @ts-expect-error for enum type
                options: field.options,
                defaultValue: get(
                  appConfig[module],
                  field.key + (field.sub ? '.' + field.sub : '')
                ),
                onChange: onUpdate,
              };
            }

            return <ConfigRow key={props.field} {...props} />;
          })}
          {operations?.map(Operation => (
            <Operation key={Operation.name} appConfig={patchedAppConfig} />
          ))}
        </div>
      </div>
    </ScrollArea>
  );
};

export { SettingsPage as Component };
