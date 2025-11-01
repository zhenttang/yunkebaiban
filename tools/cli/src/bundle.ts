import { rmSync } from 'node:fs';
import { cpus } from 'node:os';

import { Logger } from '@yunke-tools/utils/logger';
import { Package } from '@yunke-tools/utils/workspace';
import { merge } from 'lodash-es';
import webpack from 'webpack';
import WebpackDevServer, {
  type Configuration as DevServerConfiguration,
} from 'webpack-dev-server';

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
  ];
}

function getBundleConfigs(pkg: Package) {
  switch (pkg.name) {
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
    // @ts-expect-error allow
    config.parallelism = cpus().length;

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
    // @ts-expect-error allow
    config.parallelism = cpus().length;

    const compiler = webpack(config);

    const devServer = new WebpackDevServer(
      merge({}, defaultDevServerConfig, devServerConfig),
      compiler
    );

    await devServer.start();
  }
}
