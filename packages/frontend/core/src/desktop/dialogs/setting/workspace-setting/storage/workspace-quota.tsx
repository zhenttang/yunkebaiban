import { ErrorMessage, Skeleton } from '@yunke/component';
import { SettingRow } from '@yunke/component/setting-components';
import { WorkspaceQuotaService } from '@yunke/core/modules/quota';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVarV2 } from '@toeverything/theme/v2';
import { useEffect } from 'react';

import * as styles from './style.css';

export const WorkspaceQuotaPanel = () => {
  const t = useI18n();

  return (
    <SettingRow
      name={t['com.yunke.workspace.storage']()}
      desc=""
      spreadCol={false}
    >
      <StorageProgress />
    </SettingRow>
  );
};

export const StorageProgress = () => {
  const t = useI18n();

  const workspaceQuotaService = useService(WorkspaceQuotaService).quota;

  const isLoading = useLiveData(workspaceQuotaService.isRevalidating$);
  const usedFormatted = useLiveData(workspaceQuotaService.usedFormatted$);
  const maxFormatted = useLiveData(workspaceQuotaService.maxFormatted$);
  const percent = useLiveData(workspaceQuotaService.percent$);
  const color = useLiveData(workspaceQuotaService.color$);

  useEffect(() => {
    // revalidate quota to get the latest status
    workspaceQuotaService.revalidate();
  }, [workspaceQuotaService]);

  const loadError = useLiveData(workspaceQuotaService.error$);

  if (isLoading) {
    if (loadError) {
      return <ErrorMessage>加载错误</ErrorMessage>;
    }
    return <Skeleton height={26} />;
  }

  return (
    <div className={styles.storageProgressContainer}>
      <div className={styles.storageProgressWrapper}>
        <div className="storage-progress-desc">
          <span>{t['com.yunke.storage.used.hint']()}</span>
          <span>
            {usedFormatted ?? '0B'}/{maxFormatted ?? '0B'}
          </span>
        </div>
        <div className="storage-progress-bar-wrapper">
          <div
            className={styles.storageProgressBar}
            style={{
              width: `${percent ?? 0}%`,
              backgroundColor: color ?? cssVarV2('toast/iconState/regular'),
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};
