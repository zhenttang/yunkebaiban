import type { PackageName } from '@yunke-tools/utils/workspace';

import { Option, PackageSelectorCommand } from './command';

export class DevCommand extends PackageSelectorCommand {
  static override paths = [['dev'], ['d']];

  protected override availablePackages: PackageName[] = [
    '@yunke/web',
    '@yunke/electron',
    '@yunke/electron-renderer',
    '@yunke/mobile',
    '@yunke/ios',
    '@yunke/android',
    '@yunke/admin',
  ];

  protected deps = Option.Boolean('--deps', {
    description: '运行开发环境及依赖',
  });

  async execute() {
    const name = await this.getPackage();
    const args = [];

    if (this.deps) {
      args.push('--deps');
    }

    args.push(name, 'dev');

    await this.cli.run(args);
  }
}
