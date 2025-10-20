import type { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import { IntegrationTypeIcon } from '@yunke/core/modules/integration';
import type { I18nString } from '@yunke/i18n';
import { Logo1Icon, TodayIcon } from '@blocksuite/icons/rc';
import { LiveData } from '@toeverything/infra';
import type { ReactNode } from 'react';

import { CalendarSettingPanel } from './calendar/setting-panel';
import { ReadwiseSettingPanel } from './readwise/setting-panel';

type IntegrationCard = {
  id: string;
  name: I18nString;
  desc: I18nString;
  icon: ReactNode;
} & (
  | {
      setting: ReactNode;
    }
  | {
      link: string;
    }
);

const INTEGRATION_LIST = [
  {
    id: 'readwise' as const,
    name: 'com.yunke.integration.readwise.name',
    desc: 'com.yunke.integration.readwise.desc',
    icon: <IntegrationTypeIcon type="readwise" />,
    setting: <ReadwiseSettingPanel />,
  },
  BUILD_CONFIG.isElectron && {
    id: 'calendar' as const,
    name: 'com.yunke.integration.calendar.name',
    desc: 'com.yunke.integration.calendar.desc',
    icon: <TodayIcon />,
    setting: <CalendarSettingPanel />,
  },
  {
    id: 'web-clipper' as const,
    name: 'com.yunke.integration.web-clipper.name',
    desc: 'com.yunke.integration.web-clipper.desc',
    icon: <Logo1Icon />,
    link: 'https://chromewebstore.google.com/detail/yunke-web-clipper/mpbbkmbdpleomiogkbkkpfoljjpahmoi',
  },
] satisfies (IntegrationCard | false)[];

type IntegrationId = Exclude<
  Extract<(typeof INTEGRATION_LIST)[number], {}>,
  false
>['id'];

export type IntegrationItem = Exclude<IntegrationCard, 'id'> & {
  id: IntegrationId;
};

export function getAllowedIntegrationList$(
  featureFlagService: FeatureFlagService
) {
  return LiveData.computed(get => {
    return INTEGRATION_LIST.filter(item => {
      if (!item) return false;

      if (item.id === 'calendar') {
        return get(featureFlagService.flags.enable_calendar_integration.$);
      }

      return true;
    }) as IntegrationItem[];
  });
}
