export interface Logger {
    debug: (message: string, ...args: unknown[]) => void;
    info: (message: string, ...args: unknown[]) => void;
    warn: (message: string, ...args: unknown[]) => void;
    error: (message: string, ...args: unknown[]) => void;
}
export declare class ConsoleLogger implements Logger {
    debug(message: string, ...args: unknown[]): void;
    error(message: string, ...args: unknown[]): void;
    info(message: string, ...args: unknown[]): void;
    warn(message: string, ...args: unknown[]): void;
}
export declare class NoopLogger implements Logger {
    debug(): void;
    error(): void;
    info(): void;
    warn(): void;
}
//# sourceMappingURL=logger.d.ts.map