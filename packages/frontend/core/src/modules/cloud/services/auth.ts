import { UserFriendlyError } from '@yunke/error';
// import type { OAuthProviderType } from '@yunke/graphql';
import { track } from '@yunke/track';
import { OnEvent, Service } from '@toeverything/infra';
import { nanoid } from 'nanoid';
import { distinctUntilChanged, map, skip } from 'rxjs';

import type { GlobalDialogService } from '../../dialogs';
import { ApplicationFocused } from '../../lifecycle';
import type { UrlService } from '../../url';
import { AuthSession } from '../entities/session';
import { AccountChanged } from '../events/account-changed';
import { AccountLoggedIn } from '../events/account-logged-in';
import { AccountLoggedOut } from '../events/account-logged-out';
import { ServerStarted } from '../events/server-started';
import type { AuthStore } from '../stores/auth';
import type { FetchService } from './fetch';
import { ServerService } from './server';

@OnEvent(ApplicationFocused, e => e.onApplicationFocused)
@OnEvent(ServerStarted, e => e.onServerStarted)
export class AuthService extends Service {
  session = this.framework.createEntity(AuthSession, {
    store: this.store,
  });

  private lastEmittedAccountId: string | null = null;
  private accountChangeTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly fetchService: FetchService,
    private readonly store: AuthStore,
    private readonly urlService: UrlService,
    private readonly dialogService: GlobalDialogService,
    private readonly serverService: ServerService
  ) {
    super();

    this.session.account$
      .pipe(
        map(a => ({
          id: a?.id,
          account: a,
        })),
        distinctUntilChanged((a, b) => a.id === b.id), // only emit when the value changes
        skip(1) // skip the initial value
      )
      .subscribe(({ account }) => {
        // 防止重复发送相同账户变化事件
        if (account?.id === this.lastEmittedAccountId) {
          return;
        }
        
        // 清除之前的超时，实现防抖
        if (this.accountChangeTimeout) {
          clearTimeout(this.accountChangeTimeout);
        }
        
        // 设置防抖延迟，避免频繁触发
        this.accountChangeTimeout = setTimeout(() => {
          this.lastEmittedAccountId = account?.id || null;
          
          if (account === null) {
            this.eventBus.emit(AccountLoggedOut, account);
          } else {
            this.eventBus.emit(AccountLoggedIn, account);
          }
          this.eventBus.emit(AccountChanged, account);
        }, 300); // 300ms防抖延迟
      });
  }

  private onServerStarted() {
    this.session.revalidate();
  }

  private onApplicationFocused() {
    // 🔧 Bug #11 修复：恢复会话验证
    // session.revalidate() 已有防无限循环机制：500ms防抖 + 断路器(5秒内>10次)
    this.session.revalidate();
  }

  async signInWithCode(credential: {
    email: string;
    code: string;
  }) {
    console.log('=== AuthService.signInWithCode 开始 ===');
    console.log('验证码登录凭据:', { email: credential.email, code: credential.code });
    
    track.$.$.auth.signIn({ method: 'verification-code' });
    try {
      console.log('调用 AuthStore.signInWithCode');
      await this.store.signInWithCode(credential);
      
      console.log('验证码登录成功，重新验证会话');
      this.session.revalidate();
      
      console.log('发送登录成功事件');
      track.$.$.auth.signedIn({ method: 'verification-code' });
      
      console.log('=== AuthService.signInWithCode 完成 ===');
    } catch (e) {
      console.error('=== AuthService.signInWithCode 失败 ===');
      console.error('验证码登录失败:', e);
      
      track.$.$.auth.signInFail({
        method: 'verification-code',
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async sendEmailMagicLink(
    email: string,
    verifyToken?: string,
    challenge?: string,
    redirectUrl?: string // url to redirect to after signed-in
  ) {
    track.$.$.auth.signIn({ method: 'magic-link' });
    this.setClientNonce();
    try {
      const scheme = this.urlService.getClientScheme();
      const magicLinkUrlParams = new URLSearchParams();
      if (redirectUrl) {
        magicLinkUrlParams.set('redirect_uri', redirectUrl);
      }
      if (scheme) {
        magicLinkUrlParams.set('client', scheme);
      }
      await this.fetchService.fetch('/api/auth/magic-link-send', {
        method: 'POST',
        body: JSON.stringify({
          email,
          // we call it [callbackUrl] instead of [redirect_uri]
          // to make it clear the url is used to finish the sign-in process instead of redirect after signed-in
          callbackUrl: `/magic-link?${magicLinkUrlParams.toString()}`,
          clientNonce: this.store.getClientNonce(),
        }),
        headers: {
          'content-type': 'application/json',
          // 移除人机检测头部
        },
      });
    } catch (e) {
      track.$.$.auth.signInFail({
        method: 'magic-link',
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async signInMagicLink(email: string, token: string, byLink = true) {
    console.log('=== AuthService.signInMagicLink 开始 ===');
    console.log('Magic Link 登录凭据:', { email, token, byLink });
    
    const method = byLink ? 'magic-link' : 'otp';
    try {
      console.log('调用 AuthStore.signInMagicLink');
      await this.store.signInMagicLink(email, token);

      console.log('Magic Link 登录成功，重新验证会话');
      this.session.revalidate();
      
      console.log('发送登录成功事件');
      track.$.$.auth.signedIn({ method });
      
      console.log('=== AuthService.signInMagicLink 完成 ===');
    } catch (e) {
      console.error('=== AuthService.signInMagicLink 失败 ===');
      console.error('Magic Link 登录失败:', e);
      
      track.$.$.auth.signInFail({
        method,
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async oauthPreflight(
    provider: OAuthProviderType,
    client: string,
    /** @deprecated*/ redirectUrl?: string
  ): Promise<Record<string, string>> {
    this.setClientNonce();
    try {
      const res = await this.fetchService.fetch('/api/oauth/preflight', {
        method: 'POST',
        body: JSON.stringify({
          provider,
          client,
          redirect_uri: redirectUrl,
          client_nonce: this.store.getClientNonce(),
        }),
        headers: {
          'content-type': 'application/json',
        },
      });

      return await res.json();
    } catch (e) {
      track.$.$.auth.signInFail({
        method: 'oauth',
        provider,
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async signInOauth(code: string, state: string, provider: string) {
    try {
      const { redirectUri } = await this.store.signInOauth(
        code,
        state,
        provider
      );

      this.session.revalidate();

      track.$.$.auth.signedIn({ method: 'oauth', provider });
      return { redirectUri };
    } catch (e) {
      track.$.$.auth.signInFail({
        method: 'oauth',
        provider,
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async signInPassword(credential: {
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }) {
    console.log('=== AuthService.signInPassword 开始 ===');
    console.log('登录凭据:', { email: credential.email, hasPassword: !!credential.password });
    
    track.$.$.auth.signIn({ method: 'password' });
    try {
      console.log('调用 AuthStore.signInPassword');
      await this.store.signInPassword(credential);
      
      console.log('登录成功，重新验证会话');
      this.session.revalidate();
      
      console.log('发送登录成功事件');
      track.$.$.auth.signedIn({ method: 'password' });
      
      console.log('=== AuthService.signInPassword 完成 ===');
    } catch (e) {
      console.error('=== AuthService.signInPassword 失败 ===');
      console.error('登录失败:', e);
      
      track.$.$.auth.signInFail({
        method: 'password',
        reason: UserFriendlyError.fromAny(e).name,
      });
      throw e;
    }
  }

  async signOut() {
    await this.store.signOut();
    this.session.revalidate();
  }

  async deleteAccount() {
    const res = await this.store.deleteAccount();
    this.store.setCachedAuthSession(null);
    this.session.revalidate();
    this.dialogService.open('deleted-account', {});
    return res;
  }

  checkUserByEmail(email: string) {
    return this.store.checkUserByEmail(email);
  }


  private setClientNonce() {
    if (BUILD_CONFIG.isNative) {
      // send random client nonce on native app
      this.store.setClientNonce(nanoid());
    }
  }
}
