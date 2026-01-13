import { Store } from '@toeverything/infra';
import { getApiBaseUrl } from '@yunke/config';

import type { GlobalState } from '../../storage';
import type { TemporaryUserInfo } from '../entities/temporary-user-session';

export interface TemporaryUserSessionData {
  user: TemporaryUserInfo;
  sessionToken: string;
  canEdit: boolean;
}

export interface CreateTemporaryUserResponse {
  user: TemporaryUserInfo;
  sessionToken: string;
  canEdit: boolean;
}

export interface ValidateSessionResponse {
  valid: boolean;
  user?: TemporaryUserInfo;
}

export interface ExtendSessionResponse {
  success: boolean;
  expiresAt?: Date;
}

/**
 * 临时用户存储
 * 处理临时用户的API通信和本地缓存
 */
export class TemporaryUserStore extends Store {
  private readonly CACHE_KEY = 'temporary-user-session';

  constructor(private readonly globalState: GlobalState) {
    super();
  }

  /**
   * 监听缓存的会话数据
   */
  watchCachedSession() {
    return this.globalState.watch<TemporaryUserSessionData>(this.CACHE_KEY);
  }

  /**
   * 获取缓存的会话数据
   */
  getCachedSession(): TemporaryUserSessionData | null {
    return this.globalState.get<TemporaryUserSessionData>(this.CACHE_KEY) || null;
  }

  /**
   * 设置缓存的会话数据
   */
  setCachedSession(session: TemporaryUserSessionData | null) {
    this.globalState.set(this.CACHE_KEY, session);
  }

  /**
   * 创建临时用户
   */
  async createTemporaryUser(options: {
    workspaceId: string;
    docId: string;
    clientId?: string;
    name?: string;
  }): Promise<CreateTemporaryUserResponse | null> {
    try {
      // 统一使用 network-config.ts 的配置
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/temporary-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
        credentials: 'include', // 包含cookies
      });

      if (!response.ok) {
        throw new Error(`创建临时用户失败：${response.statusText}`);
      }

      const data = await response.json() as CreateTemporaryUserResponse;
      return data;
    } catch (error) {
      console.error('创建临时用户时出错：', error);
      
      // 如果后端API不可用，创建一个本地临时用户作为降级方案
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.warn('后端API不可用，创建本地临时用户');
        return this.createLocalTemporaryUser(options);
      }
      
      throw error;
    }
  }

  /**
   * 创建本地临时用户（降级方案）
   */
  private createLocalTemporaryUser(options: {
    workspaceId: string;
    docId: string;
    clientId?: string;
    name?: string;
  }): CreateTemporaryUserResponse {
    const tempUser: TemporaryUserInfo = {
      id: `temp_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: options.name || this.generateAnonymousName(),
      clientId: options.clientId || this.generateClientId(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时后过期
      avatarUrl: this.generateAvatarUrl(options.name || '匿名用户')
    };

    const sessionToken = this.generateSessionToken();

    return {
      user: tempUser,
      sessionToken,
      canEdit: true // AppendOnly模式允许编辑
    };
  }

  /**
   * 生成匿名用户名
   */
  private generateAnonymousName(): string {
    const adjectives = [
      '神秘的', '友善的', '聪明的', '创意的', '勤奋的', '专注的',
      '灵感的', '活跃的', '思考的', '探索的', '发现的', '创新的'
    ];
    const nouns = [
      '访客', '编辑者', '探索者', '创作者', '协作者', '贡献者',
      '思考者', '创新者', '发现者', '建设者', '设计师', '作家'
    ];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);
    
    return `${adjective}${noun}${number}`;
  }

  /**
   * 生成客户端ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成会话token
   */
  private generateSessionToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * 生成头像URL (本地SVG避免COEP问题)
   */
  private generateAvatarUrl(name: string): string {
    // 生成基于用户名的简单头像SVG
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    
    // 根据名称生成一致的颜色
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % colors.length;
    const bgColor = colors[colorIndex];
    
    // 获取名称的首字符作为头像内容
    const initial = name.charAt(0).toUpperCase();
    
    // 生成简单的SVG头像
    const svgData = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${bgColor}"/>
        <text x="20" y="26" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle">${initial}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svgData)}`;
  }

  /**
   * 验证当前会话
   */
  async validateSession(): Promise<ValidateSessionResponse> {
    try {
      // 统一使用 network-config.ts 的配置
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/temporary-users/validate`, {
        method: 'GET',
        credentials: 'include', // 包含cookies
      });

      if (!response.ok) {
        return { valid: false };
      }

      const data = await response.json() as ValidateSessionResponse;
      return data;
    } catch (error) {
      console.error('验证会话时出错：', error);
      return { valid: false };
    }
  }

  /**
   * 延长会话有效期
   */
  async extendSession(userId: string): Promise<ExtendSessionResponse> {
    try {
      // 统一使用 network-config.ts 的配置
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/temporary-users/${userId}/extend`, {
        method: 'POST',
        credentials: 'include', // 包含cookies
      });

      if (!response.ok) {
        throw new Error(`延长会话失败：${response.statusText}`);
      }

      const data = await response.json() as ExtendSessionResponse;
      return data;
    } catch (error) {
      console.error('延长会话时出错：', error);
      throw error;
    }
  }

  /**
   * 注销临时用户
   */
  async logout(): Promise<{ success: boolean }> {
    try {
      // 统一使用 network-config.ts 的配置
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/temporary-users/logout`, {
        method: 'POST',
        credentials: 'include', // 包含cookies
      });

      if (!response.ok) {
        throw new Error(`注销失败：${response.statusText}`);
      }

      const data = await response.json() as { success: boolean };
      return data;
    } catch (error) {
      console.error('注销时出错：', error);
      return { success: false };
    }
  }

  /**
   * 获取当前临时用户信息
   */
  async getCurrentUser(): Promise<{ user?: TemporaryUserInfo }> {
    try {
      // 统一使用 network-config.ts 的配置
      const apiBaseUrl = getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/temporary-users/current`, {
        method: 'GET',
        credentials: 'include', // 包含cookies
      });

      if (!response.ok) {
        return {};
      }

      const data = await response.json() as { user?: TemporaryUserInfo };
      return data;
    } catch (error) {
      console.error('获取当前用户时出错：', error);
      return {};
    }
  }

  /**
   * 从URL查询参数中提取客户端ID
   */
  static getClientIdFromUrl(): string | undefined {
    if (typeof window === 'undefined') return undefined;
    
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('clientId') || undefined;
  }

  /**
   * 生成随机客户端ID
   */
  static generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * 从localStorage获取或生成客户端ID
   */
  static getOrCreateClientId(): string {
    if (typeof window === 'undefined') return this.generateClientId();
    
    const storageKey = 'yunke-temp-user-client-id';
    let clientId = localStorage.getItem(storageKey);
    
    if (!clientId) {
      clientId = this.generateClientId();
      localStorage.setItem(storageKey, clientId);
    }
    
    return clientId;
  }
} 