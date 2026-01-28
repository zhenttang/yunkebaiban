import {
  menu,
  type MenuConfig,
  type PopupTarget,
  popMenu,
} from '@blocksuite/yunke-components/context-menu';
import { ExportIcon } from '@blocksuite/icons/lit';

import type { DataViewUILogicBase } from '../../../../core/index.js';
import { exportToCSV, exportToJSON } from './export-utils.js';

/**
 * 创建导出菜单项
 */
export function createExportMenuItems(
  target: PopupTarget,
  dataViewLogic: DataViewUILogicBase,
  onBack?: () => void
): MenuConfig {
  return menu.subMenu({
    name: '导出',
    prefix: ExportIcon(),
    options: {
      title: {
        text: '导出数据',
        onBack: onBack,
      },
      items: [
        menu.group({
          items: [
            menu.action({
              name: '导出为 CSV',
              select: () => {
                exportToCSV(dataViewLogic);
              },
            }),
            menu.action({
              name: '导出为 JSON',
              select: () => {
                exportToJSON(dataViewLogic);
              },
            }),
          ],
        }),
      ],
    },
  });
}

/**
 * 弹出导出菜单
 */
export function popExportMenu(
  target: PopupTarget,
  dataViewLogic: DataViewUILogicBase
): void {
  popMenu(target, {
    options: {
      title: {
        text: '导出数据',
      },
      items: [
        menu.group({
          items: [
            menu.action({
              name: '导出为 CSV',
              select: () => {
                exportToCSV(dataViewLogic);
              },
            }),
            menu.action({
              name: '导出为 JSON',
              select: () => {
                exportToJSON(dataViewLogic);
              },
            }),
          ],
        }),
      ],
    },
  });
}

export { exportToCSV, exportToJSON } from './export-utils.js';
