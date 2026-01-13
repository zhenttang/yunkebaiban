import { Button, Loading } from '@yunke/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@yunke/component/setting-components';
import { WorkspaceSubscriptionService } from '@yunke/core/modules/cloud';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { PaymentModal } from '@yunke/core/components/community-ui/payment-modal';
import type { CommunityDocument } from '@yunke/core/components/community-ui/types';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';

import { TeamResumeAction } from '../../general-setting/plans/actions';
import { BillingHistory } from './billing-history';
import { PaymentMethodUpdater } from './payment-method';
import { TeamCard } from './team-card';
import { TypeformLink } from './typeform-link';

// 模拟测试文档数据
const mockTestDocument: CommunityDocument = {
  id: 'test-payment-' + Date.now(),
  title: 'YUNKE支付功能测试',
  description: '测试支付宝沙箱环境集成功能',
  author: {
    id: 'system',
    name: '系统测试',
    avatar: '',
  },
  category: {
    id: 999,
    name: '系统测试',
    sortOrder: 0,
    isActive: true,
  },
  tags: [
    { id: 999, name: '测试', color: '#1976d2', usageCount: 1 },
  ],
  isPaid: true,
  price: 1.00, // 1元测试
  isPublic: false,
  requireFollow: false,
  viewCount: 0,
  likeCount: 0,
  collectCount: 0,
  isLiked: false,
  isCollected: false,
  canAccess: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const WorkspaceSettingBilling = () => {
  const workspace = useService(WorkspaceService).workspace;

  const t = useI18n();

  const subscriptionService = workspace?.scope.get(
    WorkspaceSubscriptionService
  );
  const subscription = useLiveData(
    subscriptionService?.subscription.subscription$
  );
  
  // 支付测试状态
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTestResult, setPaymentTestResult] = useState<string>('');

  useEffect(() => {
    // revalidate subscription - only on mount
    subscriptionService?.subscription.revalidate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 支付测试处理
  const handleOpenPaymentTest = useCallback(() => {
    setIsPaymentModalOpen(true);
    setPaymentTestResult('');
  }, []);

  const handleClosePaymentTest = useCallback(() => {
    setIsPaymentModalOpen(false);
  }, []);

  const handlePaymentTestSuccess = useCallback(() => {
    setPaymentTestResult('支付测试成功！');
    console.log('支付测试成功');
  }, []);

  if (workspace === null) {
    return null;
  }

  if (!subscription) {
    return <Loading />;
  }

  return (
    <>
      <SettingHeader
        title={t['com.yunke.payment.billing-setting.title']()}
        subtitle={t['com.yunke.payment.billing-setting.subtitle']()}
      />
      <SettingWrapper
        title={t['com.yunke.payment.billing-setting.information']()}
      >
        <TeamCard />
        <TypeformLink />
        <PaymentMethodUpdater />
        {subscription?.end && subscription.canceledAt ? (
          <ResumeSubscription expirationDate={subscription.end} />
        ) : null}
      </SettingWrapper>

      <SettingWrapper title={t['com.yunke.payment.billing-setting.history']()}>
        <BillingHistory />
      </SettingWrapper>

      {/* 支付功能测试区域 */}
      <SettingWrapper title="支付功能测试" description="测试支付宝沙箱环境集成">
        <SettingRow
          name="支付流程测试"
          desc="测试完整的支付流程，包括订单创建、二维码生成和状态查询"
        >
          <Button onClick={handleOpenPaymentTest} variant="primary">
            🧪 开始测试支付
          </Button>
        </SettingRow>
        
        {paymentTestResult && (
          <SettingRow
            name="测试结果"
            desc={paymentTestResult}
          />
        )}
      </SettingWrapper>

      {/* 支付测试弹窗 */}
      <PaymentModal
        document={mockTestDocument}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentTest}
        onPaymentSuccess={handlePaymentTestSuccess}
      />
    </>
  );
};

const ResumeSubscription = ({ expirationDate }: { expirationDate: string }) => {
  const t = useI18n();
  const [open, setOpen] = useState(false);
  const handleClick = useCallback(() => {
    setOpen(true);
  }, []);

  return (
    <SettingRow
      name={t['com.yunke.payment.billing-setting.expiration-date']()}
      desc={t['com.yunke.payment.billing-setting.expiration-date.description'](
        {
          expirationDate: new Date(expirationDate).toLocaleDateString(),
        }
      )}
    >
      <TeamResumeAction open={open} onOpenChange={setOpen}>
        <Button onClick={handleClick} variant="primary">
          {t['com.yunke.payment.billing-setting.resume-subscription']()}
        </Button>
      </TeamResumeAction>
    </SettingRow>
  );
};
