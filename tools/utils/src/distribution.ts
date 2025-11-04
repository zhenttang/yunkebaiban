import { PackageList, type PackageName } from './yarn';

export const PackageToDistribution = new Map<
  PackageName,
  BUILD_CONFIG_TYPE['distribution']
>([
  ['@yunke/admin', 'admin'],
  ['@yunke/web', 'web'],
  ['@yunke/website', 'web'],
  ['@yunke/electron-renderer', 'desktop'],
  ['@yunke/electron', 'desktop'],
  ['@yunke/mobile', 'mobile'],
  ['@yunke/ios', 'ios'],
  ['@yunke/android', 'android'],
  ['@yunke/android', 'android'],
]);

export const AliasToPackage = new Map<string, PackageName>([
  ['admin', '@yunke/admin'],
  ['web', '@yunke/web'],
  ['electron', '@yunke/electron'],
  ['desktop', '@yunke/electron-renderer'],
  ['renderer', '@yunke/electron-renderer'],
  ['mobile', '@yunke/mobile'],
  ['ios', '@yunke/ios'],
  ['android', '@yunke/android'],
  ...PackageList.map(
    pkg => [pkg.name.split('/').pop()!, pkg.name] as [string, PackageName]
  ),
]);

// 为常用包提供简要描述，用于交互式选择时显示
export const PackageDescriptions = new Map<PackageName, string>([
  ['@yunke/web', '浏览器端 Web 应用（SPA）'],
  ['@yunke/website', '官网静态站（多页 HTML）'],
  ['@yunke/electron', 'Electron 主进程（桌面壳）'],
  ['@yunke/electron-renderer', 'Electron 渲染进程（桌面 UI）'],
  ['@yunke/mobile', '移动端 Web/PWA'],
  ['@yunke/ios', 'iOS 原生壳（Capacitor）'],
  ['@yunke/android', 'Android 原生壳（Capacitor）'],
  ['@yunke/admin', '后台管理控制台'],
]);
