export { PageLayoutMode, type DocLayoutConfig } from '../types/contracts.js';

/**
 * 配置数据实用工具
 */
export class LayoutConfigUtils {
  static createDefaultConfig(docId: string) {
    return {
      docId, layoutMode: 'normal' as const, columnWidths: [1],
      responsive: true, lastModified: Date.now(), version: '1.0.0'
    };
  }

  static validateConfig(config: any): boolean {
    return !!(config?.docId && config?.layoutMode && config?.columnWidths);
  }

  static normalizeColumnWidths(widths: number[]): number[] {
    const sum = widths.reduce((a, b) => a + b, 0);
    return sum > 0 ? widths.map(w => w / sum) : [1];
  }
}