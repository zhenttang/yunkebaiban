import { partition } from 'lodash-es';

import { AIProvider } from './ai-provider';
import type { CopilotClient } from './copilot-client';
import { delay, toTextStream } from './event-source';

const TIMEOUT = 50000;

export type TextToTextOptions = {
  client: CopilotClient;
  sessionId: string;
  content?: string;
  attachments?: (string | Blob | File)[];
  params?: Record<string, any>;
  timeout?: number;
  stream?: boolean;
  signal?: AbortSignal;
  retry?: boolean;
  workflow?: boolean;
  isRootSession?: boolean;
  postfix?: (text: string) => string;
  reasoning?: boolean;
  webSearch?: boolean;
  modelId?: string;
};

export type ToImageOptions = TextToTextOptions & {
  seed?: string;
};

async function resizeImage(blob: Blob | File): Promise<Blob | null> {
  let src = '';
  try {
    src = URL.createObjectURL(blob);
    const img = new Image();
    img.src = src;
    await new Promise(resolve => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    // keep aspect ratio
    const scale = Math.min(1024 / img.width, 1024 / img.height);
    canvas.width = Math.floor(img.width * scale);
    canvas.height = Math.floor(img.height * scale);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return await new Promise(resolve =>
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.8)
      );
    }
  } catch (e) {
    console.error(e);
  } finally {
    if (src) URL.revokeObjectURL(src);
  }
  return null;
}

interface CreateMessageOptions {
  client: CopilotClient;
  sessionId: string;
  content?: string;
  attachments?: (string | Blob | File)[];
  params?: Record<string, any>;
}

async function createMessage({
  client,
  sessionId,
  content,
  attachments,
  params,
}: CreateMessageOptions): Promise<string> {
  console.log(`[AI_DEBUG] === createMessage called ===`);
  console.log(`[AI_DEBUG] createMessage params:`, {
    sessionId,
    content: content?.substring(0, 100) + '...',
    hasAttachments: !!(attachments && attachments.length > 0),
    params,
  });
  
  // 验证sessionId - 修复关键问题
  if (!sessionId || sessionId === 'undefined') {
    const error = new Error('sessionId is required but was undefined or invalid');
    console.error(`[AI_DEBUG] createMessage failed:`, error);
    throw error;
  }
  
  // 验证content
  if (content === undefined || content === null) {
    const error = new Error('content is required but was undefined or null');
    console.error(`[AI_DEBUG] createMessage failed:`, error);
    throw error;
  }
  
  const hasAttachments = attachments && attachments.length > 0;
  const options: Parameters<CopilotClient['createMessage']>[0] = {
    sessionId,
    role: 'user',  // 保持小写，由copilot-client.ts内部处理转换
    content,
    // 移除 params 字段，CopilotClient.createMessage 不接受此参数
  };

  if (hasAttachments) {
    const [stringAttachments, blobs] = partition(
      attachments,
      attachment => typeof attachment === 'string'
    ) as [string[], (Blob | File)[]];
    
    // 处理文件attachments：将blobs转换为File对象，合并到attachments中
    const processedBlobs = (
      await Promise.all(
        blobs.map(resizeImage).map(async blob => {
          const file = await blob;
          if (!file) return null;
          return new File([file], sessionId, {
            type: file.type,
          });
        })
      )
    ).filter(Boolean) as File[];
    
    // 合并字符串attachments和处理后的文件attachments
    options.attachments = [...stringAttachments, ...processedBlobs];
  }

  console.log(`[AI_DEBUG] Calling client.createMessage with options:`, {
    ...options,
    content: options.content?.substring(0, 100) + '...'
  });
  
  try {
    const result = await client.createMessage(options);
    console.log(`[AI_DEBUG] client.createMessage returned message:`, result);
    
    if (!result) {
      const error = new Error('createMessage returned null/undefined result');
      console.error(`[AI_DEBUG] createMessage validation failed:`, error);
      throw error;
    }
    
    if (!result.messageId && !result.id) {
      const error = new Error('createMessage returned result without messageId/id');
      console.error(`[AI_DEBUG] createMessage validation failed:`, error, result);
      throw error;
    }
    
    return result.messageId || result.id; // 修复：返回messageId或id，以兼容不同格式
  } catch (error) {
    console.error(`[AI_DEBUG] createMessage failed:`, {
      sessionId,
      hasContent: !!content,
      contentLength: content?.length,
      hasAttachments,
      error,
      errorMessage: error?.message,
      errorCode: error?.code,
      errorStatus: error?.status,
      errorType: typeof error,
      errorStack: error?.stack
    });
    
    // 重新抛出错误，保持原有的错误信息但加强调试信息
    if (error?.message) {
      throw new Error(`createMessage failed: ${error.message}`);
    } else {
      throw new Error(`createMessage failed: ${error}`);
    }
  }
}

