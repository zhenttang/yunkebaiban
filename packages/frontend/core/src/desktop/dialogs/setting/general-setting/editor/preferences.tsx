import { Button } from '@yunke/component';
import {
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { useI18n } from '@yunke/i18n';

export const Preferences = () => {
  const t = useI18n();
  return (
    <SettingWrapper
      title={t['com.affine.settings.editorSettings.preferences']()}
    >
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.preferences.export.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.preferences.export.description'
        ]()}
      >
        <Button>导出</Button>
      </SettingRow>
      <SettingRow
        name={t[
          'com.affine.settings.editorSettings.preferences.import.title'
        ]()}
        desc={t[
          'com.affine.settings.editorSettings.preferences.import.description'
        ]()}
      >
        <Button>导入</Button>
      </SettingRow>
    </SettingWrapper>
  );
};
