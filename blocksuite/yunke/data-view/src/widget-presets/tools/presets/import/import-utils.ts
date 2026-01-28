import type { DataViewUILogicBase } from '../../../../core/index.js';

export interface ImportResult {
  success: boolean;
  importedCount: number;
  errors: string[];
}

export interface ParsedCSVData {
  headers: string[];
  rows: string[][];
}

/**
 * 解析 CSV 文件内容
 */
export function parseCSV(content: string): ParsedCSVData {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(line => parseCSVLine(line));

  return { headers, rows };
}

/**
 * 解析单行 CSV
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // 转义的引号
        current += '"';
        i += 2;
      } else if (char === '"') {
        // 结束引号
        inQuotes = false;
        i++;
      } else {
        current += char;
        i++;
      }
    } else {
      if (char === '"') {
        // 开始引号
        inQuotes = true;
        i++;
      } else if (char === ',') {
        // 字段分隔符
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
  }

  // 添加最后一个字段
  result.push(current.trim());
  return result;
}

/**
 * 从文件导入 CSV 数据
 */
export async function importFromCSV(
  dataViewLogic: DataViewUILogicBase,
  file: File
): Promise<ImportResult> {
  const errors: string[] = [];
  let importedCount = 0;

  try {
    const content = await readFileAsText(file);
    const { headers, rows } = parseCSV(content);

    if (headers.length === 0) {
      return {
        success: false,
        importedCount: 0,
        errors: ['CSV 文件为空或格式不正确'],
      };
    }

    const view = dataViewLogic.view;
    const properties = view.properties$.value;

    // 建立 CSV 列名到属性 ID 的映射
    const columnMapping = new Map<number, string>();
    headers.forEach((header, index) => {
      const prop = properties.find(
        p => p.name$.value.toLowerCase() === header.toLowerCase()
      );
      if (prop) {
        columnMapping.set(index, prop.id);
      }
    });

    if (columnMapping.size === 0) {
      return {
        success: false,
        importedCount: 0,
        errors: ['CSV 列名与数据视图字段不匹配'],
      };
    }

    // 导入每一行数据
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];
      try {
        // 创建新行
        const newRowId = view.rowAdd('end');
        
        // 填充数据
        columnMapping.forEach((propId, colIndex) => {
          if (colIndex < row.length) {
            const value = row[colIndex];
            const prop = properties.find(p => p.id === propId);
            if (prop) {
              const parsedValue = parseValueForType(value, prop.type$.value);
              if (parsedValue !== undefined) {
                view.cellRawSet(newRowId, propId, parsedValue);
              }
            }
          }
        });

        importedCount++;
      } catch (e) {
        errors.push(`第 ${rowIndex + 2} 行导入失败: ${String(e)}`);
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      errors,
    };
  } catch (e) {
    return {
      success: false,
      importedCount: 0,
      errors: [`文件读取失败: ${String(e)}`],
    };
  }
}

/**
 * 读取文件内容为文本
 */
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * 根据属性类型解析值
 */
function parseValueForType(value: string, propertyType: string): unknown {
  if (!value || value.trim() === '') return undefined;

  const trimmedValue = value.trim();

  switch (propertyType) {
    case 'text':
    case 'rich-text':
    case 'title':
      return trimmedValue;

    case 'number':
    case 'progress':
    case 'rating':
      const num = parseFloat(trimmedValue);
      return isNaN(num) ? undefined : num;

    case 'date':
      const date = Date.parse(trimmedValue);
      return isNaN(date) ? undefined : date;

    case 'checkbox':
      const lower = trimmedValue.toLowerCase();
      if (['true', '是', '1', 'yes', 'y'].includes(lower)) return true;
      if (['false', '否', '0', 'no', 'n'].includes(lower)) return false;
      return undefined;

    case 'url':
      return { url: trimmedValue, title: '' };

    case 'email':
    case 'phone':
      return trimmedValue;

    case 'select':
      return { value: trimmedValue };

    case 'multi-select':
      // 分号或逗号分隔的多选值
      const values = trimmedValue.split(/[;,]/).map(v => ({ value: v.trim() }));
      return values.filter(v => v.value);

    default:
      return trimmedValue;
  }
}

/**
 * 打开文件选择对话框并导入
 */
export function openFileAndImport(
  dataViewLogic: DataViewUILogicBase,
  onComplete?: (result: ImportResult) => void
): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.csv';

  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;

    const result = await importFromCSV(dataViewLogic, file);
    
    if (onComplete) {
      onComplete(result);
    } else {
      // 默认显示结果提示
      if (result.success) {
        console.log(`成功导入 ${result.importedCount} 条记录`);
      } else {
        console.error('导入失败:', result.errors);
      }
    }
  };

  input.click();
}
