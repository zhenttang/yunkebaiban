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
import { tap } from 'rxjs';

import { validateAndReduceImage } from '../../../utils/reduce-image';
import type { AccountProfile, AuthStore } from '../stores/auth';

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
      console.log('Session$ mapping called with session:', session);
      const result = session
        ? {
            status: 'authenticated',
            session: session as AuthSessionInfo,
          }
        : {
            status: 'unauthenticated',
          };
      console.log('Session$ result:', result);
      return result;
    });

  status$ = this.session$.map(session => {
    console.log('Status$ mapping called with session status:', session.status);
    return session.status;
  });

  account$ = this.session$.map(session =>
    session.status === 'authenticated' ? session.session.account : null
  );

  waitForAuthenticated = (signal?: AbortSignal) =>
    this.session$.waitFor(
      session => session.status === 'authenticated',
      signal
    ) as Promise<AuthSessionAuthenticated>;

  isRevalidating$ = new LiveData(false);

  constructor(private readonly store: AuthStore) {
    super();
  }

  revalidate = effect(
    exhaustMapWithTrailing(() =>
      fromPromise(() => this.getSession()).pipe(
        backoffRetry({
          count: 3,
        }),
        tap(sessionInfo => {
          console.log('Session revalidate result:', sessionInfo);
          console.log('Current cached session:', this.store.getCachedAuthSession());
          
          // 检查会话是否发生变化
          const currentSessionJson = JSON.stringify(this.store.getCachedAuthSession());
          const newSessionJson = JSON.stringify(sessionInfo);
          const hasChanged = currentSessionJson !== newSessionJson;
          
          console.log('Session changed?', hasChanged);
          console.log('Current session JSON:', currentSessionJson);
          console.log('New session JSON:', newSessionJson);
          
          if (hasChanged) {
            console.log('Session changed, updating cached session');
            this.store.setCachedAuthSession(sessionInfo);
            console.log('Session updated, new cached session:', this.store.getCachedAuthSession());
            
            // 强制UI更新 - 确保LiveData实例被更新
            if (sessionInfo) {
              console.log('Forcing UI update with authenticated status');
              this.status$.next('authenticated');
            } else {
              console.log('Forcing UI update with unauthenticated status');
              this.status$.next('unauthenticated');
            }
          } else {
            console.log('Session unchanged, no update needed');
          }
        }),
        onStart(() => {
          console.log('Session revalidation started');
          this.isRevalidating$.next(true);
        }),
        onComplete(() => {
          console.log('Session revalidation completed');
          this.isRevalidating$.next(false);
        })
      )
    )
  );

  private async getSession(): Promise<AuthSessionInfo | null> {
    try {
      const session = await this.store.fetchSession();

      console.log('Session response:', session);

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
        console.log('Session account created:', result);
        return result;
      } else {
        console.log('No user in session response, returning null');
        return null;
      }
    } catch (e) {
      console.error('Error fetching session:', e);
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
    await this.waitForRevalidation();
  }

  async uploadAvatar(file: File) {
    const reducedFile = await validateAndReduceImage(file);
    await this.store.uploadAvatar(reducedFile);
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
