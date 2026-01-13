import { notify } from '@yunke/component';
import { SettingRow } from '@yunke/component/setting-components';
import { Button } from '@yunke/component/ui/button';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import {
  getYUNKEWorkspaceSchema,
  type Workspace,
} from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { DownloadIcon, UploadIcon } from '@blocksuite/icons/rc';
import { openFilesWith } from '@blocksuite/yunke/shared/utils';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';
import { useState } from 'react';

import * as styles from './style.css';

export const WebExportPanel = ({ workspace }: { workspace: Workspace }) => {
  const t = useI18n();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = useAsyncCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      track.$.settingsPanel.workspace.export({ type: 'workspace' });
      await ZipTransformer.exportDocs(
        workspace.docCollection,
        getYUNKEWorkspaceSchema(),
        Array.from(workspace.docCollection.docs.values()).map(doc =>
          doc.getStore()
        )
      );
      notify.success({ title: t['Export success']() });
    } catch (error: any) {
      notify.error({
        title: t['Export failed'](),
        message: error?.message,
      });
    } finally {
      setExporting(false);
    }
  }, [exporting, t, workspace]);

  const handleImport = useAsyncCallback(async () => {
    if (importing) return;
    setImporting(true);
    try {
      const files = await openFilesWith('Zip', false);
      const file = files?.[0];
      if (!file) return;
      const blob = new Blob([file], { type: 'application/zip' });
      const result = await ZipTransformer.importDocs(
        workspace.docCollection,
        getYUNKEWorkspaceSchema(),
        blob
      );
      const importedCount = result.filter(Boolean).length;
      notify.success({ title: `已导入 ${importedCount} 个文档` });
    } catch (error: any) {
      notify.error({ title: '导入失败', message: error?.message });
    } finally {
      setImporting(false);
    }
  }, [importing, workspace]);

  return (
    <>
      <SettingRow
        name={
          <div className={styles.rowTitle}>
            <DownloadIcon className={styles.rowIcon} />
            <span>本地备份</span>
          </div>
        }
        desc="导出当前工作区所有文档与附件为 ZIP 快照文件"
      >
        <Button
          variant="primary"
          onClick={handleExport}
          loading={exporting}
          disabled={importing}
        >
          导出
        </Button>
      </SettingRow>
      <SettingRow
        name={
          <div className={styles.rowTitle}>
            <UploadIcon className={styles.rowIcon} />
            <span>导入工作区</span>
          </div>
        }
        desc="从 ZIP 快照导入（可包含多个文档），合并到当前工作区"
      >
        <Button
          variant="secondary"
          onClick={handleImport}
          loading={importing}
          disabled={exporting}
        >
          导入
        </Button>
      </SettingRow>
    </>
  );
};
