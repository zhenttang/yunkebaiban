// because AbortSignal.throwIfAborted is not available in abortcontroller-polyfill
export function throwIfAborted(abort) {
    if (abort?.aborted) {
        throw abort.reason;
    }
    return true;
}
export const MANUALLY_STOP = 'manually-stop';
//# sourceMappingURL=throw-if-aborted.js.map