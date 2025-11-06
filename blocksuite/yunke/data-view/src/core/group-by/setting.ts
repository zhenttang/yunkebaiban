import {
  menu,
  type MenuConfig,
  type MenuOptions,
  popMenu,
  type PopupTarget,
} from '@blocksuite/yunke-components/context-menu';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { DeleteIcon, InvisibleIcon, ViewIcon } from '@blocksuite/icons/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { computed } from '@preact/signals-core';
import { css, html, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { KanbanSingleView } from '../../view-presets/kanban/kanban-view-manager.js';
import { TableSingleView } from '../../view-presets/table/table-view-manager.js';
import { dataViewCssVariable } from '../common/css-variable.js';
import { renderUniLit } from '../utils/uni-component/uni-component.js';
import { dragHandler } from '../utils/wc-dnd/dnd-context.js';
import { defaultActivators } from '../utils/wc-dnd/sensors/index.js';
import {
  createSortContext,
  sortable,
} from '../utils/wc-dnd/sort/sort-context.js';
import { verticalListSortingStrategy } from '../utils/wc-dnd/sort/strategies/index.js';
import { getGroupByService } from './matcher.js';
import type { GroupTrait } from './trait.js';
import type { GroupRenderProps } from './types.js';

const dateModeLabel = (key?: string) => {
  switch (key) {
    case 'date-relative':
      return '相对日期';
    case 'date-day':
      return '按天';
    case 'date-week-mon':
    case 'date-week-sun':
      return '按周';
    case 'date-month':
      return '按月';
    case 'date-year':
      return '按年';
    default:
      return '';
  }
};

export class GroupSetting extends SignalWatcher(
  WithDisposable(ShadowlessElement)
) {
  static override styles = css`
    data-view-group-setting {
      display: flex;
      flex-direction: column;
      gap: 4px;
      ${unsafeCSS(dataViewCssVariable())};
    }

    .group-item {
      display: flex;
      padding: 4px 12px;
      position: relative;
      cursor: grab;
    }

    .group-item-drag-bar {
      width: 4px;
      height: 12px;
      border-radius: 1px;
      background-color: #efeff0;
      position: absolute;
      left: 4px;
      top: 0;
      bottom: 0;
      margin: auto;
    }

    .group-item:hover .group-item-drag-bar {
      background-color: #c0bfc1;
    }
  `;

  @property({ attribute: false })
  accessor groupTrait!: GroupTrait;

  groups$ = computed(() => {
    return this.groupTrait.groupsDataListAll$.value;
  });

  sortContext = createSortContext({
    activators: defaultActivators,
    container: this,
    onDragEnd: evt => {
      const over = evt.over;
      const activeId = evt.active.id;
      const groups = this.groups$.value;
      if (over && over.id !== activeId && groups) {
        const activeIndex = groups.findIndex(data => data?.key === activeId);
        const overIndex = groups.findIndex(data => data?.key === over.id);

        this.groupTrait.moveGroupTo(
          activeId,
          activeIndex > overIndex
            ? {
                before: true,
                id: over.id,
              }
            : {
                before: false,
                id: over.id,
              }
        );
      }
    },
    modifiers: [
      ({ transform }) => {
        return {
          ...transform,
          x: 0,
        };
      },
    ],
    items: computed(() => {
      return (
        this.groupTrait.groupsDataListAll$.value?.map(
          v => v?.key ?? 'default key'
        ) ?? []
      );
    }),
    strategy: verticalListSortingStrategy,
  });

  override connectedCallback() {
    super.connectedCallback();
    this._disposables.addFromEvent(this, 'pointerdown', e => {
      e.stopPropagation();
    });
  }

  protected override render(): unknown {
    const groups = this.groupTrait.groupsDataListAll$.value;
    if (!groups) {
      return;
    }
    const map = this.groupTrait.groupDataMap$.value;
    const isAllShowed = map
      ? Object.keys(map).every(k => !this.groupTrait.isGroupHidden(k))
      : true;
    const clickChangeAll = () => {
      if (!map) return;
      Object.keys(map).forEach(key => {
        this.groupTrait.setGroupHide(key, isAllShowed);
      });
    };

    return html`
      <div style="padding: 7px 0;">
        <div
          style="padding: 0 4px; font-size: 12px;color: var(--yunke-text-secondary-color);line-height: 20px;display: flex;justify-content: space-between;align-items: center;"
        >
          <span>分组</span>
          <div
            style="cursor: pointer;font-size: 12px;color: var(--yunke-text-emphasis-color);"
            @click="${clickChangeAll}"
          >
            ${isAllShowed ? '隐藏全部' : '显示全部'}
          </div>
        </div>
        <div></div>
      </div>
      <div
        style="display:flex;flex-direction: column;gap: 4px;"
        class="group-sort-setting"
      >
        ${repeat(
          groups,
          group => group?.key ?? 'default key',
          group => {
            const type = group.property.dataType$.value;
            if (!type) return;
            const props: GroupRenderProps = {
              group,
              readonly: true,
            };
            const hide = group.hide$.value;
            return html` <div
              ${sortable(group.key)}
              ${dragHandler(group.key)}
              class="dv-hover dv-round-4 group-item"
              style="${hide ? 'opacity: 0.5;' : ''}"
            >
              <div class="group-item-drag-bar"></div>
              <div
                style="padding: 0 4px;position:relative;pointer-events: none;max-width: 330px;flex: 1;"
              >
                ${renderUniLit(group.view, props)}
                <div
                  style="position:absolute;left: 0;top: 0;right: 0;bottom: 0;"
                ></div>
              </div>
              <div
                style="cursor: pointer;padding: 4px;"
                @click="${(e: MouseEvent) => {
                  e.stopPropagation();
                  group.hideSet(!hide);
                }}"
              >
                ${hide ? InvisibleIcon() : ViewIcon()}
              </div>
            </div>`;
          }
        )}
      </div>
    `;
  }

  @query('.group-sort-setting')
  accessor groupContainer!: HTMLElement;
}

