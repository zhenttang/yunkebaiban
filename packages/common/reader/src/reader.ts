import { Container } from '@blocksuite/yunke/global/di';
import type {
  AttachmentBlockModel,
  BookmarkBlockModel,
  EmbedBlockModel,
  ImageBlockModel,
  TableBlockModel,
} from '@blocksuite/yunke/model';
import { YunkeSchemas } from '@blocksuite/yunke/schemas';
import { MarkdownAdapter } from '@blocksuite/yunke/shared/adapters';
import type { YunkeTextAttributes } from '@blocksuite/yunke/shared/types';
import {
  createYProxy,
  type DeltaInsert,
  type DraftModel,
  Schema,
  Transformer,
  type TransformerMiddleware,
  type YBlock,
} from '@blocksuite/yunke/store';
import { uniq } from 'lodash-es';
import {
  Array as YArray,
  type Doc as YDoc,
  Map as YMap,
  Text as YText,
} from 'yjs';

import { getStoreManager } from './bs-store';

const blocksuiteSchema = new Schema();
blocksuiteSchema.register([...YunkeSchemas]);

export interface BlockDocumentInfo {
  docId: string;
  blockId: string;
  content?: string | string[];
  flavour: string;
  blob?: string[];
  refDocId?: string[];
  ref?: string[];
  parentFlavour?: string;
  parentBlockId?: string;
  additional?: {
    databaseName?: string;
    displayMode?: string;
    noteBlockId?: string;
  };
  yblock: YMap<any>;
  markdownPreview?: string;
}

const bookmarkFlavours = new Set([
  'yunke:bookmark',
  'yunke:embed-youtube',
  'yunke:embed-figma',
  'yunke:embed-github',
  'yunke:embed-loom',
]);

