import cp from 'node:child_process';
import { existsSync, lstatSync, rmSync } from 'node:fs';
import { rm, symlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { utils } from '@electron-forge/core';

import {
  appIdMap,
  arch,
  buildType,
  icnsPath,
  iconPngPath,
  iconUrl,
  iconX512PngPath,
  icoPath,
  platform,
  productName,
} from './scripts/make-env.js';

const fromBuildIdentifier = utils.fromBuildIdentifier;

const linuxMimeTypes = [`x-scheme-handler/${productName.toLowerCase()}`];

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const makers = [
  !process.env.SKIP_BUNDLE &&
    platform === 'darwin' && {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: icnsPath,
        name: 'YUNKE',
        'icon-size': 128,
        background: path.join(
          __dirname,
          './resources/icons/dmg-background.png'
        ),
        contents: [
          {
            x: 176,
            y: 192,
            type: 'file',
            path: path.join(
              __dirname,
              'out',
              buildType,
              `${productName}-darwin-${arch}`,
              `${productName}.app`
            ),
          },
          { x: 432, y: 192, type: 'link', path: '/Applications' },
        ],
        iconSize: 118,
        file: path.join(
          __dirname,
          'out',
          buildType,
          `${productName}-darwin-${arch}`,
          `${productName}.app`
        ),
      },
    },
  {
    name: '@electron-forge/maker-zip',
    config: {
      name: 'yunke',
      iconUrl: icoPath,
      setupIcon: icoPath,
      platforms: ['darwin', 'linux', 'win32'],
    },
  },
  !process.env.SKIP_BUNDLE && {
    name: '@electron-forge/maker-squirrel',
    config: {
      name: productName,
      setupIcon: icoPath,
      iconUrl: iconUrl,
      loadingGif: './resources/icons/yunke_installing.gif',
    },
  },
  !process.env.SKIP_BUNDLE && {
    name: '@pengx17/electron-forge-maker-appimage',
    platforms: ['linux'],
    config: {
      icons: [
        {
          file: iconX512PngPath,
          size: 512,
        },
      ],
    },
  },
  !process.env.SKIP_BUNDLE && {
    name: '@electron-forge/maker-deb',
    config: {
      bin: productName,
      options: {
        name: productName,
        productName,
        icon: iconX512PngPath,
        mimeType: linuxMimeTypes,
        scripts: {
          // maker-deb does not have a way to include arbitrary files in package root
          // instead, put files in extraResource, and then install with a script
          postinst: './resources/deb/postinst',
          prerm: './resources/deb/prerm',
        },
      },
    },
  },
  !process.env.SKIP_BUNDLE && {
    name: '@electron-forge/maker-flatpak',
    platforms: ['linux'],
    /** @type {import('@electron-forge/maker-flatpak').MakerFlatpakConfig} */
    config: {
      options: {
        mimeType: linuxMimeTypes,
        productName,
        bin: productName,
        id: fromBuildIdentifier(appIdMap),
        icon: iconPngPath, // not working yet
        branch: buildType,
        files: [
          [
            './resources/yunke.metainfo.xml',
            '/usr/share/metainfo/yunke.metainfo.xml',
          ],
        ],
        runtimeVersion: '20.08',
        finishArgs: [
          // Wayland/X11 Rendering
          '--socket=wayland',
          '--socket=x11',
          '--share=ipc',
          // Open GL
          '--device=dri',
          // Audio output
          '--socket=pulseaudio',
          // Read/write home directory access
          '--filesystem=home',
          // Allow communication with network
          '--share=network',
          // System notifications with libnotify
          '--talk-name=org.freedesktop.Notifications',
        ],
      },
    },
  },
].filter(Boolean);

/**
 * @type {import('@electron-forge/shared-types').ForgeConfig}
 */
