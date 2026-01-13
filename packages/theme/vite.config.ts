import { resolve } from 'node:path';

import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        css: resolve(__dirname, 'src/index.css.ts'),
        'v2/index': resolve(__dirname, 'src/v2/index.ts'),
        'presets/typography': resolve(__dirname, 'src/presets/typography.css.ts'),
      },
      formats: ['es', 'cjs'],
      name: 'ToEverythingTheme',
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false,
      },
    },
    outDir: 'dist',
  },
  plugins: [
    vanillaExtractPlugin(),
    dts({
      rollupTypes: true,
      bundledPackages: [],
    }),
  ],
});

