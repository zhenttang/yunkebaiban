import { Button, ErrorMessage, Skeleton } from '@yunke/component';
import { SettingRow } from '@yunke/component/setting-components';
import {
  ServerService,
  SubscriptionService,
  UserCopilotQuotaService,
} from '@yunke/core/modules/cloud';
// import { SubscriptionPlan } from '@yunke/graphql';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import { useLiveData, useService } from '@toeverything/infra';
import { cssVar } from '@toeverything/theme';
import { useCallback, useEffect } from 'react';

import { AIResume, AISubscribe } from '../general-setting/plans/ai/actions';
import type { SettingState } from '../types';
import * as styles from './storage-progress.css';

export const AIUsagePanel = ({
  onChangeSettingState,
}: {
  onChangeSettingState?: (settingState: SettingState) => void;
}) => {
  const t = useI18n();
  const serverService = useService(ServerService);
  const hasPaymentFeature = useLiveData(
    serverService.server.features$.map(f => f?.payment)
  );
  const subscriptionService = useService(SubscriptionService);
  const aiSubscription = useLiveData(subscriptionService.subscription.ai$);
  
  // 移除重复的 revalidate 调用，依赖父组件的统一数据加载
  // useEffect(() => {
  //   subscriptionService.subscription.revalidate();
  //   subscriptionService.prices.revalidate();
  // }, []);
  
  const copilotQuotaService = useService(UserCopilotQuotaService);
  
  // 移除重复的 revalidate 调用，依赖 AccountChanged 事件自动触发更新
  // useEffect(() => {
  //   copilotQuotaService.copilotQuota.revalidate();
  // }, []);
  const copilotActionLimit = useLiveData(
    copilotQuotaService.copilotQuota.copilotActionLimit$
  );
  const copilotActionUsed = useLiveData(
    copilotQuotaService.copilotQuota.copilotActionUsed$
  );
  const loading = copilotActionLimit === null || copilotActionUsed === null;
  const loadError = useLiveData(copilotQuotaService.copilotQuota.error$);

  const openBilling = useCallback(() => {
    onChangeSettingState?.({
      activeTab: 'billing',
    });
    track.$.settingsPanel.accountUsage.viewPlans({ plan: SubscriptionPlan.AI });
  }, [onChangeSettingState]);

  if (loading) {
    if (loadError) {
      return (
        <SettingRow
          name={t['com.affine.payment.ai.usage-title']()}
          desc={''}
          spreadCol={false}
        >
          {/* TODO(@catsjuice): i18n */}
          <ErrorMessage>加载错误</ErrorMessage>
        </SettingRow>
      );
    }
    return (
      <SettingRow
        name={t['com.affine.payment.ai.usage-title']()}
        desc={''}
        spreadCol={false}
      >
        <Skeleton height={42} />
      </SettingRow>
    );
  }

  const percent =
    copilotActionLimit === 'unlimited'
      ? 0
      : Math.min(
          100,
          Math.max(
            0.5,
            Number(((copilotActionUsed / copilotActionLimit) * 100).toFixed(4))
          )
        );

  const color = percent > 80 ? cssVar('errorColor') : cssVar('processingColor');

  return (
    <SettingRow
      spreadCol={aiSubscription ? true : false}
      desc={
        aiSubscription
          ? t['com.affine.payment.ai.usage-description-purchased']()
          : ''
      }
      name={t['com.affine.payment.ai.usage-title']()}
    >
      {copilotActionLimit === 'unlimited' ? (
        hasPaymentFeature && aiSubscription?.canceledAt ? (
          <AIResume />
        ) : (
          <Button onClick={openBilling}>
            {t['com.affine.payment.ai.usage.change-button-label']()}
          </Button>
        )
      ) : (
        <div className={styles.storageProgressContainer}>
          <div className={styles.storageProgressWrapper}>
            <div className="storage-progress-desc">
              <span>{t['com.affine.payment.ai.usage.used-caption']()}</span>
              <span>
                {t['com.affine.payment.ai.usage.used-detail']({
                  used: copilotActionUsed.toString(),
                  limit: copilotActionLimit.toString(),
                })}
              </span>
            </div>

            <div className="storage-progress-bar-wrapper">
              <div
                className={styles.storageProgressBar}
                style={{ width: `${percent}%`, backgroundColor: color }}
              ></div>
            </div>
          </div>

          {hasPaymentFeature && (
            <AISubscribe variant="primary">
              {t['com.affine.payment.ai.usage.purchase-button-label']()}
            </AISubscribe>
          )}
        </div>
      )}
    </SettingRow>
  );
};
