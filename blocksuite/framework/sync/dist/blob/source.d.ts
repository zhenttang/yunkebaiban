import type { Observable } from 'rxjs';
export interface BlobState {
    uploading: boolean;
    downloading: boolean;
    errorMessage?: string | null;
    overSize: boolean;
    needUpload: boolean;
    needDownload: boolean;
}
export interface BlobSource {
    name: string;
    readonly: boolean;
    get: (key: string) => Promise<Blob | null>;
    set: (key: string, value: Blob) => Promise<string>;
    delete: (key: string) => Promise<void>;
    list: () => Promise<string[]>;
    blobState$?: (key: string) => Observable<BlobState> | null;
    upload?: (key: string) => Promise<boolean>;
}
//# sourceMappingURL=source.d.ts.map