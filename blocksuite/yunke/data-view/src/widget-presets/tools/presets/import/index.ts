import {
  menu,
  type MenuConfig,
} from '@blocksuite/yunke-components/context-menu';
import { ImportIcon } from '@blocksuite/icons/lit';

import type { DataViewUILogicBase } from '../../../../core/index.js';
import { openFileAndImport, type ImportResult } from './import-utils.js';

/**
 * 创建导入菜单项
 */
export function createImportMenuItems(
  dataViewLogic: DataViewUILogicBase,
  onComplete?: (result: ImportResult) => void
): MenuConfig {
  return menu.subMenu({
    name: '导入',
    prefix: ImportIcon(),
    options: {
      title: {
        text: '导入数据',
      },
      items: [
        menu.group({
          items: [
            menu.action({
              name: '从 CSV 导入',
              select: () => {
                openFileAndImport(dataViewLogic, (result) => {
                  if (onComplete) {
                    onComplete(result);
                  }
                  // 显示导入结果
                  if (result.success) {
                    alert(`成功导入 ${result.importedCount} 条记录`);
                  } else {
                    alert(`导入完成，成功 ${result.importedCount} 条\n\n错误:\n${result.errors.join('\n')}`);
                  }
                });
              },
            }),
          ],
        }),
        menu.group({
          name: '说明',
          items: [
            menu.action({
              name: 'CSV 文件第一行需要是列标题',
              select: () => {},
              class: { 'hint-item': true },
            }),
            menu.action({
              name: '列标题需与字段名称匹配',
              select: () => {},
              class: { 'hint-item': true },
            }),
          ],
        }),
      ],
    },
  });
}

export { importFromCSV, openFileAndImport, parseCSV, type ImportResult } from './import-utils.js';
