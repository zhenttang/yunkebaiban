import {
  formatBlockCommand,
  type TextFormatConfig,
  textFormatConfigs,
} from '@blocksuite/yunke-inline-preset';
import {
  type TextConversionConfig,
  textConversionConfigs,
} from '@blocksuite/yunke-rich-text';
import { isInsideBlockByFlavour } from '@blocksuite/yunke-shared/utils';
import {
  getFavoriteItems,
  getRecentItems,
  type SlashMenuActionItem,
  type SlashMenuConfig,
  SlashMenuConfigExtension,
  type SlashMenuItem,
} from '@blocksuite/yunke-widget-slash-menu';
import { HeadingsIcon } from '@blocksuite/icons/lit';
import { BlockSelection } from '@blocksuite/std';

import { updateBlockType } from '../commands';
import { tooltips } from './tooltips';

const noteSlashMenuConfig: SlashMenuConfig = {
  items: ctx => {
    // 🔥 每次调用重置索引
    let basicIndex = 0;

    // 🔥 生成基础菜单项映射表（用于查找最近使用的项）
    const allItems: Record<string, SlashMenuActionItem> = {};

    const basicItems = textConversionConfigs
      .filter(i => i.type && ['h1', 'h2', 'h3', 'text'].includes(i.type))
      .map(config => {
        const item = createConversionItem(config, `1_Basic@${basicIndex++}`);
        allItems[item.name] = item;
        return item;
      });

    const headingsSubmenu = textConversionConfigs
      .filter(i => i.type && ['h4', 'h5', 'h6'].includes(i.type))
      .map(config => {
        const item = createConversionItem(config);
        allItems[item.name] = item;
        return item;
      });

    const codeItems = textConversionConfigs
      .filter(i => i.flavour === 'yunke:code')
      .map(config => {
        const item = createConversionItem(config, `1_Basic@${basicIndex++}`);
        allItems[item.name] = item;
        return item;
      });

    const dividerQuoteItems = textConversionConfigs
      .filter(i => i.type && ['divider', 'quote'].includes(i.type))
      .map(config => {
        const item = {
          ...createConversionItem(config, `1_Basic@${basicIndex++}`),
          when: ({ model }) =>
            model.store.schema.flavourSchemaMap.has(config.flavour) &&
            !isInsideBlockByFlavour(model.store, model, 'yunke:edgeless-text'),
        } satisfies SlashMenuActionItem;
        allItems[item.name] = item;
        return item;
      });

    const listItems = textConversionConfigs
      .filter(i => i.flavour === 'yunke:list')
      .map((config, index) => {
        const item = createConversionItem(config, `2_List@${index++}`);
        allItems[item.name] = item;
        return item;
      });

    const styleItems = textFormatConfigs
      .filter(i => !['Code', 'Link'].includes(i.name))
      .map((config, index) => {
        const item = createTextFormatItem(config, `3_Style@${index++}`);
        allItems[item.name] = item;
        return item;
      });

    // 🔥 生成最近使用组
    const recentItemsData = getRecentItems();
    const recentMenuItems: SlashMenuActionItem[] = [];

    for (const recentData of recentItemsData) {
      const item = allItems[recentData.name];
      if (item) {
        // 克隆并修改 group 为最近使用组
        recentMenuItems.push({
          ...item,
          group: `-1_Recent@${recentMenuItems.length}`,
        });
      }
    }

    // 🔥 生成收藏组
    const favoriteItemNames = getFavoriteItems();
    const favoriteMenuItems: SlashMenuActionItem[] = [];

    for (const name of favoriteItemNames) {
      const item = allItems[name];
      if (item) {
        favoriteMenuItems.push({
          ...item,
          group: `0_Favorites@${favoriteMenuItems.length}`,
        });
      }
    }

    return [
      ...recentMenuItems,
      ...favoriteMenuItems,
      ...basicItems,
      {
        name: '其他标题',
        icon: HeadingsIcon(),
        group: `1_Basic@${basicIndex++}`,
        subMenu: headingsSubmenu,
      },
      ...codeItems,
      ...dividerQuoteItems,
      ...listItems,
      ...styleItems,
    ];
  },
};

function createConversionItem(
  config: TextConversionConfig,
  group?: SlashMenuItem['group']
): SlashMenuActionItem {
  const { name, description, icon, flavour, type } = config;
  return {
    name,
    group,
    description,
    icon,
    tooltip: tooltips[name],
    when: ({ model }) => model.store.schema.flavourSchemaMap.has(flavour),
    action: ({ std }) => {
      std.command.exec(updateBlockType, {
        flavour,
        props: { type },
      });
    },
  };
}

function createTextFormatItem(
  config: TextFormatConfig,
  group?: SlashMenuItem['group']
): SlashMenuActionItem {
  const { name, icon, id, action } = config;
  return {
    name,
    icon,
    group,
    tooltip: tooltips[name],
    action: ({ std, model }) => {
      const { host } = std;

      if (model.text?.length !== 0) {
        std.command.exec(formatBlockCommand, {
          blockSelections: [
            std.selection.create(BlockSelection, {
              blockId: model.id,
            }),
          ],
          styles: { [id]: true },
        });
      } else {
        // like format bar when the line is empty
        action(host);
      }
    },
  };
}

export const NoteSlashMenuConfigExtension = SlashMenuConfigExtension(
  'yunke:note',
  noteSlashMenuConfig
);
