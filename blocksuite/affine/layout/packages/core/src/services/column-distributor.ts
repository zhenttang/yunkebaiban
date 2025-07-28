import type { IColumnDistributor, Block } from '../types/contracts.js';

/**
 * 列分配器实现 - 平衡高度分配算法
 */
export class ColumnDistributor implements IColumnDistributor {
  distributeBlocks(blocks: Block[], columnCount: number): Block[][] {
    if (columnCount <= 0) return [];
    
    const columns: Block[][] = Array.from({ length: columnCount }, () => []);
    const columnHeights = Array(columnCount).fill(0);
    
    // 按估算高度排序（大的优先）
    const sortedBlocks = [...blocks].sort((a, b) => 
      this.estimateBlockHeight(b) - this.estimateBlockHeight(a)
    );
    
    for (const block of sortedBlocks) {
      // 找到高度最小的列
      const minIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[minIndex].push(block);
      columnHeights[minIndex] += this.estimateBlockHeight(block);
    }
    
    return columns;
  }

  redistributeOnModeChange(currentColumns: Block[][], newColumnCount: number): Block[][] {
    const allBlocks = currentColumns.flat().sort((a, b) => a.index - b.index);
    return this.distributeBlocks(allBlocks, newColumnCount);
  }

  moveBlock(blockId: string, targetColumn: number, targetIndex: number, columns: Block[][]): Block[][] {
    const newColumns = columns.map(col => [...col]);
    let movedBlock: Block | null = null;
    
    // 移除block
    for (const column of newColumns) {
      const index = column.findIndex(b => b.id === blockId);
      if (index !== -1) {
        movedBlock = column.splice(index, 1)[0];
        break;
      }
    }
    
    // 插入到目标位置
    if (movedBlock && newColumns[targetColumn]) {
      newColumns[targetColumn].splice(targetIndex, 0, movedBlock);
    }
    
    return newColumns;
  }

  evaluateDistribution(columns: Block[][]): number {
    const heights = columns.map(col => 
      col.reduce((sum, block) => sum + this.estimateBlockHeight(block), 0)
    );
    
    const avg = heights.reduce((sum, h) => sum + h, 0) / heights.length;
    const variance = heights.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / heights.length;
    
    return Math.max(0, 1 - variance / (avg * avg));
  }

  private estimateBlockHeight(block: Block): number {
    const baseHeights = {
      'paragraph': 60, 'heading': 80, 'image': 200,
      'code': 120, 'list': 40, 'table': 300
    };
    return baseHeights[block.type as keyof typeof baseHeights] || 60;
  }
}