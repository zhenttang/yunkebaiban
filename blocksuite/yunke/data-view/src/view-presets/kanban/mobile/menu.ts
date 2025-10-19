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

import { groupTraitKey } from '../../../core/group-by/trait.js';
import type { MobileKanbanViewUILogic } from './kanban-view-ui-logic.js';

export const popCardMenu = (
  ele: PopupTarget,
  groupKey: string,
  cardId: string,
  kanbanViewLogic: MobileKanbanViewUILogic
) => {
  const groupTrait = kanbanViewLogic.view.traitGet(groupTraitKey);
  if (!groupTrait) {
    return;
  }
  popFilterableSimpleMenu(ele, [
    menu.group({
      items: [
        menu.action({
          name: '展开卡片',
          prefix: ExpandFullIcon(),
          select: () => {
            kanbanViewLogic.root.openDetailPanel({
              view: kanbanViewLogic.view,
              rowId: cardId,
            });
          },
        }),
      ],
    }),
    menu.group({
      items: [
        menu.subMenu({
          name: '移动到',
          prefix: ArrowRightBigIcon(),
          options: {
            items:
              groupTrait.groupsDataList$.value
                ?.filter(v => {
                  return v.key !== groupKey;
                })
                .map(group => {
                  return menu.action({
                    name: group.value != null ? group.name$.value : '取消分组',
                    select: () => {
                      groupTrait.moveCardTo(
                        cardId,
                        groupKey,
                        group.key,
                        'start'
                      );
                    },
                  });
                }) ?? [],
          },
        }),
      ],
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
            kanbanViewLogic.view.addCard(
              { before: true, id: cardId },
              groupKey
            );
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
            kanbanViewLogic.view.addCard(
              { before: false, id: cardId },
              groupKey
            );
          },
        }),
      ],
    }),
    menu.group({
      items: [
        menu.action({
          name: '删除卡片',
          class: {
            'delete-item': true,
          },
          prefix: DeleteIcon(),
          select: () => {
            kanbanViewLogic.view.rowsDelete([cardId]);
          },
        }),
      ],
    }),
  ]);
};
