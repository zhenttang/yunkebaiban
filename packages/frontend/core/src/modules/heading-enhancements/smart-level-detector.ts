import type { ParagraphBlockModel } from '@blocksuite/yunke-model';
import type { BlockModel } from '@blocksuite/store';

export interface LevelIssue {
  type: 'level_skip' | 'too_deep' | 'inconsistent' | 'orphaned';
  message: string;
  suggestedLevel?: number;
  suggestedAction?: string;
}

export interface LevelSuggestion {
  currentLevel: string;
  suggestedLevel: string;
  reason: string;
  confidence: number; // 0-1 置信度
}

export interface HeadingAdjustment {
  blockId: string;
  currentLevel: number;
  suggestedLevel: number;
  reason: string;
  autoApply: boolean;
}

export interface HeadingContext {
  id: string;
  text: string;
  level: number;
  index: number;
  parentId?: string;
  children: HeadingContext[];
}

/**
 * 智能标题等级检测器
 * 分析文档结构，自动检测并建议标题等级调整
 */
export class SmartHeadingLevelDetector {
  private headingLevelMap = new Map<string, number>();
  private documentStructure: HeadingContext[] = [];

  /**
   * 从文档中提取所有标题
   */
  extractHeadings(doc: BlockModel): HeadingContext[] {
    const headings: HeadingContext[] = [];
    
    const traverse = (block: BlockModel, index: number = 0) => {
      if (this.isHeadingBlock(block)) {
        const level = this.getHeadingLevel(block);
        headings.push({
          id: block.id,
          text: this.getHeadingText(block),
          level,
          index,
          children: []
        });
      }
      
      block.children.forEach((child, childIndex) => {
        traverse(child, index + childIndex + 1);
      });
    };
    
    traverse(doc);
    return headings;
  }

  /**
   * 构建文档结构树
   */
  buildStructure(headings: HeadingContext[]): HeadingContext[] {
    const root: HeadingContext[] = [];
    const stack: HeadingContext[] = [];
    
    for (const heading of headings) {
      // 找到正确的父级
      while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        root.push(heading);
      } else {
        const parent = stack[stack.length - 1];
        parent.children.push(heading);
        heading.parentId = parent.id;
      }
      
      stack.push(heading);
    }
    
