/**
 * 云存储模块常量定义
 * 集中管理所有魔法数字，便于调参和维护
 */

// ====== 连接配置 ======
/** Socket.IO 连接超时时间 (ms) */
export const SOCKET_CONNECT_TIMEOUT_MS = 5000;
/** space:join 请求超时时间 (ms) */
export const SOCKET_JOIN_TIMEOUT_MS = 10000;
/** 连接超时检查延迟 (ms) */
export const CONNECTION_CHECK_TIMEOUT_MS = 5000;
/** 初始连接延迟 (ms)，避免状态更新冲突 */
export const CONNECT_DELAY_MS = 100;

// ====== 重连配置 ======
/** 最大重连次数 */
export const MAX_RECONNECT_ATTEMPTS = 5;
/** 最大重连延迟 (ms) */
export const MAX_RECONNECT_DELAY_MS = 30000;
/** 重连基础延迟 (ms)，实际延迟 = 2^attempts * BASE */
export const RECONNECT_BASE_DELAY_MS = 1000;

// ====== 同步配置 ======
/** 同步成功后状态重置延迟 (ms) */
export const SYNC_STATUS_RESET_DELAY_MS = 3000;
/** 离线同步最大退避延迟 (ms) */
export const MAX_OFFLINE_SYNC_DELAY_MS = 30000;
/** 离线同步最大失败次数（达到后不再增加退避时间） */
export const MAX_OFFLINE_SYNC_FAILURES = 5;
