// vite.config.ts
import { resolve } from "node:path";
import { vanillaExtractPlugin } from "file:///D:/Documents/yunkebaiban/baibanfront/packages/theme/node_modules/@vanilla-extract/vite-plugin/dist/vanilla-extract-vite-plugin.cjs.js";
import { defineConfig } from "file:///D:/Documents/yunkebaiban/baibanfront/packages/theme/node_modules/vite/dist/node/index.js";
import dts from "file:///D:/Documents/yunkebaiban/baibanfront/packages/theme/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\Documents\\yunkebaiban\\baibanfront\\packages\\theme";
var vite_config_default = defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: {
        index: resolve(__vite_injected_original_dirname, "src/index.ts"),
        css: resolve(__vite_injected_original_dirname, "src/index.css.ts"),
        "v2/index": resolve(__vite_injected_original_dirname, "src/v2/index.ts"),
        "presets/typography": resolve(__vite_injected_original_dirname, "src/presets/typography.css.ts")
      },
      formats: ["es", "cjs"],
      name: "ToEverythingTheme"
    },
    rollupOptions: {
      external: [],
      output: {
        preserveModules: false
      }
    },
    outDir: "dist"
  },
  plugins: [
    vanillaExtractPlugin(),
    dts({
      rollupTypes: true,
      bundledPackages: []
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxEb2N1bWVudHNcXFxceXVua2ViYWliYW5cXFxcYmFpYmFuZnJvbnRcXFxccGFja2FnZXNcXFxcdGhlbWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXERvY3VtZW50c1xcXFx5dW5rZWJhaWJhblxcXFxiYWliYW5mcm9udFxcXFxwYWNrYWdlc1xcXFx0aGVtZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovRG9jdW1lbnRzL3l1bmtlYmFpYmFuL2JhaWJhbmZyb250L3BhY2thZ2VzL3RoZW1lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5cbmltcG9ydCB7IHZhbmlsbGFFeHRyYWN0UGx1Z2luIH0gZnJvbSAnQHZhbmlsbGEtZXh0cmFjdC92aXRlLXBsdWdpbic7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBkdHMgZnJvbSAndml0ZS1wbHVnaW4tZHRzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbGliOiB7XG4gICAgICBlbnRyeToge1xuICAgICAgICBpbmRleDogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvaW5kZXgudHMnKSxcbiAgICAgICAgY3NzOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC5jc3MudHMnKSxcbiAgICAgICAgJ3YyL2luZGV4JzogcmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMvdjIvaW5kZXgudHMnKSxcbiAgICAgICAgJ3ByZXNldHMvdHlwb2dyYXBoeSc6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL3ByZXNldHMvdHlwb2dyYXBoeS5jc3MudHMnKSxcbiAgICAgIH0sXG4gICAgICBmb3JtYXRzOiBbJ2VzJywgJ2NqcyddLFxuICAgICAgbmFtZTogJ1RvRXZlcnl0aGluZ1RoZW1lJyxcbiAgICB9LFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbXSxcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBwcmVzZXJ2ZU1vZHVsZXM6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9LFxuICAgIG91dERpcjogJ2Rpc3QnLFxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgdmFuaWxsYUV4dHJhY3RQbHVnaW4oKSxcbiAgICBkdHMoe1xuICAgICAgcm9sbHVwVHlwZXM6IHRydWUsXG4gICAgICBidW5kbGVkUGFja2FnZXM6IFtdLFxuICAgIH0pLFxuICBdLFxufSk7XG5cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVYsU0FBUyxlQUFlO0FBRS9XLFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUpoQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLFFBQ3hDLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUMxQyxZQUFZLFFBQVEsa0NBQVcsaUJBQWlCO0FBQUEsUUFDaEQsc0JBQXNCLFFBQVEsa0NBQVcsK0JBQStCO0FBQUEsTUFDMUU7QUFBQSxNQUNBLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDTixpQkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxxQkFBcUI7QUFBQSxJQUNyQixJQUFJO0FBQUEsTUFDRixhQUFhO0FBQUEsTUFDYixpQkFBaUIsQ0FBQztBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
