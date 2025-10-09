import type { FrameworkProvider } from '@toeverything/infra';
export declare function getCurrentWorkspace(frameworkProvider: FrameworkProvider): {
    workspace: import("@affine/core/modules/workspace").Workspace;
    dispose: () => void;
    [Symbol.dispose]: () => void;
} | undefined;
export declare function getCurrentServerService(frameworkProvider: FrameworkProvider): import("@affine/core/modules/cloud").Server | null | undefined;
export declare function isAiEnabled(frameworkProvider: FrameworkProvider): boolean | undefined;
//# sourceMappingURL=utils.d.ts.map