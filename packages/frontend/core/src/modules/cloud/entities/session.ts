import { UserFriendlyError } from '@affine/error';
import {
  backoffRetry,
  effect,
  Entity,
  exhaustMapWithTrailing,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { isEqual } from 'lodash-es';
import { debounceTime, tap } from 'rxjs';

import { validateAndReduceImage } from '../../../utils/reduce-image';
import type { AccountProfile, AuthStore } from '../stores/auth';
import { AvatarUpdated } from '../events/avatar-updated';

export interface AuthSessionInfo {
  account: AuthAccountInfo;
}

export interface AuthAccountInfo {
  id: string;
  label: string;
  email?: string;
  info?: AccountProfile | null;
  avatar?: string | null;
}

export interface AuthSessionUnauthenticated {
  status: 'unauthenticated';
}

export interface AuthSessionAuthenticated {
  status: 'authenticated';
  session: AuthSessionInfo;
}

export type AuthSessionStatus = (
  | AuthSessionUnauthenticated
  | AuthSessionAuthenticated
)['status'];

export class AuthSession extends Entity {
  session$: LiveData<AuthSessionUnauthenticated | AuthSessionAuthenticated> =
    LiveData.from(this.store.watchCachedAuthSession(), null).map(session => {
      return session
        ? {
            status: 'authenticated',
            session: session as AuthSessionInfo,
          }
        : {
            status: 'unauthenticated',
          };
    });

  status$ = this.session$.map(session => session.status);

  account$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.session.account : null
  );

  waitForAuthenticated = (signal?: AbortSignal) =>
    this.session$.waitFor(
      session => session.status === 'authenticated',
      signal
    ) as Promise<AuthSessionAuthenticated>;

  isRevalidating$ = new LiveData(false);

  // 添加循环检测机制
  private revalidateCallCount = 0;
  private revalidateResetTimeout: NodeJS.Timeout | null = null;
  private lastRevalidateTime = 0;

  constructor(private readonly store: AuthStore) {
    super();
  }

  revalidate = effect(
    exhaustMapWithTrailing(() => {
      // 防止短时间内频繁调用
      const now = Date.now();
      if (now - this.lastRevalidateTime < 500) {
        return fromPromise(() => Promise.resolve(null));
      }
      
      // 循环检测机制
      this.revalidateCallCount++;
      this.lastRevalidateTime = now;
      
      // 重置计数器
      if (this.revalidateResetTimeout) {
        clearTimeout(this.revalidateResetTimeout);
      }
      this.revalidateResetTimeout = setTimeout(() => {
        this.revalidateCallCount = 0;
      }, 5000); // 5秒内重置计数
      
      // 如果5秒内调用超过10次，触发断路器
      if (this.revalidateCallCount > 10) {
        return fromPromise(() => Promise.resolve(null));
      }
      
      return fromPromise(() => this.getSession()).pipe(
        debounceTime(500), // 增加防抖时间到500ms
        backoffRetry({
          count: 3,
        }),
        tap(sessionInfo => {
          // 更严格的变化检查，包括深度比较
          const currentSession = this.store.getCachedAuthSession();
          let hasChanged = false;
          
          if (!currentSession && !sessionInfo) {
            hasChanged = false;
          } else if (!currentSession || !sessionInfo) {
            hasChanged = true;
          } else {
            // 深度比较账户信息
            hasChanged = !isEqual(currentSession.account, sessionInfo.account);
          }
          
          if (hasChanged) {
            this.store.setCachedAuthSession(sessionInfo);
          } else {
          }
        }),
        onStart(() => {
          this.isRevalidating$.next(true);
        }),
        onComplete(() => {
          this.isRevalidating$.next(false);
        })
      );
    })
  );

  private async getSession(): Promise<AuthSessionInfo | null> {
    try {
      const session = await this.store.fetchSession();


      if (session?.user) {
        const account = {
          id: session.user.id,
          email: session.user.email,
          label: session.user.name,
          avatar: session.user.avatarUrl,
          info: session.user,
        };
        const result = {
          account,
        };
        return result;
      } else {
        return null;
      }
    } catch (e) {
      if (UserFriendlyError.fromAny(e).is('UNSUPPORTED_CLIENT_VERSION')) {
        return null;
      }
      throw e;
    }
  }

  async waitForRevalidation(signal?: AbortSignal) {
    this.revalidate();
    await this.isRevalidating$.waitFor(
      isRevalidating => !isRevalidating,
      signal
    );
  }

  async removeAvatar() {
    await this.store.removeAvatar();
    
    // 发送头像删除事件，通知其他缓存服务更新
    const currentSession = this.store.getCachedAuthSession();
    if (currentSession) {
      this.eventBus.emit(AvatarUpdated, {
        userId: currentSession.account.id,
        avatarUrl: null
      });
    }
    
    await this.waitForRevalidation();
  }

  async uploadAvatar(file: File) {
    const reducedFile = await validateAndReduceImage(file);
    const avatarUrl = await this.store.uploadAvatar(reducedFile);
    
    // 立即更新缓存的会话信息，包含新的头像URL
    const currentSession = this.store.getCachedAuthSession();
    if (currentSession && avatarUrl) {
      const updatedSession = {
        ...currentSession,
        account: {
          ...currentSession.account,
          avatar: avatarUrl,
          info: currentSession.account.info ? {
            ...currentSession.account.info,
            avatarUrl: avatarUrl
          } : currentSession.account.info
        }
      };
      this.store.setCachedAuthSession(updatedSession);
      
      // 发送头像更新事件，通知其他缓存服务更新
      this.eventBus.emit(AvatarUpdated, {
        userId: currentSession.account.id,
        avatarUrl: avatarUrl
      });
    }
    
    // 然后异步重新验证最新状态
    await this.waitForRevalidation();
  }

  async updateLabel(label: string) {
    await this.store.updateLabel(label);
    await this.waitForRevalidation();
  }

  override dispose(): void {
    this.revalidate.unsubscribe();
  }
}
