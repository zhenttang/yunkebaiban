import { notify } from '@yunke/component';
import { SettingRow } from '@yunke/component/setting-components';
import { Button } from '@yunke/component/ui/button';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import type { Workspace } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { universalId } from '@yunke/nbstore';
import track from '@yunke/track';
import { DownloadIcon, ExportIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useState } from 'react';

import * as styles from './style.css';

interface ExportPanelProps {
  workspace: Workspace;
}

export const DesktopExportPanel = ({ workspace }: ExportPanelProps) => {
  const t = useI18n();
  const [saving, setSaving] = useState(false);
  const desktopApi = useService(DesktopApiService);
  const isLocalWorkspace = workspace.flavour === 'local';
  const fullBackupName = (
    <div className={styles.rowTitle}>
      <ExportIcon className={styles.rowIcon} />
      <span>{t['Full Backup']()}</span>
    </div>
  );
  const quickExportName = (
    <div className={styles.rowTitle}>
      <DownloadIcon className={styles.rowIcon} />
      <span>{t['Quick Export']()}</span>
    </div>
  );

  const [fullSyncing, setFullSyncing] = useState(false);
  const [fullSynced, setFullSynced] = useState(isLocalWorkspace);

  const fullSync = useAsyncCallback(async () => {
    setFullSyncing(true);
    await workspace.engine.blob.fullDownload();
    await workspace.engine.doc.waitForSynced();
    setFullSynced(true);
    setFullSyncing(false);
  }, [workspace.engine.blob, workspace.engine.doc]);

  const onExport = useAsyncCallback(async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    try {
      track.$.settingsPanel.workspace.export({
        type: 'workspace',
      });

      const result = await desktopApi.handler?.dialog.saveDBFileAs(
        universalId({
          peer: workspace.flavour,
          type: 'workspace',
          id: workspace.id,
        }),
        workspace.name$.getValue() ?? 'db'
      );
      if (result?.error) {
        throw new Error(result.error);
      } else if (!result?.canceled) {
        notify.success({ title: t['Export success']() });
      }
    } catch (e: any) {
      notify.error({ title: t['Export failed'](), message: e.message });
    } finally {
      setSaving(false);
    }
  }, [desktopApi, saving, t, workspace]);

  if (fullSynced) {
    return (
      <SettingRow
        name={fullBackupName}
        desc={t['Full Backup Description']()}
      >
        <Button
          variant="primary"
          data-testid="export-yunke-backup"
          onClick={onExport}
          disabled={saving}
        >
          {t['Full Backup']()}
        </Button>
      </SettingRow>
    );
  }

  return (
    <>
      <SettingRow
        name={fullBackupName}
        desc={
          fullSynced ? t['Full Backup Description']() : t['Full Backup Hint']()
        }
      >
        <Button
          variant="primary"
          data-testid="export-yunke-full-sync"
          onClick={fullSync}
          loading={fullSyncing}
          disabled={fullSyncing}
          prefix={<ExportIcon />}
        >
          {t['Full Backup']()}
        </Button>
      </SettingRow>
      <SettingRow
        name={quickExportName}
        desc={t['Quick Export Description']()}
      >
        <Button
          data-testid="export-yunke-backup"
          onClick={onExport}
          disabled={saving}
        >
          {t['Quick Export']()}
        </Button>
      </SettingRow>
    </>
  );
};
