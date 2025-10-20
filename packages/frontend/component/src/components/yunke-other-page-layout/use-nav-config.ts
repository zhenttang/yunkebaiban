import { useI18n } from '@yunke/i18n';
import { useMemo } from 'react';

export const useNavConfig = () => {
  const t = useI18n();
  return useMemo(
    () => [
      {
        title: t['com.yunke.other-page.nav.official-website'](),
        path: 'https://yunke.pro',
      },
      {
        title: t['com.yunke.other-page.nav.blog'](),
        path: 'https://yunke.pro/blog',
      },
      {
        title: t['com.yunke.other-page.nav.contact-us'](),
        path: 'https://yunke.pro/about-us',
      },
    ],
    [t]
  );
};
