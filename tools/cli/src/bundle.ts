import { rmSync } from 'node:fs';
import { cpus } from 'node:os';
import https from 'node:https';

import { Logger } from '@yunke-tools/utils/logger';
import { Package } from '@yunke-tools/utils/workspace';
import { merge } from 'lodash-es';
import webpack from 'webpack';
import WebpackDevServer, {
  type Configuration as DevServerConfiguration,
} from 'webpack-dev-server';
import CopyPlugin from 'copy-webpack-plugin';
import { ProjectRoot } from '@yunke-tools/utils/path';

import { Option, PackageCommand } from './command';
import {
  createHTMLTargetConfig,
  createNodeTargetConfig,
  createWorkerTargetConfig,
} from './webpack';

function getBaseWorkerConfigs(pkg: Package) {
  const core = new Package('@yunke/core');

  return [
    createWorkerTargetConfig(
      pkg,
      core.srcPath.join(
        'modules/workspace-engine/impls/workspace-profile.worker.ts'
      ).value
    ),
    createWorkerTargetConfig(
      pkg,
      core.srcPath.join('modules/pdf/renderer/pdf.worker.ts').value
    ),
    createWorkerTargetConfig(
      pkg,
      core.srcPath.join(
        'blocksuite/view-extensions/turbo-renderer/turbo-painter.worker.ts'
      ).value
    ),
    // 🔧 P2 优化：文档合并 Worker
    createWorkerTargetConfig(
      pkg,
      core.srcPath.join(
        'modules/cloud-storage/workers/merge-update.worker.ts'
      ).value
    ),
  ];
}

function getBundleConfigs(pkg: Package) {
  switch (pkg.name) {
    case '@yunke/website': {
      // 多入口 + 多页面：React 组件化渲染
      const entries = {
        home: pkg.srcPath.join('entries/home.tsx').value,
        product: pkg.srcPath.join('entries/product.tsx').value,
        solutions: pkg.srcPath.join('entries/solutions.tsx').value,
        pricing: pkg.srcPath.join('entries/pricing.tsx').value,
        download: pkg.srcPath.join('entries/download.tsx').value,
      } as Record<string, string>;

      const config = createHTMLTargetConfig(
        pkg,
        entries,
        {
          // 生成多页 HTML
          pages: [
            {
              filename: 'index.html',
              chunks: ['home'],
              title: '云科白板 - 企业级知识白板协作平台',
              description:
                '基于 YJS CRDT 技术的企业级白板，支持 Windows、macOS、Linux、iOS、Android 多平台实时协作。更快更稳的协作体验。',
              keywords: '企业白板,协作工具,知识管理,在线白板,实时协作,跨平台白板',
              themeColor: '#ffffff',
              lang: 'zh-CN',
            },
            {
              filename: 'product/index.html',
              chunks: ['product'],
              title: '产品功能 - 云科白板',
              description:
                '了解云科白板的核心功能：实时协作、跨平台同步、企业级安全、离线支持等特性。',
              themeColor: '#ffffff',
              lang: 'zh-CN',
            },
            {
              filename: 'solutions/index.html',
              chunks: ['solutions'],
              title: '解决方案 - 云科白板',
              description:
                '了解云科白板如何为不同行业和场景提供解决方案：团队协作、知识管理、培训教育等。',
              themeColor: '#ffffff',
              lang: 'zh-CN',
            },
            {
              filename: 'pricing/index.html',
              chunks: ['pricing'],
              title: '定价方案 - 云科白板',
              description:
                '选择适合您的云科白板定价方案：免费版、专业版、企业版，满足不同规模团队的需求。',
              themeColor: '#ffffff',
              lang: 'zh-CN',
            },
            {
              filename: 'download/index.html',
              chunks: ['download'],
              title: '下载 - 云科白板',
              description:
                '下载云科白板，支持 Windows、macOS、Linux、iOS、Android 全平台。企业级白板协作工具。',
              themeColor: '#ffffff',
              lang: 'zh-CN',
            },
          ],
          additionalEntryForSelfhost: false,
          injectGlobalErrorHandler: false,
          emitAssetsManifest: false,
        }
      );

      // 复制静态资源（例如 icons.svg、任意附带资源）
      (config.plugins ||= []).push(
        new CopyPlugin({
          patterns: [
            {
              // 可选：从应用内 public 目录复制静态资源（如有）
              from: pkg.join('public').value,
              to: pkg.distPath.value,
              noErrorOnMissing: true,
            },
          ],
        })
      );

      return [config];
    }
    case '@yunke/admin': {
      return [createHTMLTargetConfig(pkg, pkg.srcPath.join('index.tsx').value)];
    }
    case '@yunke/web':
    case '@yunke/mobile':
    case '@yunke/ios':
    case '@yunke/android':
    case '@yunke/android': {
      const workerConfigs = getBaseWorkerConfigs(pkg);
      workerConfigs.push(
        createWorkerTargetConfig(
          pkg,
          pkg.srcPath.join('nbstore.worker.ts').value
        )
      );

      return [
        createHTMLTargetConfig(
          pkg,
          pkg.srcPath.join('index.tsx').value,
          {},
          workerConfigs.map(config => config.name)
        ),
        ...workerConfigs,
      ];
    }
    case '@yunke/electron-renderer': {
      const workerConfigs = getBaseWorkerConfigs(pkg);

      return [
        createHTMLTargetConfig(
          pkg,
          {
            index: pkg.srcPath.join('app/index.tsx').value,
            shell: pkg.srcPath.join('shell/index.tsx').value,
            popup: pkg.srcPath.join('popup/index.tsx').value,
            backgroundWorker: pkg.srcPath.join('background-worker/index.ts')
              .value,
          },
          {
            additionalEntryForSelfhost: false,
            injectGlobalErrorHandler: false,
            emitAssetsManifest: false,
          },
          workerConfigs.map(config => config.name)
        ),
        ...workerConfigs,
      ];
    }
    case '@yunke/server': {
      return [createNodeTargetConfig(pkg, pkg.srcPath.join('index.ts').value)];
    }
  }

  throw new Error(`Unsupported package: ${pkg.name}`);
}

