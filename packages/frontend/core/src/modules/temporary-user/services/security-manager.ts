import { Service } from '@toeverything/infra';

/**
 * 安全策略配置
 */
export interface SecurityConfig {
  /** 每小时最大临时用户创建数量 */
  maxCreationsPerHour: number;
  /** 每个IP地址的最大并发临时用户数 */
  maxConcurrentUsersPerIP: number;
  /** 临时用户会话最大持续时间（小时） */
  maxSessionDuration: number;
  /** 编辑操作频率限制（每分钟最大操作数） */
  maxEditsPerMinute: number;
  /** 可疑活动检测阈值 */
  suspiciousActivityThreshold: number;
}

/**
 * 用户活动记录
 */
interface UserActivity {
  userId: string;
  createdAt: number;
  lastActiveAt: number;
  editCount: number;
  lastEditTime: number;
  ipAddress?: string;
  userAgent?: string;
  suspicious: boolean;
}

/**
 * 安全事件类型
 */
export enum SecurityEventType {
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SESSION_EXPIRED = 'session_expired',
  IP_BLOCKED = 'ip_blocked',
  TOO_MANY_CONCURRENT_USERS = 'too_many_concurrent_users',
}

/**
 * 安全事件
 */
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  timestamp: number;
  details: Record<string, any>;
}

/**
 * 临时用户安全管理器
 * 负责实施安全策略、防滥用机制和异常检测
 */
export class TemporaryUserSecurityManager extends Service {
  private readonly config: SecurityConfig = {
    maxCreationsPerHour: 10, // 每小时最多创建10个临时用户
    maxConcurrentUsersPerIP: 3, // 每个IP最多3个并发用户
    maxSessionDuration: 24, // 24小时最大会话时长
    maxEditsPerMinute: 30, // 每分钟最多30次编辑
    suspiciousActivityThreshold: 5, // 可疑活动检测阈值
  };

  private readonly userActivities = new Map<string, UserActivity>();
  private readonly ipUserCounts = new Map<string, Set<string>>();
  private readonly hourlyCreations = new Map<string, number[]>(); // IP -> 创建时间戳数组
  private readonly blockedIPs = new Set<string>();
  private readonly securityEvents: SecurityEvent[] = [];

  /**
   * 检查是否允许创建新的临时用户
   */
  canCreateTemporaryUser(ipAddress?: string): {
    allowed: boolean;
    reason?: string;
  } {
    if (!ipAddress) {
      return { allowed: true };
    }

    // 检查IP是否被封禁
    if (this.blockedIPs.has(ipAddress)) {
      this.recordSecurityEvent({
        type: SecurityEventType.IP_BLOCKED,
        ipAddress,
        timestamp: Date.now(),
        details: { reason: 'IP is blocked' },
      });
      return { allowed: false, reason: '此IP地址已被限制访问' };
    }

    // 检查每小时创建限制
    const hourlyLimit = this.checkHourlyCreationLimit(ipAddress);
    if (!hourlyLimit.allowed) {
      return hourlyLimit;
    }

    // 检查并发用户限制
    const concurrentLimit = this.checkConcurrentUserLimit(ipAddress);
    if (!concurrentLimit.allowed) {
      return concurrentLimit;
    }

    return { allowed: true };
  }

  /**
   * 注册新的临时用户活动
   */
  registerUserActivity(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): void {
    const now = Date.now();
    
    const activity: UserActivity = {
      userId,
      createdAt: now,
      lastActiveAt: now,
      editCount: 0,
      lastEditTime: 0,
      ipAddress,
      userAgent,
      suspicious: false,
    };

    this.userActivities.set(userId, activity);

    // 更新IP用户计数
    if (ipAddress) {
      if (!this.ipUserCounts.has(ipAddress)) {
        this.ipUserCounts.set(ipAddress, new Set());
      }
      this.ipUserCounts.get(ipAddress)!.add(userId);

      // 记录每小时创建统计
      if (!this.hourlyCreations.has(ipAddress)) {
        this.hourlyCreations.set(ipAddress, []);
      }
      this.hourlyCreations.get(ipAddress)!.push(now);
    }

    console.log('[Security] Registered user activity:', { userId, ipAddress });
  }

