import {
  menu,
  popFilterableSimpleMenu,
  type PopupTarget,
} from '@blocksuite/yunke-components/context-menu';
import {
  ArrowRightBigIcon,
  DeleteIcon,
  ExpandFullIcon,
  MoveLeftIcon,
  MoveRightIcon,
} from '@blocksuite/icons/lit';
import { html } from 'lit';

import type { KanbanSelectionController } from './controller/selection.js';
import type { KanbanViewUILogic } from './kanban-view-ui-logic.js';

export const openDetail = (
  kanbanViewLogic: KanbanViewUILogic,
  rowId: string,
  selection: KanbanSelectionController
) => {
  const old = selection.selection;
  selection.selection = undefined;
  kanbanViewLogic.root.openDetailPanel({
    view: selection.view,
    rowId: rowId,
    onClose: () => {
      selection.selection = old;
    },
  });
};

export const popCardMenu = (
  kanbanViewLogic: KanbanViewUILogic,
  ele: PopupTarget,
  rowId: string,
  selection: KanbanSelectionController
) => {
  popFilterableSimpleMenu(ele, [
    menu.action({
      name: '展开卡片',
      prefix: ExpandFullIcon(),
      select: () => {
        openDetail(kanbanViewLogic, rowId, selection);
      },
    }),
    menu.subMenu({
      name: '移动到',
      prefix: ArrowRightBigIcon(),
      options: {
        items:
          selection.view.groupTrait.groupsDataList$.value
            ?.filter(v => {
              const cardSelection = selection.selection;
              if (cardSelection?.selectionType === 'card') {
                return v.key !== cardSelection?.cards[0].groupKey;
              }
              return false;
            })
            .map(group => {
              return menu.action({
                name: group.value != null ? group.name$.value : '取消分组',
                select: () => {
                  selection.moveCard(rowId, group.key);
                },
              });
            }) ?? [],
      },
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: '在前面插入',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveLeftIcon()}
          </div>`,
          select: () => {
            selection.insertRowBefore();
          },
        }),
        menu.action({
          name: '在后面插入',
          prefix: html` <div
            style="transform: rotate(90deg);display:flex;align-items:center;"
          >
            ${MoveRightIcon()}
          </div>`,
          select: () => {
            selection.insertRowAfter();
          },
        }),
      ],
    }),
    menu.group({
      name: '',
      items: [
        menu.action({
          name: '删除卡片',
          class: {
            'delete-item': true,
          },
          prefix: DeleteIcon(),
          select: () => {
            selection.deleteCard();
          },
        }),
      ],
    }),
  ]);
};
