import { Store } from '@toeverything/infra';
import { map } from 'rxjs';

import type { FetchService, ServerService } from '../../cloud';
import type { GlobalSessionState } from '../../storage';

// 通知类型定义
export type Notification = {
  id: string;
  userId: string;
  type: NotificationType;
  level: NotificationLevel;
  body: Record<string, any>;
  read: boolean;
  createdAt: string;
  updatedAt: string;
};

// 通知类型枚举
export enum NotificationType {
  MENTION = 'Mention',
  INVITATION = 'Invitation',
  INVITATION_ACCEPTED = 'InvitationAccepted',
  INVITATION_BLOCKED = 'InvitationBlocked',
  INVITATION_REJECTED = 'InvitationRejected',
  INVITATION_REVIEW_REQUEST = 'InvitationReviewRequest',
  INVITATION_REVIEW_APPROVED = 'InvitationReviewApproved',
  INVITATION_REVIEW_DECLINED = 'InvitationReviewDeclined',
}

// 通知级别枚举
export enum NotificationLevel {
  HIGH = 'High',
  DEFAULT = 'Default',
  LOW = 'Low',
  MIN = 'Min',
  NONE = 'None',
}

// 分页参数
export type PaginationInput = {
  page: number;
  size: number;
};

// 通知列表响应
export type NotificationListResponse = {
  notifications: Notification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

// 通知数量响应
export type NotificationCountResponse = {
  count: number;
};

// 文档模式
export type DocMode = 'edgeless' | 'page';

export class NotificationStore extends Store {
  constructor(
    private readonly fetchService: FetchService,
    private readonly serverService: ServerService,
    private readonly globalSessionState: GlobalSessionState
  ) {
    super();
  }

  watchNotificationCountCache() {
    return this.globalSessionState
      .watch('notification-count:' + this.serverService.server.id)
      .pipe(
        map(count => {
          if (typeof count === 'number') {
            return count;
          }
          return 0;
        })
      );
  }

  setNotificationCountCache(count: number) {
    this.globalSessionState.set(
      'notification-count:' + this.serverService.server.id,
      count
    );
  }

  async getNotificationCount(signal?: AbortSignal): Promise<number> {
    try {
      const result = await this.fetchService.fetch('/api/notifications/count', {
        method: 'GET',
        signal,
      });

      const data: NotificationCountResponse = await result.json();
      return data.count;
    } catch (error) {
      console.error('Error getting notification count:', error);
      return 0;
    }
  }

  async listNotification(pagination: PaginationInput, signal?: AbortSignal): Promise<NotificationListResponse | null> {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        size: pagination.size.toString(),
      });

      const result = await this.fetchService.fetch(`/api/notifications?${params.toString()}`, {
        method: 'GET',
        signal,
      });

      const data: NotificationListResponse = await result.json();
      return data;
    } catch (error) {
      console.error('Error listing notifications:', error);
      return null;
    }
  }

  async readNotification(id: string): Promise<boolean> {
    try {
      const result = await this.fetchService.fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });

      const data = await result.json();
      return data.success || false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async mentionUser(
    userId: string,
    workspaceId: string,
    doc: {
      id: string;
      title: string;
      blockId?: string;
      elementId?: string;
      mode: DocMode;
    }
  ): Promise<boolean> {
    try {
      const result = await this.fetchService.fetch('/api/notifications/mention', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          workspaceId,
          doc,
        }),
      });

      const data = await result.json();
      return data.success || false;
    } catch (error) {
      console.error('Error mentioning user:', error);
      return false;
    }
  }

  /**
   * 删除通知
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      const result = await this.fetchService.fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });

      const data = await result.json();
      return data.success || false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead(): Promise<number> {
    try {
      const result = await this.fetchService.fetch('/api/notifications/read-all', {
        method: 'PUT',
      });

      const data = await result.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * 获取通知详情
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    try {
      const result = await this.fetchService.fetch(`/api/notifications/${id}`, {
        method: 'GET',
      });

      const data = await result.json();
      return data.notification || null;
    } catch (error) {
      console.error('Error getting notification by id:', error);
      return null;
    }
  }
}