  /**
   * 检查编辑操作是否允许
   */
  canPerformEdit(userId: string): {
    allowed: boolean;
    reason?: string;
  } {
    const activity = this.userActivities.get(userId);
    if (!activity) {
      return { allowed: false, reason: '用户活动记录不存在' };
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // 检查编辑频率限制
    if (activity.lastEditTime > oneMinuteAgo) {
      const editsInLastMinute = this.countRecentEdits(userId, oneMinuteAgo);
      if (editsInLastMinute >= this.config.maxEditsPerMinute) {
        this.recordSecurityEvent({
          type: SecurityEventType.RATE_LIMIT_EXCEEDED,
          userId,
          ipAddress: activity.ipAddress,
          timestamp: now,
          details: { 
            editsInLastMinute, 
            limit: this.config.maxEditsPerMinute 
          },
        });
        return { 
          allowed: false, 
          reason: '编辑操作过于频繁，请稍后再试' 
        };
      }
    }

    // 检查会话是否过期
    const sessionAge = (now - activity.createdAt) / (1000 * 60 * 60);
    if (sessionAge > this.config.maxSessionDuration) {
      this.recordSecurityEvent({
        type: SecurityEventType.SESSION_EXPIRED,
        userId,
        ipAddress: activity.ipAddress,
        timestamp: now,
        details: { sessionAge, limit: this.config.maxSessionDuration },
      });
      return { allowed: false, reason: '会话已过期，请重新获取访问权限' };
    }

    return { allowed: true };
  }

  /**
   * 记录编辑操作
   */
  recordEdit(userId: string): void {
    const activity = this.userActivities.get(userId);
    if (!activity) {
      return;
    }

    const now = Date.now();
    activity.editCount++;
    activity.lastEditTime = now;
    activity.lastActiveAt = now;

    // 检测可疑活动
    this.detectSuspiciousActivity(userId);

    console.log('[Security] Recorded edit:', { 
      userId, 
      editCount: activity.editCount,
      suspicious: activity.suspicious
    });
  }

  /**
   * 清理过期数据
   */
  cleanup(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // 清理过期的用户活动
    for (const [userId, activity] of this.userActivities.entries()) {
      if (activity.lastActiveAt < oneDayAgo) {
        this.userActivities.delete(userId);
        
        // 从IP用户计数中移除
        if (activity.ipAddress) {
          const ipUsers = this.ipUserCounts.get(activity.ipAddress);
          if (ipUsers) {
            ipUsers.delete(userId);
            if (ipUsers.size === 0) {
              this.ipUserCounts.delete(activity.ipAddress);
            }
          }
        }
      }
    }

    // 清理每小时创建记录
    for (const [ip, timestamps] of this.hourlyCreations.entries()) {
      const recentTimestamps = timestamps.filter(ts => ts > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.hourlyCreations.delete(ip);
      } else {
        this.hourlyCreations.set(ip, recentTimestamps);
      }
    }

    // 清理旧的安全事件
    const recentEvents = this.securityEvents.filter(event => 
      event.timestamp > oneDayAgo
    );
    this.securityEvents.length = 0;
    this.securityEvents.push(...recentEvents);

    console.log('[Security] Cleanup completed:', {
      activeUsers: this.userActivities.size,
      activeIPs: this.ipUserCounts.size,
      securityEvents: this.securityEvents.length,
    });
  }

  /**
   * 获取安全统计信息
   */
  getSecurityStats(): {
    activeUsers: number;
    activeIPs: number;
    blockedIPs: number;
    recentEvents: number;
    suspiciousUsers: number;
  } {
    const suspiciousUsers = Array.from(this.userActivities.values())
      .filter(activity => activity.suspicious).length;

    return {
      activeUsers: this.userActivities.size,
      activeIPs: this.ipUserCounts.size,
      blockedIPs: this.blockedIPs.size,
      recentEvents: this.securityEvents.length,
      suspiciousUsers,
    };
  }

  /**
   * 手动封禁IP地址
   */
  blockIP(ipAddress: string, reason?: string): void {
    this.blockedIPs.add(ipAddress);
    
    this.recordSecurityEvent({
      type: SecurityEventType.IP_BLOCKED,
      ipAddress,
      timestamp: Date.now(),
      details: { reason: reason || 'Manual block', manual: true },
    });

    console.log('[Security] IP blocked:', { ipAddress, reason });
  }

  /**
   * 解除IP封禁
   */
  unblockIP(ipAddress: string): void {
    this.blockedIPs.delete(ipAddress);
    console.log('[Security] IP unblocked:', ipAddress);
  }

  // 私有方法

  private checkHourlyCreationLimit(ipAddress: string): {
    allowed: boolean;
    reason?: string;
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    const creations = this.hourlyCreations.get(ipAddress) || [];
    const recentCreations = creations.filter(ts => ts > oneHourAgo);
    
    if (recentCreations.length >= this.config.maxCreationsPerHour) {
      this.recordSecurityEvent({
        type: SecurityEventType.RATE_LIMIT_EXCEEDED,
        ipAddress,
        timestamp: now,
        details: { 
          creationsInLastHour: recentCreations.length,
          limit: this.config.maxCreationsPerHour
        },
      });
      return { 
        allowed: false, 
        reason: '创建频率过高，请稍后再试' 
      };
    }

    return { allowed: true };
  }

  private checkConcurrentUserLimit(ipAddress: string): {
    allowed: boolean;
    reason?: string;
  } {
    const currentUsers = this.ipUserCounts.get(ipAddress);
    const userCount = currentUsers ? currentUsers.size : 0;

    if (userCount >= this.config.maxConcurrentUsersPerIP) {
      this.recordSecurityEvent({
        type: SecurityEventType.TOO_MANY_CONCURRENT_USERS,
        ipAddress,
        timestamp: Date.now(),
        details: { 
          concurrentUsers: userCount,
          limit: this.config.maxConcurrentUsersPerIP
        },
      });
      return { 
        allowed: false, 
        reason: '同时在线用户数过多，请稍后再试' 
      };
    }

    return { allowed: true };
  }

  private countRecentEdits(userId: string, since: number): number {
    // 在实际实现中，这里应该查询编辑历史记录
    // 目前简化为基于编辑计数的估算
    const activity = this.userActivities.get(userId);
    return activity && activity.lastEditTime > since ? 1 : 0;
  }

  private detectSuspiciousActivity(userId: string): void {
    const activity = this.userActivities.get(userId);
    if (!activity || activity.suspicious) {
      return;
    }

    const now = Date.now();
    const sessionDuration = now - activity.createdAt;
    const editRate = activity.editCount / (sessionDuration / (1000 * 60)); // 每分钟编辑数

    // 检测异常高的编辑频率
    if (editRate > this.config.suspiciousActivityThreshold) {
      activity.suspicious = true;
      
      this.recordSecurityEvent({
        type: SecurityEventType.SUSPICIOUS_ACTIVITY,
        userId,
        ipAddress: activity.ipAddress,
        timestamp: now,
        details: { 
          editRate,
          threshold: this.config.suspiciousActivityThreshold,
          editCount: activity.editCount,
          sessionDuration
        },
      });

      console.warn('[Security] Suspicious activity detected:', {
        userId,
        editRate,
        editCount: activity.editCount,
      });
    }
  }

  private recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);
    
    // 保持事件列表大小在合理范围内
    if (this.securityEvents.length > 1000) {
      this.securityEvents.splice(0, 100); // 删除最旧的100个事件
    }

    console.log('[Security] Security event recorded:', event);
  }
} 