function generateMarkdownPreviewBuilder(
  workspaceId: string,
  blocks: BlockDocumentInfo[],
  yRootDoc?: YDoc
) {
  function yblockToDraftModal(yblock: YBlock): DraftModel | null {
    const flavour = yblock.get('sys:flavour') as string;
    const blockSchema = blocksuiteSchema.flavourSchemaMap.get(flavour);
    if (!blockSchema) {
      return null;
    }
    const keys = Array.from(yblock.keys())
      .filter(key => key.startsWith('prop:'))
      .map(key => key.substring(5));

    const props = Object.fromEntries(
      keys.map(key => [key, createYProxy(yblock.get(`prop:${key}`))])
    );

    return {
      props,
      id: yblock.get('sys:id') as string,
      flavour,
      children: [],
      role: blockSchema.model.role,
      version: (yblock.get('sys:version') as number) ?? blockSchema.version,
      keys: Array.from(yblock.keys())
        .filter(key => key.startsWith('prop:'))
        .map(key => key.substring(5)),
    } as unknown as DraftModel;
  }

  const titleMiddleware: TransformerMiddleware = ({ adapterConfigs }) => {
    const pages = yRootDoc?.getMap('meta').get('pages');
    if (!(pages instanceof YArray)) {
      return;
    }
    for (const meta of pages.toArray()) {
      adapterConfigs.set(
        'title:' + meta.get('id'),
        meta.get('title')?.toString() ?? '未命名'
      );
    }
  };

  const baseUrl = `/workspace/${workspaceId}`;

  function getDocLink(docId: string, blockId: string) {
    const searchParams = new URLSearchParams();
    searchParams.set('blockIds', blockId);
    return `${baseUrl}/${docId}?${searchParams.toString()}`;
  }

  const docLinkBaseURLMiddleware: TransformerMiddleware = ({
    adapterConfigs,
  }) => {
    adapterConfigs.set('docLinkBaseUrl', baseUrl);
  };

  const container = new Container();
  getStoreManager()
    .get('store')
    .forEach(ext => {
      ext.setup(container);
    });

  const provider = container.provider();
  const markdownAdapter = new MarkdownAdapter(
    new Transformer({
      schema: blocksuiteSchema,
      blobCRUD: {
        delete: () => Promise.resolve(),
        get: () => Promise.resolve(null),
        list: () => Promise.resolve([]),
        set: () => Promise.resolve(''),
      },
      docCRUD: {
        create: () => {
          throw new Error('未实现');
        },
        get: () => null,
        delete: () => {},
      },
      middlewares: [docLinkBaseURLMiddleware, titleMiddleware],
    }),
    provider
  );

  const markdownPreviewCache = new WeakMap<BlockDocumentInfo, string | null>();

  function trimCodeBlock(markdown: string) {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');
    if (lines.length > 5) {
      return [...lines.slice(0, 4), '...', lines.at(-1), ''].join('\n');
    }
    return [...lines, ''].join('\n');
  }

  function trimParagraph(markdown: string) {
    const lines = markdown.split('\n').filter(line => line.trim() !== '');

    if (lines.length > 3) {
      return [...lines.slice(0, 3), '...', lines.at(-1), ''].join('\n');
    }

    return [...lines, ''].join('\n');
  }

  function getListDepth(block: BlockDocumentInfo) {
    let parentBlockCount = 0;
    let currentBlock: BlockDocumentInfo | undefined = block;
    do {
      currentBlock = blocks.find(
        b => b.blockId === currentBlock?.parentBlockId
      );

      // 到达根块。不计算它。
      if (!currentBlock || currentBlock.flavour !== 'yunke:list') {
        break;
      }
      parentBlockCount++;
    } while (currentBlock);
    return parentBlockCount;
  }

  // 仅适用于列表块
  function indentMarkdown(markdown: string, depth: number) {
    if (depth <= 0) {
      return markdown;
    }

    return (
      markdown
        .split('\n')
        .map(line => '    '.repeat(depth) + line)
        .join('\n') + '\n'
    );
  }

  const generateDatabaseMarkdownPreview = (block: BlockDocumentInfo) => {
    const isDatabaseBlock = (block: BlockDocumentInfo) => {
      return block.flavour === 'yunke:database';
    };

    const model = yblockToDraftModal(block.yblock);

    if (!model) {
      return null;
    }

    let dbBlock: BlockDocumentInfo | null = null;

    if (isDatabaseBlock(block)) {
      dbBlock = block;
    } else {
      const parentBlock = blocks.find(b => b.blockId === block.parentBlockId);

      if (parentBlock && isDatabaseBlock(parentBlock)) {
        dbBlock = parentBlock;
      }
    }

    if (!dbBlock) {
      return null;
    }

    const url = getDocLink(block.docId, dbBlock.blockId);
    const title = dbBlock.additional?.databaseName;

    return `[database · ${title || 'Untitled'}][](${url})\n`;
  };

  const generateImageMarkdownPreview = (block: BlockDocumentInfo) => {
    const isImageModel = (
      model: DraftModel | null
    ): model is DraftModel<ImageBlockModel> => {
      return model?.flavour === 'yunke:image';
    };

    const model = yblockToDraftModal(block.yblock);

    if (!isImageModel(model)) {
      return null;
    }

    const info = ['an image block'];

    if (model.props.sourceId) {
      info.push(`file id ${model.props.sourceId}`);
    }

    if (model.props.caption) {
      info.push(`with caption ${model.props.caption}`);
    }

    return info.join(', ') + '\n';
  };

  const generateEmbedMarkdownPreview = (block: BlockDocumentInfo) => {
    const isEmbedModel = (
      model: DraftModel | null
    ): model is DraftModel<EmbedBlockModel> => {
      return (
        model?.flavour === 'yunke:embed-linked-doc' ||
        model?.flavour === 'yunke:embed-synced-doc'
      );
    };

    const draftModel = yblockToDraftModal(block.yblock);
    if (!isEmbedModel(draftModel)) {
      return null;
    }

    const url = getDocLink(block.docId, draftModel.id);

    return `[](${url})\n`;
  };

  const generateLatexMarkdownPreview = (block: BlockDocumentInfo) => {
    let content =
      typeof block.content === 'string'
        ? block.content.trim()
        : block.content?.join('').trim();

    content = content?.split('\n').join(' ') ?? '';

    return `LaTeX, with value ${content}\n`;
  };

  const generateBookmarkMarkdownPreview = (block: BlockDocumentInfo) => {
    const isBookmarkModel = (
      model: DraftModel | null
    ): model is DraftModel<BookmarkBlockModel> => {
      return bookmarkFlavours.has(model?.flavour ?? '');
    };

    const draftModel = yblockToDraftModal(block.yblock);
    if (!isBookmarkModel(draftModel)) {
      return null;
    }
    const title = draftModel.props.title;
    const url = draftModel.props.url;
    return `[${title}](${url})\n`;
  };

  const generateAttachmentMarkdownPreview = (block: BlockDocumentInfo) => {
    const isAttachmentModel = (
      model: DraftModel | null
    ): model is DraftModel<AttachmentBlockModel> => {
      return model?.flavour === 'yunke:attachment';
    };

    const draftModel = yblockToDraftModal(block.yblock);
    if (!isAttachmentModel(draftModel)) {
      return null;
    }

    return `[${draftModel.props.name}](${draftModel.props.sourceId})\n`;
  };

  const generateTableMarkdownPreview = (block: BlockDocumentInfo) => {
    const isTableModel = (
      model: DraftModel | null
    ): model is DraftModel<TableBlockModel> => {
      return model?.flavour === 'yunke:table';
    };

    const draftModel = yblockToDraftModal(block.yblock);
    if (!isTableModel(draftModel)) {
      return null;
    }

    const url = getDocLink(block.docId, draftModel.id);

    return `[table][](${url})\n`;
  };

  const generateMarkdownPreview = async (block: BlockDocumentInfo) => {
    if (markdownPreviewCache.has(block)) {
      return markdownPreviewCache.get(block);
    }
    const flavour = block.flavour;
    let markdown: string | null = null;

    if (
      flavour === 'yunke:paragraph' ||
      flavour === 'yunke:list' ||
      flavour === 'yunke:code'
    ) {
      const draftModel = yblockToDraftModal(block.yblock);
      markdown =
        block.parentFlavour === 'yunke:database'
          ? generateDatabaseMarkdownPreview(block)
          : ((draftModel ? await markdownAdapter.fromBlock(draftModel) : null)
              ?.file ?? null);

      if (markdown) {
        if (flavour === 'yunke:code') {
          markdown = trimCodeBlock(markdown);
        } else if (flavour === 'yunke:paragraph') {
          markdown = trimParagraph(markdown);
        }
      }
    } else if (flavour === 'yunke:database') {
      markdown = generateDatabaseMarkdownPreview(block);
    } else if (
      flavour === 'yunke:embed-linked-doc' ||
      flavour === 'yunke:embed-synced-doc'
    ) {
      markdown = generateEmbedMarkdownPreview(block);
    } else if (flavour === 'yunke:attachment') {
      markdown = generateAttachmentMarkdownPreview(block);
    } else if (flavour === 'yunke:image') {
      markdown = generateImageMarkdownPreview(block);
    } else if (flavour === 'yunke:surface' || flavour === 'yunke:page') {
      // 跳过
    } else if (flavour === 'yunke:latex') {
      markdown = generateLatexMarkdownPreview(block);
    } else if (bookmarkFlavours.has(flavour)) {
      markdown = generateBookmarkMarkdownPreview(block);
    } else if (flavour === 'yunke:table') {
      markdown = generateTableMarkdownPreview(block);
    } else {
      console.warn(`unknown flavour: ${flavour}`);
    }

    if (markdown && flavour === 'yunke:list') {
      const blockDepth = getListDepth(block);
      markdown = indentMarkdown(markdown, Math.max(0, blockDepth));
    }

    markdownPreviewCache.set(block, markdown);
    return markdown;
  };

  return generateMarkdownPreview;
}

