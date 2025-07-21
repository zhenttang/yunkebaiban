// 因为 AbortSignal.throwIfAborted 在 abortcontroller-polyfill 中不可用
export function throwIfAborted(abort?: AbortSignal) {
  if (abort?.aborted) {
    throw abort.reason;
  }
  return true;
}

export const MANUALLY_STOP = 'manually-stop';
