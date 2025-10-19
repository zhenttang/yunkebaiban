import { UserFriendlyError } from '@yunke/error';
import {
  LiveData,
} from '@toeverything/infra';

import type { 
  CreateTemporaryUserResponse,
  ExtendSessionResponse,
  TemporaryUserSessionData,
  TemporaryUserStore,
  ValidateSessionResponse
} from '../stores/temporary-user';

export interface TemporaryUserInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  clientId: string;
  expiresAt: Date;
}

export interface TemporaryUserSessionUnauthenticated {
  status: 'unauthenticated';
}

export interface TemporaryUserSessionAuthenticated {
  status: 'authenticated';
  user: TemporaryUserInfo;
  sessionToken: string;
  canEdit: boolean;
}

export type TemporaryUserSessionStatus = (
  | TemporaryUserSessionUnauthenticated
  | TemporaryUserSessionAuthenticated
)['status'];

/**
 * 临时用户会话管理类
 * 管理AppendOnly分享模式下的匿名用户身份状态
 */
export class TemporaryUserSession {
  session$: LiveData<TemporaryUserSessionUnauthenticated | TemporaryUserSessionAuthenticated> =
    LiveData.from(this.store.watchCachedSession(), null).map(session =>
      session
        ? {
            status: 'authenticated' as const,
            user: session.user,
            sessionToken: session.sessionToken,
            canEdit: session.canEdit,
          }
        : {
            status: 'unauthenticated' as const,
          }
    );

  status$ = this.session$.map(session => session.status);

  user$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.user : null
  );

  canEdit$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.canEdit : false
  );

  sessionToken$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.sessionToken : null
  );

  waitForAuthenticated = (signal?: AbortSignal) =>
    this.session$.waitFor(
      session => session.status === 'authenticated',
      signal
    ) as Promise<TemporaryUserSessionAuthenticated>;

  isCreating$ = new LiveData(false);
  isValidating$ = new LiveData(false);

  constructor(private readonly store: TemporaryUserStore) {
    // 初始化
  }

  /**
   * 创建临时用户身份
   */
  async createTemporaryUser(options: {
    workspaceId: string;
    docId: string;
    clientId?: string;
    name?: string;
  }): Promise<void> {
    this.isCreating$.next(true);
    
    try {
      const sessionInfo = await this.store.createTemporaryUser(options);
      if (sessionInfo) {
        this.store.setCachedSession({
          user: sessionInfo.user,
          sessionToken: sessionInfo.sessionToken,
          canEdit: sessionInfo.canEdit,
        });
      }
    } catch (error) {
      console.error('创建临时用户失败：', error);
      throw error;
    } finally {
      this.isCreating$.next(false);
    }
  }

  /**
   * 验证当前会话
   */
  async validateSession(): Promise<void> {
    this.isValidating$.next(true);
    
    try {
      const result = await this.store.validateSession();
      if (!result.valid) {
        // 会话无效，清除缓存
        this.store.setCachedSession(null);
      } else if (result.user) {
        // 更新用户信息
        const currentSession = this.store.getCachedSession();
        if (currentSession) {
          this.store.setCachedSession({
            ...currentSession,
            user: result.user,
          });
        }
      }
    } catch (error) {
      console.error('验证会话失败：', error);
    } finally {
      this.isValidating$.next(false);
    }
  }

  /**
   * 延长会话有效期
   */
  async extendSession(): Promise<boolean> {
    const currentSession = this.session$.value;
    if (currentSession.status !== 'authenticated') {
      return false;
    }

    try {
      const result: ExtendSessionResponse = await this.store.extendSession(currentSession.user.id);
      if (result.success && result.expiresAt) {
        // 更新本地缓存的过期时间
        this.store.setCachedSession({
          ...this.store.getCachedSession()!,
          user: {
            ...currentSession.user,
            expiresAt: result.expiresAt,
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('延长临时用户会话失败：', error);
      return false;
    }
  }

  /**
   * 注销临时用户
   */
  async logout(): Promise<void> {
    try {
      await this.store.logout();
    } catch (error) {
      console.error('注销临时用户失败：', error);
    } finally {
      this.store.setCachedSession(null);
    }
  }

  /**
   * 检查会话是否即将过期
   */
  isSessionExpiringSoon(): boolean {
    const session = this.session$.value;
    if (session.status !== 'authenticated') {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(session.user.expiresAt);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    
    // 如果剩余时间少于30分钟，认为即将过期
    return timeUntilExpiry < 30 * 60 * 1000;
  }

  /**
   * 检查会话是否已过期
   */
  isSessionExpired(): boolean {
    const session = this.session$.value;
    if (session.status !== 'authenticated') {
      return true;
    }

    const now = new Date();
    const expiresAt = new Date(session.user.expiresAt);
    return now > expiresAt;
  }

  /**
   * 自动延长即将过期的会话
   */
  async autoExtendIfNeeded(): Promise<void> {
    if (this.isSessionExpiringSoon() && !this.isSessionExpired()) {
      await this.extendSession();
    }
  }

  /**
   * 清理资源
   */
      dispose(): void {
      // LiveData会自动清理，无需手动销毁
      console.log('临时用户会话已释放');
    }
} 