const IN_CI = !!process.env.CI;
const httpProxyMiddlewareLogLevel = IN_CI ? 'silent' : 'error';

const defaultDevServerConfig: DevServerConfiguration = {
  host: '0.0.0.0',
  allowedHosts: 'all',
  hot: false,
  liveReload: true,
  compress: !process.env.CI,
  setupExitSignals: true,
  client: {
    overlay: process.env.DISABLE_DEV_OVERLAY === 'true' ? false : undefined,
    logging: process.env.CI ? 'none' : 'error',
    // 参考：https://webpack.js.org/configuration/dev-server/#websocketurl
    webSocketURL: 'auto://0.0.0.0:0/ws',
  },
  historyApiFallback: {
    rewrites: [
      {
        from: /.*/,
        to: () => {
          return process.env.SELF_HOSTED === 'true'
            ? '/selfhost.html'
            : '/index.html';
        },
      },
    ],
  },
  headers: (req): Record<string, string | string[]> => {
    if (
      [/^\/api/, /^\/socket\.io/].some(path => path.test(req.path))
    ) {
      return {};
    }

    const headers: Record<string, string | string[]> = {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      // 添加权限策略允许剪贴板访问（修复局域网访问复制粘贴问题）
      'Permissions-Policy': 'clipboard-read=*, clipboard-write=*',
      // 强制标记为安全上下文（开发环境专用）
      'Sec-Fetch-Site': 'same-origin'
    };

    // 🔥 性能优化：添加静态资源缓存
    const isStaticAsset = /\.(js|css|woff2?|ttf|png|jpg|jpeg|gif|svg|webp|ico)$/i.test(req.path);
    const hasHash = /\.[a-f0-9]{8,}\./i.test(req.path); // 检测是否有contenthash
    
    if (isStaticAsset) {
      if (hasHash) {
        // 有hash的资源：长期缓存（1年）
        headers['Cache-Control'] = 'public, max-age=31536000, immutable';
      } else {
        // 无hash的资源（如index.html）：协商缓存
        headers['Cache-Control'] = 'no-cache, must-revalidate';
      }
    }

    return headers;
  },
  proxy: [
    {
      context: '/api',
      target: process.env.VITE_API_BASE_URL || '',
      logLevel: httpProxyMiddlewareLogLevel,
    },
    {
      context: '/socket.io',
      target: process.env.VITE_SOCKETIO_URL || process.env.VITE_API_BASE_URL || '',
      ws: true,
      logLevel: httpProxyMiddlewareLogLevel,
    },
    // 外部存储代理 - 解决 S3/OSS 跨域问题
    // URL 格式: /external-storage-proxy/{base64编码的完整目标URL}
    {
      context: '/external-storage-proxy',
      target: 'https://placeholder.com', // 会被 router 动态覆盖
      changeOrigin: true,
      secure: false,
      timeout: 60000, // 60秒超时
      proxyTimeout: 60000,
      logLevel: 'debug', // 开启调试日志
      agent: new https.Agent({ rejectUnauthorized: false }), // HTTPS 代理
      router: (req: { url?: string }) => {
        const url = req.url || '';
        const match = url.match(/^\/external-storage-proxy\/([A-Za-z0-9+/=]+)/);
        if (match) {
          try {
            const targetUrl = Buffer.from(match[1], 'base64').toString('utf-8');
            const parsed = new URL(targetUrl);
            console.log(`[Proxy] 转发到: ${parsed.protocol}//${parsed.host}`);
            return `${parsed.protocol}//${parsed.host}`;
          } catch (e) {
            console.error('[Proxy] 解析目标 URL 失败:', e);
            return 'https://placeholder.com';
          }
        }
        return 'https://placeholder.com';
      },
      pathRewrite: (path: string) => {
        const match = path.match(/^\/external-storage-proxy\/([A-Za-z0-9+/=]+)/);
        if (match) {
          try {
            const targetUrl = Buffer.from(match[1], 'base64').toString('utf-8');
            const parsed = new URL(targetUrl);
            const result = parsed.pathname + parsed.search;
            console.log(`[Proxy] 路径重写: ${result}`);
            return result;
          } catch (e) {
            console.error('[Proxy] 路径重写失败:', e);
            return path;
          }
        }
        return path;
      },
      onProxyReq: (proxyReq: import('http').ClientRequest, req: import('http').IncomingMessage) => {
        const url = req.url || '';
        const match = url.match(/^\/external-storage-proxy\/([A-Za-z0-9+/=]+)/);
        if (match) {
          try {
            const targetUrl = Buffer.from(match[1], 'base64').toString('utf-8');
            const parsed = new URL(targetUrl);
            // 设置正确的 Host 头
            proxyReq.setHeader('Host', parsed.host);
            console.log(`[Proxy] 请求: ${req.method} ${targetUrl}`);
            console.log(`[Proxy] 请求头:`, Object.fromEntries(
              Object.entries(req.headers).filter(([k]) => !k.startsWith('sec-') && k !== 'cookie')
            ));
          } catch (e) {
            console.error('[Proxy] onProxyReq 错误:', e);
          }
        }
      },
      onProxyRes: (proxyRes: import('http').IncomingMessage, req: import('http').IncomingMessage) => {
        console.log(`[Proxy] 响应: ${proxyRes.statusCode} ${req.url}`);
      },
      onError: (err: Error, req: import('http').IncomingMessage, res: import('http').ServerResponse) => {
        console.error(`[Proxy] 错误: ${err.message}`, err);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proxy Error', message: err.message }));
      },
    },
  ],
};

