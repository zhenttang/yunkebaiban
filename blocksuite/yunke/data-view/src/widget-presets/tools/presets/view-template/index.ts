import {
  menu,
  type MenuConfig,
  popMenu,
  type PopupTarget,
} from '@blocksuite/yunke-components/context-menu';
import { TemplateIcon, PlusIcon, SaveIcon } from '@blocksuite/icons/lit';

import type { DataViewUILogicBase } from '../../../../core/index.js';
import { getTemplateManager } from './template-manager.js';
import { PRESET_VIEW_TEMPLATES } from './template-types.js';

/**
 * 创建模板子菜单
 */
export function createTemplateMenuItems(
  target: PopupTarget,
  dataViewLogic: DataViewUILogicBase,
  onApplyTemplate?: () => void
): MenuConfig {
  const templateManager = getTemplateManager();
  const currentViewType = dataViewLogic.view.type;
  
  // 获取适用于当前视图类型的模板
  const applicableTemplates = templateManager.getTemplatesByViewType(currentViewType);
  const customTemplates = templateManager.getCustomTemplates().filter(
    t => t.viewType === currentViewType
  );

  return menu.subMenu({
    name: '模板',
    prefix: TemplateIcon(),
    options: {
      title: {
        text: '视图模板',
      },
      items: [
        // 保存为模板
        menu.group({
          name: '操作',
          items: [
            menu.action({
              name: '保存为模板',
              prefix: SaveIcon(),
              select: () => {
                const templateName = prompt('请输入模板名称:', `${dataViewLogic.view.name$.value} 模板`);
                if (templateName) {
                  const description = prompt('请输入模板描述（可选）:');
                  templateManager.createTemplateFromView(
                    dataViewLogic,
                    templateName,
                    description || undefined
                  );
                  alert('模板保存成功！');
                }
              },
            }),
          ],
        }),
        // 预设模板
        ...(applicableTemplates.length > 0
          ? [
              menu.group({
                name: '预设模板',
                items: applicableTemplates
                  .filter(t => t.isPreset)
                  .map(template =>
                    menu.action({
                      name: template.name,
                      select: () => {
                        if (templateManager.applyTemplate(dataViewLogic, template.id)) {
                          onApplyTemplate?.();
                          alert(`已应用模板: ${template.name}`);
                        } else {
                          alert('应用模板失败');
                        }
                      },
                    })
                  ),
              }),
            ]
          : []),
        // 自定义模板
        ...(customTemplates.length > 0
          ? [
              menu.group({
                name: '我的模板',
                items: customTemplates.map(template =>
                  menu.action({
                    name: template.name,
                    select: () => {
                      if (templateManager.applyTemplate(dataViewLogic, template.id)) {
                        onApplyTemplate?.();
                        alert(`已应用模板: ${template.name}`);
                      } else {
                        alert('应用模板失败');
                      }
                    },
                  })
                ),
              }),
            ]
          : []),
      ],
    },
  });
}

/**
 * 弹出模板选择菜单（用于新建视图时）
 */
export function popTemplateSelector(
  target: PopupTarget,
  onSelect: (templateId: string) => void
): void {
  const templateManager = getTemplateManager();
  const allTemplates = templateManager.getAllTemplates();

  // 按视图类型分组
  const groupedTemplates: Record<string, typeof allTemplates> = {};
  allTemplates.forEach(t => {
    const key = t.viewType;
    if (!groupedTemplates[key]) {
      groupedTemplates[key] = [];
    }
    groupedTemplates[key].push(t);
  });

  const viewTypeLabels: Record<string, string> = {
    table: '表格视图',
    kanban: '看板视图',
    calendar: '日历视图',
    gantt: '甘特图',
    chart: '图表视图',
  };

  const items: MenuConfig[] = [];

  Object.entries(groupedTemplates).forEach(([viewType, templates]) => {
    items.push(
      menu.group({
        name: viewTypeLabels[viewType] || viewType,
        items: templates.map(template =>
          menu.action({
            name: template.name,
            select: () => onSelect(template.id),
          })
        ),
      })
    );
  });

  popMenu(target, {
    options: {
      title: {
        text: '选择模板',
      },
      items,
    },
  });
}

export { getTemplateManager, ViewTemplateManager } from './template-manager.js';
export type { ViewTemplateConfig, ViewTemplateData } from './template-types.js';
