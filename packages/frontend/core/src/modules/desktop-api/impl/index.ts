/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { apis, appInfo, events, sharedStorage } from '@yunke/electron-api';
import { Service } from '@toeverything/infra';

import type { DesktopApiProvider } from '../provider';

export class ElectronApiImpl extends Service implements DesktopApiProvider {
  constructor() {
    super();

    if (!apis || !events || !sharedStorage || !appInfo) {
      throw new Error('DesktopApiImpl初始化失败');
    }
  }
  handler = apis;
  events = events;
  sharedStorage = sharedStorage;
  appInfo = appInfo!;
}
