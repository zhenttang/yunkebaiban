import { useI18n } from '@yunke/i18n';

import { SettingGroup } from '../group';
import { RowLayout } from '../row.layout';

export const OthersGroup = () => {
  const t = useI18n();

  return (
    <SettingGroup title={t['com.yunke.mobile.setting.others.title']()}>
      <RowLayout
        label={t['com.yunke.mobile.setting.others.github']()}
        href="https://gitcode.com/xiaoleixiaolei"
      />

      <RowLayout
        label={t['com.yunke.mobile.setting.others.website']()}
        href="https://yunke.pro/"
      />

      <RowLayout
        label={t['com.yunke.mobile.setting.others.privacy']()}
        href="https://yunke.pro/privacy"
      />

      <RowLayout
        label={t['com.yunke.mobile.setting.others.terms']()}
        href="https://yunke.pro/terms"
      />
    </SettingGroup>
  );
};
