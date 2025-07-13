import { ErrorCode } from './code.js';
export class BlockSuiteError extends Error {
    static { this.ErrorCode = ErrorCode; }
    constructor(code, message, options) {
        super(message, options);
        this.name = 'BlockSuiteError';
        this.code = code;
        this.isFatal = code >= 10000;
    }
}
export function handleError(error) {
    if (!(error instanceof BlockSuiteError)) {
        throw error;
    }
    if (error.isFatal) {
        throw new Error('A fatal error for BlockSuite occurs, please contact the team if you find this.', { cause: error });
    }
    console.error("A runtime error for BlockSuite occurs, you can ignore this error if it won't break the user experience.");
    console.error(error.stack);
}
export * from './code.js';
//# sourceMappingURL=index.js.map