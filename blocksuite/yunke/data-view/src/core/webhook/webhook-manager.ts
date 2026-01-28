/**
 * Webhook 支持系统
 */

export interface WebhookConfig {
  /** Webhook ID */
  id: string;
  /** Webhook 名称 */
  name: string;
  /** Webhook URL */
  url: string;
  /** 是否启用 */
  enabled: boolean;
  /** 触发事件类型 */
  events: WebhookEventType[];
  /** 请求头 */
  headers?: Record<string, string>;
  /** 密钥（用于签名验证） */
  secret?: string;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 最后触发时间 */
  lastTriggeredAt?: number;
  /** 最后触发状态 */
  lastStatus?: 'success' | 'failed';
}

export type WebhookEventType =
  | 'row.created'      // 行创建
  | 'row.updated'      // 行更新
  | 'row.deleted'      // 行删除
  | 'cell.updated'     // 单元格更新
  | 'property.created' // 列创建
  | 'property.deleted' // 列删除
  | 'view.updated';    // 视图更新

export interface WebhookPayload {
  /** 事件类型 */
  event: WebhookEventType;
  /** 时间戳 */
  timestamp: number;
  /** 视图 ID */
  viewId: string;
  /** 视图名称 */
  viewName: string;
  /** 事件数据 */
  data: WebhookEventData;
}

export interface WebhookEventData {
  /** 行 ID */
  rowId?: string;
  /** 属性 ID */
  propertyId?: string;
  /** 属性名称 */
  propertyName?: string;
  /** 旧值 */
  oldValue?: unknown;
  /** 新值 */
  newValue?: unknown;
  /** 行数据（完整） */
  rowData?: Record<string, unknown>;
}

const STORAGE_KEY = 'yunke-webhooks';

/**
 * Webhook 管理器
 */
export class WebhookManager {
  private static instance: WebhookManager;
  private webhooks: WebhookConfig[] = [];
  private pendingQueue: Array<{ webhook: WebhookConfig; payload: WebhookPayload }> = [];
  private isProcessing = false;

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  /**
   * 从存储加载配置
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.webhooks = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load webhooks:', e);
      this.webhooks = [];
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.webhooks));
    } catch (e) {
      console.warn('Failed to save webhooks:', e);
    }
  }

  /**
   * 获取所有 Webhook
   */
  getWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }

  /**
   * 获取单个 Webhook
   */
  getWebhook(id: string): WebhookConfig | undefined {
    return this.webhooks.find(w => w.id === id);
  }

  /**
   * 添加 Webhook
   */
  addWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>): WebhookConfig {
    const webhook: WebhookConfig = {
      ...config,
      id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.webhooks.push(webhook);
    this.saveToStorage();
    return webhook;
  }

  /**
   * 更新 Webhook
   */
  updateWebhook(id: string, updates: Partial<WebhookConfig>): boolean {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.webhooks[index] = {
      ...this.webhooks[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveToStorage();
    return true;
  }

  /**
   * 删除 Webhook
   */
  deleteWebhook(id: string): boolean {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;

    this.webhooks.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 触发 Webhook
   */
  async trigger(
    eventType: WebhookEventType,
    viewId: string,
    viewName: string,
    data: WebhookEventData
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: Date.now(),
      viewId,
      viewName,
      data,
    };

    // 查找匹配的 Webhook
    const matchingWebhooks = this.webhooks.filter(
      w => w.enabled && w.events.includes(eventType)
    );

    // 添加到队列
    for (const webhook of matchingWebhooks) {
      this.pendingQueue.push({ webhook, payload });
    }

    // 处理队列
    this.processQueue();
  }

  /**
   * 处理发送队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.pendingQueue.length === 0) return;

    this.isProcessing = true;

    while (this.pendingQueue.length > 0) {
      const item = this.pendingQueue.shift();
      if (!item) continue;

      const { webhook, payload } = item;
      await this.sendWebhook(webhook, payload);
    }

    this.isProcessing = false;
  }

  /**
   * 发送 Webhook 请求
   */
  private async sendWebhook(
    webhook: WebhookConfig,
    payload: WebhookPayload
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...webhook.headers,
      };

      // 如果有密钥，添加签名
      if (webhook.secret) {
        const signature = await this.generateSignature(
          JSON.stringify(payload),
          webhook.secret
        );
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // 更新状态
      this.updateWebhook(webhook.id, {
        lastTriggeredAt: Date.now(),
        lastStatus: response.ok ? 'success' : 'failed',
      });

      if (!response.ok) {
        console.warn(`Webhook ${webhook.name} failed:`, response.status);
      }
    } catch (e) {
      console.error(`Webhook ${webhook.name} error:`, e);
      this.updateWebhook(webhook.id, {
        lastTriggeredAt: Date.now(),
        lastStatus: 'failed',
      });
    }
  }

  /**
   * 生成签名
   */
  private async generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * 测试 Webhook
   */
  async testWebhook(id: string): Promise<{ success: boolean; error?: string }> {
    const webhook = this.getWebhook(id);
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    const testPayload: WebhookPayload = {
      event: 'row.created',
      timestamp: Date.now(),
      viewId: 'test-view',
      viewName: '测试视图',
      data: {
        rowId: 'test-row',
        rowData: { title: '测试数据' },
      },
    };

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...webhook.headers,
        },
        body: JSON.stringify(testPayload),
      });

      return {
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (e) {
      return {
        success: false,
        error: String(e),
      };
    }
  }
}

/**
 * 获取 Webhook 管理器实例
 */
export function getWebhookManager(): WebhookManager {
  return WebhookManager.getInstance();
}

/**
 * 事件类型标签映射
 */
export const WEBHOOK_EVENT_LABELS: Record<WebhookEventType, string> = {
  'row.created': '行创建',
  'row.updated': '行更新',
  'row.deleted': '行删除',
  'cell.updated': '单元格更新',
  'property.created': '列创建',
  'property.deleted': '列删除',
  'view.updated': '视图更新',
};
