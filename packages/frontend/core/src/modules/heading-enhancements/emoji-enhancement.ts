import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { ParagraphBlockModel } from '@blocksuite/affine-model';

export interface EmojiSuggestion {
  emoji: string;
  name: string;
  category: string;
  keywords: string[];
  relevance: number;
}

export interface EmojiContext {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  language: 'zh' | 'en' | 'mixed';
}

export interface EmojiSettings {
  enabled: boolean;
  autoSuggest: boolean;
  showShortcuts: boolean;
  maxSuggestions: number;
  contextLength: number;
  categories: string[];
  customEmojis: { [key: string]: string };
}

/**
 * 表情符号增强组件
 * 提供智能表情建议、快捷输入、自定义表情等功能
 */
export class EmojiEnhancement extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .emoji-container {
      position: relative;
      display: inline-flex;
    }

    .emoji-trigger {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 12px;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      user-select: none;
      margin: 0 2px;
    }

    .emoji-trigger:hover {
      background: rgba(255, 193, 7, 0.15);
      border-color: rgba(255, 193, 7, 0.4);
      transform: translateY(-1px);
    }

    .emoji-trigger.active {
      background: rgba(255, 193, 7, 0.2);
      border-color: #FFC107;
    }

    .emoji-suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      background: white;
      border: 1px solid var(--affine-border-color);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      min-width: 280px;
      max-height: 320px;
      overflow-y: auto;
      margin-top: 4px;
    }

    .emoji-suggestions.hidden {
      display: none;
    }

    .emoji-header {
      padding: 8px 12px;
      border-bottom: 1px solid var(--affine-border-color);
      font-size: 12px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
      background: var(--affine-background-secondary-color);
    }

    .emoji-categories {
      display: flex;
      padding: 8px 12px;
      gap: 4px;
      border-bottom: 1px solid var(--affine-border-color);
      background: var(--affine-background-secondary-color);
    }

    .emoji-category {
      padding: 4px 8px;
      background: transparent;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--affine-text-secondary-color);
    }

    .emoji-category:hover {
      background: var(--affine-hover-color);
      color: var(--affine-text-primary-color);
    }

    .emoji-category.active {
      background: var(--affine-primary-color);
      color: white;
      border-color: var(--affine-primary-color);
    }

    .emoji-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 2px;
      padding: 8px;
    }

    .emoji-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      border: 1px solid transparent;
    }

    .emoji-item:hover {
      background: var(--affine-hover-color);
      border-color: var(--affine-border-color);
    }

    .emoji-item.highlighted {
      background: rgba(91, 156, 255, 0.08);
      border-color: #5B9CFF;
    }

    .emoji-symbol {
      font-size: 16px;
      min-width: 20px;
      text-align: center;
    }

    .emoji-info {
      flex: 1;
      min-width: 0;
    }

    .emoji-name {
      font-size: 12px;
      font-weight: 500;
      color: var(--affine-text-primary-color);
      margin-bottom: 2px;
    }

    .emoji-keywords {
      font-size: 10px;
      color: var(--affine-text-secondary-color);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .emoji-relevance {
      font-size: 10px;
      color: var(--affine-text-tertiary-color);
      background: var(--affine-background-secondary-color);
      padding: 2px 6px;
      border-radius: 10px;
      margin-left: 4px;
    }

    .emoji-shortcuts {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      padding: 8px 12px;
      border-top: 1px solid var(--affine-border-color);
      background: var(--affine-background-secondary-color);
    }

    .emoji-shortcut {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: white;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
      color: var(--affine-text-secondary-color);
    }

    .emoji-shortcut:hover {
      background: var(--affine-hover-color);
      border-color: var(--affine-primary-color);
      color: var(--affine-text-primary-color);
    }

    .emoji-search {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--affine-border-color);
    }

    .emoji-search-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .emoji-search-input:focus {
      border-color: var(--affine-primary-color);
    }

    .emoji-recent {
      display: flex;
      gap: 4px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--affine-border-color);
    }

    .emoji-recent-item {
      padding: 4px 6px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 14px;
    }

    .emoji-recent-item:hover {
      background: var(--affine-hover-color);
      transform: scale(1.1);
    }

    .emoji-context-info {
      padding: 8px 12px;
      border-bottom: 1px solid var(--affine-border-color);
      font-size: 11px;
      color: var(--affine-text-secondary-color);
      background: var(--affine-background-secondary-color);
    }

    .context-item {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
    }

    .context-label {
      font-weight: 500;
      min-width: 50px;
    }

    .context-value {
      flex: 1;
    }

    .emoji-floating {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1000;
      pointer-events: none;
      font-size: 20px;
      animation: emojiFloat 2s ease-out forwards;
    }

    @keyframes emojiFloat {
      0% {
        opacity: 1;
        transform: translate(0, 0) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(0, -30px) scale(1.2);
      }
    }

    .emoji-tooltip {
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      margin-bottom: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .emoji-trigger:hover .emoji-tooltip {
      opacity: 1;
    }

    .no-results {
      padding: 20px;
      text-align: center;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .loading {
      padding: 20px;
      text-align: center;
      color: var(--affine-text-secondary-color);
      font-size: 12px;
    }

    .loading::after {
      content: '';
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid var(--affine-border-color);
      border-top: 2px solid var(--affine-primary-color);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-left: 8px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  @property({ attribute: false })
  declare model: ParagraphBlockModel;

  @property({ attribute: false })
  declare settings: EmojiSettings;

  constructor() {
    super();
    this.settings = {
      enabled: true,
      autoSuggest: true,
      showShortcuts: true,
      maxSuggestions: 20,
      contextLength: 100,
      categories: ['smileys', 'people', 'nature', 'food', 'activities', 'travel', 'objects', 'symbols'],
      customEmojis: {},
    };
  }

  @state()
  private _suggestions: EmojiSuggestion[] = [];

  @state()
  private _context: EmojiContext | null = null;

  @state()
  private _showSuggestions = false;

  @state()
  private _activeCategory = 'all';

  @state()
  private _searchQuery = '';

  @state()
  private _recentEmojis: string[] = [];

  @state()
  private _isLoading = false;

  @state()
  private _highlightedIndex = -1;

  // 预定义的表情符号数据库
  private _emojiDatabase: { [category: string]: EmojiSuggestion[] } = {
    smileys: [
      { emoji: '😀', name: '开心', category: 'smileys', keywords: ['开心', '高兴', '笑', 'happy', 'smile'], relevance: 0.9 },
      { emoji: '😂', name: '哭笑', category: 'smileys', keywords: ['哭笑', '大笑', '搞笑', 'laugh', 'funny'], relevance: 0.9 },
      { emoji: '😍', name: '爱心眼', category: 'smileys', keywords: ['喜欢', '爱', '心动', 'love', 'like'], relevance: 0.8 },
      { emoji: '🤔', name: '思考', category: 'smileys', keywords: ['思考', '困惑', '想', 'think', 'confused'], relevance: 0.8 },
      { emoji: '😭', name: '大哭', category: 'smileys', keywords: ['哭', '难过', '伤心', 'cry', 'sad'], relevance: 0.7 },
      { emoji: '😅', name: '尴尬笑', category: 'smileys', keywords: ['尴尬', '汗', '无奈', 'awkward', 'sweat'], relevance: 0.7 },
    ],
    people: [
      { emoji: '👍', name: '赞', category: 'people', keywords: ['赞', '好', '支持', 'good', 'thumbs up'], relevance: 0.9 },
      { emoji: '👎', name: '踩', category: 'people', keywords: ['踩', '不好', '反对', 'bad', 'thumbs down'], relevance: 0.8 },
      { emoji: '👏', name: '鼓掌', category: 'people', keywords: ['鼓掌', '赞美', '支持', 'clap', 'applause'], relevance: 0.8 },
      { emoji: '🙏', name: '祈祷', category: 'people', keywords: ['祈祷', '感谢', '拜托', 'pray', 'thanks'], relevance: 0.7 },
    ],
    nature: [
      { emoji: '🌞', name: '太阳', category: 'nature', keywords: ['太阳', '阳光', '晴天', 'sun', 'sunny'], relevance: 0.8 },
      { emoji: '🌙', name: '月亮', category: 'nature', keywords: ['月亮', '夜晚', '晚上', 'moon', 'night'], relevance: 0.8 },
      { emoji: '⭐', name: '星星', category: 'nature', keywords: ['星星', '夜空', '闪亮', 'star', 'bright'], relevance: 0.7 },
      { emoji: '🌸', name: '樱花', category: 'nature', keywords: ['樱花', '花', '春天', 'cherry blossom', 'flower'], relevance: 0.7 },
    ],
    food: [
      { emoji: '🍕', name: '披萨', category: 'food', keywords: ['披萨', '食物', '美食', 'pizza', 'food'], relevance: 0.8 },
      { emoji: '🍔', name: '汉堡', category: 'food', keywords: ['汉堡', '食物', '快餐', 'burger', 'food'], relevance: 0.8 },
      { emoji: '🍜', name: '拉面', category: 'food', keywords: ['拉面', '面条', '汤', 'noodle', 'soup'], relevance: 0.7 },
      { emoji: '🍰', name: '蛋糕', category: 'food', keywords: ['蛋糕', '甜点', '庆祝', 'cake', 'dessert'], relevance: 0.7 },
    ],
    activities: [
      { emoji: '⚽', name: '足球', category: 'activities', keywords: ['足球', '运动', '球', 'football', 'sport'], relevance: 0.8 },
      { emoji: '🎵', name: '音乐', category: 'activities', keywords: ['音乐', '歌曲', '声音', 'music', 'song'], relevance: 0.8 },
      { emoji: '🎮', name: '游戏', category: 'activities', keywords: ['游戏', '玩', '娱乐', 'game', 'play'], relevance: 0.7 },
      { emoji: '📚', name: '书本', category: 'activities', keywords: ['书', '学习', '阅读', 'book', 'study'], relevance: 0.7 },
    ],
    travel: [
      { emoji: '✈️', name: '飞机', category: 'travel', keywords: ['飞机', '旅行', '出行', 'airplane', 'travel'], relevance: 0.8 },
      { emoji: '🚗', name: '汽车', category: 'travel', keywords: ['汽车', '车', '交通', 'car', 'transport'], relevance: 0.8 },
      { emoji: '🏠', name: '房子', category: 'travel', keywords: ['房子', '家', '住宅', 'house', 'home'], relevance: 0.7 },
      { emoji: '🏖️', name: '海滩', category: 'travel', keywords: ['海滩', '海', '度假', 'beach', 'vacation'], relevance: 0.7 },
    ],
    objects: [
      { emoji: '📱', name: '手机', category: 'objects', keywords: ['手机', '电话', '通讯', 'phone', 'mobile'], relevance: 0.8 },
      { emoji: '💻', name: '电脑', category: 'objects', keywords: ['电脑', '工作', '技术', 'computer', 'laptop'], relevance: 0.8 },
      { emoji: '⌚', name: '手表', category: 'objects', keywords: ['手表', '时间', '钟', 'watch', 'time'], relevance: 0.7 },
      { emoji: '🎁', name: '礼物', category: 'objects', keywords: ['礼物', '惊喜', '庆祝', 'gift', 'present'], relevance: 0.7 },
    ],
    symbols: [
      { emoji: '❤️', name: '红心', category: 'symbols', keywords: ['爱', '心', '喜欢', 'love', 'heart'], relevance: 0.9 },
      { emoji: '💯', name: '100分', category: 'symbols', keywords: ['100', '完美', '棒', 'perfect', 'hundred'], relevance: 0.8 },
      { emoji: '🔥', name: '火', category: 'symbols', keywords: ['火', '热门', '厉害', 'fire', 'hot'], relevance: 0.8 },
      { emoji: '✨', name: '闪亮', category: 'symbols', keywords: ['闪亮', '特别', '优秀', 'sparkle', 'special'], relevance: 0.7 },
    ],
  };

  override connectedCallback() {
    super.connectedCallback();
    this._loadRecentEmojis();
    this._setupModelObserver();
    this._setupKeyboardShortcuts();
  }

  private _setupModelObserver() {
    this.disposables.add(
      this.model.text.yText.observe(() => {
        if (this.settings.autoSuggest) {
          this._analyzeContextAndSuggest();
        }
      })
    );
  }

  private _setupKeyboardShortcuts() {
    this.disposables.add(
      this.model.doc.slots.keydown.on(({ event }) => {
        if (event.key === ':' && event.ctrlKey) {
          event.preventDefault();
          this._showEmojiPicker();
        }
      })
    );
  }

  private _loadRecentEmojis() {
    const stored = localStorage.getItem('recent-emojis');
    this._recentEmojis = stored ? JSON.parse(stored) : [];
  }

  private _saveRecentEmojis() {
    localStorage.setItem('recent-emojis', JSON.stringify(this._recentEmojis));
  }

  private _analyzeContextAndSuggest() {
    const text = this.model.text.toString();
    const context = this._analyzeContext(text);
    this._context = context;
    
    if (context.text.length > 0) {
      this._generateSuggestions(context);
    } else {
      this._suggestions = [];
    }
    
    this.requestUpdate();
  }

  private _analyzeContext(text: string): EmojiContext {
    const lastChars = text.slice(-this.settings.contextLength);
    
    // 简单的情感分析
    const positiveWords = ['好', '棒', '赞', '优秀', '成功', '开心', '高兴', '喜欢', 'good', 'great', 'awesome', 'happy', 'love'];
    const negativeWords = ['坏', '差', '糟糕', '失败', '难过', '生气', '讨厌', 'bad', 'terrible', 'sad', 'angry', 'hate'];
    
    const sentiment = this._analyzeSentiment(lastChars, positiveWords, negativeWords);
    
    // 检测语言
    const language = this._detectLanguage(lastChars);
    
    // 提取主题
    const topics = this._extractTopics(lastChars);
    
    return {
      text: lastChars,
      sentiment,
      topics,
      language,
    };
  }

  private _analyzeSentiment(text: string, positiveWords: string[], negativeWords: string[]): 'positive' | 'negative' | 'neutral' {
    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private _detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    
    if (chineseChars > englishChars * 2) return 'zh';
    if (englishChars > chineseChars * 2) return 'en';
    return 'mixed';
  }

  private _extractTopics(text: string): string[] {
    const topics = [];
    const lowerText = text.toLowerCase();
    
    // 基于关键词提取主题
    const topicKeywords = {
      work: ['工作', '项目', '任务', '会议', 'work', 'project', 'task', 'meeting'],
      food: ['吃', '食物', '餐厅', '美食', 'eat', 'food', 'restaurant', 'meal'],
      travel: ['旅行', '出行', '景点', '酒店', 'travel', 'trip', 'hotel', 'vacation'],
      study: ['学习', '考试', '课程', '书', 'study', 'exam', 'course', 'book'],
      sports: ['运动', '健身', '球', '游戏', 'sport', 'exercise', 'game', 'fitness'],
      technology: ['技术', '电脑', '网络', '软件', 'technology', 'computer', 'software', 'internet'],
    };
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    return topics;
  }

  private _generateSuggestions(context: EmojiContext) {
    this._isLoading = true;
    this.requestUpdate();
    
    setTimeout(() => {
      const suggestions: EmojiSuggestion[] = [];
      
      // 基于情感推荐
      if (context.sentiment === 'positive') {
        suggestions.push(...this._emojiDatabase.smileys.filter(e => 
          e.keywords.some(k => ['开心', '高兴', '笑', 'happy', 'smile'].includes(k))
        ));
      } else if (context.sentiment === 'negative') {
        suggestions.push(...this._emojiDatabase.smileys.filter(e => 
          e.keywords.some(k => ['哭', '难过', '伤心', 'cry', 'sad'].includes(k))
        ));
      }
      
      // 基于主题推荐
      for (const topic of context.topics) {
        if (topic === 'food') {
          suggestions.push(...this._emojiDatabase.food);
        } else if (topic === 'travel') {
          suggestions.push(...this._emojiDatabase.travel);
        } else if (topic === 'work') {
          suggestions.push(...this._emojiDatabase.objects.filter(e => 
            e.keywords.some(k => ['电脑', '工作', 'computer', 'work'].includes(k))
          ));
        }
      }
      
      // 基于关键词匹配
      const allEmojis = Object.values(this._emojiDatabase).flat();
      const keywordMatches = allEmojis.filter(emoji => 
        emoji.keywords.some(keyword => 
          context.text.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      suggestions.push(...keywordMatches);
      
      // 去重和排序
      const uniqueSuggestions = Array.from(
        new Map(suggestions.map(s => [s.emoji, s])).values()
      );
      
      this._suggestions = uniqueSuggestions
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, this.settings.maxSuggestions);
      
      this._isLoading = false;
      this.requestUpdate();
    }, 300);
  }

  private _showEmojiPicker() {
    this._showSuggestions = true;
    this._highlightedIndex = -1;
    
    if (this._suggestions.length === 0) {
      this._loadAllEmojis();
    }
    
    this.requestUpdate();
  }

  private _hideEmojiPicker() {
    this._showSuggestions = false;
    this._searchQuery = '';
    this._highlightedIndex = -1;
    this.requestUpdate();
  }

  private _loadAllEmojis() {
    const category = this._activeCategory === 'all' ? null : this._activeCategory;
    
    if (category && this._emojiDatabase[category]) {
      this._suggestions = this._emojiDatabase[category];
    } else {
      this._suggestions = Object.values(this._emojiDatabase).flat();
    }
    
    this._filterSuggestions();
  }

  private _filterSuggestions() {
    if (!this._searchQuery) {
      this._loadAllEmojis();
      return;
    }
    
    const query = this._searchQuery.toLowerCase();
    const allEmojis = Object.values(this._emojiDatabase).flat();
    
    this._suggestions = allEmojis.filter(emoji => 
      emoji.name.toLowerCase().includes(query) ||
      emoji.keywords.some(keyword => keyword.toLowerCase().includes(query))
    );
  }

  private _selectCategory(category: string) {
    this._activeCategory = category;
    this._loadAllEmojis();
    this.requestUpdate();
  }

  private _insertEmoji(emoji: string) {
    // 在当前位置插入表情符号
    const text = this.model.text.toString();
    const newText = text + emoji;
    
    this.model.text.clear();
    this.model.text.insert(0, newText);
    
    // 更新最近使用的表情符号
    this._addToRecentEmojis(emoji);
    
    // 显示浮动动画
    this._showFloatingEmoji(emoji);
    
    this._hideEmojiPicker();
  }

  private _addToRecentEmojis(emoji: string) {
    this._recentEmojis = [emoji, ...this._recentEmojis.filter(e => e !== emoji)].slice(0, 10);
    this._saveRecentEmojis();
  }

  private _showFloatingEmoji(emoji: string) {
    const rect = this.getBoundingClientRect();
    const floatingElement = document.createElement('div');
    floatingElement.className = 'emoji-floating';
    floatingElement.textContent = emoji;
    floatingElement.style.left = `${rect.left + rect.width / 2}px`;
    floatingElement.style.top = `${rect.top}px`;
    
    document.body.appendChild(floatingElement);
    
    setTimeout(() => {
      document.body.removeChild(floatingElement);
    }, 2000);
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (!this._showSuggestions) return;
    
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this._highlightedIndex = Math.max(0, this._highlightedIndex - 1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this._highlightedIndex = Math.min(this._suggestions.length - 1, this._highlightedIndex + 1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this._highlightedIndex >= 0) {
          this._insertEmoji(this._suggestions[this._highlightedIndex].emoji);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this._hideEmojiPicker();
        break;
    }
    
    this.requestUpdate();
  }

  private _renderTrigger() {
    return html`
      <div class="emoji-trigger" @click=${this._showEmojiPicker}>
        <span>😀</span>
        <span>表情</span>
        <div class="emoji-tooltip">
          Ctrl + : 快速打开表情选择器
        </div>
      </div>
    `;
  }

  private _renderSuggestions() {
    if (!this._showSuggestions) return nothing;
    
    return html`
      <div class="emoji-suggestions" @keydown=${this._handleKeyDown}>
        ${this._renderHeader()}
        ${this._renderSearch()}
        ${this._renderContextInfo()}
        ${this._renderRecentEmojis()}
        ${this._renderCategories()}
        ${this._renderEmojiList()}
        ${this.settings.showShortcuts ? this._renderShortcuts() : nothing}
      </div>
    `;
  }

  private _renderHeader() {
    return html`
      <div class="emoji-header">
        表情符号选择器
        <button 
          style="float: right; background: none; border: none; cursor: pointer;"
          @click=${this._hideEmojiPicker}
        >
          ✕
        </button>
      </div>
    `;
  }

  private _renderSearch() {
    return html`
      <div class="emoji-search">
        <input
          class="emoji-search-input"
          type="text"
          placeholder="搜索表情符号..."
          .value=${this._searchQuery}
          @input=${(e: Event) => {
            this._searchQuery = (e.target as HTMLInputElement).value;
            this._filterSuggestions();
            this.requestUpdate();
          }}
        />
      </div>
    `;
  }

  private _renderContextInfo() {
    if (!this._context) return nothing;
    
    return html`
      <div class="emoji-context-info">
        <div class="context-item">
          <span class="context-label">情感:</span>
          <span class="context-value">${this._getSentimentText(this._context.sentiment)}</span>
        </div>
        <div class="context-item">
          <span class="context-label">主题:</span>
          <span class="context-value">${this._context.topics.join(', ') || '无'}</span>
        </div>
      </div>
    `;
  }

  private _getSentimentText(sentiment: string): string {
    switch (sentiment) {
      case 'positive': return '积极 😊';
      case 'negative': return '消极 😔';
      default: return '中性 😐';
    }
  }

  private _renderRecentEmojis() {
    if (this._recentEmojis.length === 0) return nothing;
    
    return html`
      <div class="emoji-recent">
        <span style="font-size: 11px; color: var(--affine-text-secondary-color); margin-right: 8px;">最近使用:</span>
        ${this._recentEmojis.map(emoji => html`
          <div class="emoji-recent-item" @click=${() => this._insertEmoji(emoji)}>
            ${emoji}
          </div>
        `)}
      </div>
    `;
  }

  private _renderCategories() {
    const categories = [
      { key: 'all', name: '全部', icon: '🔍' },
      { key: 'smileys', name: '表情', icon: '😀' },
      { key: 'people', name: '人物', icon: '👍' },
      { key: 'nature', name: '自然', icon: '🌞' },
      { key: 'food', name: '食物', icon: '🍕' },
      { key: 'activities', name: '活动', icon: '⚽' },
      { key: 'travel', name: '旅行', icon: '✈️' },
      { key: 'objects', name: '物品', icon: '📱' },
      { key: 'symbols', name: '符号', icon: '❤️' },
    ];
    
    return html`
      <div class="emoji-categories">
        ${categories.map(category => html`
          <button
            class=${classMap({
              'emoji-category': true,
              'active': this._activeCategory === category.key
            })}
            @click=${() => this._selectCategory(category.key)}
          >
            ${category.icon} ${category.name}
          </button>
        `)}
      </div>
    `;
  }

  private _renderEmojiList() {
    if (this._isLoading) {
      return html`<div class="loading">加载中...</div>`;
    }
    
    if (this._suggestions.length === 0) {
      return html`<div class="no-results">没有找到匹配的表情符号</div>`;
    }
    
    return html`
      <div class="emoji-list">
        ${this._suggestions.map((suggestion, index) => html`
          <div
            class=${classMap({
              'emoji-item': true,
              'highlighted': index === this._highlightedIndex
            })}
            @click=${() => this._insertEmoji(suggestion.emoji)}
          >
            <span class="emoji-symbol">${suggestion.emoji}</span>
            <div class="emoji-info">
              <div class="emoji-name">${suggestion.name}</div>
              <div class="emoji-keywords">${suggestion.keywords.join(', ')}</div>
            </div>
            <div class="emoji-relevance">${Math.round(suggestion.relevance * 100)}%</div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderShortcuts() {
    const shortcuts = [
      { emoji: '👍', name: '赞', shortcut: ':+1:' },
      { emoji: '❤️', name: '爱心', shortcut: ':heart:' },
      { emoji: '😂', name: '笑哭', shortcut: ':joy:' },
      { emoji: '🔥', name: '火', shortcut: ':fire:' },
      { emoji: '💯', name: '100分', shortcut: ':100:' },
    ];
    
    return html`
      <div class="emoji-shortcuts">
        <span style="font-size: 11px; color: var(--affine-text-secondary-color); margin-right: 8px;">快捷方式:</span>
        ${shortcuts.map(shortcut => html`
          <div class="emoji-shortcut" @click=${() => this._insertEmoji(shortcut.emoji)}>
            ${shortcut.emoji} ${shortcut.shortcut}
          </div>
        `)}
      </div>
    `;
  }

  override render() {
    return html`
      <div class="emoji-container">
        ${this._renderTrigger()}
        ${this._renderSuggestions()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'emoji-enhancement': EmojiEnhancement;
  }
}