export default {
  buildIdentifier: buildType,
  packagerConfig: {
    name: productName,
    appBundleId: fromBuildIdentifier(appIdMap),
    icon: icnsPath,
    dir: __dirname,
    osxSign: {
      identity: 'Developer ID Application: TOEVERYTHING PTE. LTD.',
      'hardened-runtime': true,
    },
    electronZipDir: process.env.ELECTRON_FORGE_ELECTRON_ZIP_DIR,
    osxNotarize: process.env.APPLE_ID
      ? {
          tool: 'notarytool',
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID,
        }
      : undefined,
    // We need the following line for updater
    // Also include web-static outside of asar so Electron can load HTML files
    extraResource: [
      './resources/app-update.yml',
      './resources/web-static',
      ...(platform === 'linux' ? ['./resources/yunke.metainfo.xml'] : []),
    ],
    protocols: [
      {
        name: productName,
        schemes: [productName.toLowerCase()],
      },
    ],
    executableName: productName,
    asar: {
      unpack: '**/*.node'
    },
    ignore: (filePath) => {
      // IMPORTANT: Since electron-updater and other deps are bundled in dist/main.js,
      // we DON'T need to package node_modules. This avoids conflicts.
      
      // 排除临时构建目录（最重要！防止打包临时文件导致超过 4GB）
      if (/\/YUNKE-canary[^/]*$/i.test(filePath)) return true;
      if (filePath.includes('/temp_asar')) return true;
      if (filePath.includes('/out/')) return true;
      
      // Include the dist directory (contains bundled code)
      if (filePath.includes('/dist/')) return false;
      
      // EXCLUDE resources/web-static from asar (it's added via extraResource)
      // This allows Electron to load HTML files directly
      if (filePath.includes('/resources/web-static')) return true;
      
      // Include other resources (like app-update.yml)
      if (filePath.includes('/resources/')) return false;
      
      // Exclude everything else: node_modules, source files, etc.
      if (filePath.includes('node_modules')) return true;
      if (filePath.includes('/src/')) return true;
      if (filePath.includes('/scripts/')) return true;
      if (filePath.match(/\.(ts|tsx|map|spec\.(js|ts))$/)) return true;
      if (filePath.includes('/.git/')) return true;
      if (filePath.includes('/.husky/')) return true;
      if (filePath.includes('/docs/')) return true;
      if (filePath.includes('/.claude/')) return true;
      if (filePath.includes('/test/')) return true;
      
      // For root level, include package.json
      if (filePath === '/package.json') return false;
      
      return false;
    },
    extendInfo: {
      NSAudioCaptureUsageDescription:
        'Please allow access in order to capture audio from other apps by YUNKE.',
    },
  },
  makers,
  plugins: [{ name: '@electron-forge/plugin-auto-unpack-natives', config: {} }],
  hooks: {
    readPackageJson: async (_, packageJson) => {
      // we want different package name for canary build
      // so stable and canary will not share the same app data
      packageJson.productName = productName;
    },
    prePackage: async () => {
      // Clean up old output directory to avoid EBUSY errors on Windows
      const outDir = path.join(__dirname, 'out', buildType);
      if (existsSync(outDir)) {
        console.log('Cleaning old output directory...');
        try {
          // Use synchronous rmSync with maxRetries for better handling of locked files on Windows
          rmSync(outDir, { 
            recursive: true, 
            force: true,
            maxRetries: 3,
            retryDelay: 1000
          });
          console.log('✓ Old output directory cleaned');
        } catch (err) {
          console.warn('Warning: Could not fully clean output directory:', err.message);
          console.warn('If you see EBUSY errors, please close any running Electron apps and try again.');
        }
      }

      // Ensure web assets are generated and copied to resources/web-static
      console.log('Generating assets (frontend HTML/JS/CSS + electron build)...');
      cp.spawnSync('yarn', ['generate-assets'], { stdio: 'inherit', cwd: __dirname });

      // Verify dist directory exists with bundled code
      const distPath = path.join(__dirname, 'dist', 'main.js');
      if (!existsSync(distPath)) {
        throw new Error(
          'dist/main.js not found! Please run "yarn build" before packaging.\n' +
          'The main.js file should contain bundled electron-updater and other dependencies.'
        );
      }
      
      // Verify web-static directory exists with frontend resources
      const webStaticPath = path.join(__dirname, 'resources', 'web-static', 'shell.html');
      if (!existsSync(webStaticPath)) {
        throw new Error(
          'resources/web-static/shell.html not found!\n' +
          'Frontend resources were not copied. Please check electron-renderer build output.'
        );
      }
      
      console.log('✓ dist/main.js exists - dependencies are bundled');
      console.log('✓ resources/web-static exists - frontend resources ready');
      
      // Since all dependencies are bundled in dist/main.js, we don't need node_modules
      // Remove any existing node_modules symlink to avoid confusion
      const nodeModulesPath = path.join(__dirname, 'node_modules');
      if (existsSync(nodeModulesPath)) {
        const stats = lstatSync(nodeModulesPath);
        if (stats.isSymbolicLink()) {
          console.log('Removing node_modules symlink (not needed for bundled app)...');
          try {
            rmSync(nodeModulesPath, { force: true });
            console.log('✓ node_modules symlink removed');
          } catch (err) {
            console.warn('Could not remove node_modules symlink:', err.message);
          }
        }
      }
    },
    generateAssets: async (_, platform, arch) => {
      if (process.env.SKIP_GENERATE_ASSETS) {
        return;
      }

      // TODO(@Peng): right now we do not need the following
      // it is for octobase-node, but we dont use it for now.
      if (platform === 'darwin' && arch === 'arm64') {
        // In GitHub Actions runner, MacOS is always x64
        // we need to manually set TARGET to aarch64-apple-darwin
        process.env.TARGET = 'aarch64-apple-darwin';
      }

      cp.spawnSync('yarn', ['generate-assets'], {
        stdio: 'inherit',
        cwd: __dirname,
      });
    },
  },
};
