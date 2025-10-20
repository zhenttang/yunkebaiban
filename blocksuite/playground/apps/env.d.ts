import type { EditorHost } from '@blocksuite/yunke/block-std';
import type { TestYunkeEditorContainer } from '@blocksuite/integration-test';
import type { BlockSchema, Blocks, Workspace, Transformer } from '@blocksuite/yunke/store';
import type { z } from 'zod';
import type * as Y from 'yjs';

declare global {
  type HTMLTemplate = [
    string,
    Record<string, unknown>,
    ...(HTMLTemplate | string)[],
  ];

  interface Window {
    editor: TestYunkeEditorContainer;
    doc: Blocks;
    collection: Workspace;
    blockSchemas: z.infer<typeof BlockSchema>[];
    job: Transformer;
    Y: typeof Y;
    std: typeof std;
    host: EditorHost;
    testWorker: Worker;

    wsProvider: ReturnType<typeof setupBroadcastProvider>;
    bcProvider: ReturnType<typeof setupBroadcastProvider>;
  }
}
