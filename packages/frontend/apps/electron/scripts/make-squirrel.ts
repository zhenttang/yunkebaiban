import path from 'node:path';

import debug from 'debug';
import type { Options as ElectronWinstallerOptions } from 'electron-winstaller';
import { convertVersion, createWindowsInstaller } from 'electron-winstaller';
import fs from 'fs-extra';

import {
  arch,
  buildType,
  iconUrl,
  icoPath,
  platform,
  productName,
  ROOT,
} from './make-env.js';

const log = debug('yunke:make-squirrel');

// taking from https://github.com/electron/forge/blob/main/packages/maker/squirrel/src/MakerSquirrel.ts
// it was for forge's maker, but can be used standalone as well
async function make() {
  const appName = productName;
  const makeDir = path.resolve(ROOT, 'out', buildType, 'make');
  const outPath = path.resolve(makeDir, `squirrel.windows/${arch}`);
  const appDirectory = path.resolve(
    ROOT,
    'out',
    buildType,
    `${appName}-${platform}-${arch}`
  );
  log('making squirrel.windows: appDirectory', appDirectory);
  await fs.ensureDir(outPath);

  const packageJSON = await fs.readJson(path.resolve(ROOT, 'package.json'));

  const winstallerConfig: ElectronWinstallerOptions = {
    name: appName,
    title: appName,
    noMsi: true,
    exe: `${appName}.exe`,
    setupExe: `${appName}-${packageJSON.version} Setup.exe`,
    version: packageJSON.version,
    appDirectory,
    outputDirectory: outPath,
    // iconUrl: iconUrl, // 注释掉远程 URL，避免网络问题导致安装失败
    setupIcon: icoPath,
    loadingGif: path.resolve(ROOT, './resources/icons/yunke_installing.gif'),
    signWithParams: undefined, // 禁用代码签名（开发/测试环境）
  };

  await createWindowsInstaller(winstallerConfig);
  const nupkgVersion = convertVersion(packageJSON.version);
  const artifacts = [
    path.resolve(outPath, 'RELEASES'),
    path.resolve(outPath, winstallerConfig.setupExe || `${appName}Setup.exe`),
    path.resolve(
      outPath,
      `${winstallerConfig.name}-${nupkgVersion}-full.nupkg`
    ),
  ];
  const deltaPath = path.resolve(
    outPath,
    `${winstallerConfig.name}-${nupkgVersion}-delta.nupkg`
  );
  if (
    (winstallerConfig.remoteReleases && !winstallerConfig.noDelta) ||
    (await fs.pathExists(deltaPath))
  ) {
    artifacts.push(deltaPath);
  }
  const msiPath = path.resolve(
    outPath,
    winstallerConfig.setupMsi || `${appName}Setup.msi`
  );
  if (!winstallerConfig.noMsi && (await fs.pathExists(msiPath))) {
    artifacts.push(msiPath);
  }
  log('making squirrel.windows done:', artifacts);
  return artifacts;
}

make().catch(e => {
  console.error(e);
});
