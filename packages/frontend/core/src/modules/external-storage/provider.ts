import { Framework } from '@toeverything/infra';

import { ExternalStorageService } from './services/external-storage';

export function configureExternalStorageModule(framework: Framework) {
  framework.service(ExternalStorageService);
}

