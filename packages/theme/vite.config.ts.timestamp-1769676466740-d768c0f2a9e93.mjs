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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxEb2N1bWVudHNcXFxceXVua2ViYWliYW5cXFxcYmFpYmFuZnJvbnRcXFxccGFja2FnZXNcXFxcdGhlbWVcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXERvY3VtZW50c1xcXFx5dW5rZWJhaWJhblxcXFxiYWliYW5mcm9udFxcXFxwYWNrYWdlc1xcXFx0aGVtZVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovRG9jdW1lbnRzL3l1bmtlYmFpYmFuL2JhaWJhbmZyb250L3BhY2thZ2VzL3RoZW1lL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XHJcblxyXG5pbXBvcnQgeyB2YW5pbGxhRXh0cmFjdFBsdWdpbiB9IGZyb20gJ0B2YW5pbGxhLWV4dHJhY3Qvdml0ZS1wbHVnaW4nO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcclxuaW1wb3J0IGR0cyBmcm9tICd2aXRlLXBsdWdpbi1kdHMnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBidWlsZDoge1xyXG4gICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgbGliOiB7XHJcbiAgICAgIGVudHJ5OiB7XHJcbiAgICAgICAgaW5kZXg6IHJlc29sdmUoX19kaXJuYW1lLCAnc3JjL2luZGV4LnRzJyksXHJcbiAgICAgICAgY3NzOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9pbmRleC5jc3MudHMnKSxcclxuICAgICAgICAndjIvaW5kZXgnOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy92Mi9pbmRleC50cycpLFxyXG4gICAgICAgICdwcmVzZXRzL3R5cG9ncmFwaHknOiByZXNvbHZlKF9fZGlybmFtZSwgJ3NyYy9wcmVzZXRzL3R5cG9ncmFwaHkuY3NzLnRzJyksXHJcbiAgICAgIH0sXHJcbiAgICAgIGZvcm1hdHM6IFsnZXMnLCAnY2pzJ10sXHJcbiAgICAgIG5hbWU6ICdUb0V2ZXJ5dGhpbmdUaGVtZScsXHJcbiAgICB9LFxyXG4gICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICBleHRlcm5hbDogW10sXHJcbiAgICAgIG91dHB1dDoge1xyXG4gICAgICAgIHByZXNlcnZlTW9kdWxlczogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgb3V0RGlyOiAnZGlzdCcsXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICB2YW5pbGxhRXh0cmFjdFBsdWdpbigpLFxyXG4gICAgZHRzKHtcclxuICAgICAgcm9sbHVwVHlwZXM6IHRydWUsXHJcbiAgICAgIGJ1bmRsZWRQYWNrYWdlczogW10sXHJcbiAgICB9KSxcclxuICBdLFxyXG59KTtcclxuXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBdVYsU0FBUyxlQUFlO0FBRS9XLFNBQVMsNEJBQTRCO0FBQ3JDLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUpoQixJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxLQUFLO0FBQUEsTUFDSCxPQUFPO0FBQUEsUUFDTCxPQUFPLFFBQVEsa0NBQVcsY0FBYztBQUFBLFFBQ3hDLEtBQUssUUFBUSxrQ0FBVyxrQkFBa0I7QUFBQSxRQUMxQyxZQUFZLFFBQVEsa0NBQVcsaUJBQWlCO0FBQUEsUUFDaEQsc0JBQXNCLFFBQVEsa0NBQVcsK0JBQStCO0FBQUEsTUFDMUU7QUFBQSxNQUNBLFNBQVMsQ0FBQyxNQUFNLEtBQUs7QUFBQSxNQUNyQixNQUFNO0FBQUEsSUFDUjtBQUFBLElBQ0EsZUFBZTtBQUFBLE1BQ2IsVUFBVSxDQUFDO0FBQUEsTUFDWCxRQUFRO0FBQUEsUUFDTixpQkFBaUI7QUFBQSxNQUNuQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxxQkFBcUI7QUFBQSxJQUNyQixJQUFJO0FBQUEsTUFDRixhQUFhO0FBQUEsTUFDYixpQkFBaUIsQ0FBQztBQUFBLElBQ3BCLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
