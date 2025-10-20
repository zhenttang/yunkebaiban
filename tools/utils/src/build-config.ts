import type { Package } from '@yunke-tools/utils/workspace';

import { PackageToDistribution } from './distribution';

export interface BuildFlags {
  channel: 'stable' | 'beta' | 'internal' | 'canary';
  mode: 'development' | 'production';
}

export function getBuildConfig(
  pkg: Package,
  buildFlags: BuildFlags
): BUILD_CONFIG_TYPE {
  const distribution = PackageToDistribution.get(pkg.name);

  if (!distribution) {
    throw new Error(`找不到 ${pkg.name} 的分发版本`);
  }

  const buildPreset: Record<BuildFlags['channel'], BUILD_CONFIG_TYPE> = {
    get stable() {
      return {
        debug: buildFlags.mode === 'development',
        distribution,
        isDesktopEdition: (
          ['web', 'desktop', 'admin'] as BUILD_CONFIG_TYPE['distribution'][]
        ).includes(distribution),
        isMobileEdition: (
          ['mobile', 'ios', 'android'] as BUILD_CONFIG_TYPE['distribution'][]
        ).includes(distribution),
        isElectron: distribution === 'desktop',
        isWeb: distribution === 'web',
        isMobileWeb: distribution === 'mobile',
        isIOS: distribution === 'ios',
        isAndroid: distribution === 'android',
        isNative:
          distribution === 'desktop' ||
          distribution === 'ios' ||
          distribution === 'android',
        isAdmin: distribution === 'admin',

        appBuildType: 'stable' as const,
        appVersion: pkg.version,
        // editorVersion: pkg.dependencies['@blocksuite/yunke'],
        editorVersion: pkg.version,
        githubUrl: 'https://gitcode.com/xiaoleixiaolei',
        changelogUrl: 'https://yunke.pro/what-is-new',
        downloadUrl: 'https://yunke.pro/download',
        pricingUrl: 'https://yunke.pro/pricing',
        discordUrl: 'https://yunke.pro/redirect/discord',
        requestLicenseUrl: 'https://yunke.pro/redirect/license',
        imageProxyUrl: '/api/worker/image-proxy',
        linkPreviewUrl: '/api/worker/link-preview',
        CAPTCHA_SITE_KEY: process.env.CAPTCHA_SITE_KEY ?? '',
        SENTRY_DSN: process.env.SENTRY_DSN ?? '',
        MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN ?? '',
        DEBUG_JOTAI: process.env.DEBUG_JOTAI ?? '',
      };
    },
    get beta() {
      return {
        ...this.stable,
        appBuildType: 'beta' as const,
        changelogUrl: 'https://gitcode.com/xiaoleixiaolei/releases',
      };
    },
    get internal() {
      return {
        ...this.stable,
        appBuildType: 'internal' as const,
        changelogUrl: 'https://gitcode.com/xiaoleixiaolei/releases',
      };
    },
    // canary版本将更激进并启用所有功能
    get canary() {
      return {
        ...this.stable,
        appBuildType: 'canary' as const,
        changelogUrl: 'https://gitcode.com/xiaoleixiaolei/releases',
      };
    },
  };

  const currentBuild = buildFlags.channel;

  if (!(currentBuild in buildPreset)) {
    throw new Error(`不支持 BUILD_TYPE ${currentBuild}`);
  }

  const currentBuildPreset = buildPreset[currentBuild];

  const environmentPreset = {
    changelogUrl: process.env.CHANGELOG_URL ?? currentBuildPreset.changelogUrl,
  };

  return {
    ...currentBuildPreset,
    // 环境预设将覆盖当前构建预设
    // 此环境变量仅用于调试目的
    // 请勿将它们放入CI中
    ...(process.env.CI ? {} : environmentPreset),
  };
}
