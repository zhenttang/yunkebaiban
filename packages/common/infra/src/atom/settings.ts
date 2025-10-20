import { DebugLogger } from '@yunke/debug';
import { setupGlobal } from '@yunke/env/global';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomEffect } from 'jotai-effect';

setupGlobal();

const logger = new DebugLogger('yunke:settings');

export type AppSetting = {
  clientBorder: boolean;
  windowFrameStyle: 'frameless' | 'NativeTitleBar';
  enableBlurBackground: boolean;
  enableNoisyBackground: boolean;
  autoCheckUpdate: boolean;
  autoDownloadUpdate: boolean;
  enableTelemetry: boolean;
};
export const windowFrameStyleOptions: AppSetting['windowFrameStyle'][] = [
  'frameless',
  'NativeTitleBar',
];

export const APP_SETTINGS_STORAGE_KEY = 'yunke-settings';
const appSettingBaseAtom = atomWithStorage<AppSetting>(
  APP_SETTINGS_STORAGE_KEY,
  {
    clientBorder: BUILD_CONFIG.isElectron && !environment.isWindows,
    windowFrameStyle: 'frameless',
    enableBlurBackground: false,
    enableNoisyBackground: true,
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    enableTelemetry: true,
  },
  undefined,
  {
    getOnInit: true,
  }
);

type SetStateAction<Value> = Value | ((prev: Value) => Value);

// todo(@pengx17): 使用全局状态代替
const appSettingEffect = atomEffect(get => {
  const settings = get(appSettingBaseAtom);
  // settings中的一些值应该同步到electron端
  if (BUILD_CONFIG.isElectron) {
    logger.debug('同步设置到electron', settings);
    // 这个api类型在@yunke/electron-api中，但它与这个包是循环依赖，这里使用any
    (window as any).__apis?.updater
      .setConfig({
        autoCheckUpdate: settings.autoCheckUpdate,
        autoDownloadUpdate: settings.autoDownloadUpdate,
      })
      .catch((err: any) => {
        console.error(err);
      });
  }
});

export const appSettingAtom = atom<
  AppSetting,
  [SetStateAction<Partial<AppSetting>>],
  void
>(
  get => {
    get(appSettingEffect);
    return get(appSettingBaseAtom);
  },
  (_get, set, apply) => {
    set(appSettingBaseAtom, prev => {
      const next = typeof apply === 'function' ? apply(prev) : apply;
      return { ...prev, ...next };
    });
  }
);
