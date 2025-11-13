// GraphQL imports removed - now using direct REST API calls
import { Store } from '@toeverything/infra';

import type { GlobalState } from '../../storage';
import type { AuthSessionInfo } from '../entities/session';
import type { AuthProvider } from '../provider/auth';
import type { FetchService } from '../services/fetch';
import type { ServerService } from '../services/server';

const AUTH_DEBUG_ENABLED = process.env.NODE_ENV !== 'production';

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

  private debugLog(message: string, payload?: Record<string, unknown>) {
    if (!AUTH_DEBUG_ENABLED) {
      return;
    }

    if (payload) {
      console.debug(`[AuthStore] ${message}`, payload);
      return;
    }

    console.debug(`[AuthStore] ${message}`);
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
           localStorage.getItem('yunke-admin-token');
  }

  getStoredRefreshToken(): string | null {
    return this.globalState.get<string>(`${this.serverService.server.id}-auth-refresh-token`);
  }

  setStoredTokens(token: string, refreshToken: string) {
    // 存储到GlobalState（核心模块）
    this.globalState.set(`${this.serverService.server.id}-auth-token`, token);
    this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, refreshToken);
    
    // 同时存储到localStorage（兼容管理员模块）
    localStorage.setItem('yunke-admin-token', token);
    localStorage.setItem('yunke-admin-refresh-token', refreshToken);
  }

  clearStoredTokens() {
    // 清除GlobalState（核心模块）
    this.globalState.set(`${this.serverService.server.id}-auth-token`, null);
    this.globalState.set(`${this.serverService.server.id}-auth-refresh-token`, null);
    
    // 清除localStorage（兼容管理员模块）
    localStorage.removeItem('yunke-admin-token');
    localStorage.removeItem('yunke-admin-refresh-token');
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
      if (res.status === 429) {
        // 请求过于频繁，返回 null 而不是抛出错误
        // 这样可以避免未捕获的错误，同时保持当前会话状态
        console.warn('请求过于频繁，暂时跳过会话获取');
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
    this.debugLog('signInMagicLink start', { email });

    try {
      const result = await this.authProvider.signInMagicLink(
        email,
        token,
        this.getClientNonce()
      );

      this.debugLog('signInMagicLink resolved', {
        hasUser: Boolean(result?.user),
      });

      // 登录成功后，存储JWT token和用户会话信息
      if (result && result.user) {
        // 存储JWT tokens
        this.setStoredTokens(result.token, result.refreshToken);
        
        const sessionInfo = {
          user: result.user,
          token: result.token,
          expiresAt: null, // JWT的过期时间在token中
        };

        this.setCachedAuthSession(sessionInfo);
        this.debugLog('signInMagicLink session cached', {
          userId: result.user.id,
        });
      } else {
        console.warn('AuthProvider 返回空结果');
      }
    } catch (error: any) {
      console.error('❌ AUTH_STORE_ERROR: [AuthStore] signInMagicLink 失败', {
        error: error.message,
        errorType: error.name,
        stack: error.stack?.substring(0, 500)
      });
      throw error;
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
    this.debugLog('signInWithCode start', { email: credential.email });

    const result = await this.authProvider.signInWithCode(credential);
    this.debugLog('signInWithCode resolved', {
      hasUser: Boolean(result?.user),
    });
    
    // 登录成功后，存储JWT token和用户会话信息
    if (result && result.user) {
      // 存储JWT tokens
      this.setStoredTokens(result.token, result.refreshToken);
      
      const sessionInfo = {
        user: result.user,
        token: result.token,
        expiresAt: null, // JWT的过期时间在token中
      };
      
      this.setCachedAuthSession(sessionInfo);
      this.debugLog('signInWithCode session cached', {
        userId: result.user.id,
      });
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
    this.debugLog('signInPassword start', {
      email: credential.email,
      hasPassword: Boolean(credential.password),
    });

    const result = await this.authProvider.signInPassword(credential);
    this.debugLog('signInPassword resolved', {
      hasUser: Boolean(result?.user),
    });
    
    // 登录成功后，存储JWT token和用户会话信息
    if (result && result.user) {
      // 存储JWT tokens
      this.setStoredTokens(result.token, result.refreshToken);
      
      const sessionInfo = {
        user: result.user,
        token: result.token,
        expiresAt: null, // JWT的过期时间在token中
      };
      
      this.setCachedAuthSession(sessionInfo);
      this.debugLog('signInPassword session cached', {
        userId: result.user.id,
      });
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
