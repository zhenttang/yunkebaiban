import { PackageList, type PackageName } from './yarn';

export const PackageToDistribution = new Map<
  PackageName,
  BUILD_CONFIG_TYPE['distribution']
>([
  ['@yunke/admin', 'admin'],
  ['@yunke/web', 'web'],
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
  ['server', '@yunke/server'],
  ...PackageList.map(
    pkg => [pkg.name.split('/').pop()!, pkg.name] as [string, PackageName]
  ),
]);