export const selectGroupByProperty = (
  group: GroupTrait,
  ops?: {
    onSelect?: (id?: string) => void;
    onClose?: () => void;
    onBack?: () => void;
  }
): MenuOptions => {
  const view = group.view;
  return {
    onClose: ops?.onClose,
    title: {
      text: '分组依据',
      onBack: ops?.onBack,
    },
    items: [
      menu.group({
        items: view.propertiesRaw$.value
          .filter(property => {
            if (property.type$.value === 'title') {
              return false;
            }
            const dataType = property.dataType$.value;
            if (!dataType) {
              return false;
            }
            const groupByService = getGroupByService(view.manager.dataSource);
            return !!groupByService?.matcher.match(dataType);
          })
          .map<MenuConfig>(property => {
            return menu.action({
              name: property.name$.value,
              isSelected: group.property$.value?.id === property.id,
              prefix: html` <uni-lit .uni="${property.icon}"></uni-lit>`,
              select: () => {
                group.changeGroup(property.id);
                ops?.onSelect?.(property.id);
              },
            });
          }),
      }),
      menu.group({
        items: [
          menu.action({
            prefix: DeleteIcon(),
            hide: () =>
              view instanceof KanbanSingleView || group.property$.value == null,
            class: { 'delete-item': true },
            name: '移除分组',
            select: () => {
              group.changeGroup(undefined);
              ops?.onSelect?.();
            },
          }),
        ],
      }),
    ],
  };
};
export const popSelectGroupByProperty = (
  target: PopupTarget,
  group: GroupTrait,
  ops?: {
    onSelect?: () => void;
    onClose?: () => void;
    onBack?: () => void;
  }
) => {
  popMenu(target, {
    options: selectGroupByProperty(group, ops),
  });
};
export const popGroupSetting = (
  target: PopupTarget,
  group: GroupTrait,
  onBack: () => void
) => {
  const view = group.view;
  const groupProperty = group.property$.value;
  if (groupProperty == null) {
    return;
  }
  const type = groupProperty.type$.value;
  if (!type) {
    return;
  }
  const icon = groupProperty.icon;
  const menuHandler = popMenu(target, {
    options: {
      title: {
        text: '分组',
        onBack: onBack,
      },
      items: [
        menu.group({
          items: [
            menu.subMenu({
              name: '分组依据',
              postfix: html`
                <div
                  style="display:flex;align-items:center;gap: 4px;font-size: 12px;line-height: 20px;color: var(--yunke-text-secondary-color);margin-right: 4px;margin-left: 8px;"
                  class="dv-icon-16"
                >
                  ${renderUniLit(icon, {})} ${groupProperty.name$.value}
                </div>
              `,
              label: () => html`
                <div style="color: var(--yunke-text-secondary-color);">
                  分组依据
                </div>
              `,
              options: selectGroupByProperty(group, {
                onSelect: () => {
                  menuHandler.close();
                  popGroupSetting(target, group, onBack);
                },
              }),
            }),
          ],
        }),
        ...(type === 'date'
          ? [
              menu.group({
                items: [
                  menu.dynamic(() => [
                    menu.subMenu({
                      name: '日期分组',
                      postfix: html`
                        <div
                          style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:30px;"
                        >
                          ${dateModeLabel(group.groupInfo$.value?.config.name)}
                        </div>
                      `,
                      options: {
                        items: [
                          menu.dynamic(() =>
                            (
                              [
                                ['相对日期', 'date-relative'],
                                ['按天', 'date-day'],
                                [
                                  '按周',
                                  group.groupInfo$.value?.config.name ===
                                  'date-week-mon'
                                    ? 'date-week-mon'
                                    : 'date-week-sun',
                                ],
                                ['按月', 'date-month'],
                                ['按年', 'date-year'],
                              ] as [string, string][]
                            ).map(
                              ([label, key]): MenuConfig =>
                                menu.action({
                                  name: label,
                                  isSelected:
                                    group.groupInfo$.value?.config.name === key,
                                  select: () => {
                                    group.changeGroupMode(key);
                                  },
                                })
                            )
                          ),
                        ],
                      },
                    }),
                  ]),
                ],
              }),
              ...(group.groupInfo$.value?.config.name?.startsWith('date-week')
                ? [
                    menu.group({
                      items: [
                        menu.dynamic(() => [
                          menu.subMenu({
                            name: '周起始日',
                            postfix: html`
                              <div
                                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
                              >
                                ${
                                  group.groupInfo$.value?.config.name ===
                                  'date-week-mon'
                                    ? '周一'
                                    : '周日'
                                }
                              </div>
                            `,
                            options: {
                              items: [
                                menu.dynamic(() =>
                                  (
                                    [
                                      ['周一', 'date-week-mon'],
                                      ['周日', 'date-week-sun'],
                                    ] as [string, string][]
                                  ).map(([label, key]) =>
                                    menu.action({
                                      name: label,
                                      isSelected:
                                        group.groupInfo$.value?.config.name ===
                                        key,
                                      select: () => {
                                        group.changeGroupMode(key);
                                      },
                                    })
                                  )
                                ),
                              ],
                            },
                          }),
                        ]),
                      ],
                    }),
                  ]
                : []),
              menu.group({
                items: [
                  menu.dynamic(() => [
                    menu.subMenu({
                      name: '排序',
                      postfix: html`
                        <div
                          style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
                        >
                          ${group.sortAsc$.value ? '从旧到新' : '从新到旧'}
                        </div>
                      `,
                      options: {
                        items: [
                          menu.dynamic(() => [
                            menu.action({
                              name: '从旧到新',
                              isSelected: group.sortAsc$.value,
                              select: () => {
                                group.setDateSortOrder(true);
                              },
                            }),
                            menu.action({
                              name: '从新到旧',
                              isSelected: !group.sortAsc$.value,
                              select: () => {
                                group.setDateSortOrder(false);
                              },
                            }),
                          ]),
                        ],
                      },
                    }),
                  ]),
                ],
              }),
              menu.group({
                items: [
                  menu.action({
                    name: '隐藏空分组',
                    isSelected: group.hideEmpty$.value,
                    select: () => {
                      group.setHideEmpty(!group.hideEmpty$.value);
                    },
                  }),
                ],
              }),
            ]
          : []),
        menu.group({
          items: [
            menu =>
              html` <data-view-group-setting
                @mouseenter="${() => menu.closeSubMenu()}"
                .groupTrait="${group}"
                .columnId="${groupProperty.id}"
              ></data-view-group-setting>`,
          ],
        }),
        menu.group({
          items: [
            menu.action({
              name: '移除分组',
              prefix: DeleteIcon(),
              class: { 'delete-item': true },
              hide: () => !(view instanceof TableSingleView),
              select: () => {
                group.changeGroup(undefined);
              },
            }),
          ],
        }),
      ],
    },
  });
};
