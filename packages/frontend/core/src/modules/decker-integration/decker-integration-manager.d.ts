import type { BlockSuiteStore } from '@blocksuite/store';
export interface DeckerExportData {
    type: 'DECK_EXPORT_COMPLETE';
    gifData: number[];
    deckData: string;
    metadata: {
        filename: string;
        size: number;
        deckSize: number;
        timestamp: number;
        checksum: number;
        deckChecksum: number;
    };
}
export declare class DeckerIntegrationManager {
    private store;
    private listeners;
    constructor();
    setStore(store: BlockSuiteStore): void;
    private setupGlobalListener;
    private handleDeckerExport;
    private createImageBlock;
    addListener(listener: (event: MessageEvent) => void): () => void;
    openDeckerForNew(): void;
    openDeckerForEdit(deckData: string): void;
    private openDeckerModal;
}
export declare const deckerIntegrationManager: DeckerIntegrationManager;
export declare function openDeckerEditor(): void;
export declare function openDeckerEditorWithData(deckData: string): void;
//# sourceMappingURL=decker-integration-manager.d.ts.map