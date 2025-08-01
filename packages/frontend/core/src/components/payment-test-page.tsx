// 支付功能测试页面 - 使用AFFiNE设计系统
import React, { useState } from 'react';
import { Button } from '@affine/component';
import { PaymentModal } from '../components/community-ui/payment-modal';
import type { CommunityDocument } from '../components/community-ui/types';
import * as styles from './payment-test-page.css';

// 模拟测试文档数据
const mockDocument: CommunityDocument = {
  id: 'test-doc-' + Date.now(),
  title: 'AFFiNE Pro功能详解',
  description: '了解AFFiNE Pro的所有高级功能，包括无限存储、高级协作工具等',
  author: {
    id: 'author-1',
    name: 'AFFiNE团队',
    avatar: '',
  },
  category: {
    id: 1,
    name: '产品介绍',
    sortOrder: 1,
    isActive: true,
  },
  tags: [
    { id: 1, name: 'Pro功能', color: '#1976d2', usageCount: 10 },
    { id: 2, name: '教程', color: '#388e3c', usageCount: 5 },
  ],
  isPaid: true,
  price: 1.00, // 1元
  isPublic: true,
  requireFollow: false,
  viewCount: 156,
  likeCount: 23,
  collectCount: 8,
  isLiked: false,
  isCollected: false,
  canAccess: false, // 需要支付才能访问
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const PaymentTestPage: React.FC = () => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentResult, setPaymentResult] = useState<string>('');

  const handleOpenPayment = () => {
    setIsPaymentModalOpen(true);
    setPaymentResult('');
  };

  const handleClosePayment = () => {
    setIsPaymentModalOpen(false);
  };

  const handlePaymentSuccess = () => {
    setPaymentResult('支付成功！内容已解锁');
    console.log('支付成功，用户可以访问内容了');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>支付功能测试</h1>
        <p className={styles.subtitle}>测试AFFiNE支付宝沙箱环境集成</p>
      </div>
      
      <div className={styles.content}>
        <div className={styles.testCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>测试文档信息</h2>
          </div>
          
          <div className={styles.docInfo}>
            <div className={styles.infoRow}>
              <span className={styles.label}>标题:</span>
              <span className={styles.value}>{mockDocument.title}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>描述:</span>
              <span className={styles.value}>{mockDocument.description}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>价格:</span>
              <span className={styles.priceValue}>¥{mockDocument.price}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.label}>访问状态:</span>
              <span className={mockDocument.canAccess ? styles.statusSuccess : styles.statusPending}>
                {mockDocument.canAccess ? '可访问' : '需要支付'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <Button
              onClick={handleOpenPayment}
              variant="primary"
              size="large"
            >
              🔓 解锁内容 (¥{mockDocument.price})
            </Button>
            
            {paymentResult && (
              <div className={styles.successMessage}>
                ✅ {paymentResult}
              </div>
            )}
          </div>
        </div>

        <div className={styles.instructionCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>测试说明</h3>
          </div>
          
          <div className={styles.instructions}>
            <ul className={styles.instructionList}>
              <li>点击"解锁内容"按钮打开支付弹窗</li>
              <li>选择支付方式（默认支付宝）</li>
              <li>确认支付后会生成二维码</li>
              <li>使用支付宝沙箱钱包扫码支付</li>
              <li>支付成功后内容自动解锁</li>
            </ul>
            
            <div className={styles.notice}>
              <strong>注意:</strong> 当前使用支付宝沙箱环境，请使用测试账号
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        document={mockDocument}
        isOpen={isPaymentModalOpen}
        onClose={handleClosePayment}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
};