import { showAILoginRequiredAtom } from '@yunke/core/components/yunke/auth/ai-login-required';
import type { UserFriendlyError } from '@yunke/error';
import { getCurrentStore } from '@toeverything/infra';

import {
  GeneralNetworkError,
  PaymentRequiredError,
  UnauthorizedError,
} from './error';

// REST API 响应类型定义
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Copilot 数据模型（基于实际后端实现）
interface CopilotSession {
  sessionId: string;  // 修复：后端返回的是sessionId而不是id
  workspaceId: string;
  docId?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  provider?: string;
  model?: string;
  finished?: boolean;
}

interface CopilotMessage {
  messageId: string;  // 修复：后端返回的是messageId而不是id
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  attachments?: any[];
  params?: any;
  tokens?: number;
  finishReason?: string;
}

interface CopilotQuota {
  feature: string;
  limit: number;
  used: number;
  resetDate?: string;
}

interface UsageStats {
  totalSessions: number;
  totalMessages: number;
  tokensUsed: number;
  avgSessionLength: number;
}

interface SessionStats {
  sessionId: string;
  messageCount: number;
  tokensUsed: number;
  duration: number;
  finished: boolean;
}

// 错误处理
function codeToError(error: UserFriendlyError) {
  switch (error.status) {
    case 401:
      return new UnauthorizedError();
    case 402:
      return new PaymentRequiredError();
    default:
      return new GeneralNetworkError(
        error.code
          ? `${error.code}: ${error.message}\nIdentify: ${error.name}`
          : error.message
      );
  }
}

function resolveError(err: any) {
  const error = codeToError(err);
  if (error instanceof UnauthorizedError) {
    getCurrentStore().set(showAILoginRequiredAtom, true);
  }
  return error;
}

// Copilot 客户端类 - 基于实际Java后端API
export class CopilotClient {
  constructor(
    readonly gql: any, // 保留参数以兼容现有代码，但不使用
    readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>,
    readonly eventSource: (
      url: string,
      eventSourceInitDict?: EventSourceInit
    ) => EventSource
  ) {}

  // 统一的 REST API 调用方法
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      console.log(`[CopilotClient] Making API call:`, {
        endpoint,
        method: options.method || 'GET',
        hasBody: !!options.body,
        bodyPreview: options.body ? String(options.body).substring(0, 200) + '...' : null
      });
      
