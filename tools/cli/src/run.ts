import { Path } from '@yunke-tools/utils/path';
import { execAsync } from '@yunke-tools/utils/process';
import type { Package, PackageName } from '@yunke-tools/utils/workspace';

import { Option, PackageCommand } from './command';

interface RunScriptOptions {
  includeDependencies?: boolean;
  waitDependencies?: boolean;
  ignoreIfNotFound?: boolean;
}

const currentDir = Path.dir(import.meta.url);

const ignoreLoaderScripts = [
  'vitest',
  'vite',
  'ts-node',
  'prisma',
  'cap',
  'tsc',
  'typedoc',
  /^r$/,
  /electron(?!-)/,
];

export class RunCommand extends PackageCommand {
  static override paths = [[], ['run'], ['r']];

  static override usage = PackageCommand.Usage({
    description: 'Yunke单仓脚本',
    details: `
      \`yunke web <script>\`    Run any script defined in package's package.json

      \`yunke init\`            Generate the required files if there are any package added or removed

      \`yunke clean\`           Clean the output files of ts, cargo, webpack, etc.

      \`yunke bundle\`          Bundle the packages

      \`yunke build\`           A proxy for <-p package>'s \`build\` script

      \`yunke dev\`             A proxy for <-p package>'s \`dev\` script
    `,
    examples: [
      [`See detail of each command`, '$0 -h'],
      [
        `Run custom 'xxx' script defined in @yunke/web's package.json`,
        '$0 web xxx',
      ],
      [`Run 'init' for workspace`, '$0 init'],
      [`Clean dist of each package`, '$0 clean --dist'],
      [`Clean node_modules under each package`, '$0 clean --node-modules'],
      [`Clean everything`, '$0 clean --all'],
      [`为 @yunke/web 运行 'build' 脚本`, '$0 build -p web'],
      [`为 @yunke/electron 运行 'dev' 脚本`, '$0 dev -p electron'],
      `为 @yunke/web 运行 'build' 脚本，并预先构建所有依赖`,
    ],
  });

  // 我们使用位置参数而不是选项
  protected override packageNameOrAlias: string = Option.String({
    required: true,
    validator: this.packageNameValidator,
  });

  args = Option.Proxy({ name: 'args', required: 1 });

  async execute() {
    await this.run(this.package, this.args, {
      includeDependencies: this.deps,
      waitDependencies: this.waitDeps,
    });
  }

  async run(name: PackageName, args: string[], opts: RunScriptOptions = {}) {
    opts = {
      includeDependencies: false,
      waitDependencies: true,
      ignoreIfNotFound: false,
      ...opts,
    };

    const pkg = this.workspace.getPackage(name);
    const scriptName = args[0];
    const pkgScript = pkg.scripts[scriptName];

    if (pkgScript) {
      await this.runScript(pkg, scriptName, args.slice(1), opts);
    } else {
      await this.runCommand(pkg, args);
    }
  }

  async runScript(
    pkg: Package,
    scriptName: string,
    args: string[],
    opts: RunScriptOptions = {}
  ) {
    const rawScript = pkg.scripts[scriptName];

    if (!rawScript) {
      if (opts.ignoreIfNotFound) {
        return;
      }

      throw new Error(`Script ${scriptName} not found in ${pkg.name}`);
    }

    const rawArgs = [...rawScript.split(' '), ...args];

    const { args: extractedArgs, envs } = this.extractEnvs(rawArgs);

    args = extractedArgs;

    if (opts.includeDependencies) {
      const depsRun = Promise.all(
        pkg.deps.map(dep => {
          return this.runScript(
            pkg.workspace.getPackage(dep.name),
            scriptName,
            [],
            {
              ...opts,
              ignoreIfNotFound: true,
            }
          );
        })
      );

      if (opts.waitDependencies) {
        await depsRun;
      } else {
        depsRun.catch(e => {
          this.logger.error(e);
        });
      }
    }

    const isYunkeCommand = args[0] === 'yunke';
    if (isYunkeCommand) {
      // 从 'yunke xxx' 命令中移除 'yunke'
      args.shift();
      args.push('-p', pkg.name);

      process.env = {
        ...process.env,
        ...envs,
      };
      await this.cli.run(args);
    } else {
      await this.runCommand(pkg, rawArgs);
    }
  }

  async runCommand(pkg: Package, args: string[]) {
    const { args: extractedArgs, envs } = this.extractEnvs(args);
    args = extractedArgs;

    const bin = args[0] === 'yarn' ? args[1] : args[0];

    const loader = currentDir.join('../register.js').toFileUrl().toString();

    // 自动检测ts/mjs脚本的简单测试
    const isLoaderRequired =
      !ignoreLoaderScripts.some(ignore => new RegExp(ignore).test(bin)) ||
      process.env.NODE_OPTIONS?.includes('ts-node/esm') ||
      process.env.NODE_OPTIONS?.includes(loader);

    let NODE_OPTIONS = process.env.NODE_OPTIONS
      ? [process.env.NODE_OPTIONS]
      : [];

    if (isLoaderRequired) {
      NODE_OPTIONS.push(`--import=${loader}`);
    }

    if (args[0] !== 'yarn') {
      // 在命令前添加 'yarn'，这样我们可以绕过二进制执行
      args.unshift('yarn');
    }

    await execAsync(pkg.name, args, {
      cwd: pkg.path.value,
      env: {
        ...envs,
        NODE_OPTIONS: NODE_OPTIONS.join(' '),
      },
    });
  }

  private extractEnvs(args: string[]): {
    args: string[];
    envs: Record<string, string>;
  } {
    const envs: Record<string, string> = {};

    let i = 0;

    while (i < args.length) {
      const arg = args[i];
      if (arg === 'cross-env') {
        i++;
        continue;
      }

      const match = arg.match(/^([A-Z_]+)=(.+)$/);

      if (match) {
        envs[match[1]] = match[2];
        i++;
      } else {
        // 不再是环境变量
        break;
      }
    }

    return {
      args: args.slice(i),
      envs,
    };
  }
}
