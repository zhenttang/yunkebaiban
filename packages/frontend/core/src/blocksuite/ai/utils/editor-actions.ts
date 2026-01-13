import { WorkspaceImpl } from '@yunke/core/modules/workspace/impls/workspace';
import { defaultImageProxyMiddleware } from '@blocksuite/yunke/shared/adapters';
import { replaceSelectedTextWithBlocksCommand } from '@blocksuite/yunke/shared/commands';
import { isInsideEdgelessEditor } from '@blocksuite/yunke/shared/utils';
import {
  type BlockComponent,
  BlockSelection,
  type EditorHost,
  SurfaceSelection,
  type TextSelection,
} from '@blocksuite/yunke/std';
import {
  type BlockModel,
  type BlockSnapshot,
  Slice,
} from '@blocksuite/yunke/store';
import { Doc as YDoc } from 'yjs';

import {
  insertFromMarkdown,
  markDownToDoc,
  markdownToSnapshot,
} from '../../utils';
import type { YunkeAIPanelWidget } from '../widgets/ai-panel/ai-panel';

const getNoteId = (blockElement: BlockComponent) => {
  let element = blockElement;
  while (element.flavour !== 'yunke:note') {
    if (!element.parentComponent) {
      break;
    }
    element = element.parentComponent;
  }

  return element.model.id;
};

const setBlockSelection = (
  host: EditorHost,
  parent: BlockComponent,
  models: BlockModel[]
) => {
  const selections = models
    .map(model => model.id)
    .map(blockId => host.selection.create(BlockSelection, { blockId }));

  if (isInsideEdgelessEditor(host)) {
    const surfaceElementId = getNoteId(parent);
    const surfaceSelection = host.selection.create(
      SurfaceSelection,
      selections[0].blockId,
      [surfaceElementId],
      true
    );

    selections.push(surfaceSelection);
    host.selection.set(selections);
  } else {
    host.selection.setGroup('note', selections);
  }
};

export const insert = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent,
  below: boolean = true
) => {
  const blockParent = selectBlock.parentComponent;
  if (!blockParent) return;
  const index = blockParent.model.children.findIndex(
    model => model.id === selectBlock.model.id
  );
  const insertIndex = below ? index + 1 : index;

  const { store } = host;
  const models = await insertFromMarkdown(
    host,
    content,
    store,
    blockParent.model.id,
    insertIndex
  );
  await host.updateComplete;
  requestAnimationFrame(() => setBlockSelection(host, blockParent, models));
};

export const insertBelow = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent
) => {
  await insert(host, content, selectBlock, true);
};

export const insertAbove = async (
  host: EditorHost,
  content: string,
  selectBlock: BlockComponent
) => {
  await insert(host, content, selectBlock, false);
};

export const replace = async (
  host: EditorHost,
  content: string,
  firstBlock: BlockComponent,
  selectedModels: BlockModel[],
  textSelection?: TextSelection
) => {
  const firstBlockParent = firstBlock.parentComponent;
  if (!firstBlockParent) return;
  const firstIndex = firstBlockParent.model.children.findIndex(
    model => model.id === firstBlock.model.id
  );

  if (textSelection) {
    const collection = new WorkspaceImpl({
      id: 'AI_REPLACE',
      rootDoc: new YDoc({ guid: 'AI_REPLACE' }),
    });
    collection.meta.initialize();
    const fragmentDoc = collection.createDoc();

    try {
      const fragment = fragmentDoc.getStore();
      fragmentDoc.load();

      const rootId = fragment.addBlock('yunke:page');
      fragment.addBlock('yunke:surface', {}, rootId);
      const noteId = fragment.addBlock('yunke:note', {}, rootId);

      const { snapshot, transformer } = await markdownToSnapshot(
        content,
        fragment,
        host
      );

      if (snapshot) {
        const blockSnapshots = (
          snapshot.content[0].flavour === 'yunke:note'
            ? snapshot.content[0].children
            : snapshot.content
        ) as BlockSnapshot[];

        const blocks = (
          await Promise.all(
            blockSnapshots.map(async blockSnapshot => {
              return await transformer.snapshotToBlock(
                blockSnapshot,
                fragment,
                noteId,
                0
              );
            })
          )
        ).filter(block => block) as BlockModel[];
        host.std.command.exec(replaceSelectedTextWithBlocksCommand, {
          textSelection,
          blocks,
        });
      }
    } finally {
      collection.dispose();
    }
  } else {
    selectedModels.forEach(model => {
      host.store.deleteBlock(model);
    });

    const { store } = host;
    const models = await insertFromMarkdown(
      host,
      content,
      store,
      firstBlockParent.model.id,
      firstIndex
    );

    await host.updateComplete;
    requestAnimationFrame(() =>
      setBlockSelection(host, firstBlockParent, models)
    );
  }
};

export const copyTextAnswer = async (panel: YunkeAIPanelWidget) => {
  const host = panel.host;
  if (!panel.answer) {
    return false;
  }
  return copyText(host, panel.answer);
};

export const copyText = async (host: EditorHost, text: string) => {
  const previewDoc = await markDownToDoc(
    host.std.store.provider,
    host.std.store.schema,
    text,
    [defaultImageProxyMiddleware]
  );
  const models = previewDoc
    .getBlocksByFlavour('yunke:note')
    .map(b => b.model)
    .flatMap(model => model.children);
  const slice = Slice.fromModels(previewDoc, models);
  await host.std.clipboard.copySlice(slice);
  previewDoc.dispose();
  previewDoc.workspace.dispose();
  return true;
};
