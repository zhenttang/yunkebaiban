import { ErrorCode } from './code.js';
export declare class BlockSuiteError extends Error {
    static ErrorCode: typeof ErrorCode;
    code: ErrorCode;
    isFatal: boolean;
    constructor(code: ErrorCode, message: string, options?: {
        cause: Error;
    });
}
export declare function handleError(error: Error): void;
export * from './code.js';
//# sourceMappingURL=index.d.ts.map