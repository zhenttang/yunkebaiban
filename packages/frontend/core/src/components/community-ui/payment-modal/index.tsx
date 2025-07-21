import React, { useState, useCallback, useEffect } from 'react';
import type { CommunityDocument, PaymentOrderRequest, PaymentOrderResponse } from '../types';
import { PAYMENT_METHODS } from '../types';
import * as styles from './styles.css';

interface PaymentModalProps {
  document: CommunityDocument;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onCreateOrder?: (request: PaymentOrderRequest) => Promise<PaymentOrderResponse>;
  onCheckPaymentStatus?: (orderId: string) => Promise<boolean>;
}

type PaymentStatus = 'selecting' | 'processing' | 'waiting' | 'success' | 'error';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  document,
  isOpen,
  onClose,
  onPaymentSuccess,
  onCreateOrder,
  onCheckPaymentStatus,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'WECHAT' | 'ALIPAY'>('WECHAT');
  const [status, setStatus] = useState<PaymentStatus>('selecting');
  const [orderInfo, setOrderInfo] = useState<PaymentOrderResponse | null>(null);
  const [error, setError] = useState<string>('');

  // 重置状态当模态框打开时
  useEffect(() => {
    if (isOpen) {
      setStatus('selecting');
      setOrderInfo(null);
      setError('');
    }
  }, [isOpen]);

  // 支付状态轮询
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === 'waiting' && orderInfo && onCheckPaymentStatus) {
      timer = setInterval(async () => {
        try {
          const isPaid = await onCheckPaymentStatus(orderInfo.orderId);
          if (isPaid) {
            setStatus('success');
            setTimeout(() => {
              onPaymentSuccess();
              onClose();
            }, 2000);
          }
        } catch (err) {
          console.error('检查支付状态失败:', err);
        }
      }, 2000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, orderInfo, onCheckPaymentStatus, onPaymentSuccess, onClose]);

  const handlePayment = useCallback(async () => {
    if (!onCreateOrder) {
      setError('支付功能暂不可用');
      return;
    }

    setStatus('processing');
    setError('');

    try {
      const order = await onCreateOrder({
        documentId: document.id,
        paymentMethod,
      });

      setOrderInfo(order);
      setStatus('waiting');
    } catch (err: any) {
      setError(err.message || '支付失败，请重试');
      setStatus('error');
    }
  }, [document.id, paymentMethod, onCreateOrder]);

  const handleRetry = useCallback(() => {
    setStatus('selecting');
    setError('');
    setOrderInfo(null);
  }, []);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const renderContent = () => {
    switch (status) {
      case 'selecting':
        return (
          <>
            <div className={styles.docInfo}>
              <h4 className={styles.docTitle}>{document.title}</h4>
              <p className={styles.docDescription}>{document.description}</p>
              <div className={styles.priceInfo}>
                <span className={styles.priceLabel}>价格:</span>
                <span className={styles.priceValue}>¥{document.price}</span>
              </div>
            </div>

            <div className={styles.paymentMethods}>
              <h3 className={styles.paymentMethodsTitle}>选择支付方式</h3>
              <div className={styles.paymentMethodsList}>
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method.value}
                    className={styles.paymentMethodOption}
                    data-selected={paymentMethod === method.value}
                  >
                    <input
                      type="radio"
                      className={styles.paymentMethodRadio}
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value as 'WECHAT' | 'ALIPAY')}
                    />
                    <span className={styles.paymentMethodIcon}>{method.icon}</span>
                    <div className={styles.paymentMethodInfo}>
                      <div className={styles.paymentMethodName}>{method.label}</div>
                      <div className={styles.paymentMethodDesc}>
                        {method.value === 'WECHAT' ? '使用微信扫码支付' : '使用支付宝扫码支付'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </>
        );

      case 'processing':
        return (
          <div className={styles.loadingStatus}>
            <div className={styles.statusIcon}>
              <div className={styles.loadingIndicator}>
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
                <div className={styles.loadingDot} />
              </div>
            </div>
            <div className={styles.statusText}>正在创建订单...</div>
            <div className={styles.statusSubtext}>请稍候</div>
          </div>
        );

      case 'waiting':
        return (
          <>
            {orderInfo?.qrCode && (
              <div className={styles.qrCodeContainer}>
                <img 
                  src={orderInfo.qrCode} 
                  alt="支付二维码"
                  className={styles.qrCodeImage}
                />
                <div className={styles.qrCodeText}>
                  请使用{paymentMethod === 'WECHAT' ? '微信' : '支付宝'}扫描二维码完成支付
                </div>
              </div>
            )}
            <div className={styles.loadingStatus}>
              <div className={styles.statusIcon}>⏳</div>
              <div className={styles.statusText}>等待支付完成...</div>
              <div className={styles.statusSubtext}>
                支付金额: ¥{document.price}
              </div>
            </div>
          </>
        );

      case 'success':
        return (
          <div className={styles.successStatus}>
            <div className={styles.statusIcon}>✅</div>
            <div className={styles.statusText}>支付成功！</div>
            <div className={styles.statusSubtext}>正在为您解锁内容...</div>
          </div>
        );

      case 'error':
        return (
          <div className={styles.errorStatus}>
            <div className={styles.statusIcon}>❌</div>
            <div className={styles.statusText}>支付失败</div>
            <div className={styles.statusSubtext}>{error}</div>
          </div>
        );
    }
  };

  const renderActions = () => {
    switch (status) {
      case 'selecting':
        return (
          <>
            <button className={styles.cancelButton} onClick={onClose}>
              取消
            </button>
            <button className={styles.payButton} onClick={handlePayment}>
              支付 ¥{document.price}
            </button>
          </>
        );

      case 'processing':
        return (
          <button className={styles.cancelButton} onClick={onClose}>
            取消
          </button>
        );

      case 'waiting':
        return (
          <>
            <button className={styles.cancelButton} onClick={onClose}>
              取消支付
            </button>
            <button className={styles.payButton} disabled>
              等待支付...
            </button>
          </>
        );

      case 'error':
        return (
          <>
            <button className={styles.cancelButton} onClick={onClose}>
              关闭
            </button>
            <button className={styles.payButton} onClick={handleRetry}>
              重试支付
            </button>
          </>
        );

      case 'success':
        return (
          <button className={styles.payButton} onClick={onClose}>
            确认
          </button>
        );
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {status === 'success' ? '支付成功' : '解锁付费内容'}
          </h2>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="关闭"
          >
            ×
          </button>
        </div>

        {renderContent()}

        <div className={styles.modalActions}>
          {renderActions()}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;