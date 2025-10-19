import React, { useState, useCallback, useEffect } from 'react';
import { Button, Loading } from '@yunke/component';
import { Modal } from '@yunke/component/ui/modal';
import type { CommunityDocument, PaymentOrderRequest, PaymentOrderResponse } from '../types';
import { PAYMENT_METHODS } from '../types';
import { paymentApi } from '../../../api/payment';
import { useQRCode } from '../../../utils/qrcode';

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
  const [paymentMethod, setPaymentMethod] = useState<'WECHAT' | 'ALIPAY'>('ALIPAY');
  const [status, setStatus] = useState<PaymentStatus>('selecting');
  const [orderInfo, setOrderInfo] = useState<PaymentOrderResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string>('');
  const { generateImage } = useQRCode();

  useEffect(() => {
    if (isOpen) {
      setStatus('selecting');
      setOrderInfo(null);
      setError('');
      setQrCodeImageUrl('');
    }
  }, [isOpen]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (status === 'waiting' && orderInfo) {
      timer = setInterval(async () => {
        try {
          const isPaid = await paymentApi.checkPaymentStatus(orderInfo.orderId);
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
      }, 3000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [status, orderInfo, onPaymentSuccess, onClose]);

  const handlePayment = useCallback(async () => {
    setStatus('processing');
    setError('');
    setQrCodeImageUrl('');

    try {
      const order = await paymentApi.createPaymentOrder({
        documentId: document.id,
        paymentMethod,
      });

      if (order.qrCode) {
        const qrImageUrl = await generateImage(order.qrCode, { width: 200 });
        setQrCodeImageUrl(qrImageUrl);
      }

      setOrderInfo(order);
      setStatus('waiting');
    } catch (err: any) {
      console.error('支付失败:', err);
      setError(err.message || '支付失败，请重试');
      setStatus('error');
    }
  }, [document.id, paymentMethod, generateImage]);

  const handleRetry = useCallback(() => {
    setStatus('selecting');
    setError('');
    setOrderInfo(null);
    setQrCodeImageUrl('');
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'selecting':
        return (
          <div style={{ 
            padding: '0 24px 24px 24px',
            minHeight: '400px',
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            {/* Order Summary */}
            <div style={{
              marginBottom: '24px',
              padding: '20px 24px',
              border: `1px solid var(--affine-border-color)`,
              borderRadius: '8px',
              backgroundColor: 'var(--affine-background-secondary-color)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '16px',
                marginBottom: '8px'
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: 'var(--affine-text-primary-color)',
                  margin: 0,
                  lineHeight: '1.5',
                  flex: 1,
                  minWidth: 0,
                  wordBreak: 'break-word'
                }}>{document.title}</h3>
                <span style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--affine-text-primary-color)',
                  lineHeight: '1.5',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>¥{document.price}</span>
              </div>
              <p style={{
                fontSize: '14px',
                color: 'var(--affine-text-secondary-color)',
                margin: 0,
                lineHeight: '1.5',
                wordBreak: 'break-word'
              }}>{document.description}</p>
            </div>

            {/* Payment Methods */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '15px',
                fontWeight: '500',
                color: 'var(--affine-text-primary-color)',
                margin: '0 0 12px 0',
                lineHeight: '1.5'
              }}>选择支付方式</h4>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                width: '100%'
              }}>
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '14px 16px',
                      border: `2px solid ${paymentMethod === method.value ? 'var(--affine-brand-color)' : 'var(--affine-border-color)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      backgroundColor: paymentMethod === method.value ? 'var(--affine-background-secondary-color)' : 'var(--affine-background-primary-color)',
                      transition: 'all 0.2s ease',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={(e) => setPaymentMethod(e.target.value as 'WECHAT' | 'ALIPAY')}
                      style={{
                        marginRight: '12px',
                        accentColor: 'var(--affine-brand-color)'
                      }}
                    />
                    <div style={{
                      width: '20px',
                      height: '20px',
                      marginRight: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {method.value === 'ALIPAY' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#1677FF">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v-.07zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160">
                          <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 1.68.41 3.26 1.15 4.65L2 22l5.5-1.18c1.33.69 2.84 1.08 4.5 1.08 5.5 0 9.96-4.46 9.96-9.96S17.5 2.04 12 2.04zm0 17.92c-1.43 0-2.76-.38-3.91-1.04L7.5 19.5l.54-.12c-1.15-1.15-1.85-2.74-1.85-4.5 0-4.39 3.57-7.96 7.96-7.96s7.96 3.57 7.96 7.96-3.57 7.96-7.96 7.96z"/>
                        </svg>
                      )}
                    </div>
                    <span style={{
                      fontSize: '15px',
                      color: 'var(--affine-text-primary-color)',
                      fontWeight: '400',
                      lineHeight: '1.4'
                    }}>{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'var(--affine-background-tertiary-color)',
              borderRadius: '6px',
              border: `1px solid var(--affine-border-color)`,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <span style={{ 
                fontSize: '14px',
                lineHeight: '1'
              }}>🔒</span>
              <span style={{
                fontSize: '13px',
                color: 'var(--affine-text-secondary-color)',
                lineHeight: '1.4'
              }}>安全支付由支付宝/微信官方保障</span>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <Loading size={24} style={{ marginBottom: '16px' }} />
            <h3 style={{
              fontSize: 'var(--affine-font-base)',
              fontWeight: '500',
              color: 'var(--affine-text-primary-color)',
              margin: '0 0 8px 0'
            }}>正在生成支付订单</h3>
            <p style={{
              fontSize: 'var(--affine-font-sm)',
              color: 'var(--affine-text-secondary-color)',
              margin: 0
            }}>请稍候...</p>
          </div>
        );

      case 'waiting':
        return (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            {/* QR Code */}
            <div style={{
              display: 'inline-block',
              padding: '20px',
              backgroundColor: '#fff',
              border: `1px solid var(--affine-border-color)`,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              {(qrCodeImageUrl || orderInfo?.qrCode) && (
                <img 
                  src={qrCodeImageUrl || orderInfo.qrCode} 
                  alt="支付二维码"
                  style={{
                    width: '200px',
                    height: '200px',
                    display: 'block'
                  }}
                  onError={(e) => {
                    if (orderInfo?.qrCode && e.currentTarget.src !== orderInfo.qrCode) {
                      e.currentTarget.src = orderInfo.qrCode;
                    }
                  }}
                />
              )}
            </div>
            
            <h3 style={{
              fontSize: 'var(--affine-font-base)',
              fontWeight: '500',
              color: 'var(--affine-text-primary-color)',
              margin: '0 0 8px 0'
            }}>使用{paymentMethod === 'WECHAT' ? '微信' : '支付宝'}扫码支付</h3>
            
            <p style={{
              fontSize: 'var(--affine-font-sm)',
              color: 'var(--affine-text-secondary-color)',
              margin: '0 0 16px 0'
            }}>打开{paymentMethod === 'WECHAT' ? '微信' : '支付宝'}App扫描二维码</p>
            
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--affine-background-tertiary-color)',
              borderRadius: '4px',
              fontSize: 'var(--affine-font-xs)',
              color: 'var(--affine-text-secondary-color)'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#52c41a',
                display: 'inline-block'
              }}></span>
              支付金额: ¥{orderInfo ? (orderInfo.amount / 100).toFixed(2) : document.price}
            </div>
            
            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'var(--affine-background-secondary-color)',
              borderRadius: '6px',
              textAlign: 'left'
            }}>
              <h4 style={{
                fontSize: 'var(--affine-font-sm)',
                fontWeight: '500',
                color: 'var(--affine-text-primary-color)',
                margin: '0 0 8px 0'
              }}>订单信息</h4>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--affine-font-xs)',
                color: 'var(--affine-text-secondary-color)',
                marginBottom: '4px'
              }}>
                <span>商品</span>
                <span>{document.title}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--affine-font-xs)',
                color: 'var(--affine-text-secondary-color)',
                marginBottom: '4px'
              }}>
                <span>订单号</span>
                <span>{orderInfo?.orderId?.slice(-8) || 'N/A'}</span>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 'var(--affine-font-xs)',
                color: 'var(--affine-text-secondary-color)'
              }}>
                <span>支付方式</span>
                <span>{paymentMethod === 'WECHAT' ? '微信支付' : '支付宝'}</span>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#52c41a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px', color: '#fff' }}>✓</span>
            </div>
            <h3 style={{
              fontSize: 'var(--affine-font-h5)',
              fontWeight: '600',
              color: 'var(--affine-text-primary-color)',
              margin: '0 0 8px 0'
            }}>支付成功</h3>
            <p style={{
              fontSize: 'var(--affine-font-sm)',
              color: 'var(--affine-text-secondary-color)',
              margin: 0
            }}>内容已解锁，感谢您的购买</p>
          </div>
        );

      case 'error':
        return (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '48px 24px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'var(--affine-error-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '24px', color: '#fff' }}>✕</span>
            </div>
            <h3 style={{
              fontSize: 'var(--affine-font-base)',
              fontWeight: '500',
              color: 'var(--affine-text-primary-color)',
              margin: '0 0 8px 0'
            }}>支付失败</h3>
            <p style={{
              fontSize: 'var(--affine-font-sm)',
              color: 'var(--affine-text-secondary-color)',
              margin: 0,
              maxWidth: '280px'
            }}>{error || '支付过程中出现问题，请重试'}</p>
          </div>
        );
    }
  };

  const renderActions = () => {
    switch (status) {
      case 'selecting':
        return (
          <>
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" onClick={handlePayment}>
              支付 ¥{document.price}
            </Button>
          </>
        );

      case 'processing':
        return (
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
        );

      case 'waiting':
        return (
          <>
            <Button variant="secondary" onClick={onClose}>
              取消支付
            </Button>
            <div style={{
              padding: '8px 16px',
              fontSize: 'var(--affine-font-sm)',
              color: 'var(--affine-text-secondary-color)',
              backgroundColor: 'var(--affine-background-tertiary-color)',
              borderRadius: '4px',
              border: `1px solid var(--affine-border-color)`
            }}>
              等待支付中...
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <Button variant="secondary" onClick={onClose}>
              关闭
            </Button>
            <Button variant="primary" onClick={handleRetry}>
              重试
            </Button>
          </>
        );

      case 'success':
        return (
          <Button variant="primary" onClick={onClose} style={{ minWidth: '100px' }}>
            完成
          </Button>
        );
    }
  };

  return (
    <>
      <style>{`
        .payment-modal-header {
          padding: 20px 24px 12px 24px !important;
          margin-bottom: 0 !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          color: var(--affine-text-primary-color) !important;
        }
      `}</style>
      <Modal
      open={isOpen}
      onOpenChange={onClose}
      width={520}
      height="auto"
      title={status === 'success' ? '支付成功' : status === 'error' ? '支付失败' : '解锁付费内容'}
      headerClassName="payment-modal-header"
      contentOptions={{
        style: { 
          padding: '0',
          minWidth: '480px',
          maxWidth: '520px',
          minHeight: '500px'
        }
      }}
      closeButtonOptions={{
        style: {
          top: '20px',
          right: '20px',
          zIndex: 1000
        }
      }}
    >
      {renderContent()}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end',
        alignItems: 'center',
        padding: '20px 28px',
        borderTop: `1px solid var(--affine-border-color)`,
        backgroundColor: 'var(--affine-background-secondary-color)',
        minHeight: '72px',
        boxSizing: 'border-box'
      }}>
        {renderActions()}
      </div>
    </Modal>
    </>
  );
};

export default PaymentModal;