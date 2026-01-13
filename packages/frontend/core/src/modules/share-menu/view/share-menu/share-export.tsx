import { useExportPage } from '@yunke/core/components/hooks/yunke/use-export-page';
import {
  ExportMenuItems,
  PrintMenuItems,
} from '@yunke/core/components/page-list';
import { EditorService } from '@yunke/core/modules/editor';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';

import * as styles from './index.css';

export const ShareExport = () => {
  const t = useI18n();
  const editor = useService(EditorService).editor;
  const exportHandler = useExportPage();
  const currentMode = useLiveData(editor.mode$);

  return (
    <div className={styles.exportContainerStyle}>
      <div className={styles.descriptionStyle}>
        {t['com.yunke.share-menu.ShareViaExportDescription']()}
      </div>
      <div className={styles.exportContainerStyle}>
        <ExportMenuItems
          exportHandler={exportHandler}
          className={styles.exportItemStyle}
          pageMode={currentMode}
        />
      </div>
      {currentMode === 'page' && (
        <>
          <div className={styles.descriptionStyle}>
            {t['com.yunke.share-menu.ShareViaPrintDescription']()}
          </div>
          <div>
            <PrintMenuItems
              exportHandler={exportHandler}
              className={styles.exportItemStyle}
            />
          </div>
        </>
      )}
    </div>
  );
};
