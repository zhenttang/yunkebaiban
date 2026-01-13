// 支付功能API调用函数
import type {
  PaymentOrderRequest,
  PaymentOrderResponse,
  ApiResponse,
} from '../components/community-ui/types';
import { getPaymentApiBase } from '@yunke/config';
import type { FetchService } from '../modules/cloud/services/fetch';

// 支付后端服务地址 - 从统一配置模块获取
const PAYMENT_API_BASE = getPaymentApiBase();

/**
 * 统一的支付API请求函数
 * 优先使用FetchService（如果提供），否则使用统一的fetch wrapper
 */
async function paymentFetch(
  path: string,
  options: RequestInit = {},
  fetchService?: FetchService
): Promise<Response> {
  const url = `${PAYMENT_API_BASE}${path}`;
  
  if (fetchService) {
    // 使用FetchService，享受重试、超时、JWT token等功能
    return await fetchService.fetch(url, options);
  } else {
    // 回退方案：直接使用fetch，但使用统一配置
    // 注意：这种情况下不会有自动重试和统一超时
    return await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
}

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
   * @param request 支付订单请求
   * @param fetchService 可选的FetchService，用于享受统一的重试、超时等功能
   */
  createPaymentOrder: async (
    request: PaymentOrderRequest,
    fetchService?: FetchService
  ): Promise<PaymentOrderResponse> => {
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
      const response = await paymentFetch('/payment/test/create', {
        method: 'POST',
        body: JSON.stringify(backendRequest),
      }, fetchService);

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
   * @param orderId 订单ID
   * @param fetchService 可选的FetchService
   */
  checkPaymentStatus: async (
    orderId: string,
    fetchService?: FetchService
  ): Promise<boolean> => {
    try {
      const response = await paymentFetch(`/payment/test/status/${orderId}`, {
        method: 'GET',
      }, fetchService);

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
   * @param orderId 订单ID
   * @param fetchService 可选的FetchService
   */
  getPaymentStatusText: async (
    orderId: string,
    fetchService?: FetchService
  ): Promise<string> => {
    try {
      const response = await paymentFetch(`/payment/test/status/${orderId}`, {
        method: 'GET',
      }, fetchService);

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