// 移除列表第一行的缩进
// 例如：
// ```
//     - list item 1
//       - list item 2
// ```
// 变成
// ```
// - list item 1
//   - list item 2
// ```
function unindentMarkdown(markdown: string) {
  const lines = markdown.split('\n');
  const res: string[] = [];
  let firstListFound = false;
  let baseIndent = 0;

  for (let current of lines) {
    const indent = current.match(/^\s*/)?.[0]?.length ?? 0;

    if (indent > 0) {
      if (!firstListFound) {
        // 对于第一个列表项，移除所有缩进
        firstListFound = true;
        baseIndent = indent;
        current = current.trimStart();
      } else {
        // 对于后续列表项，保持相对缩进
        current =
          ' '.repeat(Math.max(0, indent - baseIndent)) + current.trimStart();
      }
    }

    res.push(current);
  }

  return res.join('\n');
}

export async function readAllBlocksFromDoc({
  ydoc,
  rootYDoc,
  spaceId,
  maxSummaryLength,
}: {
  ydoc: YDoc;
  rootYDoc?: YDoc;
  spaceId: string;
  maxSummaryLength?: number;
}): Promise<
  | {
      blocks: BlockDocumentInfo[];
      title: string;
      summary: string;
    }
  | undefined
> {
  let docTitle = '';
  let summary = '';
  maxSummaryLength ??= 1000;
  const blockDocuments: BlockDocumentInfo[] = [];

  const generateMarkdownPreview = generateMarkdownPreviewBuilder(
    spaceId,
    blockDocuments,
    rootYDoc
  );

  const blocks = ydoc.getMap<any>('blocks');
  if (blocks.size === 0) {
    return undefined;
  }

  // 构建父级映射以快速查找
  // 对于每个块，记录其父级id
  const parentMap: Record<string, string | null> = {};
  for (const [id, block] of blocks.entries()) {
    const children = block.get('sys:children') as YArray<string> | undefined;
    if (children instanceof YArray && children.length) {
      for (const child of children) {
        parentMap[child] = id;
      }
    }
  }

  // 找到满足谓词的最近块
  const nearest = (
    blockId: string,
    predicate: (block: YMap<any>) => boolean
  ) => {
    let current: string | null = blockId;
    while (current) {
      const block = blocks.get(current);
      if (block && predicate(block)) {
        return block;
      }
      current = parentMap[current] ?? null;
    }
    return null;
  };

  const nearestByFlavour = (blockId: string, flavour: string) =>
    nearest(blockId, block => block.get('sys:flavour') === flavour);

  let rootBlockId: string | null = null;
  for (const block of blocks.values()) {
    const flavour = block.get('sys:flavour')?.toString();
    const blockId = block.get('sys:id')?.toString();
    if (flavour === 'yunke:page' && blockId) {
      rootBlockId = blockId;
    }
  }

  if (!rootBlockId) {
    return undefined;
  }

  const queue: { parent?: string; id: string }[] = [{ id: rootBlockId }];
  const visited = new Set<string>(); // 避免循环

  const pushChildren = (id: string, block: YMap<any>) => {
    const children = block.get('sys:children');
    if (children instanceof YArray && children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        const childId = children.get(i);
        if (childId && !visited.has(childId)) {
          queue.push({ parent: id, id: childId });
          visited.add(childId);
        }
      }
    }
  };

  // #region 第一次循环 - 生成块基本信息
  while (queue.length) {
    const next = queue.pop();
    if (!next) {
      break;
    }

    const { parent: parentBlockId, id: blockId } = next;
    const block = blockId ? blocks.get(blockId) : null;
    const parentBlock = parentBlockId ? blocks.get(parentBlockId) : null;
    if (!block) {
      break;
    }

    const flavour = block.get('sys:flavour')?.toString();
    const parentFlavour = parentBlock?.get('sys:flavour')?.toString();
    const noteBlock = nearestByFlavour(blockId, 'yunke:note');

    // 显示模式：
    // - both: page and edgeless -> 退回到page
    // - page: 仅page -> page
    // - edgeless: 仅edgeless -> edgeless
    // - undefined: edgeless（假设它是edgeless上的普通元素）
    let displayMode = noteBlock?.get('prop:displayMode') ?? 'edgeless';

    if (displayMode === 'both') {
      displayMode = 'page';
    }

    const noteBlockId: string | undefined = noteBlock
      ?.get('sys:id')
      ?.toString();

    pushChildren(blockId, block);

    const commonBlockProps = {
      docId: ydoc.guid,
      flavour,
      blockId,
      yblock: block,
      additional: { displayMode, noteBlockId },
    };

    if (flavour === 'yunke:page') {
      docTitle = block.get('prop:title').toString();
      blockDocuments.push({ ...commonBlockProps, content: docTitle });
    } else if (
      flavour === 'yunke:paragraph' ||
      flavour === 'yunke:list' ||
      flavour === 'yunke:code'
    ) {
      const text = block.get('prop:text') as YText;

      if (!text) {
        continue;
      }

      const deltas: DeltaInsert<YunkeTextAttributes>[] = text.toDelta();
      const refs = uniq(
        deltas
          .flatMap(delta => {
            if (
              delta.attributes &&
              delta.attributes.reference &&
              delta.attributes.reference.pageId
            ) {
              const { pageId: refDocId, params = {} } =
                delta.attributes.reference;
              return {
                refDocId,
                ref: JSON.stringify({ docId: refDocId, ...params }),
              };
            }
            return null;
          })
          .filter(ref => !!ref)
      );

      const databaseName =
        flavour === 'yunke:paragraph' && parentFlavour === 'yunke:database' // 如果块是数据库行
          ? parentBlock?.get('prop:title')?.toString()
          : undefined;

      blockDocuments.push({
        ...commonBlockProps,
        content: text.toString(),
        ...refs.reduce<{ refDocId: string[]; ref: string[] }>(
          (prev, curr) => {
            prev.refDocId.push(curr.refDocId);
            prev.ref.push(curr.ref);
            return prev;
          },
          { refDocId: [], ref: [] }
        ),
        parentFlavour,
        parentBlockId,
        additional: { ...commonBlockProps.additional, databaseName },
      });

      if (maxSummaryLength > 0) {
        summary += text.toString();
        maxSummaryLength -= text.length;
      }
    } else if (
      flavour === 'yunke:embed-linked-doc' ||
      flavour === 'yunke:embed-synced-doc'
    ) {
      const pageId = block.get('prop:pageId');
      if (typeof pageId === 'string') {
        // 引用信息
        const params = block.get('prop:params') ?? {};
        blockDocuments.push({
          ...commonBlockProps,
          refDocId: [pageId],
          ref: [JSON.stringify({ docId: pageId, ...params })],
          parentFlavour,
          parentBlockId,
        });
      }
    } else if (flavour === 'yunke:attachment' || flavour === 'yunke:image') {
      const blobId = block.get('prop:sourceId');
      if (typeof blobId === 'string') {
        blockDocuments.push({
          ...commonBlockProps,
          blob: [blobId],
          parentFlavour,
          parentBlockId,
        });
      }
    } else if (flavour === 'yunke:surface') {
      const texts = [];

      const elementsObj = block.get('prop:elements');
      if (
        !(
          elementsObj instanceof YMap &&
          elementsObj.get('type') === '$blocksuite:internal:native$'
        )
      ) {
        continue;
      }
      const elements = elementsObj.get('value') as YMap<any>;
      if (!(elements instanceof YMap)) {
        continue;
      }

      for (const element of elements.values()) {
        if (!(element instanceof YMap)) {
          continue;
        }
        const text = element.get('text') as YText;
        if (!text) {
          continue;
        }

        texts.push(text.toString());
      }

      blockDocuments.push({
        ...commonBlockProps,
        content: texts,
        parentFlavour,
        parentBlockId,
      });
    } else if (flavour === 'yunke:database') {
      const texts = [];
      const columnsObj = block.get('prop:columns');
      const databaseTitle = block.get('prop:title');
      if (databaseTitle instanceof YText) {
        texts.push(databaseTitle.toString());
      }
      if (columnsObj instanceof YArray) {
        for (const column of columnsObj) {
          if (!(column instanceof YMap)) {
            continue;
          }
          if (typeof column.get('name') === 'string') {
            texts.push(column.get('name'));
          }

          const data = column.get('data');
          if (!(data instanceof YMap)) {
            continue;
          }
          const options = data.get('options');
          if (!(options instanceof YArray)) {
            continue;
          }
          for (const option of options) {
            if (!(option instanceof YMap)) {
              continue;
            }
            const value = option.get('value');
            if (typeof value === 'string') {
              texts.push(value);
            }
          }
        }
      }

      blockDocuments.push({
        ...commonBlockProps,
        content: texts,
        additional: {
          ...commonBlockProps.additional,
          databaseName: databaseTitle?.toString(),
        },
      });
    } else if (flavour === 'yunke:latex') {
      blockDocuments.push({
        ...commonBlockProps,
        content: block.get('prop:latex')?.toString() ?? '',
      });
    } else if (flavour === 'yunke:table') {
      const contents = Array.from<string>(block.keys())
        .map(key => {
          if (key.startsWith('prop:cells.') && key.endsWith('.text')) {
            return block.get(key)?.toString() ?? '';
          }
          return '';
        })
        .filter(Boolean);
      blockDocuments.push({
        ...commonBlockProps,
        content: contents,
      });
    } else if (bookmarkFlavours.has(flavour)) {
      blockDocuments.push({ ...commonBlockProps });
    }
  }
  // #endregion

  // #region 第二次循环 - 生成markdown预览
  const TARGET_PREVIEW_CHARACTER = 500;
  const TARGET_PREVIOUS_BLOCK = 1;
  const TARGET_FOLLOW_BLOCK = 4;
  for (const block of blockDocuments) {
    if (block.ref?.length) {
      const target = block;

      // 应该只生成属于同一个yunke:note的markdown预览
      const noteBlock = nearestByFlavour(block.blockId, 'yunke:note');

      const sameNoteBlocks = noteBlock
        ? blockDocuments.filter(
            candidate =>
              nearestByFlavour(candidate.blockId, 'yunke:note') === noteBlock
          )
        : [];

      // 只为引用块生成markdown预览
      let previewText = (await generateMarkdownPreview(target)) ?? '';
      let previousBlock = 0;
      let followBlock = 0;
      let previousIndex = sameNoteBlocks.findIndex(
        block => block.blockId === target.blockId
      );
      let followIndex = previousIndex;

      while (
        !(
          (
            previewText.length > TARGET_PREVIEW_CHARACTER || // 如果预览文本达到限制则停止
            ((previousBlock >= TARGET_PREVIOUS_BLOCK || previousIndex < 0) &&
              (followBlock >= TARGET_FOLLOW_BLOCK ||
                followIndex >= sameNoteBlocks.length))
          ) // 如果没有更多块，或者预览块达到限制则停止
        )
      ) {
        if (previousBlock < TARGET_PREVIOUS_BLOCK) {
          previousIndex--;
          const block =
            previousIndex >= 0 ? sameNoteBlocks.at(previousIndex) : null;
          const markdown = block ? await generateMarkdownPreview(block) : null;
          if (
            markdown &&
            !previewText.startsWith(
              markdown
            ) /* 一个小技巧，跳过具有相同内容的块 */
          ) {
            previewText = markdown + '\n' + previewText;
            previousBlock++;
          }
        }

        if (followBlock < TARGET_FOLLOW_BLOCK) {
          followIndex++;
          const block = sameNoteBlocks.at(followIndex);
          const markdown = block ? await generateMarkdownPreview(block) : null;
          if (
            markdown &&
            !previewText.endsWith(
              markdown
            ) /* 一个小技巧，跳过具有相同内容的块 */
          ) {
            previewText = previewText + '\n' + markdown;
            followBlock++;
          }
        }
      }

      block.markdownPreview = unindentMarkdown(previewText);
    }
  }
  // #endregion

  return {
    blocks: blockDocuments,
    title: docTitle,
    summary,
  };
}

