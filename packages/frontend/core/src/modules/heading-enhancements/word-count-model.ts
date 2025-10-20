import {
  BlockModel,
  BlockSchemaExtension,
  defineBlockSchema,
  type Text,
} from '@blocksuite/store';

export interface WordCountResult {
  characters: number;
  charactersNoSpaces: number;
  words: number;
  paragraphs: number;
  sentences: number;
  readingTime: number; // 分钟
  lastUpdated: Date;
}

export interface WordCountProps {
  targetBlocks: string[]; // 要统计的块ID列表
  countType: 'characters' | 'words' | 'paragraphs' | 'all';
  showDetails: boolean;
  realtime: boolean;
  goal?: number; // 目标字数
  title?: string; // 自定义标题
  position: 'inline' | 'sidebar' | 'floating';
  theme: 'default' | 'compact' | 'detailed';
  excludeHeadings: boolean; // 是否排除标题
  excludeQuotes: boolean; // 是否排除引用
  updateInterval: number; // 更新间隔（毫秒）
}

export const WordCountBlockSchema = defineBlockSchema({
  flavour: 'yunke:word-count',
  props: (internal): WordCountProps => ({
    targetBlocks: [],
    countType: 'words',
    showDetails: true,
    realtime: true,
    goal: undefined,
    title: undefined,
    position: 'inline',
    theme: 'default',
    excludeHeadings: false,
    excludeQuotes: false,
    updateInterval: 1000,
  }),
  metadata: {
    version: 1,
    role: 'content',
    parent: [
      'yunke:note',
      'yunke:paragraph',
      'yunke:list',
    ],
  },
  toModel: () => new WordCountBlockModel(),
});

export const WordCountBlockSchemaExtension = BlockSchemaExtension(WordCountBlockSchema);

export class WordCountBlockModel extends BlockModel<WordCountProps> {
  private _cache: WordCountResult | null = null;
  private _lastCacheTime = 0;

  override isEmpty(): boolean {
    return false; // 字数统计块永远不为空
  }

  /**
   * 获取目标内容
   */
  getTargetContent(): string {
    const { targetBlocks, excludeHeadings, excludeQuotes } = this.props;
    let content = '';

    if (targetBlocks.length === 0) {
      // 如果没有指定目标块，统计整个文档
      content = this.getDocumentContent();
    } else {
      // 统计指定的块
      for (const blockId of targetBlocks) {
        const block = this.doc.getBlock(blockId);
        if (block) {
          const blockContent = this.getBlockContent(block);
          if (blockContent) {
            // 根据设置过滤内容
            if (excludeHeadings && this.isHeadingBlock(block)) {
              continue;
            }
            if (excludeQuotes && this.isQuoteBlock(block)) {
              continue;
            }
            content += blockContent + '\n';
          }
        }
      }
    }

    return content.trim();
  }

  /**
   * 计算字数统计
   */
  calculateWordCount(): WordCountResult {
    // 检查缓存
    const now = Date.now();
    if (this._cache && (now - this._lastCacheTime) < this.props.updateInterval) {
      return this._cache;
    }

    const content = this.getTargetContent();
    
    // 计算字符数
    const characters = content.length;
    const charactersNoSpaces = content.replace(/\s/g, '').length;
    
    // 计算词数（支持中英文）
    const words = this.countWords(content);
    
    // 计算段落数
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // 计算句子数
    const sentences = content.split(/[.!?。！？]+/).filter(s => s.trim().length > 0).length;
    
    // 计算阅读时间（中文：每分钟300字，英文：每分钟200词）
    const readingTime = this.calculateReadingTime(content, words);

    const result: WordCountResult = {
      characters,
      charactersNoSpaces,
      words,
      paragraphs,
      sentences,
      readingTime,
      lastUpdated: new Date(),
    };

    // 更新缓存
    this._cache = result;
    this._lastCacheTime = now;

    return result;
  }

  /**
   * 计算词数（支持中英文混合）
   */
  private countWords(text: string): number {
    // 中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 英文单词
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '') // 移除中文字符
      .split(/\s+/)
      .filter(word => word.length > 0 && /[a-zA-Z]/.test(word))
      .length;
    
