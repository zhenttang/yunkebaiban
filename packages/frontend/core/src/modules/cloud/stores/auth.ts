// GraphQL imports removed - now using direct REST API calls
import { Store } from '@toeverything/infra';

import type { GlobalState } from '../../storage';
import type { AuthSessionInfo } from '../entities/session';
import type { AuthProvider } from '../provider/auth';
import type { FetchService } from '../services/fetch';
import type { GraphQLService } from '../services/graphql';
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
    private readonly gqlService: GraphQLService,
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

  async fetchSession() {
    const url = `/api/auth/session`;
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 包含cookies，因为Java后端使用cookie认证
    };

    const res = await this.fetchService.fetch(url, options);
    
    if (!res.ok) {
      if (res.status === 401) {
        // 未认证，返回空会话
        return { user: null };
      }
      const errorData = await res.json().catch(() => ({}));
      throw new Error('获取会话失败：' + JSON.stringify(errorData));
    }
    
    const data = await res.json();
    
    // Java后端返回 { user: userInfo } 或 { user: null }
    if (data.user) {
      // 如果有用户信息，更新缓存的会话
      const sessionInfo = {
        user: data.user,
        token: null, // Java后端使用Cookie认证
        expiresAt: null,
      };
      this.setCachedAuthSession(sessionInfo);
      return { user: data.user };
    }
    
    // 如果没有用户信息，清除缓存的会话
    this.setCachedAuthSession(null);
    return { user: null };
  }

  async signInMagicLink(email: string, token: string) {
    await this.authProvider.signInMagicLink(
      email,
      token,
      this.getClientNonce()
    );
  }

  async signInOauth(code: string, state: string, provider: string) {
    return await this.authProvider.signInOauth(
      code,
      state,
      provider,
      this.getClientNonce()
    );
  }

  async signInPassword(credential: {
    email: string;
    password: string;
    verifyToken?: string;
    challenge?: string;
  }) {
    console.log('=== AuthStore.signInPassword 开始 ===');
    console.log('登录凭据:', { email: credential.email, hasPassword: !!credential.password });
    
    const user = await this.authProvider.signInPassword(credential);
    console.log('AuthProvider 返回用户信息:', user);
    
    // 登录成功后，存储用户会话信息
    if (user) {
      const sessionInfo = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          hasPassword: user.hasPassword,
          avatarUrl: user.avatarUrl,
          emailVerified: user.emailVerified,
        },
        token: null, // Java后端使用Cookie，不需要token
        expiresAt: null,
      };
      
      console.log('存储会话信息到缓存:', sessionInfo);
      this.setCachedAuthSession(sessionInfo);
      console.log('=== AuthStore.signInPassword 完成 ===');
    } else {
      console.warn('AuthProvider 返回空用户信息');
    }
  }

  async signOut() {
    await this.authProvider.signOut();
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
