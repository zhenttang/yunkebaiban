import { AliasToPackage, PackageDescriptions } from '@yunke-tools/utils/distribution';
import { Logger } from '@yunke-tools/utils/logger';
import { exec, execAsync, spawn } from '@yunke-tools/utils/process';
import { type PackageName, Workspace } from '@yunke-tools/utils/workspace';
import { Command as BaseCommand, Option } from 'clipanion';
import inquirer from 'inquirer';
import * as t from 'typanion';

import type { CliContext } from './context';

export abstract class Command extends BaseCommand<CliContext> {
  // @ts-expect-error hack: Get the command name
  cmd = this.constructor.paths[0][0];

  get logger() {
    return new Logger(this.cmd);
  }

  get workspace() {
    return this.context.workspace;
  }

  set workspace(workspace: Workspace) {
    this.context.workspace = workspace;
  }

  exec = exec.bind(null, this.cmd);
  execAsync = execAsync.bind(null, this.cmd);
  spawn = spawn.bind(null, this.cmd);
}

export abstract class PackageCommand extends Command {
  protected availablePackageNameArgs = (
    Workspace.PackageNames as string[]
  ).concat(Array.from(AliasToPackage.keys()));
  protected packageNameValidator = t.isOneOf(
    this.availablePackageNameArgs.map(k => t.isLiteral(k))
  );

  protected packageNameOrAlias = Option.String('--package,-p', {
    required: true,
    validator: this.packageNameValidator,
    description: '要运行的包名或别名',
  });

  get package(): PackageName {
    const name =
      AliasToPackage.get(this.packageNameOrAlias as any) ??
      (this.packageNameOrAlias as PackageName);

    // 检查
    this.workspace.getPackage(name);

    return name;
  }

  protected _deps = Option.Boolean('--deps', false, {
    description: '在工作区依赖中执行相同的命令（如果已定义）。',
  });

  get deps() {
    return this._deps;
  }

  waitDeps = Option.Boolean('--wait-deps', false, {
    description: '等待依赖准备就绪后再运行命令',
  });
}

export abstract class PackagesCommand extends Command {
  protected availablePackageNameArgs = (
    Workspace.PackageNames as string[]
  ).concat(Array.from(AliasToPackage.keys()));
  protected packageNameValidator = t.isOneOf(
    this.availablePackageNameArgs.map(k => t.isLiteral(k))
  );

  protected packageNamesOrAliases = Option.Array('--package,-p', {
    required: true,
    validator: t.isArray(this.packageNameValidator),
  });
  get packages() {
    return this.packageNamesOrAliases.map(
      name => AliasToPackage.get(name as any) ?? name
    );
  }

  deps = Option.Boolean('--deps', false, {
    description: '在工作区依赖中执行相同的命令（如果已定义）。',
  });
}

export abstract class PackageSelectorCommand extends Command {
  protected availablePackages = Workspace.PackageNames;

  protected availablePackageNameArgs = (
    Workspace.PackageNames as string[]
  ).concat(Array.from(AliasToPackage.keys()));

  protected packageNameValidator = t.isOneOf(
    this.availablePackageNameArgs.map(k => t.isLiteral(k))
  );

  protected packageNameOrAlias = Option.String('--package,-p', {
    validator: this.packageNameValidator,
    description: '要运行的包名或别名',
  });

  async getPackage(): Promise<PackageName> {
    let name = this.packageNameOrAlias
      ? (AliasToPackage.get(this.packageNameOrAlias as any) ??
        this.packageNameOrAlias)
      : undefined;

    if (!name) {
      const answer = await inquirer.prompt([
        {
          type: 'list',
          name: 'package',
          message: '您想要开发哪个包？',
          choices: this.availablePackages.map(name => {
            const desc = PackageDescriptions.get(name as PackageName);
            const label = desc ? `${name} — ${desc}` : name;
            return {
              name: label,
              value: name,
              short: name,
            };
          }),
          pageSize: 10,
          default: '@yunke/web',
        },
      ]);

      name = answer.package as PackageName;
    }

    // 检查
    this.workspace.getPackage(name as PackageName);

    return name as PackageName;
  }
}

export { Option };
