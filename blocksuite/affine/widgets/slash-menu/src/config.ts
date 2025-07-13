import { toast } from '@blocksuite/affine-components/toast';
import type {
  ListBlockModel,
  ParagraphBlockModel,
} from '@blocksuite/affine-model';
import { insertContent } from '@blocksuite/affine-rich-text';
import {
  ArrowDownBigIcon,
  ArrowUpBigIcon,
  CopyIcon,
  DeleteIcon,
  DualLinkIcon,
  NowIcon,
  TodayIcon,
  TomorrowIcon,
  YesterdayIcon,
} from '@blocksuite/icons/lit';
import { type DeltaInsert, Slice, Text } from '@blocksuite/store';

import { slashMenuToolTips } from './tooltips';
import type { SlashMenuConfig } from './types';
import { formatDate, formatTime } from './utils';

export const defaultSlashMenuConfig: SlashMenuConfig = {
  items: () => {
    const now = new Date();
    const tomorrow = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return [
      {
        name: '今天',
        icon: TodayIcon(),
        tooltip: slashMenuToolTips['Today'],
        description: formatDate(now),
        group: '6_Date@0',
        action: ({ std, model }) => {
          insertContent(std, model, formatDate(now));
        },
      },
      {
        name: '明天',
        icon: TomorrowIcon(),
        tooltip: slashMenuToolTips['Tomorrow'],
        description: formatDate(tomorrow),
        group: '6_Date@1',
        action: ({ std, model }) => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          insertContent(std, model, formatDate(tomorrow));
        },
      },
      {
        name: '昨天',
        icon: YesterdayIcon(),
        tooltip: slashMenuToolTips['Yesterday'],
        description: formatDate(yesterday),
        group: '6_Date@2',
        action: ({ std, model }) => {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          insertContent(std, model, formatDate(yesterday));
        },
      },
      {
        name: '现在',
        icon: NowIcon(),
        tooltip: slashMenuToolTips['Now'],
        description: formatTime(now),
        group: '6_Date@3',
        action: ({ std, model }) => {
          insertContent(std, model, formatTime(now));
        },
      },
      {
        name: '上移',
        description: '将此行向上移动。',
        icon: ArrowUpBigIcon(),
        tooltip: slashMenuToolTips['Move Up'],
        group: '8_Actions@0',
        action: ({ std, model }) => {
          const { host } = std;
          const previousSiblingModel = host.store.getPrev(model);
          if (!previousSiblingModel) return;

          const parentModel = host.store.getParent(previousSiblingModel);
          if (!parentModel) return;

          host.store.moveBlocks(
            [model],
            parentModel,
            previousSiblingModel,
            true
          );
        },
      },
      {
        name: '下移',
        description: '将此行向下移动。',
        icon: ArrowDownBigIcon(),
        tooltip: slashMenuToolTips['Move Down'],
        group: '8_Actions@1',
        action: ({ std, model }) => {
          const { host } = std;
          const nextSiblingModel = host.store.getNext(model);
          if (!nextSiblingModel) return;

          const parentModel = host.store.getParent(nextSiblingModel);
          if (!parentModel) return;

          host.store.moveBlocks([model], parentModel, nextSiblingModel, false);
        },
      },
      {
        name: '复制',
        description: '将此行复制到剪贴板。',
        icon: CopyIcon(),
        tooltip: slashMenuToolTips['Copy'],
        group: '8_Actions@2',
        action: ({ std, model }) => {
          const slice = Slice.fromModels(std.store, [model]);

          std.clipboard
            .copy(slice)
            .then(() => {
              toast(std.host, '已复制到剪贴板');
            })
            .catch(e => {
              console.error(e);
            });
        },
      },
      {
        name: '复制行',
        description: '创建此行的副本。',
        icon: DualLinkIcon(),
        tooltip: slashMenuToolTips['Copy'],
        group: '8_Actions@3',
        action: ({ std, model }) => {
          if (!model.text || !(model.text instanceof Text)) {
            console.error("无法复制没有文本的块");
            return;
          }
          const { host } = std;
          const parent = host.store.getParent(model);
          if (!parent) {
            console.error(
              '复制块失败！未找到父节点: ' +
                model.id +
                '|' +
                model.flavour
            );
            return;
          }
          const index = parent.children.indexOf(model);

          // FIXME: this clone is not correct
          host.store.addBlock(
            model.flavour,
            {
              type: (model as ParagraphBlockModel).props.type,
              text: new Text(
                (
                  model as ParagraphBlockModel
                ).props.text.toDelta() as DeltaInsert[]
              ),
              checked: (model as ListBlockModel).props.checked,
            },
            host.store.getParent(model),
            index
          );
        },
      },
      {
        name: '删除',
        description: '永久移除此行。',
        searchAlias: ['remove'],
        icon: DeleteIcon(),
        tooltip: slashMenuToolTips['Delete'],
        group: '8_Actions@4',
        action: ({ std, model }) => {
          std.host.store.deleteBlock(model);
        },
      },
    ];
  },
};
