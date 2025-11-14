import type { ParagraphBlockModel } from '@blocksuite/yunke-model';
import type { BlockModel } from '@blocksuite/store';

import { headingKeys } from '../config.js';
import { isHeadingBlock } from './query.js';

/**
 * 获取标题的层级（1-6）
 */
export function getHeadingLevel(block: ParagraphBlockModel): number {
  const type = block.props.type$.value;
  if (type.startsWith('h')) {
    const level = parseInt(type.substring(1));
    return isNaN(level) ? 0 : level;
  }
  return 0;
}

/**
 * 获取标题控制的范围
 * 从当前标题开始，到下一个同级或更高级标题之前的所有块
 *
 * @param heading - 标题块
 * @param allBlocks - 父容器中的所有块
 * @returns 该标题控制的所有块（包括标题本身）
 *
 * @example
 * 文档结构：
 * H1 标题A
 *   段落1
 *   H2 标题B
 *     段落2
 *   H2 标题C
 * H1 标题D
 *
 * getHeadingControlledBlocks(标题A, allBlocks) 返回：
 * [标题A, 段落1, 标题B, 段落2, 标题C]
 *
 * getHeadingControlledBlocks(标题B, allBlocks) 返回：
 * [标题B, 段落2]
 */
export function getHeadingControlledBlocks(
  heading: ParagraphBlockModel,
  allBlocks: BlockModel[]
): BlockModel[] {
  if (!isHeadingBlock(heading)) {
    return [heading];
  }

  const headingLevel = getHeadingLevel(heading);
  const headingIndex = allBlocks.indexOf(heading);

  if (headingIndex === -1) {
    return [heading];
  }

  const controlledBlocks: BlockModel[] = [heading];

  // 从标题后一个块开始遍历
  for (let i = headingIndex + 1; i < allBlocks.length; i++) {
    const block = allBlocks[i];

    // 如果遇到同级或更高级的标题，停止
    if (isHeadingBlock(block)) {
      const currentLevel = getHeadingLevel(block);
      if (currentLevel <= headingLevel) {
        break;
      }
    }

    // 将块加入控制范围
    controlledBlocks.push(block);
  }

  return controlledBlocks;
}

/**
 * 批量移动块到新位置
 *
 * @param blocks - 要移动的块数组
 * @param targetParent - 目标父块
 * @param targetIndex - 目标位置索引
 */
export function moveBlocksToPosition(
  blocks: BlockModel[],
  targetParent: BlockModel,
  targetIndex: number
): void {
  if (blocks.length === 0) return;

  const store = blocks[0].store;

  // 使用事务确保原子性操作
  store.transact(() => {
    // 1. 先从原位置删除所有块（但不真正删除，只是从父块中移除）
    blocks.forEach(block => {
      const parent = store.getParent(block);
      if (parent) {
        const index = parent.children.indexOf(block);
        if (index !== -1) {
          parent.children.splice(index, 1);
        }
      }
    });

    // 2. 将所有块插入到目标位置
    blocks.forEach((block, i) => {
      targetParent.children.splice(targetIndex + i, 0, block);
    });
  });
}

/**
 * 检查是否可以将标题移动到目标位置
 * 防止将父标题移动到其子标题下面
 *
 * @param headingBlocks - 要移动的块（包含标题和其控制的内容）
 * @param targetBlock - 目标位置的块
 * @returns 是否可以移动
 */
export function canMoveHeadingTo(
  headingBlocks: BlockModel[],
  targetBlock: BlockModel
): boolean {
  // 不能移动到自己控制的范围内
  return !headingBlocks.includes(targetBlock);
}
