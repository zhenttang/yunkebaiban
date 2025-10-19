import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'layout-switcher/index': 'src/layout-switcher/index.ts',
    'column-content/index': 'src/column-content/index.ts',
    'shared/index': 'src/shared/index.ts'
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  external: ['lit'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"'
    };
  }
});