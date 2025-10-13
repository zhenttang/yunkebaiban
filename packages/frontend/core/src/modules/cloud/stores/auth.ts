// GraphQL imports removed - now using direct REST API calls
import { Store } from '@toeverything/infra';

import type { GlobalState } from '../../storage';
import type { AuthSessionInfo } from '../entities/session';
import type { AuthProvider } from '../provider/auth';
import type { FetchService } from '../services/fetch';
import type { ServerService } from '../services/server';

export interface AccountProfile {
  id: string;
  email: string;
  name: string;
  hasPassword: boolean;
  avatarUrl: string | null;
  emailVerified: string | null;
}

export class AuthStore extends Store {
  constructor(
    private readonly fetchService: FetchService,
    private readonly globalState: GlobalState,
    private readonly serverService: ServerService,
    private readonly authProvider: AuthProvider
  ) {
    super();
  }

  watchCachedAuthSession() {
    return this.globalState.watch<AuthSessionInfo>(
      `${this.serverService.server.id}-auth`
    );
  }

  getCachedAuthSession() {
    return this.globalState.get<AuthSessionInfo>(
      `${this.serverService.server.id}-auth`
    );
  }

  setCachedAuthSession(session: AuthSessionInfo | null) {
    this.globalState.set(`${this.serverService.server.id}-auth`, session);
  }

  getClientNonce() {
    return this.globalState.get<string>('auth-client-nonce');
  }

  setClientNonce(nonce: string) {
    this.globalState.set('auth-client-nonce', nonce);
  }

  // JWT token管理方法
  getStoredToken(): string | null {
    // 优先从GlobalState获取，如果没有则从localStorage获取（兼容管理员模块）
    return this.globalState.get<string>(`${this.serverService.server.id}-auth-token`) ||
           localStorage.getItem('affine-admin-token');
  }

  getStoredRefreshToken(): string | null {
    return this.globalState.get<string>(`${this.serverService.server.id}-auth-refresh-token`);
  }

  setStoredTokens(token: string, refreshToken: string) {
    // 存储到GlobalState（核心模块）
    this.globalState.set(`${this.serverService.server.id}-auth-token`, token);
    this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, refreshToken);
    
