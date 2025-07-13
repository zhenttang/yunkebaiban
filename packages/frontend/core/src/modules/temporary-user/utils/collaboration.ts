import type { Awareness } from 'y-protocols/awareness.js';

import type { TemporaryUserInfo } from '../entities/temporary-user-session';

/**
 * 临时用户协作工具
 */
export class TemporaryUserCollaboration {
  /**
   * 在Awareness中设置临时用户状态
   */
  static setTemporaryUserAwareness(
    awareness: Awareness,
    user: TemporaryUserInfo
  ): void {
    awareness.setLocalStateField('user', {
      name: user.name,
      isTemporary: true,
      temporaryId: user.id,
      avatar: user.avatarUrl,
      color: this.generateUserColor(user.id),
    });

    console.log('[TemporaryUser] Set awareness state for temporary user:', {
      id: user.id,
      name: user.name,
    });
  }

  /**
   * 设置匿名用户状态
   */
  static setAnonymousUserAwareness(awareness: Awareness): void {
    awareness.setLocalStateField('user', {
      name: '匿名访客',
      isTemporary: false,
      isAnonymous: true,
      color: '#cccccc',
    });

    console.log('[TemporaryUser] Set awareness state for anonymous user');
  }

  /**
   * 清除用户Awareness状态
   */
  static clearUserAwareness(awareness: Awareness): void {
    awareness.setLocalStateField('user', null);
    console.log('[TemporaryUser] Cleared user awareness state');
  }

  /**
   * 为用户生成一致的颜色
   */
  static generateUserColor(userId: string): string {
    // 基于用户ID生成一致的颜色
    const colors = [
      '#FF6B6B', // 红色
      '#4ECDC4', // 青色
      '#45B7D1', // 蓝色
      '#96CEB4', // 绿色
      '#FFEAA7', // 黄色
      '#DDA0DD', // 紫色
      '#98D8C8', // 薄荷绿
      '#F7DC6F', // 金色
      '#BB8FCE', // 淡紫色
      '#85C1E9', // 天蓝色
    ];

    // 使用简单的哈希函数基于用户ID选择颜色
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 获取Awareness中的所有用户状态
   */
  static getAwarenessUsers(awareness: Awareness): Array<{
    clientId: number;
    user: any;
    isTemporary?: boolean;
    isAnonymous?: boolean;
  }> {
    const users: Array<{
      clientId: number;
      user: any;
      isTemporary?: boolean;
      isAnonymous?: boolean;
    }> = [];

    awareness.getStates().forEach((state, clientId) => {
      if (state.user) {
        users.push({
          clientId,
          user: state.user,
          isTemporary: state.user.isTemporary,
          isAnonymous: state.user.isAnonymous,
        });
      }
    });

    return users;
  }

  /**
   * 统计协作用户数量
   */
  static getCollaboratorCount(awareness: Awareness): {
    total: number;
    temporary: number;
    registered: number;
    anonymous: number;
  } {
    const users = this.getAwarenessUsers(awareness);
    
    let temporary = 0;
    let registered = 0;
    let anonymous = 0;

    users.forEach(({ user }) => {
      if (user.isTemporary) {
        temporary++;
      } else if (user.isAnonymous) {
        anonymous++;
      } else {
        registered++;
      }
    });

    return {
      total: users.length,
      temporary,
      registered,
      anonymous,
    };
  }

  /**
   * 监听Awareness变化
   */
  static observeAwarenessChanges(
    awareness: Awareness,
    callback: (users: Array<{
      clientId: number;
      user: any;
      isTemporary?: boolean;
      isAnonymous?: boolean;
    }>) => void
  ): () => void {
    const handleChange = () => {
      const users = this.getAwarenessUsers(awareness);
      callback(users);
    };

    awareness.on('change', handleChange);

    // 返回清理函数
    return () => {
      awareness.off('change', handleChange);
    };
  }

  /**
   * 为临时用户创建WriterInfo
   */
  static createTemporaryUserWriterInfo(user: TemporaryUserInfo) {
    return {
      id: user.id,
      name: user.name,
      avatar: user.avatarUrl,
      isTemporary: true,
      color: this.generateUserColor(user.id),
    };
  }

  /**
   * 检查是否为临时用户
   */
  static isTemporaryUser(userState: any): boolean {
    return userState && userState.isTemporary === true;
  }

  /**
   * 检查是否为匿名用户
   */
  static isAnonymousUser(userState: any): boolean {
    return userState && userState.isAnonymous === true;
  }
} 