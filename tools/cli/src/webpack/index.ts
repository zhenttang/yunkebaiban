import { createRequire } from 'node:module';
import path from 'node:path';

import { getBuildConfig } from '@yunke-tools/utils/build-config';
import { Path, ProjectRoot } from '@yunke-tools/utils/path';
import { Package } from '@yunke-tools/utils/workspace';
import { PerfseePlugin } from '@perfsee/webpack';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';
import { VanillaExtractPlugin } from '@vanilla-extract/webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { compact, merge } from 'lodash-es';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

import { productionCacheGroups } from './cache-group.js';
import {
  type CreateHTMLPluginConfig,
  createHTMLPlugins,
} from './html-plugin.js';
import { WebpackS3Plugin } from './s3-plugin.js';

const require = createRequire(import.meta.url);
const cssnano = require('cssnano');

// 手动读取.env文件（支持多环境文件）
import { readFileSync, existsSync } from 'node:fs';

/**
 * 解析.env文件内容
 */
function parseEnvFile(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // 移除引号
        const cleanValue = value.replace(/^["']|["']$/g, '');
        envVars[key.trim()] = cleanValue;
      }
    }
  }
  
  return envVars;
}

/**
 * 读取.env文件（如果存在）
 */
function loadEnvFile(filePath: string): Record<string, string> {
  if (existsSync(filePath)) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      return parseEnvFile(content);
    } catch (error) {
      // 静默处理.env文件读取失败
    }
  }
  return {};
}

// 确定当前环境模式
const mode = process.env.NODE_ENV === 'production' ? 'production' : 'development';

// 按照优先级读取环境变量文件（后面的会覆盖前面的）
// 1. .env（基础配置，所有环境共享）
// 2. .env.local（本地覆盖，优先级更高，不应提交到git）
// 3. .env.[mode]（环境特定配置，如.env.development或.env.production）
// 4. .env.[mode].local（环境特定的本地覆盖）
const envVars: Record<string, string> = {
  ...loadEnvFile(ProjectRoot.join('.env').value),
  ...loadEnvFile(ProjectRoot.join('.env.local').value),
  ...loadEnvFile(ProjectRoot.join(`.env.${mode}`).value),
  ...loadEnvFile(ProjectRoot.join(`.env.${mode}.local`).value),
};

// 将环境变量设置到process.env中（如果process.env中还没有）
for (const [key, value] of Object.entries(envVars)) {
  if (!process.env[key]) {
    process.env[key] = value;
  }
}

const IN_CI = !!process.env.CI;

const availableChannels = ['canary', 'beta', 'stable', 'internal'];
function getBuildConfigFromEnv(pkg: Package) {
  const channel = process.env.BUILD_TYPE ?? 'canary';
  const dev = process.env.NODE_ENV === 'development';
  if (!availableChannels.includes(channel)) {
    throw new Error(
      `BUILD_TYPE must be one of ${availableChannels.join(', ')}, received [${channel}]`
    );
  }

  return getBuildConfig(pkg, {
    // @ts-expect-error checked
    channel,
    mode: dev ? 'development' : 'production',
  });
}

