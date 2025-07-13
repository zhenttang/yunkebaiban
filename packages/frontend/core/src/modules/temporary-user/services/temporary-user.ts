import { OnEvent, Service } from '@toeverything/infra';
import { distinctUntilChanged, map, skip } from 'rxjs';

import { ApplicationFocused } from '../../lifecycle';
import { TemporaryUserSession } from '../entities/temporary-user-session';
import { TemporaryUserChanged, TemporaryUserCreated, TemporaryUserExpired } from '../events';
import { TemporaryUserStore } from '../stores/temporary-user';
import { TemporaryUserSecurityManager } from './security-manager';
import type { TemporaryUserInfo } from '../entities/temporary-user-session';

@OnEvent(ApplicationFocused, e => e.onApplicationFocused)
export class TemporaryUserService extends Service {
  session: TemporaryUserSession;

  constructor(
    private readonly store: TemporaryUserStore,
    private readonly securityManager: TemporaryUserSecurityManager
  ) {
    super();

    // 手动创建TemporaryUserSession实例并注入store依赖
    this.session = new TemporaryUserSession(this.store);

    // 监听临时用户状态变化
    this.session.user$
      .pipe(
        map((user: TemporaryUserInfo | null) => ({
          id: user?.id,
          user: user,
        })),
        distinctUntilChanged((a, b) => a.id === b.id), // 只有当用户ID改变时才触发
        skip(1) // 跳过初始值
      )
      .subscribe(({ user }) => {
        try {
          if (user === null) {
            // TODO: 发射事件，暂时注释掉
            // this.framework.get('eventBus').emit(TemporaryUserExpired, null);
          } else {
            // TODO: 发射事件，暂时注释掉
            // this.framework.get('eventBus').emit(TemporaryUserCreated, user as TemporaryUserInfo);
          }
          // TODO: 发射事件，暂时注释掉  
          // this.framework.get('eventBus').emit(TemporaryUserChanged, user as TemporaryUserInfo | null);
        } catch (error) {
          console.error('发送临时用户事件失败：', error);
        }
      });

    // 设置定期检查会话状态
    this.setupSessionMonitoring();
    
    // 设置安全清理
    this.setupSecurityCleanup();
  }

  private onApplicationFocused() {
    // 暂时注释掉，防止无限循环
    // 当应用获得焦点时验证会话状态
    // this.session.validateSession();
  }

  /**
   * 为AppendOnly分享模式创建临时用户
   */
  async createTemporaryUserForShare(options: {
    workspaceId: string;
    docId: string;
    name?: string;
  }): Promise<{ success: boolean; reason?: string }> {
    try {
      // 进行安全检查
      const ipAddress = this.getClientIP();
      const securityCheck = this.securityManager.canCreateTemporaryUser(ipAddress);
      
      if (!securityCheck.allowed) {
        console.warn('[安全] 临时用户创建被阻止:', securityCheck.reason);
        return { success: false, reason: securityCheck.reason };
      }

      // 生成或获取客户端ID
      const clientId = TemporaryUserStore.getOrCreateClientId();
      
      // 尝试创建临时用户
      await this.session.createTemporaryUser({
        ...options,
        clientId,
      });

      const success = this.session.status$.value === 'authenticated';
      
      if (success) {
        const user = this.getCurrentTemporaryUser();
        if (user) {
          // 注册用户活动以进行安全监控
          this.securityManager.registerUserActivity(
            user.id,
            ipAddress,
            this.getUserAgent()
          );
        }
      }

      return { success };
    } catch (error) {
      console.error('为共享创建临时用户失败：', error);
      return { success: false, reason: '创建临时用户失败' };
    }
  }

  /**
   * 检查当前是否有有效的临时用户会话
   */
  isTemporaryUserActive(): boolean {
    return this.session.status$.value === 'authenticated' && !this.session.isSessionExpired();
  }

  /**
   * 检查是否可以在当前分享页面进行编辑
   */
  canEditInShareMode(): boolean {
    return this.isTemporaryUserActive() && this.session.canEdit$.value;
  }

