import { showAILoginRequiredAtom } from '@yunke/core/components/yunke/auth/ai-login-required';
import type { UserFriendlyError } from '@yunke/error';
import { getCurrentStore } from '@toeverything/infra';

import { GeneralNetworkError, PaymentRequiredError, UnauthorizedError } from './error';

// REST API 响应类型定义
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CopilotSession {
  id: string;
  workspaceId: string;
  docId?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

interface CopilotMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface CopilotContext {
  id: string;
  sessionId: string;
  workspaceId: string;
  createdAt: string;
}

// 已移除 GraphQL 相关类型与回退逻辑，仅保留 REST 实现

function resolveError(src: any) {
  const err = codeToError(src);
  if (err instanceof UnauthorizedError) {
    getCurrentStore().set(showAILoginRequiredAtom, true);
  }
  return err;
}

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

export class CopilotClient {
  constructor(
    readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>,
    readonly eventSource: (
      url: string,
      eventSourceInitDict?: EventSourceInit
    ) => EventSource
  ) {}

  // 统一的REST API调用方法
  private async restCall<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await this.fetcher(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          errorMessage = response.statusText || errorMessage;
        }
        
        throw {
          status: response.status,
          message: errorMessage,
          code: 'REST_API_ERROR'
        };
      }

      const data: ApiResponse<T> = await response.json();
      
      // 处理Java后端的响应格式
      if (data.success && data.data) {
        return data.data;
      } else if (data.success === false) {
        throw {
          status: 400,
          message: data.error || 'API调用失败',
          code: 'API_ERROR'
        };
      }
      
      // 直接返回数据（兼容不同响应格式）
      return data as unknown as T;
    } catch (err) {
      throw resolveError(err);
    }
  }

  // 已移除 GraphQL 回退，统一使用 REST

  async createSession(options: {
    workspaceId: string;
    docId?: string;
    title?: string;
  }): Promise<CopilotSession> {
    return await this.restCall<CopilotSession>('/api/copilot/sessions', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async updateSession(options: {
    sessionId: string;
    title?: string;
    updatedAt?: string;
  }): Promise<CopilotSession> {
    const { sessionId, ...updateData } = options;
    return await this.restCall<CopilotSession>(`/api/copilot/sessions/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async forkSession(options: {
    sessionId: string;
    workspaceId: string;
    title?: string;
  }): Promise<CopilotSession> {
    const { sessionId, ...forkData } = options;
    return await this.restCall<CopilotSession>(`/api/copilot/sessions/${sessionId}/fork`, {
      method: 'POST',
      body: JSON.stringify(forkData),
    });
  }

  async createMessage(options: {
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
  }): Promise<CopilotMessage> {
    const { sessionId, ...messageData } = options;
    return await this.restCall<CopilotMessage>(`/api/copilot/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }

  async getSession(workspaceId: string, sessionId: string): Promise<CopilotSession | null> {
    return await this.restCall<CopilotSession>(`/api/copilot/sessions/${sessionId}?workspaceId=${workspaceId}`);
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
      workspaceId,
      ...(docId && { docId }),
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() }),
    });
    return await this.restCall<CopilotSession[]>(`/api/copilot/sessions?${params}`);
  }

  async getHistories(
    workspaceId: string,
    docId?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<CopilotMessage[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(docId && { docId }),
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() }),
    });
    return await this.restCall<CopilotMessage[]>(`/api/copilot/histories?${params}`);
  }

  async getHistoryIds(
    workspaceId: string,
    docId?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<string[]> {
    const params = new URLSearchParams({
      workspaceId,
      ...(docId && { docId }),
      ...(options?.limit && { limit: options.limit.toString() }),
      ...(options?.offset && { offset: options.offset.toString() }),
    });
    const histories = await this.restCall<CopilotMessage[]>(`/api/copilot/histories?${params}&idsOnly=true`);
    return histories.map(h => h.id);
  }

  async cleanupSessions(input: {
    workspaceId: string;
    docId: string;
    sessionIds: string[];
  }): Promise<boolean> {
    await this.restCall('/api/copilot/sessions/cleanup', {
      method: 'DELETE',
      body: JSON.stringify(input),
    });
    return true;
  }

  async createContext(workspaceId: string, sessionId: string): Promise<CopilotContext> {
    return await this.restCall<CopilotContext>('/api/copilot/contexts', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, sessionId }),
    });
  }

  async getContextId(workspaceId: string, sessionId: string): Promise<string | undefined> {
    const contexts = await this.restCall<CopilotContext[]>(
      `/api/copilot/contexts?workspaceId=${workspaceId}&sessionId=${sessionId}`
    );
    return contexts[0]?.id;
  }

  // 保持现有的streaming方法不变（已经是REST API）
  async chatText(sessionId: string, message: string): Promise<Response> {
    return this.fetcher(`/api/copilot/chat/${sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
  }

  chatTextStream(sessionId: string, message: string): EventSource {
    return this.eventSource(`/api/copilot/chat/${sessionId}/stream`, {
      withCredentials: true,
    });
  }

  async chatImages(sessionId: string, message: string): Promise<Response> {
    return this.fetcher(`/api/copilot/chat/${sessionId}/images`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
  }

  async getUnsplashPhotos(query: string): Promise<Response> {
    return this.fetcher(`/api/copilot/unsplash/photos?query=${encodeURIComponent(query)}`);
  }

  // Context management methods (REST implementation)
  async addContextDoc(contextId: string, docId: string): Promise<boolean> {
    try {
      await this.restCall(`/api/copilot/contexts/${contextId}/docs`, {
        method: 'POST',
        body: JSON.stringify({ docId }),
      });
      return true;
    } catch (restError) {
      console.warn('REST API failed:', restError);
      return false;
    }
  }

  async addContextFile(contextId: string, fileId: string): Promise<boolean> {
    try {
      await this.restCall(`/api/copilot/contexts/${contextId}/files`, {
        method: 'POST',
        body: JSON.stringify({ fileId }),
      });
      return true;
    } catch (restError) {
      console.warn('REST API failed:', restError);
      return false;
    }
  }

  async removeContextDoc(contextId: string, docId: string): Promise<boolean> {
    try {
      await this.restCall(`/api/copilot/contexts/${contextId}/docs/${docId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (restError) {
      console.warn('REST API failed:', restError);
      return false;
    }
  }

  async removeContextFile(contextId: string, fileId: string): Promise<boolean> {
    try {
      await this.restCall(`/api/copilot/contexts/${contextId}/files/${fileId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (restError) {
      console.warn('REST API failed:', restError);
      return false;
    }
  }
}
