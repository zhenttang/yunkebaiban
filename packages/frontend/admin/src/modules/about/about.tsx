import { cn } from '@affine/admin/utils';

type Channel = 'stable' | 'canary' | 'beta' | 'internal';

const appNames = {
  stable: 'AFFiNE',
  canary: 'AFFiNE 金丝雀版',
  beta: 'AFFiNE 测试版',
  internal: 'AFFiNE 内部版',
} satisfies Record<Channel, string>;
const appName = appNames[BUILD_CONFIG.appBuildType];

export function AboutAFFiNE() {
  return (
    <div className="flex flex-col h-full gap-3 py-5 px-6 w-full">
      <div className="flex items-center">
        <span className="text-xl font-semibold">关于 AFFiNE</span>
      </div>
      <div className="space-y-3 text-sm font-normal text-gray-500">
        <div>{`应用版本: ${appName} ${BUILD_CONFIG.appVersion}`}</div>
        <div>{`编辑器版本: ${BUILD_CONFIG.editorVersion}`}</div>
      </div>
    </div>
  );
}