  /**
   * 获取当前临时用户信息
   */
  getCurrentTemporaryUser() {
    return this.session.user$.value;
  }

  /**
   * 手动延长会话
   */
  async extendSession(): Promise<boolean> {
    if (!this.isTemporaryUserActive()) {
      return false;
    }
    
    return await this.session.extendSession();
  }

  /**
   * 注销临时用户
   */
  async logout(): Promise<void> {
    await this.session.logout();
  }

  /**
   * 设置会话监控
   */
  private setupSessionMonitoring(): void {
    // 暂时注释掉会话监控，防止无限循环
    /*
    // 每5分钟检查一次会话状态
    const CHECK_INTERVAL = 5 * 60 * 1000; // 5分钟

    setInterval(() => {
      this.checkSessionStatus();
    }, CHECK_INTERVAL);

    // 页面可见性变化时也检查
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkSessionStatus();
        }
      });
    }
    */
  }

  /**
   * 设置安全清理
   */
  private setupSecurityCleanup(): void {
    // 每小时清理一次安全数据
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1小时

    setInterval(() => {
      this.performSecurityCleanup();
    }, CLEANUP_INTERVAL);
  }

  /**
   * 检查会话状态并自动处理
   */
  private async checkSessionStatus(): Promise<void> {
    if (!this.isTemporaryUserActive()) {
      return;
    }

    try {
      // 如果会话即将过期，自动延长
      await this.session.autoExtendIfNeeded();
      
      // 验证会话是否仍然有效
      this.session.validateSession();
    } catch (error) {
      console.error('检查会话状态时出错:', error);
    }
  }

  /**
   * 获取临时用户的显示名称
   */
  getDisplayName(): string {
    const user = this.getCurrentTemporaryUser();
    return user?.name || '匿名用户';
  }

  /**
   * 获取临时用户的头像URL
   */
  getAvatarUrl(): string | undefined {
    const user = this.getCurrentTemporaryUser();
    return user?.avatarUrl;
  }

  /**
   * 检查会话剩余时间
   */
  getSessionTimeRemaining(): number {
    const user = this.getCurrentTemporaryUser();
    if (!user) return 0;

    const now = new Date();
    const expiresAt = new Date(user.expiresAt);
    return Math.max(0, expiresAt.getTime() - now.getTime());
  }

  /**
   * 格式化剩余时间为可读字符串
   */
  formatTimeRemaining(): string {
    const remaining = this.getSessionTimeRemaining();
    
    if (remaining <= 0) {
      return '已过期';
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else {
      return `${minutes}分钟`;
    }
  }

  /**
   * 检查是否需要显示过期警告
   */
  shouldShowExpirationWarning(): boolean {
    return this.session.isSessionExpiringSoon() && !this.session.isSessionExpired();
  }

  /**
   * 记录编辑操作（用于安全监控）
   */
  recordEditOperation(): void {
    const user = this.getCurrentTemporaryUser();
    if (user) {
      const editCheck = this.securityManager.canPerformEdit(user.id);
      if (editCheck.allowed) {
        this.securityManager.recordEdit(user.id);
      } else {
        console.warn('[安全] 编辑操作被阻止:', editCheck.reason);
        // 这里可以触发UI提示用户编辑被限制
      }
    }
  }

  /**
   * 获取安全统计信息
   */
  getSecurityStats() {
    return this.securityManager.getSecurityStats();
  }

  /**
   * 清理安全数据
   */
  performSecurityCleanup(): void {
    this.securityManager.cleanup();
  }

  // 辅助方法

  /**
   * 获取客户端IP地址（前端环境中的近似方法）
   */
  private getClientIP(): string | undefined {
    // 在前端环境中无法直接获取真实IP，这里返回undefined
    // 在实际部署中，IP检查应该在后端进行
    return undefined;
  }

  /**
   * 获取用户代理字符串
   */
  private getUserAgent(): string | undefined {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return undefined;
  }

  override dispose(): void {
    this.session.dispose();
  }
} 