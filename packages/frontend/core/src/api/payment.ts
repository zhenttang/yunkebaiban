// 支付功能API调用函数
import type {
  PaymentOrderRequest,
  PaymentOrderResponse,
  ApiResponse,
} from '../components/community-ui/types';
import { getPaymentApiBase } from '@yunke/config';

// 支付后端服务地址 - 从统一配置模块获取
const PAYMENT_API_BASE = getPaymentApiBase();

interface PaymentCreateRequest {
  planType: string;
  amount: number;
  paymentMethod: 'WECHAT' | 'ALIPAY';
  subject: string;
  description: string;
  userId?: string;
}

interface PaymentCreateResponse {
  success: boolean;
  orderId: string;
  jeepayOrderId?: string;
  payDataType: string;
  payData: string;
  payUrl?: string;
  qrCodeUrl: string;
  amount: number;
  expireTime?: string;
  status: string;
  message: string;
}

export const paymentApi = {
  /**
   * 创建支付订单
   */
  createPaymentOrder: async (request: PaymentOrderRequest): Promise<PaymentOrderResponse> => {
    // 映射为后端API需要的格式
    const backendRequest: PaymentCreateRequest = {
      planType: 'document_access',
      amount: 100, // 临时固定金额1元（100分）
      paymentMethod: request.paymentMethod,
      subject: `解锁文档内容 - ${request.documentId}`,
      description: '解锁付费文档内容访问权限',
      userId: 'test_user_' + Date.now().toString(), // 临时生成用户ID
    };

    try {
      const response = await fetch(`${PAYMENT_API_BASE}/payment/test/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: PaymentCreateResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || '创建支付订单失败');
      }

      // 转换为前端接口格式
      return {
        orderId: result.orderId,
        paymentUrl: result.qrCodeUrl, // 使用二维码内容作为支付URL
        qrCode: result.qrCodeUrl, // 二维码内容
        amount: result.amount,
      };
    } catch (error) {
      console.error('创建支付订单失败:', error);
      throw error;
    }
  },

  /**
   * 查询支付状态
   */
  checkPaymentStatus: async (orderId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${PAYMENT_API_BASE}/payment/test/status/${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.text();
      const cleanStatus = status.replace(/"/g, '');
      
      // 支付成功返回true
      return cleanStatus === 'SUCCESS';
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return false;
    }
  },

  /**
   * 获取支付状态文本
   */
  getPaymentStatusText: async (orderId: string): Promise<string> => {
    try {
      const response = await fetch(`${PAYMENT_API_BASE}/payment/test/status/${orderId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const status = await response.text();
      const cleanStatus = status.replace(/"/g, '');
      
      const statusMap: Record<string, string> = {
        'PENDING': '待支付',
        'PROCESSING': '支付中',
        'SUCCESS': '支付成功',
        'FAILED': '支付失败',
        'CANCELLED': '已取消',
        'REFUNDED': '已退款',
        'UNKNOWN': '未知状态'
      };
      
      return statusMap[cleanStatus] || cleanStatus;
    } catch (error) {
      console.error('查询支付状态失败:', error);
      return '查询失败';
    }
  },
};
