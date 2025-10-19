import { openSingleFileWith } from '@blocksuite/yunke-shared/utils';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { ExportToPdfIcon, FileIcon } from '@blocksuite/icons/lit';

import { addSiblingAttachmentBlocks } from '../utils';
import { AttachmentTooltip, PDFTooltip } from './tooltips';

export const attachmentSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: '附件',
      description: '将文件附加到文档。',
      icon: FileIcon(),
      tooltip: {
        figure: AttachmentTooltip,
        caption: 'Attachment',
      },
      searchAlias: ['file'],
      group: '4_Content & Media@3',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:attachment'),
      action: ({ std, model }) => {
        (async () => {
          const file = await openSingleFileWith();
          if (!file) return;

          await addSiblingAttachmentBlocks(std, [file], model);
          if (model.text?.length === 0) {
            std.store.deleteBlock(model);
          }
        })().catch(console.error);
      },
    },
    {
      name: 'PDF',
      description: '上传PDF到文档。',
      icon: ExportToPdfIcon(),
      tooltip: {
        figure: PDFTooltip,
        caption: 'PDF',
      },
      group: '4_Content & Media@4',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:attachment'),
      action: ({ std, model }) => {
        (async () => {
          const file = await openSingleFileWith();
          if (!file) return;

          await addSiblingAttachmentBlocks(std, [file], model);
          if (model.text?.length === 0) {
            std.store.deleteBlock(model);
          }
        })().catch(console.error);
      },
    },
  ],
};
