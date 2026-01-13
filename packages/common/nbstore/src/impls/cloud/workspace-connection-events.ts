/**
 * WorkspaceConnection事件总线的类型定义
 *
 * 这个文件定义了WorkspaceConnection发布的所有事件类型
 * Storage层通过订阅这些事件来接收更新，而不是直接操作Socket
 */

/**
 * 文档更新消息
 */
export interface DocUpdateMessage {
  /** 文档ID（已转换为新ID） */
  docId: string;
  /** Y.js更新数据 */
  update: Uint8Array;
  /** 更新时间戳 */
  timestamp: Date;
  /** 会话ID（用于识别是否是自己的更新） */
  sessionId?: string;
  /** 客户端ID（用于识别是否是自己的更新） */
  clientId?: string;
}

/**
 * Awareness更新消息
 */
export interface AwarenessUpdateMessage {
  /** 文档ID */
  docId: string;
  /** Awareness数据 */
  awarenessUpdate: Uint8Array;
}

/**
 * WorkspaceConnection事件总线
 *
 * 事件流向：
 * Server → WorkspaceConnection (监听Socket事件) → EventBus → Storage (订阅EventBus)
 */
export interface WorkspaceConnectionEvents {
  // ============ 文档更新事件 ============

  /**
   * 单个文档更新
   * 对应Socket事件: space:broadcast-doc-update
   */
  'doc:update': (message: DocUpdateMessage) => void;

  /**
   * 批量文档更新
   * 对应Socket事件: space:broadcast-doc-updates
   */
  'doc:updates': (messages: DocUpdateMessage[]) => void;

  // ============ Awareness事件 ============

  /**
   * Awareness更新
   * 对应Socket事件: space:broadcast-awareness-update
   */
  'awareness:update': (message: AwarenessUpdateMessage) => void;

  /**
   * 服务器请求收集当前awareness状态
   * 对应Socket事件: space:collect-awareness
   */
  'awareness:collect': (docId: string) => void;

  // ============ 连接状态事件 ============

  /**
   * Socket连接成功
   */
  'connection:connected': () => void;

  /**
   * Socket断开连接
   * @param reason 断开原因
   */
  'connection:disconnected': (reason: string) => void;

  /**
   * 连接错误
   * @param error 错误对象
   */
  'connection:error': (error: Error) => void;

  /**
   * 连接已同步（space:join完成，idConverter加载完成）
   */
  'connection:synced': () => void;
}