export function textToText({
  client,
  sessionId,
  content,
  attachments,
  params,
  stream,
  signal,
  timeout = TIMEOUT,
  retry = false,
  workflow = false,
  postfix,
  reasoning,
  webSearch,
  modelId,
}: TextToTextOptions) {
  console.log(`[AI_DEBUG] === textToText called ===`);
  console.log(`[AI_DEBUG] textToText params:`, {
    sessionId,
    content: content?.substring(0, 100) + '...',
    stream,
    retry,
    reasoning,
    webSearch,
    modelId,
  });
  
  let messageId: string | undefined;

  if (stream) {
    return {
      [Symbol.asyncIterator]: async function* () {
        console.log(`[AI_DEBUG] 流式模式: 使用POST方法发送完整消息`);
        
        // 使用POST方法发送消息并接收流式响应
        const eventSource = client.chatTextStreamWithContent({
          sessionId,
          content,
          reasoning,
          webSearch,
          modelId,
          attachments: attachments || []
        });
        
        AIProvider.LAST_ACTION_SESSIONID = sessionId;

        if (signal) {
          if (signal.aborted) {
            eventSource.close();
            return;
          }
          signal.onabort = () => {
            eventSource.close();
          };
        }
        if (postfix) {
          const messages: string[] = [];
          for await (const event of toTextStream(eventSource, {
            timeout,
            signal,
          })) {
            if (event.type === 'message') {
              messages.push(event.data);
            }
          }
          yield postfix(messages.join(''));
        } else {
          for await (const event of toTextStream(eventSource, {
            timeout,
            signal,
          })) {
            if (event.type === 'message') {
              // 修复: 传递完整的事件对象而不是只传递data字段
              yield event;
            }
          }
        }
      },
    };
  } else {
    return Promise.race([
      timeout
        ? delay(timeout).then(() => {
            throw new Error('超时');
          })
        : null,
      (async function () {
        if (!retry) {
          messageId = await createMessage({
            client,
            sessionId,
            content,
            attachments,
            params,
          });
        }
        AIProvider.LAST_ACTION_SESSIONID = sessionId;

        return client.chatText({
          sessionId,
          messageId,
          reasoning,
          webSearch,
          modelId,
        });
      })(),
    ]);
  }
}

// Only one image is currently being processed
export function toImage({
  content,
  sessionId,
  attachments,
  params,
  seed,
  signal,
  timeout = TIMEOUT,
  retry = false,
  workflow = false,
  client,
}: ToImageOptions) {
  let messageId: string | undefined;
  return {
    [Symbol.asyncIterator]: async function* () {
      if (!retry) {
        messageId = await createMessage({
          client,
          sessionId,
          content,
          attachments,
          params,
        });
      }
      const eventSource = client.imagesStream(
        sessionId,
        messageId,
        seed,
        workflow ? 'workflow' : undefined
      );
      AIProvider.LAST_ACTION_SESSIONID = sessionId;

      for await (const event of toTextStream(eventSource, {
        timeout,
        signal,
      })) {
        if (event.type === 'attachment') {
          yield event.data;
        }
      }
    },
  };
}