      const response = await this.fetcher(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log(`[CopilotClient] API response:`, {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let errorBody = null;
        
        try {
          const errorData = await response.text(); // 先获取原始文本
          console.error(`[CopilotClient] Error response body:`, errorData);
          
          try {
            errorBody = JSON.parse(errorData); // 尝试解析为JSON
            errorMessage = errorBody.error || errorBody.message || errorMessage;
          } catch (parseError) {
            console.warn(`[CopilotClient] Failed to parse error as JSON:`, parseError);
            errorMessage = errorData || errorMessage;
          }
        } catch (e) {
          console.warn(`[CopilotClient] Failed to read error response:`, e);
        }
        
        console.error(`[CopilotClient] API call failed:`, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          errorMessage,
          errorBody
        });
        
        throw {
          status: response.status,
          message: errorMessage,
          code: 'REST_API_ERROR',
          body: errorBody,
          endpoint: endpoint
        };
      }

      const data = await response.json();
      console.log(`[CopilotClient] API response data:`, data);
      
      // 直接返回响应数据（Java后端直接返回数据对象）
      return data as T;
    } catch (err) {
      console.error(`[CopilotClient] API call exception:`, {
        endpoint,
        error: err,
        errorType: typeof err,
        errorMessage: err?.message,
        errorStack: err?.stack
      });
      throw resolveError(err);
    }
  }

  // ==================== 会话管理 ====================

  async createSession(options: {
    workspaceId: string;
    docId?: string;
    title?: string;
    provider?: string;
    model?: string;
  }): Promise<string> { // 修复：返回类型改为 string（sessionId）
    // 修复400错误：转换前端参数格式到后端期望格式
    const requestBody = {
      workspaceId: options.workspaceId,
      docId: options.docId || null,
      title: options.title || 'New Chat Session',
      // 转换 provider 字符串为大写枚举格式（如 "openai" -> "OPENAI"）
      provider: options.provider?.toUpperCase() || 'OPENAI',
      model: options.model || null,
      prompt: '', // 后端期望的字段
      config: {}  // 后端期望的字段
    };
    
    try {
      console.log(`[CopilotClient] 创建会话请求:`, requestBody);
      
      const session = await this.apiCall<CopilotSession>('/api/copilot/sessions', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      console.log(`[CopilotClient] 创建会话响应:`, session);
      
      if (!session || !session.sessionId) {
        throw new Error('Failed to create session: Invalid response from server');
      }
      
      return session.sessionId; // 修复：使用sessionId而不是id
    } catch (error) {
      console.error('[CopilotClient] createSession failed:', error);
      throw new Error(`Session creation failed: ${error.message || error}`);
    }
  }

  async updateSession(options: {
    sessionId: string;
    title?: string;
    provider?: string;
    model?: string;
  }): Promise<CopilotSession> {
    const { sessionId, ...updateData } = options;
    return await this.apiCall<CopilotSession>(`/api/copilot/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async forkSession(options: {
    sessionId: string;
    workspaceId: string;
    title?: string;
    docId?: string;
  }): Promise<string> { // 修复：返回类型改为 string（sessionId）保持一致
    // Java后端没有fork endpoint，使用create代替
    const { sessionId, ...forkData } = options;
    const originalSession = await this.getSession('', sessionId);
    if (!originalSession) {
      throw new Error('Original session not found');
    }
    
    // createSession 现在返回 sessionId，直接返回即可
    return await this.createSession({
      ...forkData,
      title: forkData.title || `${originalSession.title} (Copy)`,
    });
  }

  async getSession(workspaceId: string, sessionId: string): Promise<CopilotSession | null> {
    try {
      return await this.apiCall<CopilotSession>(`/api/copilot/sessions/${sessionId}`);
    } catch (error) {
      // 如果会话不存在，返回 null 而不是抛出错误
      if ((error as any).status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getSessions(
    workspaceId: string,
    docId?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<CopilotSession[]> {
    const params = new URLSearchParams({
      ...(options?.limit && { limit: options.limit.toString() }),
    });
    
    if (workspaceId) {
      // 获取工作空间会话
      return await this.apiCall<CopilotSession[]>(
        `/api/copilot/workspaces/${workspaceId}/sessions?${params}`
      );
    } else {
      // 获取用户会话
      return await this.apiCall<CopilotSession[]>(`/api/copilot/sessions?${params}`);
    }
  }

  async cleanupSessions(input: {
    workspaceId?: string;
    docId?: string;
    sessionIds?: string[];
  }): Promise<boolean> {
    try {
      const count = await this.apiCall<number>('/api/copilot/sessions', {
        method: 'DELETE',
      });
      return count > 0;
    } catch (error) {
      console.warn('Failed to cleanup sessions:', error);
      return false;
    }
  }

  async finishSession(sessionId: string): Promise<boolean> {
    try {
      return await this.apiCall<boolean>(`/api/copilot/sessions/${sessionId}/finish`, {
        method: 'POST',
      });
    } catch (error) {
      console.warn('Failed to finish session:', error);
      return false;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      return await this.apiCall<boolean>(`/api/copilot/sessions/${sessionId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to delete session:', error);
      return false;
    }
  }

  // ==================== 消息管理 ====================

  async createMessage(options: {
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    attachments?: any[];
  }): Promise<CopilotMessage> {
    const { sessionId, role, content, attachments } = options;
    
    // 验证必要参数
    if (!sessionId || sessionId === 'undefined') {
      const error = new Error('sessionId is required for createMessage');
      console.error('[CopilotClient] createMessage validation failed:', error);
      throw error;
    }
    
    if (!content && content !== '') {
      const error = new Error('content is required for createMessage');
      console.error('[CopilotClient] createMessage validation failed:', error);
      throw error;
    }
    
    // 转换为后端期望的格式 - 修复：匹配 CreateChatMessageInput DTO
    const requestBody = {
      content,
      role: role.toUpperCase(), // 'user' -> 'USER', 'assistant' -> 'ASSISTANT', 'system' -> 'SYSTEM'
      attachments: attachments || [],
      params: {},  // 后端期望的字段
      stream: false // 后端期望的字段
      // 注意：sessionId不需要在body中，它在URL路径中
    };
    
    console.log(`[CopilotClient] 发送消息请求:`, { 
      sessionId, 
      requestBody,
      requestBodyString: JSON.stringify(requestBody, null, 2)
    });
    
    try {
      const result = await this.apiCall<CopilotMessage>(`/api/copilot/sessions/${sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`[CopilotClient] 发送消息响应:`, result);
      
      if (!result) {
        const error = new Error('createMessage returned null/undefined result');
        console.error('[CopilotClient] createMessage result validation failed:', error);
        throw error;
      }
      
      // 确保返回的消息有正确的ID字段
      if (!result.messageId && !result.id) {
        const error = new Error('createMessage returned result without messageId/id');
        console.error('[CopilotClient] createMessage result validation failed:', error, result);
        throw error;
      }
      
      return result;
    } catch (error) {
      console.error(`[CopilotClient] createMessage failed:`, {
        sessionId,
        error,
        errorMessage: error?.message,
        errorCode: error?.code,
        errorStatus: error?.status,
        endpoint: `/api/copilot/sessions/${sessionId}/messages`
      });
      throw error;
    }
  }

  async getHistories(
    workspaceId: string,
    docId?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {  // 修复：返回AIHistory结构
    // Java后端需要先获取会话，然后获取每个会话的消息
    const sessions = await this.getSessions(workspaceId, docId, options);
    const histories: any[] = [];
    
    for (const session of sessions) {
      try {
        const messages = await this.getSessionMessages(session.sessionId, options?.limit, options?.offset);
        
        // 转换为前端期望的AIHistory格式
        const history = {
          sessionId: session.sessionId,
          tokens: 0, // 暂时设为0，后端可能没有这个统计
          action: session.title || 'Chat',
          createdAt: session.createdAt,
          messages: messages.map(msg => ({
            id: msg.messageId,  // 使用messageId作为id
            content: msg.content,
            createdAt: msg.createdAt,
            role: typeof msg.role === 'string' ? msg.role.toLowerCase() : msg.role, // 安全转换角色
            attachments: msg.attachments || []
          }))
        };
        
        histories.push(history);
      } catch (error) {
        console.warn(`Failed to get messages for session ${session.sessionId}:`, error);
      }
    }
    
    return histories.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getHistoryIds(
    workspaceId: string,
    docId?: string,
    options?: {
      limit?: number;
      offset?: number;
      sessionId?: string;
    }
  ): Promise<any[]> {  // 返回AIHistoryIds结构
    const histories = await this.getHistories(workspaceId, docId, options);
    
    // 如果指定了sessionId，只返回该会话的历史记录
    if (options?.sessionId) {
      const targetHistory = histories.find(h => h.sessionId === options.sessionId);
      return targetHistory ? [targetHistory].map(history => ({
        sessionId: history.sessionId,
        messages: history.messages.map(msg => ({
          id: msg.id,
          createdAt: msg.createdAt,
          role: msg.role
        }))
      })) : [];
    }
    
    // 转换为AIHistoryIds格式：只返回必要的字段
    return histories.map(history => ({
      sessionId: history.sessionId,
      messages: history.messages.map(msg => ({
        id: msg.id,
        createdAt: msg.createdAt,
        role: msg.role
      }))
    }));
  }

  async getSessionMessages(
    sessionId: string,
    limit = 50,
    offset = 0
  ): Promise<CopilotMessage[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    return await this.apiCall<CopilotMessage[]>(
      `/api/copilot/sessions/${sessionId}/messages?${params}`
    );
  }

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      return await this.apiCall<boolean>(`/api/copilot/messages/${messageId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.warn('Failed to delete message:', error);
      return false;
    }
  }

  async searchMessages(sessionId: string, query: string): Promise<CopilotMessage[]> {
    try {
      const params = new URLSearchParams({ q: query });
      return await this.apiCall<CopilotMessage[]>(
        `/api/copilot/sessions/${sessionId}/messages/search?${params}`
      );
    } catch (error) {
      console.warn('Failed to search messages:', error);
      return [];
    }
  }

  // ==================== 上下文管理（模拟实现） ====================
  // Java后端没有context相关端点，提供模拟实现以保持兼容性

  async createContext(workspaceId: string, sessionId: string): Promise<any> {
    console.warn('Context management not implemented in Java backend');
    return { id: `context_${sessionId}`, sessionId, workspaceId, createdAt: new Date().toISOString() };
  }

  async getContextId(workspaceId: string, sessionId: string): Promise<string | undefined> {
    return `context_${sessionId}`;
  }

  async addContextDoc(contextId: string, docId: string): Promise<boolean> {
    console.warn('Context doc management not implemented in Java backend');
    return true;
  }

  async removeContextDoc(contextId: string, docId: string): Promise<boolean> {
    console.warn('Context doc management not implemented in Java backend');
    return true;
  }

  async addContextFile(contextId: string, file: File): Promise<boolean> {
    console.warn('Context file management not implemented in Java backend');
    return true;
  }

  async removeContextFile(contextId: string, fileId: string): Promise<boolean> {
    console.warn('Context file management not implemented in Java backend');
    return true;
  }

  async addContextCategory(contextId: string, category: string): Promise<boolean> {
    console.warn('Context category management not implemented in Java backend');
    return true;
  }

  async removeContextCategory(contextId: string, category: string): Promise<boolean> {
    console.warn('Context category management not implemented in Java backend');
    return true;
  }

  async getContextDocsAndFiles(
    workspaceId: string,
    sessionId: string,
    contextId: string
  ): Promise<any | null> {
    console.warn('Context management not implemented in Java backend');
    return null;
  }

  async matchContext(
    content: string,
    contextId?: string,
    workspaceId?: string,
    limit?: number,
    scopedThreshold?: number,
    threshold?: number
  ): Promise<{ files?: any[]; docs?: any[] }> {
    console.warn('Context matching not implemented in Java backend');
    return {};
  }

  // ==================== AI 聊天功能 ====================

  async chatText({
    sessionId,
    messageId,
    reasoning,
    webSearch,
    modelId,
    signal,
  }: {
    sessionId: string;
    messageId?: string;
    reasoning?: boolean;
    webSearch?: boolean;
    modelId?: string;
    signal?: AbortSignal;
  }): Promise<string> {
    // Java后端使用流式endpoint，这里调用AI控制器
    const response = await this.fetcher('/api/ai/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: messageId || '',
        provider: 'openai',
        model: modelId || 'gpt-3.5-turbo'
      }),
      signal,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data.result || '';
  }

  // 简单的GET流式聊天 - 用于测试SSE格式修复
  chatTextStreamSimple({
    sessionId,
    content,
    reasoning,
    webSearch,
    modelId
  }: {
    sessionId: string;
    content?: string;
    reasoning?: boolean;
    webSearch?: boolean;
    modelId?: string;
  }): EventSource {
    console.log(`[CopilotClient] 创建简单GET流式连接:`, {
      sessionId,
      content: content?.substring(0, 50) + '...',
      reasoning,
      webSearch,
      modelId
    });
    
    // 使用GET方法的流式端点，传递content参数
    const params = new URLSearchParams();
    if (content) {
      params.append('content', content);
    }
    if (reasoning) {
      params.append('reasoning', 'true');
    }
    if (webSearch) {
      params.append('webSearch', 'true');
    }
    if (modelId) {
      params.append('modelId', modelId);
    }
    
    const url = `/api/copilot/sessions/${sessionId}/stream?${params}`;
    console.log(`[CopilotClient] GET EventSource URL: ${url}`);
    
    const eventSource = this.eventSource(url);
    
    // 添加事件监听器来调试
    eventSource.onopen = (event) => {
      console.log(`[CopilotClient] GET EventSource opened:`, event);
    };
    
    eventSource.onerror = (event) => {
      console.error(`[CopilotClient] GET EventSource error:`, event);
    };
    
    eventSource.onmessage = (event) => {
      console.log(`[CopilotClient] GET EventSource message:`, event.data);
    };
    
    return eventSource;
  }

  // 流式文本聊天
  chatTextStream(
    {
      sessionId,
      messageId,
      reasoning,
      webSearch,
      modelId,
    }: {
      sessionId: string;
      messageId?: string;
      reasoning?: boolean;
      webSearch?: boolean;
      modelId?: string;
    },
    endpoint = 'stream'
  ): EventSource {
    console.log(`[CopilotClient] 创建流式连接:`, {
      sessionId,
      messageId,
      reasoning,
      webSearch,
      modelId,
      endpoint
    });
    
    // 使用Java后端的流式消息端点
    // 注意：这里使用GET方法的流式端点，因为消息已经通过createMessage发送
    // 后端会获取session中最新的消息进行AI回复
    const url = `/api/copilot/sessions/${sessionId}/stream`;
    
    console.log(`[CopilotClient] EventSource URL: ${url}`);
    
    const eventSource = this.eventSource(url);
    
    // 添加事件监听器来调试
    eventSource.onopen = (event) => {
      console.log(`[CopilotClient] EventSource opened:`, event);
    };
    
    eventSource.onerror = (event) => {
      console.error(`[CopilotClient] EventSource error:`, event);
    };
    
    eventSource.onmessage = (event) => {
      console.log(`[CopilotClient] EventSource message:`, event.data);
    };
    
    return eventSource;
  }

  // 带内容的流式文本聊天 - 修复超时问题的关键方法
  chatTextStreamWithContent({
    sessionId,
    content,
    reasoning,
    webSearch,
    modelId,
    attachments
  }: {
    sessionId: string;
    content?: string;
    reasoning?: boolean;
    webSearch?: boolean;
    modelId?: string;
    attachments?: any[];
  }): EventSource {
    console.log(`[CopilotClient] 创建带内容的流式连接:`, {
      sessionId,
      content: content?.substring(0, 50) + '...',
      reasoning,
      webSearch,
      modelId,
      hasAttachments: !!(attachments && attachments.length > 0)
    });
    
    // 使用后端的POST流式端点，直接传递消息内容
    // 这避免了分两步的问题，后端会：
    // 1. 保存用户消息
    // 2. 立即开始AI流式回复
    const url = `/api/copilot/sessions/${sessionId}/stream`;
    
    // 构建请求体，匹配后端的 CreateChatMessageInput 格式
    const requestBody = {
      content: content || '',
      role: 'USER',
      attachments: attachments || [],
      params: {
        reasoning: reasoning || false,
        webSearch: webSearch || false,
        modelId: modelId || 'deepseek-chat'
      },
      stream: true
    };
    
    console.log(`[CopilotClient] POST流式请求:`, {
      url,
      body: {
        ...requestBody,
        content: requestBody.content.substring(0, 50) + '...'
      }
    });
    
    // 创建POST请求的EventSource - 这需要特殊处理
    // 因为标准EventSource不支持POST，我们需要使用fetch + ReadableStream
    return this.createPostEventSource(url, requestBody);
  }

  // 创建支持POST的EventSource替代品
  private createPostEventSource(url: string, body: any): EventSource {
    console.log(`[CopilotClient] 创建POST EventSource:`, { url, hasBody: !!body });
    
    // 创建一个伪EventSource对象
    const eventSource = {
      readyState: EventSource.CONNECTING,
      onopen: null as ((event: Event) => void) | null,
      onmessage: null as ((event: MessageEvent) => void) | null,
      onerror: null as ((event: Event) => void) | null,
      addEventListener: function(type: string, listener: EventListener) {
        console.log(`[CopilotClient] 添加事件监听器: ${type}`);
        if (type === 'message' && this.onmessage === null) {
          this.onmessage = listener as (event: MessageEvent) => void;
        } else if (type === 'error' && this.onerror === null) {
          this.onerror = listener as (event: Event) => void;
        } else if (type === 'open' && this.onopen === null) {
          this.onopen = listener as (event: Event) => void;
        }
      },
      close: function() {
        console.log(`[CopilotClient] EventSource关闭`);
        this.readyState = EventSource.CLOSED;
      }
    } as EventSource;

    // 启动POST流式请求
    this.startPostStream(url, body, eventSource);
    
    return eventSource;
  }

  private async startPostStream(url: string, body: any, eventSource: any) {
    try {
      console.log(`[CopilotClient] 开始POST流式请求:`, url);
      console.log(`[CopilotClient] 请求体:`, body);
      
      const response = await this.fetcher(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(body),
      });

      console.log(`[CopilotClient] POST响应状态:`, response.status, response.statusText);

      if (!response.ok) {
        console.error(`[CopilotClient] POST流式请求失败:`, response.status, response.statusText);
        eventSource.readyState = EventSource.CLOSED;
        if (eventSource.onerror) {
          eventSource.onerror(new Event('error'));
        }
        return;
      }

      console.log(`[CopilotClient] POST流式请求成功，开始读取流`);
      eventSource.readyState = EventSource.OPEN;
      
      if (eventSource.onopen) {
        eventSource.onopen(new Event('open'));
      }

      // 简化的流式数据读取
      if (!response.body) {
        throw new Error('响应没有body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[CopilotClient] 流式数据读取完成`);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          console.log(`[CopilotClient] 收到原始数据块:`, JSON.stringify(chunk));

          // 解析流式数据 - 支持多种格式，包括双重data:前缀的异常情况
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:data: ')) {
              // 异常情况：双重data:前缀，移除两个前缀
              const data = line.slice(11); // 移除"data:data: "前缀
              if (data.trim() && eventSource.onmessage) {
                console.log(`[CopilotClient] 解析到双重前缀SSE数据:`, JSON.stringify(data));
                const event = new MessageEvent('message', { data });
                eventSource.onmessage(event);
              }
            } else if (line.startsWith('data: ')) {
              // 标准SSE格式：data: 内容（有空格）
              const data = line.slice(6); // 移除"data: "前缀
              if (data.trim() && eventSource.onmessage) {
                console.log(`[CopilotClient] 解析到SSE数据（有空格）:`, JSON.stringify(data));
                const event = new MessageEvent('message', { data });
                eventSource.onmessage(event);
              }
            } else if (line.startsWith('data:') && !line.startsWith('data:data:')) {
              // SSE格式：data:内容（无空格） - 修复这种情况
              const data = line.slice(5); // 移除"data:"前缀
              if (data.trim() && eventSource.onmessage) {
                console.log(`[CopilotClient] 解析到SSE数据（无空格）:`, JSON.stringify(data));
                const event = new MessageEvent('message', { data });
                eventSource.onmessage(event);
              }
            } else if (line.trim() && !line.startsWith(':') && eventSource.onmessage) {
              // 直接文本格式（备用处理）
              console.log(`[CopilotClient] 解析到直接文本数据:`, JSON.stringify(line.trim()));
              const event = new MessageEvent('message', { data: line.trim() });
              eventSource.onmessage(event);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      eventSource.readyState = EventSource.CLOSED;
      console.log(`[CopilotClient] POST流式连接正常结束，状态设置为CLOSED`);
      
      // 触发一个结束事件，让toTextStream知道流已经结束
      if (eventSource.onerror) {
        // 发送一个正常结束的error事件（没有错误数据）
        eventSource.onerror(new Event('error'));
      }
    } catch (error) {
      console.error(`[CopilotClient] POST流式请求异常:`, error);
      eventSource.readyState = EventSource.CLOSED;
      if (eventSource.onerror) {
        eventSource.onerror(new Event('error'));
      }
    }
  }

  // 图像生成（Java后端不支持，返回空EventSource）
  imagesStream(
    sessionId: string,
    messageId?: string,
    seed?: string,
    endpoint = 'images'
  ): EventSource {
    console.warn('Image generation not implemented in Java backend');
    // 返回一个空的EventSource
    return new EventSource('data:text/plain,');
  }

  // ==================== 配额管理 ====================

  async getUserQuotas(): Promise<CopilotQuota[]> {
    try {
      return await this.apiCall<CopilotQuota[]>('/api/copilot/quota');
    } catch (error) {
      console.warn('Failed to get user quotas:', error);
      return [];
    }
  }

  async getUserQuota(feature: string): Promise<CopilotQuota | null> {
    try {
      return await this.apiCall<CopilotQuota>(`/api/copilot/quota/${feature}`);
    } catch (error) {
      console.warn('Failed to get user quota:', error);
      return null;
    }
  }

  // ==================== 统计信息 ====================

  async getUserUsageStats(): Promise<UsageStats | null> {
    try {
      return await this.apiCall<UsageStats>('/api/copilot/stats/user');
    } catch (error) {
      console.warn('Failed to get usage stats:', error);
      return null;
    }
  }

  async getSessionStats(sessionId: string): Promise<SessionStats | null> {
    try {
      return await this.apiCall<SessionStats>(`/api/copilot/sessions/${sessionId}/stats`);
    } catch (error) {
      console.warn('Failed to get session stats:', error);
      return null;
    }
  }

  // ==================== AI 提供商管理 ====================

  async getAvailableProviders(): Promise<string[]> {
    try {
      return await this.apiCall<string[]>('/api/copilot/providers');
    } catch (error) {
      console.warn('Failed to get providers:', error);
      return ['openai'];
    }
  }

  async getProviderModels(provider: string): Promise<string[]> {
    try {
      return await this.apiCall<string[]>(`/api/copilot/providers/${provider}/models`);
    } catch (error) {
      console.warn('Failed to get provider models:', error);
      return ['gpt-3.5-turbo', 'gpt-4'];
    }
  }

  // ==================== 工具方法 ====================

  private paramsToQueryString(params: Record<string, string | boolean | undefined>): string {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (typeof value === 'boolean') {
        if (value) {
          queryString.append(key, 'true');
        }
      } else if (typeof value === 'string') {
        queryString.append(key, value);
      }
    });
    return queryString.toString();
  }

  // ==================== 不支持的功能 ====================

  async getEmbeddingStatus(workspaceId: string): Promise<any> {
    // Embedding status not implemented in Java backend
    return null;
  }

  async getUnsplashPhotos(query: string): Promise<any[]> {
    console.warn('Unsplash integration not implemented in Java backend');
    return [];
  }
}

// 导出错误处理函数以保持兼容性
export { resolveError };
export function handleError(src: any) {
  const err = resolveError(src);
  if (err instanceof UnauthorizedError) {
    getCurrentStore().set(showAILoginRequiredAtom, true);
  }
  return err;
}