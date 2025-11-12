import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import * as fg from 'fast-glob';
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    vanillaExtractPlugin(),
    // 参考：https://github.com/vitejs/vite-plugin-react-swc/issues/85#issuecomment-2003922124
    swc.vite({
      jsc: {
        preserveAllComments: true,
        parser: {
          syntax: 'typescript',
          dynamicImport: true,
          tsx: true,
          decorators: true,
        },
        target: 'es2022',
        externalHelpers: false,
        transform: {
          react: {
            runtime: 'automatic',
          },
          useDefineForClassFields: false,
          decoratorVersion: '2022-03',
        },
      },
      sourceMaps: true,
      inlineSourcesContent: true,
    }),
  ],
  assetsInclude: ['**/*.md', '**/*.zip'],
  resolve: {
    alias: {
      // 防止测试使用两个不同来源的yjs
      yjs: resolve(rootDir, 'node_modules/yjs'),
      '@yunke/core': fileURLToPath(
        new URL('./packages/frontend/core/src', import.meta.url)
      ),
    },
  },
  test: {
    setupFiles: [
      // TODO: 恢复测试初始化文件
      // resolve(rootDir, './scripts/setup/polyfill.ts'),
      // resolve(rootDir, './scripts/setup/lit.ts'),
      // resolve(rootDir, './scripts/setup/vi-mock.ts'),
      // resolve(rootDir, './scripts/setup/global.ts'),
    ],
    include: [
      // rootDir在Windows上不能作为模式使用
      fg.convertPathToPattern(rootDir) +
        'packages/{common,frontend}/**/*.spec.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules',
      '**/dist',
      '**/build',
      '**/out,',
      '**/packages/frontend/apps/electron',
    ],
    testTimeout: 5000,
    coverage: {
      all: false,
      provider: 'istanbul', // 或者使用 'c8'
      reporter: ['lcov'],
      reportsDirectory: resolve(rootDir, '.coverage/store'),
    },
  },
});
