/**
 * 格式化剩余时间为可读字符串
 */
export function formatTimeRemaining(expiresAt: string | Date): string {
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  const remaining = Math.max(0, expirationDate.getTime() - now.getTime());

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
 * 检查会话是否即将过期（小于30分钟）
 */
export function isSessionExpiringSoon(expiresAt: string | Date): boolean {
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  const remaining = expirationDate.getTime() - now.getTime();
  
  // 30分钟 = 30 * 60 * 1000 毫秒
  return remaining > 0 && remaining < 30 * 60 * 1000;
}

/**
 * 检查会话是否已过期
 */
export function isSessionExpired(expiresAt: string | Date): boolean {
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  return expirationDate.getTime() <= now.getTime();
}

/**
 * 获取会话剩余时间（毫秒）
 */
export function getSessionTimeRemaining(expiresAt: string | Date): number {
  const now = new Date();
  const expirationDate = new Date(expiresAt);
  return Math.max(0, expirationDate.getTime() - now.getTime());
} 