export function createHTMLTargetConfig(
  pkg: Package,
  entry: string | Record<string, string>,
  htmlConfig: Partial<CreateHTMLPluginConfig> = {},
  deps?: string[]
): webpack.Configuration {
  entry = typeof entry === 'string' ? { index: entry } : entry;

  htmlConfig = merge(
    {},
    {
      filename: 'index.html',
      additionalEntryForSelfhost: true,
      injectGlobalErrorHandler: true,
      emitAssetsManifest: true,
    },
    htmlConfig
  );

  const buildConfig = getBuildConfigFromEnv(pkg);

  const config: webpack.Configuration = {
    //#region basic webpack config
    name: entry['index'],
    dependencies: deps,
    context: ProjectRoot.value,
    experiments: {
      topLevelAwait: true,
      outputModule: false,
      syncWebAssembly: true,
    },
    entry,
    output: {
      environment: { module: true, dynamicImport: true },
      filename: buildConfig.debug
        ? 'js/[name].js'
        : 'js/[name].[contenthash:8].js',
      assetModuleFilename: buildConfig.debug
        ? '[name].[contenthash:8][ext]'
        : 'assets/[name].[contenthash:8][ext][query]',
      path: pkg.distPath.value,
      clean: false,
      globalObject: 'globalThis',
      // 注意(@forehalo): 始终保持为 '/'
      publicPath: '/',
    },
    target: ['web', 'es2022'],
    mode: buildConfig.debug ? 'development' : 'production',
    devtool: buildConfig.debug ? 'cheap-module-source-map' : 'source-map',
    resolve: {
      symlinks: true,
      extensionAlias: {
        '.js': ['.js', '.tsx', '.ts'],
        '.mjs': ['.mjs', '.mts'],
      },
      extensions: ['.js', '.ts', '.tsx'],
      alias: {
        yjs: ProjectRoot.join('node_modules', 'yjs').value,
        lit: ProjectRoot.join('node_modules', 'lit').value,
        '@preact/signals-core': ProjectRoot.join(
          'node_modules',
          '@preact',
          'signals-core'
        ).value,
      },
    },
    //#endregion

    //#region module config
    module: {
      parser: {
        javascript: {
          // 不要模拟Node.js全局变量
          node: false,
          requireJs: false,
          import: true,
          // 将缺失的导出视为错误
          strictExportPresence: true,
        },
      },
      //#region rules
      rules: [
        { test: /\.m?js?$/, resolve: { fullySpecified: false } },
        {
          test: /\.js$/,
          enforce: 'pre',
          include: /@blocksuite/,
          use: ['source-map-loader'],
        },
        {
          oneOf: [
            {
              test: /\.ts$/,
              exclude: /node_modules/,
              loader: 'swc-loader',
              options: {
                // SWC配置文档：https://swc.rs/docs/configuring-swc/
                jsc: {
                  preserveAllComments: true,
                  parser: {
                    syntax: 'typescript',
                    dynamicImport: true,
                    topLevelAwait: false,
                    tsx: false,
                    decorators: true,
                  },
                  target: 'es2022',
                  externalHelpers: false,
                  transform: {
                    useDefineForClassFields: false,
                    legacyDecorator: true,
                    decoratorMetadata: true,
                    decoratorVersion: '2022-03',
                  },
                },
                sourceMaps: true,
                inlineSourcesContent: true,
              },
            },
            {
              test: /\.tsx$/,
              exclude: /node_modules/,
              loader: 'swc-loader',
              options: {
                // SWC配置文档：https://swc.rs/docs/configuring-swc/
                jsc: {
                  preserveAllComments: true,
                  parser: {
                    syntax: 'typescript',
                    dynamicImport: true,
                    topLevelAwait: false,
                    tsx: true,
                    decorators: true,
                  },
                  target: 'es2022',
                  externalHelpers: false,
                  transform: {
                    react: { runtime: 'automatic' },
                    useDefineForClassFields: false,
                    legacyDecorator: true,
                    decoratorMetadata: true,
                    decoratorVersion: '2022-03',
                  },
                },
                sourceMaps: true,
                inlineSourcesContent: true,
              },
            },
            {
              test: /\.(png|jpg|gif|svg|webp|mp4|zip)$/,
              type: 'asset/resource',
            },
            { test: /\.(ttf|eot|woff|woff2)$/, type: 'asset/resource' },
            { test: /\.txt$/, type: 'asset/source' },
            { test: /\.inline\.svg$/, type: 'asset/inline' },
            {
              test: /\.css$/,
              use: [
                buildConfig.debug
                  ? 'style-loader'
                  : MiniCssExtractPlugin.loader,
                {
                  loader: 'css-loader',
                  options: {
                    url: true,
                    sourceMap: false,
                    modules: false,
                    import: true,
                    importLoaders: 1,
                  },
                },
                {
                  loader: 'postcss-loader',
                  options: {
                    postcssOptions: {
                      plugins: pkg.join('tailwind.config.js').exists()
                        ? [
                            [
                              '@tailwindcss/postcss',
                              require(pkg.join('tailwind.config.js').value),
                            ],
                            ['autoprefixer'],
                          ]
                        : [
                            cssnano({
                              preset: ['default', { convertValues: false }],
                            }),
                          ],
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
      //#endregion
    },
    //#endregion

    //#region plugins
    plugins: compact([
      !IN_CI && new webpack.ProgressPlugin({ percentBy: 'entries' }),
      ...createHTMLPlugins(buildConfig, htmlConfig),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        // 注入VITE风格的环境变量以支持import.meta.env
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || envVars.VITE_API_BASE_URL || ''),
        'import.meta.env.VITE_DRAWIO_URL': JSON.stringify(process.env.VITE_DRAWIO_URL || envVars.VITE_DRAWIO_URL || ''),
        'import.meta.env.MODE': JSON.stringify(buildConfig.debug ? 'development' : 'production'),
        // 创建完整的import.meta.env对象
        'import.meta.env': JSON.stringify({
          VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || envVars.VITE_API_BASE_URL || '',
          VITE_DRAWIO_URL: process.env.VITE_DRAWIO_URL || envVars.VITE_DRAWIO_URL || '',
          MODE: buildConfig.debug ? 'development' : 'production'
        }),
        ...Object.entries(buildConfig).reduce(
          (def, [k, v]) => {
            def[`BUILD_CONFIG.${k}`] = JSON.stringify(v);
            return def;
          },
          {} as Record<string, string>
        ),
      }),
      !buildConfig.debug &&
        // 待办事项: 支持多个入口点
        new MiniCssExtractPlugin({
          filename: `[name].[contenthash:8].css`,
          ignoreOrder: true,
        }),
      new VanillaExtractPlugin(),
      !buildConfig.isAdmin &&
        new CopyPlugin({
          patterns: [
            {
              // 将共享的公共资源复制到dist目录
              from: new Package('@yunke/core').join('public').value,
            },
          ],
        }),
      !buildConfig.debug &&
        (buildConfig.isWeb || buildConfig.isMobileWeb || buildConfig.isAdmin) &&
        process.env.R2_SECRET_ACCESS_KEY &&
        new WebpackS3Plugin(),
      !buildConfig.debug &&
        process.env.PERFSEE_TOKEN &&
        new PerfseePlugin({ project: 'yunke-toeverything' }),
      process.env.SENTRY_AUTH_TOKEN &&
        process.env.SENTRY_ORG &&
        process.env.SENTRY_PROJECT &&
        sentryWebpackPlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
      // 🔥 Bundle分析工具（运行: ANALYZE=true yarn build）
      process.env.ANALYZE === 'true' &&
        (() => {
          try {
            const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
            return new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: true,
              reportFilename: 'bundle-report.html',
              generateStatsFile: true,
              statsFilename: 'bundle-stats.json',
            });
          } catch (e) {
            console.warn('⚠️  webpack-bundle-analyzer 未安装，请运行: yarn add -D webpack-bundle-analyzer');
            return null;
          }
        })(),
      // 像 # sourceMappingURL=76-6370cd185962bc89.js.map 这样的sourcemap URL在electron中无法加载
      // 这是因为Chromium会忽略默认的 file:// 协议
      // 所以我们需要将sourceMappingURL替换为 assets:// 协议
      // 例如:
      // 将 # sourceMappingURL=76-6370cd185962bc89.js.map 替换为
      // # sourceMappingURL=assets://./{dir}/76-6370cd185962bc89.js.map
      buildConfig.isElectron &&
        new webpack.SourceMapDevToolPlugin({
          append: pathData => {
            return `\n//# sourceMappingURL=assets://./${pathData.filename}.map`;
          },
          filename: '[file].map',
        }),
    ]),
    //#endregion

    stats: { errorDetails: true },

    //#region optimization
    optimization: {
      minimize: !buildConfig.debug,
      minimizer: [
        new TerserPlugin({
          minify: TerserPlugin.swcMinify,
          parallel: true,
          extractComments: true,
          terserOptions: {
            ecma: 2020,
            compress: { unused: true },
            mangle: { keep_classnames: true },
          },
        }),
      ],
      removeEmptyChunks: true,
      providedExports: true,
      usedExports: true,
      sideEffects: true,
      removeAvailableModules: true,
      runtimeChunk: { name: 'runtime' },
      splitChunks: {
        chunks: 'all',
        minSize: 1,
        minChunks: 1,
        maxInitialRequests: Number.MAX_SAFE_INTEGER,
        maxAsyncRequests: Number.MAX_SAFE_INTEGER,
        cacheGroups: productionCacheGroups,
      },
    },
    //#endregion
  };

  if (buildConfig.debug && !IN_CI) {
    config.optimization = {
      ...config.optimization,
      minimize: false,
      runtimeChunk: false,
      splitChunks: {
        maxInitialRequests: Infinity,
        chunks: 'all',
        cacheGroups: {
          defaultVendors: {
            test: `[\\/]node_modules[\\/](?!.*vanilla-extract)`,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: { minChunks: 2, priority: -20, reuseExistingChunk: true },
          styles: {
            name: 'styles',
            type: 'css/mini-extract',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };
  }

  return config;
}

export function createWorkerTargetConfig(
  pkg: Package,
  entry: string
): Omit<webpack.Configuration, 'name'> & { name: string } {
  const workerName = path.basename(entry).replace(/\.worker\.ts$/, '');
  const buildConfig = getBuildConfigFromEnv(pkg);

  return {
    name: entry,
    context: ProjectRoot.value,
    experiments: {
      topLevelAwait: true,
      outputModule: false,
      syncWebAssembly: true,
    },
    entry: { [workerName]: entry },
    output: {
      filename: `js/${workerName}-${buildConfig.appVersion}.worker.js`,
      path: pkg.distPath.value,
      clean: false,
      globalObject: 'globalThis',
      // 注意(@forehalo): 始终保持为 '/'
      publicPath: '/',
    },
    target: ['webworker', 'es2022'],
    mode: buildConfig.debug ? 'development' : 'production',
    devtool: buildConfig.debug ? 'cheap-module-source-map' : 'source-map',
    resolve: {
      symlinks: true,
      extensionAlias: { '.js': ['.js', '.ts'], '.mjs': ['.mjs', '.mts'] },
      extensions: ['.js', '.ts'],
      alias: { yjs: ProjectRoot.join('node_modules', 'yjs').value },
    },

    module: {
      parser: {
        javascript: {
          // 不要模拟Node.js全局变量
          node: false,
          requireJs: false,
          import: true,
          // 将缺失的导出视为错误
          strictExportPresence: true,
        },
      },
      rules: [
        { test: /\.m?js?$/, resolve: { fullySpecified: false } },
        {
          test: /\.js$/,
          enforce: 'pre',
          include: /@blocksuite/,
          use: ['source-map-loader'],
        },
        {
          oneOf: [
            {
              test: /\.ts$/,
              exclude: /node_modules/,
              loader: 'swc-loader',
              options: {
                // SWC配置文档：https://swc.rs/docs/configuring-swc/
                jsc: {
                  preserveAllComments: true,
                  parser: {
                    syntax: 'typescript',
                    dynamicImport: true,
                    topLevelAwait: false,
                    tsx: false,
                    decorators: true,
                  },
                  target: 'es2022',
                  externalHelpers: false,
                  transform: {
                    useDefineForClassFields: false,
                    legacyDecorator: true,
                    decoratorMetadata: true,
                    decoratorVersion: '2022-03',
                  },
                },
                sourceMaps: true,
                inlineSourcesContent: true,
              },
            },
          ],
        },
      ],
    },
    plugins: compact([
      // 注入构建配置与环境变量（供 worker 中使用 import.meta.env 与 BUILD_CONFIG）
      new webpack.DefinePlugin({
        // 兼容 import.meta.env 风格
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || envVars.VITE_API_BASE_URL || ''),
        'import.meta.env.VITE_DRAWIO_URL': JSON.stringify(process.env.VITE_DRAWIO_URL || envVars.VITE_DRAWIO_URL || ''),
        'import.meta.env.MODE': JSON.stringify(buildConfig.debug ? 'development' : 'production'),
        'import.meta.env': JSON.stringify({
          VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || envVars.VITE_API_BASE_URL || '',
          VITE_DRAWIO_URL: process.env.VITE_DRAWIO_URL || envVars.VITE_DRAWIO_URL || '',
          MODE: buildConfig.debug ? 'development' : 'production',
        }),
        // 注入 BUILD_CONFIG
        ...Object.entries(buildConfig).reduce(
          (def, [k, v]) => {
            def[`BUILD_CONFIG.${k}`] = JSON.stringify(v);
            return def;
          },
          {} as Record<string, string>
        ),
      }),
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      process.env.SENTRY_AUTH_TOKEN &&
        process.env.SENTRY_ORG &&
        process.env.SENTRY_PROJECT &&
        sentryWebpackPlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
    ]),
    stats: { errorDetails: true },
    optimization: {
      minimize: !buildConfig.debug,
      minimizer: [
        new TerserPlugin({
          minify: TerserPlugin.swcMinify,
          parallel: true,
          extractComments: true,
          terserOptions: {
            ecma: 2020,
            compress: { unused: true },
            mangle: { keep_classnames: true },
          },
        }),
      ],
      removeEmptyChunks: true,
      providedExports: true,
      usedExports: true,
      sideEffects: true,
      removeAvailableModules: true,
      runtimeChunk: false,
      splitChunks: false,
    },
    performance: { hints: false },
  };
}

export function createNodeTargetConfig(
  pkg: Package,
  entry: string
): Omit<webpack.Configuration, 'name'> & { name: string } {
  return {
    name: entry,
    context: ProjectRoot.value,
    experiments: {
      topLevelAwait: true,
      outputModule: pkg.packageJson.type === 'module',
      syncWebAssembly: true,
    },
    entry: { index: entry },
    output: {
      filename: `main.js`,
      path: pkg.distPath.value,
      clean: true,
      globalObject: 'globalThis',
    },
    target: ['node', 'es2022'],
    externals: (data, callback) => {
      if (
        data.request &&
        // import ... from 'module' 形式的导入
        /^[a-zA-Z@]/.test(data.request) &&
        // 不是工作空间依赖
        !pkg.deps.some(dep => data.request!.startsWith(dep.name))
      ) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    externalsPresets: { node: true },
    node: { __dirname: false, __filename: false },
    mode: 'none',
    devtool: 'source-map',
    resolve: {
      symlinks: true,
      extensionAlias: { '.js': ['.js', '.ts'], '.mjs': ['.mjs', '.mts'] },
      extensions: ['.js', '.ts', '.tsx', '.node'],
      alias: { yjs: ProjectRoot.join('node_modules', 'yjs').value },
    },
    module: {
      parser: {
        javascript: { url: false, importMeta: false, createRequire: false },
      },
      rules: [
        {
          test: /\.js$/,
          enforce: 'pre',
          include: /@blocksuite/,
          use: ['source-map-loader'],
        },
        {
          test: /\.node$/,
          loader: Path.dir(import.meta.url).join('node-loader.js').value,
        },
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          loader: 'swc-loader',
          options: {
            // SWC配置文档：https://swc.rs/docs/configuring-swc/
            jsc: {
              preserveAllComments: true,
              parser: {
                syntax: 'typescript',
                dynamicImport: true,
                topLevelAwait: true,
                tsx: true,
                decorators: true,
              },
              target: 'es2022',
              externalHelpers: false,
              transform: {
                legacyDecorator: true,
                decoratorMetadata: true,
                decoratorVersion: '2022-03',
                react: { runtime: 'automatic' },
              },
            },
            sourceMaps: true,
            inlineSourcesContent: true,
          },
        },
      ],
    },
    plugins: compact([
      new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
      new webpack.IgnorePlugin({
        checkResource(resource) {
          const lazyImports = [
            '@nestjs/microservices',
            '@nestjs/websockets/socket-module',
            '@apollo/subgraph',
            '@apollo/gateway',
            '@as-integrations/fastify',
            'ts-morph',
            'class-validator',
            'class-transformer',
          ];
          return lazyImports.some(lazyImport =>
            resource.startsWith(lazyImport)
          );
        },
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': '"production"',
      }),
    ]),
    stats: { errorDetails: true },
    optimization: { nodeEnv: false },
    performance: { hints: false },
    ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
  };
}
