type Status = {
    id: number;
    status: 'new' | 'recording' | 'paused' | 'stopped' | 'ready' | 'create-block-success' | 'create-block-failed';
    appName?: string;
    appGroupId?: number;
    icon?: Buffer;
    filepath?: string;
    sampleRate?: number;
    numberOfChannels?: number;
};
export declare const useRecordingStatus: () => Status | null;
export declare function Recording(): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=index.d.ts.map