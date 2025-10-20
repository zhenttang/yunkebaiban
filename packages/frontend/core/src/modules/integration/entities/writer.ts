import { getStoreManager } from '@yunke/core/blocksuite/manager/store';
import { MarkdownTransformer } from '@blocksuite/yunke/widgets/linked-doc';
import { Entity } from '@toeverything/infra';

import type { TagService } from '../../tag';
import {
  getYUNKEWorkspaceSchema,
  type WorkspaceService,
} from '../../workspace';

export class IntegrationWriter extends Entity {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly tagService: TagService
  ) {
    super();
  }

  public async writeDoc(options: {
    /**
     * Title of the doc
     */
    title?: string;
    /**
     * Markdown string
     */
    content: string;
    /**
     * Comment of the markdown content
     */
    comment?: string | null;
    /**
     * Doc id, if not provided, a new doc will be created
     */
    docId?: string;
    /**
     * Update strategy, default is `override`
     */
    updateStrategy?: 'override' | 'append';
    /**
     * Tags to apply to the doc
     */
    tags?: string[];
  }) {
    const {
      title,
      content,
      comment,
      docId,
      tags,
      updateStrategy = 'override',
    } = options;

    const workspace = this.workspaceService.workspace;
    let markdown = comment ? `${content}\n\n---\n\n${comment}` : content;

    let finalDocId: string;
    if (!docId) {
      const newDocId = await MarkdownTransformer.importMarkdownToDoc({
        collection: workspace.docCollection,
        schema: getYUNKEWorkspaceSchema(),
        markdown,
        fileName: title,
        extensions: getStoreManager().config.init().value.get('store'),
      });

      if (!newDocId) throw new Error('创建新文档失败');
      finalDocId = newDocId;
    } else {
      const collection = workspace.docCollection;

      const doc = collection.getDoc(docId)?.getStore();
      if (!doc) throw new Error('文档未找到');

      if (updateStrategy === 'override') {
        const pageBlock = doc.getBlocksByFlavour('yunke:page')[0];
        // remove all children of the page block
        pageBlock.model.children.forEach(child => {
          doc.deleteBlock(child);
        });
        // add a new note block
        const noteBlockId = doc.addBlock('yunke:note', {}, pageBlock.id);
        // import the markdown to the note block
        await MarkdownTransformer.importMarkdownToBlock({
          doc,
          blockId: noteBlockId,
          markdown,
          extensions: getStoreManager().config.init().value.get('store'),
        });
      } else if (updateStrategy === 'append') {
        const pageBlockId = doc.getBlocksByFlavour('yunke:page')[0]?.id;
        const blockId = doc.addBlock('yunke:note', {}, pageBlockId);
        await MarkdownTransformer.importMarkdownToBlock({
          doc,
          blockId,
          markdown: `---\n${markdown}`,
          extensions: getStoreManager().config.init().value.get('store'),
        });
      } else {
        throw new Error('无效的更新策略');
      }
      finalDocId = doc.id;
    }
    await this.applyTags(finalDocId, tags);
    return finalDocId;
  }

  public async applyTags(docId: string, tags?: string[]) {
    if (!tags?.length) return;
    tags.forEach(tag => {
      this.tagService.tagList.tagByTagId$(tag).value?.tag(docId);
    });
  }
}