    // 同时存储到localStorage（兼容管理员模块）
    localStorage.setItem('affine-admin-token', token);
    localStorage.setItem('affine-admin-refresh-token', refreshToken);
  }

  clearStoredTokens() {
    // 清除GlobalState（核心模块）
    this.globalState.set(`${this.serverService.server.id}-auth-token`, null);
    this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, null);
    
    // 清除localStorage（兼容管理员模块）
    localStorage.removeItem('affine-admin-token');
    localStorage.removeItem('affine-admin-refresh-token');
  }

  async fetchSession() {
    const url = `/api/auth/session`;
    
    // 从localStorage获取JWT token
    const token = this.getStoredToken();
    if (!token) {
      return { user: null };
    }
    
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    };

    const res = await this.fetchService.fetch(url, options);
    
    if (!res.ok) {
      if (res.status === 401) {
        // 未认证或token过期，清除本地token
        this.clearStoredTokens();
        return { user: null };
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error('获取会话失败：' + JSON.stringify(errorData));
    }
    
    const data = await res.json();
    
    // 如果有用户信息，更新缓存的会话
    if (data.user) {
      const sessionInfo = {
        user: data.user,
        token: token,
        expiresAt: null, // JWT的过期时间在token中
      };
      this.setCachedAuthSession(sessionInfo);
      return { user: data.user };
    }
    
    // 如果没有用户信息，清除缓存的会话和token
    this.setCachedAuthSession(null);
    this.clearStoredTokens();
    return { user: null };
  }

  async signInMagicLink(email: string, token: string) {
    console.log('=== AuthStore.signInMagicLink 开始 ===');
    console.log('Magic Link 登录凭据:', { email, token });
    
    const result = await this.authProvider.signInMagicLink(
      email,
      token,
      this.getClientNonce()
    );
    
    console.log('AuthProvider 返回结果:', result);
    
    // 登录成功后，存储JWT token和用户会话信息
    if (result && result.user) {
      // 存储JWT tokens
      this.setStoredTokens(result.token, result.refreshToken);
      
      const sessionInfo = {
        user: result.user,
        token: result.token,
        expiresAt: null, // JWT的过期时间在token中
      };
      
      console.log('存储会话信息和JWT token到缓存:', sessionInfo);
      this.setCachedAuthSession(sessionInfo);
      console.log('=== AuthStore.signInMagicLink 完成 ===');
    } else {
      console.warn('AuthProvider 返回空结果');
    }
  }

  async signInOauth(code: string, state: string, provider: string) {
    return await this.authProvider.signInOauth(
      code,
      state,
      provider,
      this.getClientNonce()
    );
  }

  async signInWithCode(credential: {
    email: string;
    code: string;
  }) {
    console.log('=== AuthStore.signInWithCode 开始 ===');
    console.log('验证码登录凭据:', { email: credential.email, code: credential.code });
    
    const result = await this.authProvider.signInWithCode(credential);
    console.log('AuthProvider 返回结果:', result);
    
    // 登录成功后，存储JWT token和用户会话信息
    if (result && result.user) {
      // 存储JWT tokens
      this.setStoredTokens(result.token, result.refreshToken);
      
      const sessionInfo = {
        user: result.user,
        token: result.token,
        expiresAt: null, // JWT的过期时间在token中
      };
      
      console.log('存储会话信息和JWT token到缓存:', sessionInfo);
      this.setCachedAuthSession(sessionInfo);
      console.log('=== AuthStore.signInWithCode 完成 ===');
    } else {
      console.warn('AuthProvider 返回空结果');
    }
  }

  async signInPassword(credential: {
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }) {
    console.log('=== AuthStore.signInPassword 开始 ===');
    console.log('登录凭据:', { email: credential.email, hasPassword: !!credential.password });
    
    const result = await this.authProvider.signInPassword(credential);
    console.log('AuthProvider 返回结果:', result);
    
    // 登录成功后，存储JWT token和用户会话信息
    if (result && result.user) {
      // 存储JWT tokens
      this.setStoredTokens(result.token, result.refreshToken);
      
      const sessionInfo = {
        user: result.user,
        token: result.token,
        expiresAt: null, // JWT的过期时间在token中
      };
      
      console.log('存储会话信息和JWT token到缓存:', sessionInfo);
      this.setCachedAuthSession(sessionInfo);
      console.log('=== AuthStore.signInPassword 完成 ===');
    } else {
      console.warn('AuthProvider 返回空结果');
    }
  }

  async signOut() {
    await this.authProvider.signOut();
    // 清除JWT tokens和会话信息
    this.clearStoredTokens();
    this.setCachedAuthSession(null);
  }

  async uploadAvatar(file: File) {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await this.fetchService.fetch('/api/users/avatar', {
      method: 'PUT',
      body: formData,
    });

    if (!res.ok) {
      throw new Error('上传头像失败');
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '上传头像失败');
    }
    
    // 返回新的头像URL
    return data.avatarUrl;
  }

  async removeAvatar() {
    const res = await this.fetchService.fetch('/api/users/avatar', {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('删除头像失败');
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '删除头像失败');
    }
  }

  async updateLabel(label: string) {
    const res = await this.fetchService.fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: label,
      }),
    });

    if (!res.ok) {
      throw new Error('更新用户名失败');
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '更新用户名失败');
    }
  }

  async checkUserByEmail(email: string) {
    const res = await this.fetchService.fetch('/api/auth/preflight', {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'content-type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`通过邮箱检查用户失败: ${email}`);
    }

    const data = (await res.json()) as {
      registered: boolean;
      hasPassword: boolean;
      magicLink: boolean;
    };

    return data;
  }

  async deleteAccount() {
    const res = await this.fetchService.fetch('/api/users/me', {
      method: 'DELETE',
    });

    if (!res.ok) {
      throw new Error('删除账号失败');
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || '删除账号失败');
    }
    
    return data;
  }
}
