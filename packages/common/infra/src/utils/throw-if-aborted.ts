// 因为AbortSignal.throwIfAborted在abortcontroller-polyfill中不可用
export function throwIfAborted(abort?: AbortSignal) {
  if (abort?.aborted) {
    throw new Error(abort.reason);
  }
  return true;
}

export const MANUALLY_STOP = 'manually-stop';
