import path from 'node:path';

import { buildForge } from 'app-builder-lib';
import debug from 'debug';
import fs from 'fs-extra';

import {
  appIdMap,
  arch,
  buildType,
  iconPngPath,
  icoPath,
  platform,
  productName,
  REPO_ROOT,
  ROOT,
} from './make-env.js';

const log = debug('yunke:make-nsis');

// 强制禁用代码签名
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
console.log('[make-nsis] 已禁用代码签名');
console.log('[make-nsis] CSC_IDENTITY_AUTO_DISCOVERY =', process.env.CSC_IDENTITY_AUTO_DISCOVERY);

async function make() {
  const appName = productName;
  const makeDir = path.resolve(ROOT, 'out', buildType, 'make');
  const outPath = path.resolve(makeDir, `nsis.windows/${arch}`);
  const appDirectory = path.resolve(
    ROOT,
    'out',
    buildType,
    `${appName}-${platform}-${arch}`
  );

  await fs.ensureDir(outPath);
  await fs.emptyDir(outPath);

  // create tmp dir
  const tmpPath = await fs.mkdtemp(appName);

  // copy app to tmp dir
  log(`Copying app to ${tmpPath}`);
  await fs.copy(appDirectory, tmpPath);

  log(`Calling app-builder-lib's buildForge() with ${tmpPath}`);
  const output = await buildForge(
    { dir: tmpPath },
    {
      win: [`nsis:${arch}`],
      // @ts-expect-error - upstream type is wrong
      publish: null, // buildForge will incorrectly publish the build
      config: {
        appId: appIdMap[buildType],
        productName,
        executableName: productName,
        icon: iconPngPath,
        electronVersion: '36.0.0', // 指定确切的 Electron 版本
        forceCodeSigning: false, // 禁用代码签名（开发/测试环境）
        extraMetadata: {
          // do not use package.json's name
          name: productName,
        },
        nsis: {
          differentialPackage: false,
          perMachine: false,
          oneClick: false,
          license: path.resolve(REPO_ROOT, 'LICENSE'),
          installerIcon: icoPath,
          allowToChangeInstallationDirectory: true,
          // 以下配置为可选，如果文件不存在则忽略
          // include: path.resolve(ROOT, 'scripts', 'nsis-installer.nsh'),
          // installerSidebar: path.resolve(ROOT, 'resources', 'icons', 'nsis-sidebar.bmp'),
        },
      },
    }
  );

  // Move the output to the actual output folder, app-builder-lib might get it wrong
  log('making nsis.windows done:', output);

  const result: Array<string> = [];
  for (const file of output) {
    const filePath = path.resolve(outPath, path.basename(file));
    result.push(filePath);

    await fs.move(file, filePath);
  }

  // cleanup
  await fs.remove(tmpPath);
}

make().catch(e => {
  console.error(e);
});
