import type { DataViewUILogicBase } from '../../../../core/index.js';

/**
 * 将数据视图导出为 CSV 格式
 */
export function exportToCSV(dataViewLogic: DataViewUILogicBase, filename?: string): void {
  const view = dataViewLogic.view;
  const properties = view.properties$.value;
  const rows = view.rows$.value;

  // 构建 CSV 表头
  const headers = properties.map(prop => escapeCSVField(prop.name$.value));
  
  // 构建 CSV 数据行
  const dataRows = rows.map(rowId => {
    return properties.map(prop => {
      const rawValue = view.cellRawGet(rowId, prop.id);
      const stringValue = formatCellValueForCSV(rawValue, prop.type$.value);
      return escapeCSVField(stringValue);
    });
  });

  // 组合 CSV 内容
  const csvContent = [
    headers.join(','),
    ...dataRows.map(row => row.join(','))
  ].join('\n');

  // 添加 BOM 以支持中文在 Excel 中的显示
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });

  // 触发下载
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${view.name$.value || '数据导出'}_${formatDate(new Date())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 转义 CSV 字段（处理逗号、引号、换行）
 */
function escapeCSVField(value: string): string {
  if (!value) return '';
  
  // 如果包含逗号、引号或换行，需要用引号包裹
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    // 将内部的引号转义为两个引号
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * 格式化单元格值为 CSV 字符串
 */
function formatCellValueForCSV(value: unknown, propertyType: string): string {
  if (value == null) return '';

  switch (propertyType) {
    case 'text':
    case 'rich-text':
    case 'title':
      return String(value);

    case 'number':
    case 'progress':
    case 'rating':
      return String(value);

    case 'date':
      if (typeof value === 'number') {
        return new Date(value).toLocaleDateString('zh-CN');
      }
      return String(value);

    case 'date-range':
      if (typeof value === 'object' && value !== null) {
        const range = value as { start?: number; end?: number };
        const start = range.start ? new Date(range.start).toLocaleDateString('zh-CN') : '';
        const end = range.end ? new Date(range.end).toLocaleDateString('zh-CN') : '';
        return `${start} - ${end}`;
      }
      return '';

    case 'checkbox':
      return value ? '是' : '否';

    case 'select':
      if (typeof value === 'object' && value !== null && 'value' in value) {
        return String((value as { value: string }).value);
      }
      return String(value);

    case 'multi-select':
      if (Array.isArray(value)) {
        return value.map(v => {
          if (typeof v === 'object' && v !== null && 'value' in v) {
            return (v as { value: string }).value;
          }
          return String(v);
        }).join('; ');
      }
      return '';

    case 'url':
      if (typeof value === 'object' && value !== null && 'url' in value) {
        return (value as { url: string }).url;
      }
      return String(value);

    case 'email':
    case 'phone':
      return String(value);

    case 'person':
      if (Array.isArray(value)) {
        return value.map(p => (p as { name: string }).name).join('; ');
      }
      if (typeof value === 'object' && value !== null && 'name' in value) {
        return (value as { name: string }).name;
      }
      return '';

    case 'relation':
      if (Array.isArray(value)) {
        return value.map(r => (r as { displayValue: string }).displayValue).join('; ');
      }
      return '';

    case 'attachment':
      if (Array.isArray(value)) {
        return value.map(a => (a as { name: string }).name).join('; ');
      }
      return '';

    case 'created-time':
    case 'modified-time':
      if (typeof value === 'number') {
        return new Date(value).toLocaleString('zh-CN');
      }
      return '';

    case 'created-by':
    case 'modified-by':
      if (typeof value === 'object' && value !== null && 'name' in value) {
        return (value as { name: string }).name;
      }
      return '';

    case 'formula':
      return String(value);

    default:
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

/**
 * 格式化日期为文件名友好的格式
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hour}${minute}`;
}

/**
 * 将数据视图导出为 JSON 格式
 */
export function exportToJSON(dataViewLogic: DataViewUILogicBase, filename?: string): void {
  const view = dataViewLogic.view;
  const properties = view.properties$.value;
  const rows = view.rows$.value;

  const data = rows.map(rowId => {
    const record: Record<string, unknown> = {};
    properties.forEach(prop => {
      const name = prop.name$.value;
      const value = view.cellRawGet(rowId, prop.id);
      record[name] = value;
    });
    return record;
  });

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${view.name$.value || '数据导出'}_${formatDate(new Date())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
