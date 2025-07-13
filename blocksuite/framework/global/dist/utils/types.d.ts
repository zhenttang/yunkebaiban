export type Constructor<T = object, Arguments extends any[] = any[]> = new (...args: Arguments) => T;
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? T[P] extends Array<infer U> ? Array<DeepPartial<U>> : DeepPartial<T[P]> : T[P];
};
export declare function assertType<T>(_: unknown): asserts _ is T;
//# sourceMappingURL=types.d.ts.map