export class BundleCommand extends PackageCommand {
  static override paths = [['bundle'], ['webpack'], ['pack'], ['bun']];

  // bundle无法与依赖项一起运行
  override _deps = false;
  override waitDeps = false;

  dev = Option.Boolean('--dev,-d', false, {
    description: '在开发模式下运行',
  });

  async execute() {
    const pkg = this.workspace.getPackage(this.package);

    if (this.dev) {
      await BundleCommand.dev(pkg);
    } else {
      await BundleCommand.build(pkg);
    }
  }

  static async build(pkg: Package) {
    process.env.NODE_ENV = 'production';
    const logger = new Logger('bundle');
    logger.info(`Packing package ${pkg.name}...`);
    logger.info('正在清理旧输出...');
    rmSync(pkg.distPath.value, { recursive: true, force: true });

    const config = getBundleConfigs(pkg);
    // 🔧 性能优化：为每个配置设置并行度
    const parallelism = cpus().length;
    config.forEach(cfg => {
      cfg.parallelism = parallelism;
    });

    const compiler = webpack(config);

    compiler.run((error, stats) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      if (stats) {
        if (stats.hasErrors()) {
          console.error(stats.toString('errors-only'));
          process.exit(1);
        } else {
          console.log(stats.toString('minimal'));
        }
      }
    });
  }

  static async dev(pkg: Package, devServerConfig?: DevServerConfiguration) {
    process.env.NODE_ENV = 'development';
    const logger = new Logger('bundle');
    logger.info(`Starting dev server for ${pkg.name}...`);

    const config = getBundleConfigs(pkg);
    // 🔧 性能优化：为每个配置设置并行度
    const parallelism = cpus().length;
    config.forEach(cfg => {
      cfg.parallelism = parallelism;
    });

    const compiler = webpack(config);

    // 为 website 静态站点禁用 historyApiFallback，确保多页可直接访问
    const extraDevConfig: DevServerConfiguration | undefined =
      pkg.name === '@yunke/website'
        ? {
            historyApiFallback: {
              rewrites: [
                { from: /^\/product$/, to: '/product/index.html' },
                { from: /^\/solutions$/, to: '/solutions/index.html' },
                { from: /^\/pricing$/, to: '/pricing/index.html' },
                { from: /^\/download$/, to: '/download/index.html' },
              ],
              index: '/index.html',
            },
          }
        : undefined;

    const devServer = new WebpackDevServer(
      merge({}, defaultDevServerConfig, extraDevConfig, devServerConfig),
      compiler
    );

    await devServer.start();
  }
}
