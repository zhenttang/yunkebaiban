/**
 * 标题增强功能模块
 * 整合所有标题相关的创新功能
 */

// 导出所有组件
export { SmartHeadingLevelDetector } from './smart-level-detector';
export { HeadingLevelSuggestion } from './heading-level-suggestion';
export { WordCountBlockModel, WordCountBlockSchema, WordCountBlockSchemaExtension } from './word-count-model';
export { WordCountDisplay } from './word-count-display';
export { AdvancedCollapse } from './advanced-collapse';
export { EmojiEnhancement } from './emoji-enhancement';
export { DocumentStructureVisualization } from './document-structure-visualization';

// 导出类型定义
export type { 
  LevelIssue, 
  LevelSuggestion, 
  HeadingAdjustment, 
  HeadingContext 
} from './smart-level-detector';

export type { 
  WordCountResult, 
  WordCountProps 
} from './word-count-model';

export type { 
  CollapseState, 
  CollapseSettings 
} from './advanced-collapse';

export type { 
  EmojiSuggestion, 
  EmojiContext, 
  EmojiSettings 
} from './emoji-enhancement';

export type { 
  DocumentNode, 
  StructureSettings, 
  ViewPosition 
} from './document-structure-visualization';

// 注册所有自定义元素
import './heading-level-suggestion';
import './word-count-display';
import './advanced-collapse';
import './emoji-enhancement';
import './document-structure-visualization';

// 功能集成类
import { SmartHeadingLevelDetector } from './smart-level-detector';
import { WordCountBlockModel } from './word-count-model';
import type { ParagraphBlockModel } from '@blocksuite/yunke-model';
import type { BlockModel } from '@blocksuite/store';

export interface HeadingEnhancementSettings {
  // 智能等级调整
  enableSmartLevel: boolean;
  autoApplyLevelSuggestions: boolean;
  
  // 字数统计
  enableWordCount: boolean;
  wordCountRealtime: boolean;
  wordCountPosition: 'inline' | 'sidebar' | 'floating';
  
  // 高级折叠
  enableAdvancedCollapse: boolean;
  collapseAnimationDuration: number;
  enableCollapsePreview: boolean;
  
  // 表情符号增强
  enableEmojiEnhancement: boolean;
  autoEmojiSuggestion: boolean;
  
  // 文档结构可视化
  enableStructureVisualization: boolean;
  structureViewMode: 'tree' | 'mindmap' | 'timeline' | 'outline';
  
  // 全局设置
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en' | 'auto';
}

/**
 * 标题增强功能管理器
 * 统一管理所有标题增强功能
 */
export class HeadingEnhancementManager {
  private _detector: SmartHeadingLevelDetector;
  private _settings: HeadingEnhancementSettings;
  private _enabledFeatures: Set<string> = new Set();
  
  constructor(settings: Partial<HeadingEnhancementSettings> = {}) {
    this._settings = {
      enableSmartLevel: true,
      autoApplyLevelSuggestions: false,
      enableWordCount: true,
      wordCountRealtime: true,
      wordCountPosition: 'inline',
      enableAdvancedCollapse: true,
      collapseAnimationDuration: 300,
      enableCollapsePreview: true,
      enableEmojiEnhancement: true,
      autoEmojiSuggestion: true,
      enableStructureVisualization: true,
      structureViewMode: 'tree',
      theme: 'auto',
      language: 'auto',
      ...settings
    };
    
    this._detector = new SmartHeadingLevelDetector();
    this._initializeFeatures();
  }
  
  private _initializeFeatures() {
    // 根据设置启用相应功能
    if (this._settings.enableSmartLevel) {
      this._enabledFeatures.add('smart-level');
    }
    if (this._settings.enableWordCount) {
      this._enabledFeatures.add('word-count');
    }
    if (this._settings.enableAdvancedCollapse) {
      this._enabledFeatures.add('advanced-collapse');
    }
    if (this._settings.enableEmojiEnhancement) {
      this._enabledFeatures.add('emoji-enhancement');
    }
    if (this._settings.enableStructureVisualization) {
      this._enabledFeatures.add('structure-visualization');
    }
  }
  
