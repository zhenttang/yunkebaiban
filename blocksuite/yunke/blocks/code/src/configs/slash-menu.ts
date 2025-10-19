import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';

export const codeSlashMenuConfig: SlashMenuConfig = {
  disableWhen: ({ model }) => {
    return model.flavour === 'yunke:code';
  },
  items: [],
};