    return chineseChars + englishWords;
  }

  /**
   * 计算阅读时间
   */
  private calculateReadingTime(content: string, words: number): number {
    // 中文字符数
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    
    // 英文单词数
    const englishWords = words - chineseChars;
    
    // 中文阅读速度：每分钟300字
    // 英文阅读速度：每分钟200词
    const chineseTime = chineseChars / 300;
    const englishTime = englishWords / 200;
    
    return Math.ceil(chineseTime + englishTime);
  }

  /**
   * 获取整个文档内容
   */
  private getDocumentContent(): string {
    const root = this.doc.root;
    if (!root) return '';

    let content = '';
    
    const traverse = (block: BlockModel) => {
      const blockContent = this.getBlockContent(block);
      if (blockContent) {
        content += blockContent + '\n';
      }
      
      for (const child of block.children) {
        traverse(child);
      }
    };
    
    traverse(root);
    return content.trim();
  }

  /**
   * 获取单个块的内容
   */
  private getBlockContent(block: BlockModel): string {
    // 跳过字数统计块本身
    if (block.flavour === 'yunke:word-count') {
      return '';
    }

    if (block.flavour === 'yunke:paragraph') {
      const text = (block as any).text;
      return text ? text.toString() : '';
    }

    if (block.flavour === 'yunke:list') {
      const text = (block as any).text;
      return text ? text.toString() : '';
    }

    // 其他块类型
    return '';
  }

  /**
   * 检查是否是标题块
   */
  private isHeadingBlock(block: BlockModel): boolean {
    return block.flavour === 'yunke:paragraph' && 
           (block as any).type?.startsWith('h');
  }

  /**
   * 检查是否是引用块
   */
  private isQuoteBlock(block: BlockModel): boolean {
    return block.flavour === 'yunke:paragraph' && 
           (block as any).type === 'quote';
  }

  /**
   * 获取进度百分比
   */
  getProgress(): number {
    if (!this.props.goal) return 0;
    
    const count = this.calculateWordCount();
    const currentCount = this.getCurrentCount(count);
    
    return Math.min((currentCount / this.props.goal) * 100, 100);
  }

  /**
   * 根据统计类型获取当前计数
   */
  private getCurrentCount(result: WordCountResult): number {
    switch (this.props.countType) {
      case 'characters':
        return result.characters;
      case 'words':
        return result.words;
      case 'paragraphs':
        return result.paragraphs;
      default:
        return result.words;
    }
  }

  /**
   * 获取格式化的统计信息
   */
  getFormattedStats(): { [key: string]: string } {
    const result = this.calculateWordCount();
    
    return {
      characters: result.characters.toLocaleString(),
      charactersNoSpaces: result.charactersNoSpaces.toLocaleString(),
      words: result.words.toLocaleString(),
      paragraphs: result.paragraphs.toLocaleString(),
      sentences: result.sentences.toLocaleString(),
      readingTime: `${result.readingTime} 分钟`,
      lastUpdated: result.lastUpdated.toLocaleTimeString(),
    };
  }

  /**
   * 添加目标块
   */
  addTargetBlock(blockId: string): void {
    const targetBlocks = [...this.props.targetBlocks];
    if (!targetBlocks.includes(blockId)) {
      targetBlocks.push(blockId);
      this.doc.updateBlock(this, { targetBlocks });
    }
  }

  /**
   * 移除目标块
   */
  removeTargetBlock(blockId: string): void {
    const targetBlocks = this.props.targetBlocks.filter(id => id !== blockId);
    this.doc.updateBlock(this, { targetBlocks });
  }

  /**
   * 设置目标字数
   */
  setGoal(goal: number | undefined): void {
    this.doc.updateBlock(this, { goal });
  }

  /**
   * 切换实时更新
   */
  toggleRealtime(): void {
    this.doc.updateBlock(this, { realtime: !this.props.realtime });
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this._cache = null;
    this._lastCacheTime = 0;
  }
}