/**
 * Get all docs from the root doc
 */
export function readAllDocsFromRootDoc(
  rootDoc: YDoc,
  options?: {
    includeTrash?: boolean;
  }
) {
  const docs = rootDoc.getMap('meta').get('pages') as
    | YArray<YMap<any>>
    | undefined;
  const availableDocs = new Map<string, { title: string | undefined }>();

  if (docs) {
    for (const page of docs) {
      const docId = page.get('id');

      if (typeof docId !== 'string') {
        continue;
      }

      const inTrash = page.get('trash') ?? false;
      const title = page.get('title');

      if (!options?.includeTrash && inTrash) {
        continue;
      }

      availableDocs.set(docId, { title });
    }
  }

  return availableDocs;
}

export function readAllDocIdsFromRootDoc(
  rootDoc: YDoc,
  options?: {
    includeTrash?: boolean;
  }
) {
  const docs = rootDoc.getMap('meta').get('pages') as
    | YArray<YMap<any>>
    | undefined;
  const docIds = new Set<string>();
  if (docs) {
    for (const page of docs) {
      const docId = page.get('id');
      if (typeof docId !== 'string') {
        continue;
      }
      const inTrash = page.get('trash') ?? false;
      if (!options?.includeTrash && inTrash) {
        continue;
      }
      docIds.add(docId);
    }
  }
  return Array.from(docIds);
}
