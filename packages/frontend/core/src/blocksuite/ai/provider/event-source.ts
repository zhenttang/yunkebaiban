import { handleError } from './copilot-client';
import { RequestTimeoutError } from './error';

export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type AffineTextEvent = {
  type: 'attachment' | 'message';
  data: string;
};

type AffineTextStream = AsyncIterable<AffineTextEvent>;

type toTextStreamOptions = {
  timeout?: number;
  signal?: AbortSignal;
};

// todo(@Peng): may need to extend the error type
const safeParseError = (data: string): { status: number } => {
  try {
    return JSON.parse(data);
  } catch {
    return {
      status: 500,
    };
  }
};

export function toTextStream(
  eventSource: EventSource,
  { timeout, signal }: toTextStreamOptions = {}
): AffineTextStream {
  console.log(`[toTextStream] 开始创建文本流, EventSource状态:`, eventSource.readyState);
  
  return {
    [Symbol.asyncIterator]: async function* () {
      const messageQueue: AffineTextEvent[] = [];
      let resolveMessagePromise: () => void;
      let rejectMessagePromise: (err: Error) => void;

      function resetMessagePromise() {
        if (resolveMessagePromise) {
          resolveMessagePromise();
        }
        return new Promise<void>((resolve, reject) => {
          resolveMessagePromise = resolve;
          rejectMessagePromise = reject;
        });
      }
      let messagePromise = resetMessagePromise();

      function messageListener(event: MessageEvent) {
        console.log(`[toTextStream] 收到事件:`, {
          type: event.type,
          data: event.data,
          eventSource_readyState: eventSource.readyState
        });
        
        messageQueue.push({
          type: 'message', // 固定为'message'，因为我们处理的都是文本消息
          data: event.data as string,
        });
        messagePromise = resetMessagePromise();
      }

      console.log(`[toTextStream] 添加事件监听器`);
      eventSource.addEventListener('message', messageListener);
      eventSource.addEventListener('attachment', messageListener);

      eventSource.addEventListener('error', event => {
        console.log(`[toTextStream] EventSource错误事件:`, event);
        const errorMessage = (event as unknown as { data: string }).data;
        // if there is data in Error event, it means the server sent an error message
        // otherwise, the stream is finished successfully
        if (event.type === 'error' && errorMessage) {
          console.error(`[toTextStream] 收到错误消息:`, errorMessage);
          // try to parse the error message as a JSON object
          const error = safeParseError(errorMessage);
          rejectMessagePromise(handleError(error));
        } else {
          console.log(`[toTextStream] 流式连接正常结束`);
          resolveMessagePromise();
        }
        eventSource.close();
      });

      console.log(`[toTextStream] 开始消息循环处理`);
      try {
        while (
          eventSource.readyState !== EventSource.CLOSED &&
          !signal?.aborted
        ) {
          if (messageQueue.length === 0) {
            console.log(`[toTextStream] 等待消息, 队列为空, EventSource状态: ${eventSource.readyState}`);
            // Wait for the next message or timeout
            await (timeout
              ? Promise.race([
                  messagePromise,
                  delay(timeout).then(() => {
                    if (!signal?.aborted) {
                      console.error(`[toTextStream] 超时! timeout=${timeout}ms`);
                      throw new RequestTimeoutError();
                    }
                  }),
                ])
              : messagePromise);
          } else if (messageQueue.length > 0) {
            const top = messageQueue.shift();
            if (top) {
              console.log(`[toTextStream] 产出消息:`, top);
              yield top;
            }
          }
        }
      } finally {
        console.log(`[toTextStream] 清理资源, 关闭EventSource`);
        eventSource.close();
      }
    },
  };
}