    return root;
  }

  /**
   * 分析并生成等级调整建议
   */
  analyzeAndSuggestAdjustments(doc: BlockModel): HeadingAdjustment[] {
    const headings = this.extractHeadings(doc);
    const structure = this.buildStructure(headings);
    this.documentStructure = structure;
    
    const adjustments: HeadingAdjustment[] = [];
    
    // 检测跳级问题
    adjustments.push(...this.detectLevelSkips(headings));
    
    // 检测过深层级
    adjustments.push(...this.detectTooDeepLevels(headings));
    
    // 检测不一致的结构
    adjustments.push(...this.detectInconsistentStructure(structure));
    
    // 检测孤立标题
    adjustments.push(...this.detectOrphanedHeadings(structure));
    
    return adjustments;
  }

  /**
   * 检测单个标题的等级问题
   */
  detectLevelIssues(currentBlock: ParagraphBlockModel): LevelIssue[] {
    const issues: LevelIssue[] = [];
    const currentLevel = this.getHeadingLevel(currentBlock);
    
    if (currentLevel === 0) return issues; // 不是标题块
    
    // 检查前一个标题
    const previousHeading = this.findPreviousHeading(currentBlock);
    if (previousHeading) {
      const prevLevel = this.getHeadingLevel(previousHeading);
      const levelDiff = currentLevel - prevLevel;
      
      // 检测跳级问题
      if (levelDiff > 1) {
        issues.push({
          type: 'level_skip',
          message: `建议使用 h${prevLevel + 1} 而不是 h${currentLevel}，避免跳级`,
          suggestedLevel: prevLevel + 1
        });
      }
    }
    
    // 检测层级过深
    if (currentLevel > 4) {
      issues.push({
        type: 'too_deep',
        message: `标题层级过深（h${currentLevel}），建议重新组织结构`,
        suggestedLevel: Math.min(currentLevel, 4),
        suggestedAction: 'restructure'
      });
    }
    
    // 检测孤立标题（没有同级或子级标题）
    if (this.isOrphanedHeading(currentBlock)) {
      issues.push({
        type: 'orphaned',
        message: '该标题下没有内容或子标题，考虑合并或删除',
        suggestedAction: 'merge_or_delete'
      });
    }
    
    return issues;
  }

  /**
   * 生成等级建议
   */
  generateLevelSuggestion(currentBlock: ParagraphBlockModel): LevelSuggestion | null {
    const issues = this.detectLevelIssues(currentBlock);
    if (issues.length === 0) return null;
    
    const primaryIssue = issues[0];
    const currentLevel = this.getHeadingLevel(currentBlock);
    
    if (primaryIssue.suggestedLevel) {
      return {
        currentLevel: `h${currentLevel}`,
        suggestedLevel: `h${primaryIssue.suggestedLevel}`,
        reason: primaryIssue.message,
        confidence: this.calculateConfidence(primaryIssue, currentBlock)
      };
    }
    
    return null;
  }

  /**
   * 自动应用等级调整
   */
  applyLevelAdjustment(block: ParagraphBlockModel, suggestedLevel: number): void {
    const newType = `h${suggestedLevel}` as any;
    
    // 更新块的类型
    block.doc.updateBlock(block, {
      type: newType
    });
    
    // 记录调整历史
    this.recordAdjustment(block.id, this.getHeadingLevel(block), suggestedLevel);
  }

  /**
   * 检测跳级问题
   */
  private detectLevelSkips(headings: HeadingContext[]): HeadingAdjustment[] {
    const adjustments: HeadingAdjustment[] = [];
    
    for (let i = 1; i < headings.length; i++) {
      const current = headings[i];
      const previous = headings[i - 1];
      
      const levelDiff = current.level - previous.level;
      
      if (levelDiff > 1) {
        adjustments.push({
          blockId: current.id,
          currentLevel: current.level,
          suggestedLevel: previous.level + 1,
          reason: `避免从 h${previous.level} 跳到 h${current.level}`,
          autoApply: true
        });
      }
    }
    
    return adjustments;
  }

  /**
   * 检测过深层级
   */
  private detectTooDeepLevels(headings: HeadingContext[]): HeadingAdjustment[] {
    const adjustments: HeadingAdjustment[] = [];
    
    for (const heading of headings) {
      if (heading.level > 4) {
        adjustments.push({
          blockId: heading.id,
          currentLevel: heading.level,
          suggestedLevel: 4,
          reason: `标题层级过深，建议最多使用到 h4`,
          autoApply: false
        });
      }
    }
    
    return adjustments;
  }

  /**
   * 检测不一致的结构
   */
  private detectInconsistentStructure(structure: HeadingContext[]): HeadingAdjustment[] {
    const adjustments: HeadingAdjustment[] = [];
    
    const traverse = (nodes: HeadingContext[], expectedLevel: number = 1) => {
      for (const node of nodes) {
        if (node.level !== expectedLevel) {
          adjustments.push({
            blockId: node.id,
            currentLevel: node.level,
            suggestedLevel: expectedLevel,
            reason: `保持结构一致性，建议使用 h${expectedLevel}`,
            autoApply: false
          });
        }
        
        if (node.children.length > 0) {
          traverse(node.children, expectedLevel + 1);
        }
      }
    };
    
    traverse(structure);
    return adjustments;
  }

  /**
   * 检测孤立标题
   */
  private detectOrphanedHeadings(structure: HeadingContext[]): HeadingAdjustment[] {
    const adjustments: HeadingAdjustment[] = [];
    
    const traverse = (nodes: HeadingContext[]) => {
      for (const node of nodes) {
        if (node.children.length === 0 && this.hasNoContent(node.id)) {
          adjustments.push({
            blockId: node.id,
            currentLevel: node.level,
            suggestedLevel: node.level,
            reason: '该标题下没有内容，考虑添加内容或删除',
            autoApply: false
          });
        }
        
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    };
    
    traverse(structure);
    return adjustments;
  }

  /**
   * 工具方法：检查是否是标题块
   */
  private isHeadingBlock(block: BlockModel): boolean {
    return block.flavour === 'yunke:paragraph' && 
           (block as any).type?.startsWith('h');
  }

  /**
   * 工具方法：获取标题等级
   */
  private getHeadingLevel(block: BlockModel): number {
    if (!this.isHeadingBlock(block)) return 0;
    
    const type = (block as any).type;
    const match = type?.match(/h(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  /**
   * 工具方法：获取标题文本
   */
  private getHeadingText(block: BlockModel): string {
    return (block as any).text?.toString() || '';
  }

  /**
   * 工具方法：查找前一个标题
   */
  private findPreviousHeading(currentBlock: BlockModel): BlockModel | null {
    const doc = currentBlock.doc;
    const allBlocks = doc.root?.children || [];
    
    let found = false;
    for (let i = allBlocks.length - 1; i >= 0; i--) {
      const block = allBlocks[i];
      
      if (block.id === currentBlock.id) {
        found = true;
        continue;
      }
      
      if (found && this.isHeadingBlock(block)) {
        return block;
      }
    }
    
    return null;
  }

  /**
   * 工具方法：检查是否是孤立标题
   */
  private isOrphanedHeading(block: BlockModel): boolean {
    return block.children.length === 0 && this.hasNoContent(block.id);
  }

  /**
   * 工具方法：检查标题下是否有内容
   */
  private hasNoContent(blockId: string): boolean {
    // 这里应该检查标题后面是否有内容块
    // 简化实现，假设通过children判断
    return true; // 临时实现
  }

  /**
   * 工具方法：计算建议的置信度
   */
  private calculateConfidence(issue: LevelIssue, block: BlockModel): number {
    let confidence = 0.5; // 基础置信度
    
    switch (issue.type) {
      case 'level_skip':
        confidence = 0.9; // 跳级问题置信度很高
        break;
      case 'too_deep':
        confidence = 0.7; // 过深层级置信度中等
        break;
      case 'inconsistent':
        confidence = 0.6; // 不一致问题置信度较低
        break;
      case 'orphaned':
        confidence = 0.4; // 孤立标题置信度最低
        break;
    }
    
    return confidence;
  }

  /**
   * 工具方法：记录调整历史
   */
  private recordAdjustment(blockId: string, fromLevel: number, toLevel: number): void {
    const adjustment = {
      blockId,
      fromLevel,
      toLevel,
      timestamp: new Date(),
      applied: true
    };
    
    // 保存到本地存储或发送到服务器
    const history = JSON.parse(localStorage.getItem('heading-adjustments') || '[]');
    history.push(adjustment);
    localStorage.setItem('heading-adjustments', JSON.stringify(history));
  }
}