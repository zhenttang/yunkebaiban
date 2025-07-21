import type { AutoReconnectConnection } from './connection';

const CONNECTIONS: Map<string, AutoReconnectConnection<any>> = new Map();
export function share<T extends AutoReconnectConnection<any>>(conn: T): T {
  if (!conn.shareId) {
    throw new Error(
      `连接 ${conn.constructor.name} 不可共享。\n如果你想让它可共享，请重写 [shareId]。`
    );
  }

  const existing = CONNECTIONS.get(conn.shareId);

  if (existing) {
    return existing as T;
  }

  CONNECTIONS.set(conn.shareId, conn);

  return conn;
}
