import { useI18n } from '@yunke/i18n';

import tagsDark from './assets/tag-list.dark.png';
import tagsLight from './assets/tag-list.light.png';
import selectOptionIllustration from './assets/select-option.svg';
import { EmptyLayout } from './layout';
import type { UniversalEmptyProps } from './types';

export const EmptyTags = (props: UniversalEmptyProps) => {
  const t = useI18n();

  return (
    <EmptyLayout
      illustrationLight={selectOptionIllustration}
      illustrationDark={selectOptionIllustration}
      title={t['com.yunke.empty.tags.title']()}
      description={t['com.yunke.empty.tags.description']()}
      {...props}
    />
  );
};