  /**
   * 为段落块添加增强功能
   */
  enhanceParagraphBlock(model: ParagraphBlockModel): HTMLElement[] {
    const elements: HTMLElement[] = [];
    
    // 智能等级建议
    if (this._enabledFeatures.has('smart-level')) {
      const suggestionElement = document.createElement('heading-level-suggestion');
      (suggestionElement as any).model = model;
      elements.push(suggestionElement);
    }
    
    // 高级折叠
    if (this._enabledFeatures.has('advanced-collapse')) {
      const collapseElement = document.createElement('advanced-collapse');
      (collapseElement as any).model = model;
      (collapseElement as any).settings = {
        enablePreview: this._settings.enableCollapsePreview,
        animationDuration: this._settings.collapseAnimationDuration,
        collapseIcon: '▶',
        expandIcon: '▼',
        showChildCount: true,
        preserveFormatting: true,
      };
      elements.push(collapseElement);
    }
    
    // 表情符号增强
    if (this._enabledFeatures.has('emoji-enhancement')) {
      const emojiElement = document.createElement('emoji-enhancement');
      (emojiElement as any).model = model;
      (emojiElement as any).settings = {
        enabled: true,
        autoSuggest: this._settings.autoEmojiSuggestion,
        showShortcuts: true,
        maxSuggestions: 20,
        contextLength: 100,
        categories: ['smileys', 'people', 'nature', 'food', 'activities', 'travel', 'objects', 'symbols'],
        customEmojis: {},
      };
      elements.push(emojiElement);
    }
    
    return elements;
  }
  
  /**
   * 创建字数统计块
   */
  createWordCountBlock(targetBlocks: string[] = []): WordCountBlockModel {
    const wordCountModel = new WordCountBlockModel();
    
    // 设置字数统计配置
    const props = {
      targetBlocks,
      countType: 'words' as const,
      showDetails: true,
      realtime: this._settings.wordCountRealtime,
      position: this._settings.wordCountPosition,
      theme: 'default' as const,
      excludeHeadings: false,
      excludeQuotes: false,
      updateInterval: 1000,
    };
    
    // 应用配置到模型
    Object.assign(wordCountModel.props, props);
    
    return wordCountModel;
  }
  
  /**
   * 创建文档结构可视化组件
   */
  createStructureVisualization(rootBlock: BlockModel): HTMLElement {
    const structureElement = document.createElement('document-structure-visualization');
    (structureElement as any).model = rootBlock;
    (structureElement as any).settings = {
      showWordCount: true,
      showCreateTime: true,
      showTags: false,
      maxDepth: 6,
      viewMode: this._settings.structureViewMode,
      theme: this._settings.theme === 'auto' ? 'light' : this._settings.theme,
      enableSearch: true,
      enableFilter: true,
      enableExport: true,
      autoUpdate: true,
      compactMode: false,
    };
    
    return structureElement;
  }
  
  /**
   * 批量分析并应用标题等级建议
   */
  async analyzeAndApplyHeadingLevels(doc: BlockModel): Promise<void> {
    if (!this._enabledFeatures.has('smart-level')) return;
    
    const adjustments = this._detector.analyzeAndSuggestAdjustments(doc);
    
    if (this._settings.autoApplyLevelSuggestions) {
      for (const adjustment of adjustments) {
        if (adjustment.autoApply) {
          const block = doc.doc.getBlock(adjustment.blockId);
          if (block) {
            this._detector.applyLevelAdjustment(block as ParagraphBlockModel, adjustment.suggestedLevel);
          }
        }
      }
    }
  }
  
  /**
   * 更新设置
   */
  updateSettings(newSettings: Partial<HeadingEnhancementSettings>): void {
    this._settings = { ...this._settings, ...newSettings };
    this._enabledFeatures.clear();
    this._initializeFeatures();
  }
  
  /**
   * 获取当前设置
   */
  getSettings(): HeadingEnhancementSettings {
    return { ...this._settings };
  }
  
  /**
   * 获取启用的功能列表
   */
  getEnabledFeatures(): string[] {
    return Array.from(this._enabledFeatures);
  }
  
  /**
   * 启用指定功能
   */
  enableFeature(feature: string): void {
    this._enabledFeatures.add(feature);
  }
  
  /**
   * 禁用指定功能
   */
  disableFeature(feature: string): void {
    this._enabledFeatures.delete(feature);
  }
  
  /**
   * 获取功能统计信息
   */
  getFeatureStats(): { [key: string]: any } {
    return {
      totalFeatures: this._enabledFeatures.size,
      enabledFeatures: Array.from(this._enabledFeatures),
      settings: this._settings,
      detector: this._detector,
    };
  }
}

// 默认导出增强管理器
export default HeadingEnhancementManager;