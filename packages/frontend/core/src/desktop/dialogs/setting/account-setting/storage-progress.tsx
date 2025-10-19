import { Button, ErrorMessage, Skeleton, Tooltip } from '@yunke/component';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useEffect, useMemo } from 'react';

import {
  ServerService,
  SubscriptionService,
  UserQuotaService,
} from '../../../../modules/cloud';
import * as styles from './storage-progress.css';

export interface StorageProgressProgress {
  upgradable?: boolean;
  onUpgrade: () => void;
  noAutoRevalidate?: boolean; // 新增属性，避免重复revalidate
}

enum ButtonType {
  Primary = 'primary',
  Default = 'secondary',
}

export const StorageProgress = ({ onUpgrade, noAutoRevalidate = true }: StorageProgressProgress) => {
  const t = useI18n();
  const quota = useService(UserQuotaService).quota;

  // 移除重复的 revalidate 调用，默认禁用自动重新验证
  // 依赖父组件的统一数据加载和 AccountChanged 事件自动触发更新
  // useEffect(() => {
  //   if (!noAutoRevalidate) {
  //     quota.revalidate();
  //   }
  // }, []);
  
  const color = useLiveData(quota.color$);
  const usedFormatted = useLiveData(quota.usedFormatted$);
  const maxFormatted = useLiveData(quota.maxFormatted$);
  const percent = useLiveData(quota.percent$);

  const serverService = useService(ServerService);
  const hasPaymentFeature = useLiveData(
    serverService.server.features$.map(f => f?.payment)
  );
  const subscription = useService(SubscriptionService).subscription;
  
  // 移除重复的 subscription revalidate 调用
  // useEffect(() => {
  //   if (!noAutoRevalidate) {
  //     subscription.revalidate();
  //   }
  // }, []);

  const proSubscription = useLiveData(subscription.pro$);
  const isFreeUser = !proSubscription;
  const quotaName = useLiveData(
    quota.quota$.map(q => (q !== null ? q?.humanReadable.name : null))
  );

  const loading =
    proSubscription === null || percent === null || quotaName === null;
  const loadError = useLiveData(quota.error$);

  const buttonType = useMemo(() => {
    if (isFreeUser) {
      return ButtonType.Primary;
    }
    return ButtonType.Default;
  }, [isFreeUser]);

  if (loading) {
    if (loadError) {
      // TODO(@catsjuice): i18n
      return <ErrorMessage>加载错误</ErrorMessage>;
    }
    return <Skeleton height={42} />;
  }

  return (
    <div className={styles.storageProgressContainer}>
      <div className={styles.storageProgressWrapper}>
        <div className="storage-progress-desc">
          <span>{t['com.affine.storage.used.hint']()}</span>
          <span>
            {usedFormatted}/{maxFormatted}
            {` (${quotaName} ${t['com.affine.storage.plan']()})`}
          </span>
        </div>

        <div className="storage-progress-bar-wrapper">
          <div
            className={styles.storageProgressBar}
            style={{
              width: `${percent}%`,
              backgroundColor: color ?? cssVar('processingColor'),
            }}
          ></div>
        </div>
      </div>

      {hasPaymentFeature ? (
        <Tooltip
          options={{ hidden: percent < 100 }}
          content={
            isFreeUser
              ? t['com.affine.storage.maximum-tips']()
              : t['com.affine.storage.maximum-tips.pro']()
          }
        >
          <span tabIndex={0}>
            <Button variant={buttonType} onClick={onUpgrade}>
              {isFreeUser
                ? t['com.affine.storage.upgrade']()
                : t['com.affine.storage.change-plan']()}
            </Button>
          </span>
        </Tooltip>
      ) : null}
    </div>
  );
};
