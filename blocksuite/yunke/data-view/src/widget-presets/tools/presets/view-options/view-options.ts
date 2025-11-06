import {
  menu,
  type MenuButtonData,
  type MenuConfig,
  popMenu,
  type PopupTarget,
  popupTargetFromElement,
} from '@blocksuite/yunke-components/context-menu';
import { unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import {
  ArrowRightSmallIcon,
  DeleteIcon,
  DuplicateIcon,
  FilterIcon,
  GroupingIcon,
  InfoIcon,
  LayoutIcon,
  MoreHorizontalIcon,
  SortIcon,
} from '@blocksuite/icons/lit';
import { css, html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

import { popPropertiesSetting } from '../../../../core/common/properties.js';
import { filterTraitKey } from '../../../../core/filter/trait.js';
import {
  popGroupSetting,
  popSelectGroupByProperty,
} from '../../../../core/group-by/setting.js';
import { groupTraitKey } from '../../../../core/group-by/trait.js';
import {
  type DataViewUILogicBase,
  emptyFilterGroup,
  popCreateFilter,
  renderUniLit,
} from '../../../../core/index.js';
import { popCreateSort } from '../../../../core/sort/add-sort.js';
import { sortTraitKey } from '../../../../core/sort/manager.js';
import { createSortUtils } from '../../../../core/sort/utils.js';
import { WidgetBase } from '../../../../core/widget/widget-base.js';
import { popFilterRoot } from '../../../quick-setting-bar/filter/root-panel-view.js';
import { popSortRoot } from '../../../quick-setting-bar/sort/root-panel.js';
import type { ChartSingleView } from '../../../../view-presets/chart/chart-view-manager.js';

type ChartType = 'pie' | 'bar' | 'horizontal-bar' | 'stacked-bar' | 'line';

const styles = css`
  .yunke-database-toolbar-item.more-action {
    padding: 2px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    cursor: pointer;
  }

  .yunke-database-toolbar-item.more-action:hover {
    background: var(--yunke-hover-color);
  }

  .yunke-database-toolbar-item.more-action {
    font-size: 20px;
    color: ${unsafeCSSVarV2('icon/primary')};
  }

  .more-action.active {
    background: var(--yunke-hover-color);
  }
`;

export class DataViewHeaderToolsViewOptions extends WidgetBase {
  static override styles = styles;

  clickMoreAction = (e: MouseEvent) => {
    e.stopPropagation();
    this.openMoreAction(popupTargetFromElement(e.currentTarget as HTMLElement));
  };

  openMoreAction = (target: PopupTarget) => {
    popViewOptions(target, this.dataViewLogic);
  };

  override render() {
    if (this.view.readonly$.value) {
      return;
    }
    return html` <div
      class="yunke-database-toolbar-item more-action"
      @click="${this.clickMoreAction}"
    >
      ${MoreHorizontalIcon()}
    </div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'data-view-header-tools-view-options': DataViewHeaderToolsViewOptions;
  }
}
const createSettingMenus = (
  target: PopupTarget,
  dataViewLogic: DataViewUILogicBase,
  reopen: () => void
) => {
  const view = dataViewLogic.view;
  const settingItems: MenuConfig[] = [];
  settingItems.push(
    menu.action({
      name: '属性',
      prefix: InfoIcon(),
      postfix: html` <div style="font-size: 14px;">
          ${view.properties$.value.length} 已显示
        </div>
        ${ArrowRightSmallIcon()}`,
      select: () => {
        popPropertiesSetting(target, {
          view: view,
          onBack: reopen,
        });
      },
    })
  );
  const filterTrait = view.traitGet(filterTraitKey);
  if (filterTrait) {
    const filterCount = filterTrait.filter$.value.conditions.length;
    settingItems.push(
      menu.action({
        name: '过滤器',
        prefix: FilterIcon(),
        postfix: html` <div style="font-size: 14px;">
            ${filterCount === 0
              ? ''
              : filterCount === 1
                ? '1 个过滤器'
                : `${filterCount} 个过滤器`}
          </div>
          ${ArrowRightSmallIcon()}`,
        select: () => {
          if (!filterTrait.filter$.value.conditions.length) {
            popCreateFilter(target, {
              vars: view.vars$,
              onBack: reopen,
              onSelect: filter => {
                filterTrait.filterSet({
                  ...(filterTrait.filter$.value ?? emptyFilterGroup),
                  conditions: [...filterTrait.filter$.value.conditions, filter],
                });
                popFilterRoot(target, {
                  filterTrait: filterTrait,
                  onBack: reopen,
                  dataViewLogic: dataViewLogic,
                });
                dataViewLogic.eventTrace('CreateDatabaseFilter', {});
              },
            });
          } else {
            popFilterRoot(target, {
              filterTrait: filterTrait,
              onBack: reopen,
              dataViewLogic: dataViewLogic,
            });
          }
        },
      })
    );
  }
  const sortTrait = view.traitGet(sortTraitKey);
  if (sortTrait) {
    const sortCount = sortTrait.sortList$.value.length;
    settingItems.push(
      menu.action({
        name: '排序',
        prefix: SortIcon(),
        postfix: html` <div style="font-size: 14px;">
            ${sortCount === 0
              ? ''
              : sortCount === 1
                ? '1 个排序'
                : `${sortCount} 个排序`}
          </div>
          ${ArrowRightSmallIcon()}`,
        select: () => {
          const sortList = sortTrait.sortList$.value;
          const sortUtils = createSortUtils(
            sortTrait,
            dataViewLogic.eventTrace
          );
          if (!sortList.length) {
            popCreateSort(target, {
              sortUtils: sortUtils,
              onBack: reopen,
            });
          } else {
            popSortRoot(target, {
              sortUtils: sortUtils,
              title: {
                text: '排序',
                onBack: reopen,
              },
            });
          }
        },
      })
    );
  }
  const groupTrait = view.traitGet(groupTraitKey);
  if (groupTrait) {
    settingItems.push(
      menu.action({
        name: '分组',
        prefix: GroupingIcon(),
        postfix: html` <div style="font-size: 14px;">
            ${groupTrait.property$.value?.name$.value ?? ''}
          </div>
          ${ArrowRightSmallIcon()}`,
        select: () => {
          const groupBy = groupTrait.property$.value;
          if (!groupBy) {
            popSelectGroupByProperty(target, groupTrait, {
              onSelect: () => popGroupSetting(target, groupTrait, reopen),
              onBack: reopen,
            });
          } else {
            popGroupSetting(target, groupTrait, reopen);
          }
        },
      })
    );
  }
  return settingItems;
};
export const popViewOptions = (
  target: PopupTarget,
  dataViewLogic: DataViewUILogicBase,
  onClose?: () => void
) => {
  const view = dataViewLogic.view;
  const reopen = () => {
    popViewOptions(target, dataViewLogic);
  };
  const items: MenuConfig[] = [];
  items.push(
    menu.input({
      initialValue: view.name$.value,
      placeholder: '视图名称',
      onChange: text => {
        view.nameSet(text);
      },
    })
  );
  items.push(
    menu.group({
      items: [
        menu.action({
          name: '布局',
          postfix: html` <div
              style="font-size: 14px;text-transform: capitalize;"
            >
              ${view.type}
            </div>
            ${ArrowRightSmallIcon()}`,
          select: () => {
            const viewTypes = view.manager.viewMetas.map<MenuConfig>(meta => {
              return menu => {
                if (!menu.search(meta.model.defaultName)) {
                  return;
                }
                const isSelected =
                  meta.type === view.manager.currentView$.value?.type;
                const iconStyle = styleMap({
                  fontSize: '24px',
                  color: isSelected
                    ? 'var(--yunke-text-emphasis-color)'
                    : 'var(--yunke-icon-secondary)',
                });
                const textStyle = styleMap({
                  fontSize: '14px',
                  lineHeight: '22px',
                  color: isSelected
                    ? 'var(--yunke-text-emphasis-color)'
                    : 'var(--yunke-text-secondary-color)',
                });
                const data: MenuButtonData = {
                  content: () => html`
                    <div
                      style="color:var(--yunke-text-emphasis-color);width:100%;display: flex;flex-direction: column;align-items: center;justify-content: center;padding: 6px 16px;white-space: nowrap"
                    >
                      <div style="${iconStyle}">
                        ${renderUniLit(meta.renderer.icon)}
                      </div>
                      <div style="${textStyle}">${meta.model.defaultName}</div>
                    </div>
                  `,
                  select: () => {
                    const id = view.manager.currentViewId$.value;
                    if (!id) {
                      return;
                    }
                    view.manager.viewChangeType(id, meta.type);
                    dataViewLogic.clearSelection();
                  },
                  class: {},
                };
                const containerStyle = styleMap({
                  flex: '1',
                });
                return html` <yunke-menu-button
                  style="${containerStyle}"
                  .data="${data}"
                  .menu="${menu}"
                ></yunke-menu-button>`;
              };
            });
            popMenu(target, {
              options: {
                title: {
                  onBack: reopen,
                  text: '布局',
                },
                items: [
                  menu => {
                    const result = menu.renderItems(viewTypes);
                    if (result.length) {
                      return html` <div style="display: flex">${result}</div>`;
                    }
                    return html``;
                  },
                  // menu.toggleSwitch({
                  //   name: 'Show block icon',
                  //   on: true,
                  //   onChange: value => {
                  //     console.log(value);
                  //   },
                  // }),
                  // menu.toggleSwitch({
                  //   name: 'Show Vertical lines',
                  //   on: true,
                  //   onChange: value => {
                  //     console.log(value);
                  //   },
                  // }),
                ],
              },
            });
          },
          prefix: LayoutIcon(),
        }),
      ],
    })
  );

  // Add Chart View specific settings
  if (view.type === 'chart') {
    const chartView = view as ChartSingleView;
    const chartType = chartView.data$.value?.chartType ?? 'pie';
    const chartTypeLabel = (t: ChartType) =>
      t === 'pie'
        ? '饼图'
        : t === 'bar'
          ? '垂直柱状图'
          : t === 'horizontal-bar'
            ? '水平柱状图'
            : t === 'stacked-bar'
              ? '堆叠柱状图'
              : '折线图';

    items.push(
      menu.group({
        items: [
          menu.subMenu({
            name: '图表类型',
            postfix: html`
              <div
                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
              >
                ${chartTypeLabel(chartType)}
              </div>
            `,
            options: {
              items: [
                menu.group({
                  items: (
                    [
                      ['饼图', 'pie'],
                      ['垂直柱状图', 'bar'],
                      ['水平柱状图', 'horizontal-bar'],
                      ['堆叠柱状图', 'stacked-bar'],
                      ['折线图', 'line'],
                    ] as [string, ChartType][]
                  ).map(([label, type]) =>
                    menu.action({
                      name: label,
                      isSelected: chartType === type,
                      select: () => {
                        chartView.dataUpdate(() => ({ chartType: type }));
                        reopen();
                      },
                    })
                  ),
                }),
              ],
            },
          }),
          ...(chartType === 'pie'
            ? [
                menu.subMenu({
                  name: '显示内容',
                  postfix: html`
                    <div
                      style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
                    >
                      ${chartView.properties$.value.find(
                        (p: any) => p.id === chartView.data$.value?.categoryPropertyId
                      )?.name$.value ?? '无'}
                    </div>
                  `,
                  options: {
                    items: [
                      menu.group({
                        items: chartView.properties$.value.map((prop: any) =>
                          menu.action({
                            name: prop.name$.value,
                            isSelected:
                              prop.id === chartView.data$.value?.categoryPropertyId,
                            select: () => {
                              chartView.dataUpdate(() => ({
                                categoryPropertyId: prop.id,
                              }));
                              reopen();
                            },
                          })
                        ),
                      }),
                    ],
                  },
                }),
              ]
            : []),
          menu.subMenu({
            name: '排序',
            postfix: html`
              <div
                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
              >
                ${
                  {
                    manual: '手动',
                    'status-asc': '状态升序',
                    'status-desc': '状态降序',
                    'count-low-high': '数量低→高',
                    'count-high-low': '数量高→低',
                  }[chartView.data$.value?.sortBy ?? 'count-high-low'] || '数量高→低'
                }
              </div>
            `,
            options: {
              items: [
                menu.group({
                  items: Object.entries({
                    manual: '手动',
                    'status-asc': '状态升序',
                    'status-desc': '状态降序',
                    'count-low-high': '数量低→高',
                    'count-high-low': '数量高→低',
                  }).map(([key, label]) =>
                    menu.action({
                      name: label,
                      isSelected:
                        (chartView.data$.value?.sortBy ?? 'count-high-low') === key,
                      select: () => {
                        chartView.dataUpdate(() => ({
                          sortBy: key as 'manual' | 'status-asc' | 'status-desc' | 'count-low-high' | 'count-high-low',
                        }));
                        reopen();
                      },
                    })
                  ),
                }),
              ],
            },
          }),
          menu.subMenu({
            name: '颜色',
            postfix: html`
              <div
                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
              >
                ${
                  [
                    { id: 'auto', name: '自动' },
                    { id: 'colorful', name: '彩色' },
                    { id: 'colorless', name: '无色' },
                    { id: 'blue', name: '蓝色' },
                    { id: 'yellow', name: '黄色' },
                    { id: 'green', name: '绿色' },
                    { id: 'purple', name: '紫色' },
                    { id: 'teal', name: '青色' },
                    { id: 'orange', name: '橙色' },
                    { id: 'pink', name: '粉色' },
                    { id: 'red', name: '红色' },
                  ].find(c => c.id === (chartView.data$.value?.colorScheme ?? 'auto'))
                    ?.name || '自动'
                }
              </div>
            `,
            options: {
              items: [
                menu.group({
                  items: [
                    { id: 'auto', name: '自动' },
                    { id: 'colorful', name: '彩色' },
                    { id: 'colorless', name: '无色' },
                    { id: 'blue', name: '蓝色' },
                    { id: 'yellow', name: '黄色' },
                    { id: 'green', name: '绿色' },
                    { id: 'purple', name: '紫色' },
                    { id: 'teal', name: '青色' },
                    { id: 'orange', name: '橙色' },
                    { id: 'pink', name: '粉色' },
                    { id: 'red', name: '红色' },
                  ].map(scheme =>
                    menu.action({
                      name: scheme.name,
                      isSelected:
                        (chartView.data$.value?.colorScheme ?? 'auto') === scheme.id,
                      select: () => {
                        chartView.dataUpdate(() => ({
                          colorScheme: scheme.id as 'auto' | 'colorful' | 'colorless' | 'blue' | 'yellow' | 'green' | 'purple' | 'teal' | 'orange' | 'pink' | 'red',
                        }));
                        reopen();
                      },
                    })
                  ),
                }),
              ],
            },
          }),
          menu.subMenu({
            name: '高度',
            postfix: html`
              <div
                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
              >
                ${
                  (chartView.data$.value?.height || 'Medium') === 'Small'
                    ? '小'
                    : (chartView.data$.value?.height || 'Medium') === 'Large'
                      ? '大'
                      : '中'
                }
              </div>
            `,
            options: {
              items: [
                menu.group({
                  items: (
                    [
                      ['小', 'Small'],
                      ['中', 'Medium'],
                      ['大', 'Large'],
                    ] as [string, 'Small' | 'Medium' | 'Large'][]
                  ).map(([label, size]) =>
                    menu.action({
                      name: label,
                      isSelected: (chartView.data$.value?.height || 'Medium') === size,
                      select: () => {
                        chartView.dataUpdate(() => ({ height: size }));
                        reopen();
                      },
                    })
                  ),
                }),
              ],
            },
          }),
          ...(chartType === 'pie'
            ? [
                menu.toggleSwitch({
                  name: '中心显示数值',
                  on: chartView.data$.value?.showValueInCenter !== false,
                  onChange: value => {
                    chartView.dataUpdate(() => ({ showValueInCenter: value }));
                  },
                }),
              ]
            : []),
          menu.toggleSwitch({
            name: '图例',
            on: chartView.data$.value?.showLegend !== false,
            onChange: value => {
              chartView.dataUpdate(() => ({ showLegend: value }));
            },
          }),
          menu.subMenu({
            name: '数据标签',
            postfix: html`
              <div
                style="display:flex;align-items:center;gap:4px;font-size:14px;line-height:20px;color:var(--yunke-text-secondary-color);margin-left:8px;"
              >
                ${
                  {
                    None: '无',
                    Value: '数值',
                    'Value (%)': '数值 (%)',
                  }[chartView.data$.value?.dataLabels || 'Value (%)'] || '数值 (%)'
                }
              </div>
            `,
            options: {
              items: [
                menu.group({
                  items: Object.entries({
                    None: '无',
                    Value: '数值',
                    'Value (%)': '数值 (%)',
                  }).map(([key, label]) =>
                    menu.action({
                      name: label,
                      isSelected:
                        (chartView.data$.value?.dataLabels || 'Value (%)') === key,
                      select: () => {
                        chartView.dataUpdate(() => ({
                          dataLabels: key as 'None' | 'Value' | 'Value (%)',
                        }));
                        reopen();
                      },
                    })
                  ),
                }),
              ],
            },
          }),
          menu.toggleSwitch({
            name: '标题',
            on: chartView.data$.value?.showCaption === true,
            onChange: value => {
              chartView.dataUpdate(() => ({ showCaption: value }));
            },
          }),
        ],
      })
    );
  }

  items.push(
    menu.group({
      items: createSettingMenus(target, dataViewLogic, reopen),
    })
  );
  items.push(
    menu.group({
      items: [
        menu.action({
          name: '复制',
          prefix: DuplicateIcon(),
          select: () => {
            view.duplicate();
          },
        }),
        menu.action({
          name: '删除',
          prefix: DeleteIcon(),
          select: () => {
            view.delete();
          },
          class: { 'delete-item': true },
        }),
      ],
    })
  );
  popMenu(target, {
    options: {
      title: {
        text: '视图设置',
      },
      items,
      onClose: onClose,
    },
    container: document.body,
  });
};
