import type { Framework } from '@toeverything/infra';

import { GlobalStateService } from '../storage';
import { PluginRegistry } from './entities/plugin-registry';
import { PluginService } from './services/plugin-service';
import { PluginRuntimeService } from './services/plugin-runtime';

export { PluginService } from './services/plugin-service';
export { PluginRuntimeService } from './services/plugin-runtime';
export type {
  PluginContributes,
  PluginInstallOptions,
  PluginManifest,
  PluginPermission,
  PluginRecord,
} from './types';

export function configurePluginsModule(framework: Framework) {
  framework
    .service(PluginService)
    .service(PluginRuntimeService)
    .entity(PluginRegistry, [GlobalStateService]);
}
