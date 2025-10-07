import { Button } from '@affine/component';
import {
  SettingHeader,
  SettingRow,
  SettingWrapper,
} from '@affine/component/setting-components';
import { useWorkspaceInfo } from '@affine/core/components/hooks/use-workspace-info';
import { WorkspaceServerService } from '@affine/core/modules/cloud';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { PaymentModal } from '@affine/core/components/community-ui/payment-modal';
import type { CommunityDocument } from '@affine/core/components/community-ui/types';
import { UNTITLED_WORKSPACE_NAME } from '@affine/env/constant';
import { useI18n } from '@affine/i18n';
import { ArrowRightSmallIcon } from '@blocksuite/icons/rc';
import { FrameworkScope, useService } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import { DeleteLeaveWorkspace } from './delete-leave-workspace';
import { EnableCloudPanel } from './enable-cloud';
import { LabelsPanel } from './labels';
import { ProfilePanel } from './profile';
import { SharingPanel } from './sharing';
import { TemplateDocSetting } from './template';
import type { WorkspaceSettingDetailProps } from './types';

// 模拟测试文档数据
const mockTestDocument: CommunityDocument = {
  id: 'test-payment-' + Date.now(),
  title: 'AFFiNE支付功能测试',
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

export const WorkspaceSettingDetail = ({
  onCloseSetting,
}: WorkspaceSettingDetailProps) => {
  const t = useI18n();

  const workspace = useService(WorkspaceService).workspace;
  const server = workspace?.scope.get(WorkspaceServerService).server;

  const workspaceInfo = useWorkspaceInfo(workspace);
  
  // 支付测试状态
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTestResult, setPaymentTestResult] = useState<string>('');

  const handleResetSyncStatus = useCallback(() => {
    workspace?.engine.doc
      .resetSync()
      .then(() => {
        onCloseSetting();
      })
      .catch(err => {
        console.error(err);
      });
  }, [onCloseSetting, workspace]);

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

  return (
    <FrameworkScope scope={server?.scope}>
      <SettingHeader
        title={t[`Workspace Settings with name`]({
          name: workspaceInfo?.name ?? UNTITLED_WORKSPACE_NAME,
        })}
        subtitle={t['com.affine.settings.workspace.description']()}
      />
      <SettingWrapper title={t['Info']()}>
        <SettingRow
          name={t['Workspace Profile']()}
          desc={t['com.affine.settings.workspace.not-owner']()}
          spreadCol={false}
        >
          <ProfilePanel />
          <LabelsPanel />
          {workspace.flavour === 'local' && (
            <EnableCloudPanel onCloseSetting={onCloseSetting} />
          )}
        </SettingRow>
      </SettingWrapper>
      <TemplateDocSetting />
      <SharingPanel />
      {/* 支付功能测试区域 - 使用 PlanCard 样式 */}
      <SettingWrapper title="支付功能测试" description="测试支付宝沙箱环境集成">
        <div style={{ display: 'flex', gap: '16px', margin: '16px 0' }}>
          <div style={{
            backgroundColor: 'var(--affine-background-primary-color)',
            minHeight: '280px',
            minWidth: '258px',
            borderRadius: '16px',
            border: '1px solid var(--affine-border-color)',
            position: 'relative',
            userSelect: 'none',
            transition: 'all 0.23s ease',
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '12px 16px',
              background: 'var(--affine-background-overlay-panel-color)',
              borderRadius: 'inherit',
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderBottom: '1px solid var(--affine-border-color)',
              fontWeight: 600,
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{ paddingBottom: 12 }}>
                <section style={{
                  fontWeight: 600,
                  fontSize: 'var(--affine-font-xs)',
                  lineHeight: '20px'
                }}>支付功能测试</section>
                <section style={{
                  fontWeight: 400,
                  fontSize: 'var(--affine-font-xs)',
                  lineHeight: '20px',
                  color: 'var(--affine-text-secondary-color)',
                  marginBottom: 8
                }}>沙箱环境集成测试</section>
                <section style={{
                  fontWeight: 600,
                  fontSize: 'var(--affine-font-base)',
                  lineHeight: '20px',
                  height: 20,
                  display: 'flex',
                  alignItems: 'flex-end'
                }}>
                  <span style={{
                    fontSize: 'var(--affine-font-h5)',
                    marginRight: '8px'
                  }}>¥1.00</span>
                  <span style={{
                    color: 'var(--affine-text-secondary-color)',
                    fontSize: 'var(--affine-font-sm)'
                  }}>测试金额</span>
                </section>
              </div>
              <Button 
                onClick={handleOpenPaymentTest} 
                variant="primary"
                style={{ width: '100%' }}
              >
                🧪 开始测试支付
              </Button>
            </div>
            <div style={{
              fontSize: 'var(--affine-font-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '12px 16px'
            }}>
              <ul style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}>
                <section style={{
                  fontWeight: 500,
                  fontSize: 'var(--affine-font-xs)',
                  lineHeight: '20px',
                  color: 'var(--affine-text-secondary-color)'
                }}>测试功能:</section>
                <li style={{
                  display: 'flex',
                  gap: '8px',
                  lineHeight: '20px',
                  alignItems: 'normal'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <span style={{ color: 'var(--affine-brand-color)' }}>✓</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'var(--affine-text-primary-color)',
                    fontSize: 'var(--affine-font-xs)'
                  }}>订单创建与管理</div>
                </li>
                <li style={{
                  display: 'flex',
                  gap: '8px',
                  lineHeight: '20px',
                  alignItems: 'normal'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <span style={{ color: 'var(--affine-brand-color)' }}>✓</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'var(--affine-text-primary-color)',
                    fontSize: 'var(--affine-font-xs)'
                  }}>二维码生成</div>
                </li>
                <li style={{
                  display: 'flex',
                  gap: '8px',
                  lineHeight: '20px',
                  alignItems: 'normal'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <span style={{ color: 'var(--affine-brand-color)' }}>✓</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'var(--affine-text-primary-color)',
                    fontSize: 'var(--affine-font-xs)'
                  }}>支付状态查询</div>
                </li>
                <li style={{
                  display: 'flex',
                  gap: '8px',
                  lineHeight: '20px',
                  alignItems: 'normal'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '20px'
                  }}>
                    <span style={{ color: 'var(--affine-brand-color)' }}>✓</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    color: 'var(--affine-text-primary-color)',
                    fontSize: 'var(--affine-font-xs)'
                  }}>沙箱环境模拟</div>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {paymentTestResult && (
          <SettingRow
            name="测试结果"
            desc={paymentTestResult}
          />
        )}
      </SettingWrapper>

      <SettingWrapper>
        <DeleteLeaveWorkspace onCloseSetting={onCloseSetting} />
        <SettingRow
          name={
            <span style={{ color: 'var(--affine-text-secondary-color)' }}>
              {t['com.affine.resetSyncStatus.button']()}
            </span>
          }
          desc={t['com.affine.resetSyncStatus.description']()}
          style={{ cursor: 'pointer' }}
          onClick={handleResetSyncStatus}
          data-testid="reset-sync-status"
        >
          <ArrowRightSmallIcon />
        </SettingRow>
      </SettingWrapper>

      {/* 支付测试弹窗 */}
      <PaymentModal
        document={mockTestDocument}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentTest}
        onPaymentSuccess={handlePaymentTestSuccess}
      />
    </FrameworkScope>
  );
};
