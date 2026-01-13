import {
  DatabaseBlockDataSource,
  ExternalGroupByConfigProvider,
} from '@blocksuite/yunke/blocks/database';
import type { ExtensionType } from '@blocksuite/yunke/store';

import { groupByConfigList } from '../../database-block/group-by';
import { propertiesPresets } from '../../database-block/properties';

export function patchDatabaseBlockConfigService(): ExtensionType {
  //TODO use service
  DatabaseBlockDataSource.externalProperties.value = propertiesPresets;
  return {
    setup: di => {
      groupByConfigList.forEach(config => {
        di.addValue(ExternalGroupByConfigProvider(config.name), config);
      });
    },
  };
}
