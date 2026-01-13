import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fs from 'fs-extra';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

const repoRootDir = path.join(__dirname, '..', '..', '..', '..', '..');
const electronRootDir = path.join(__dirname, '..');
const publicDistDir = path.join(electronRootDir, 'resources');
const webDir = path.join(
  repoRootDir,
  'packages',
  'frontend',
  'apps',
  'electron-renderer'
);
const yunkeWebOutDir = path.join(webDir, 'dist');
const publicYunkeOutDir = path.join(publicDistDir, `web-static`);
const releaseVersionEnv = process.env.RELEASE_VERSION || '';

console.log('使用以下变量构建', {
  repoRootDir,
  electronRootDir,
  publicDistDir,
  yunkeSrcDir: webDir,
  yunkeSrcOutDir: yunkeWebOutDir,
  publicYunkeOutDir,
  releaseVersionEnv,
});

// step 0: check version match
const electronPackageJson = require(`${electronRootDir}/package.json`);
if (releaseVersionEnv && electronPackageJson.version !== releaseVersionEnv) {
  throw new Error(
    `Version mismatch, expected ${releaseVersionEnv} but got ${electronPackageJson.version}`
  );
}
// copy web dist files to electron dist

const cwd = repoRootDir;

// step 1: build web dist
if (!process.env.SKIP_WEB_BUILD) {
  spawnSync('yarn', ['workspace', '@yunke/electron-renderer', 'build'], {
    stdio: 'inherit',
    env: process.env,
    cwd,
    shell: true,
  });

  spawnSync('yarn', ['workspace', '@yunke/electron', 'build'], {
    stdio: 'inherit',
    env: process.env,
    cwd,
    shell: true,
  });

  // Use copy instead of move so source files remain for future builds
  await fs.copy(yunkeWebOutDir, publicYunkeOutDir, { overwrite: true });
  console.log(`✓ Copied frontend resources from ${yunkeWebOutDir} to ${publicYunkeOutDir}`);
}

// step 2: update app-updater.yml content with build type in resources folder
if (process.env.BUILD_TYPE === 'internal') {
  const appUpdaterYml = path.join(publicDistDir, 'app-update.yml');
  const appUpdaterYmlContent = await fs.readFile(appUpdaterYml, 'utf-8');
  const newAppUpdaterYmlContent = appUpdaterYmlContent.replace(
    'YUNKE',
    'YUNKE-Releases'
  );
  await fs.writeFile(appUpdaterYml, newAppUpdaterYmlContent);
}
