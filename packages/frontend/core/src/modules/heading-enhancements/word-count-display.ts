import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import type { WordCountBlockModel, WordCountResult } from './word-count-model';

export class WordCountDisplay extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .word-count-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--yunke-background-secondary-color);
      border: 1px solid var(--yunke-border-color);
      border-radius: 8px;
      font-family: var(--yunke-font-family);
      font-size: 14px;
      line-height: 1.4;
      user-select: none;
    }

    .word-count-container.compact {
      padding: 6px 8px;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }

    .word-count-container.detailed {
      padding: 16px;
      gap: 12px;
    }

    .word-count-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .word-count-title {
      font-weight: 600;
      color: var(--yunke-text-primary-color);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .word-count-title .icon {
      font-size: 16px;
    }

    .word-count-actions {
      display: flex;
      gap: 4px;
    }

    .action-btn {
      padding: 4px 6px;
      background: transparent;
      border: 1px solid var(--yunke-border-color);
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: var(--yunke-hover-color);
    }

    .action-btn.active {
      background: var(--yunke-primary-color);
      color: white;
      border-color: var(--yunke-primary-color);
    }

    .word-count-main {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .count-primary {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .count-number {
      font-size: 24px;
      font-weight: 700;
      color: var(--yunke-primary-color);
    }

    .count-label {
      font-size: 12px;
      color: var(--yunke-text-secondary-color);
      font-weight: 500;
    }

    .compact .count-number {
      font-size: 16px;
    }

    .count-secondary {
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
    }

    .word-count-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .compact .word-count-details {
      display: flex;
      gap: 16px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .compact .detail-item {
      flex-direction: row;
      align-items: center;
      gap: 4px;
    }

    .detail-value {
      font-weight: 600;
      color: var(--yunke-text-primary-color);
    }

    .detail-label {
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
    }

    .word-count-progress {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
    }

    .progress-bar {
      height: 6px;
      background: var(--yunke-border-color);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--yunke-primary-color), var(--yunke-success-color));
      transition: width 0.3s ease;
      border-radius: 3px;
    }

    .progress-fill.over-goal {
      background: linear-gradient(90deg, var(--yunke-success-color), var(--yunke-warning-color));
    }

    .progress-text {
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
    }

    .word-count-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 10px;
      color: var(--yunke-text-secondary-color);
      border-top: 1px solid var(--yunke-border-color);
      padding-top: 6px;
      margin-top: 4px;
    }

    .compact .word-count-footer {
      display: none;
    }

    .update-status {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .update-indicator {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--yunke-success-color);
    }

    .update-indicator.updating {
      background: var(--yunke-warning-color);
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .goal-input {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 4px;
    }

    .goal-input input {
      width: 60px;
      padding: 2px 4px;
      border: 1px solid var(--yunke-border-color);
      border-radius: 3px;
      font-size: 11px;
    }

    .goal-input button {
      padding: 2px 6px;
      background: var(--yunke-primary-color);
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 10px;
    }

    .floating {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .sidebar {
      position: sticky;
      top: 20px;
      max-width: 250px;
    }
  `;

  @property({ attribute: false })
  declare model: WordCountBlockModel;

  @state()
  private _result: WordCountResult | null = null;

  @state()
  private _isUpdating = false;

  @state()
  private _showGoalInput = false;

  @state()
  private _goalValue = '';

  private _updateInterval: number | null = null;

  override connectedCallback() {
    super.connectedCallback();
    this._updateStats();
    this._setupUpdateInterval();
    this._setupModelObserver();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._clearUpdateInterval();
  }

  private _setupModelObserver() {
    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this._updateStats();
        this._setupUpdateInterval();
      })
    );
  }

  private _setupUpdateInterval() {
    this._clearUpdateInterval();
    
    if (this.model.props.realtime) {
      this._updateInterval = window.setInterval(() => {
        this._updateStats();
      }, this.model.props.updateInterval);
    }
  }

  private _clearUpdateInterval() {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
  }

  private _updateStats() {
    this._isUpdating = true;
    this.requestUpdate();
    
    setTimeout(() => {
      this._result = this.model.calculateWordCount();
      this._isUpdating = false;
      this.requestUpdate();
    }, 100);
  }

  private _toggleRealtime() {
    this.model.toggleRealtime();
  }

  private _toggleDetails() {
    const newShowDetails = !this.model.props.showDetails;
    this.model.doc.updateBlock(this.model, { showDetails: newShowDetails });
  }

  private _showGoalSetter() {
    this._showGoalInput = true;
    this._goalValue = this.model.props.goal?.toString() || '';
    this.requestUpdate();
  }

  private _setGoal() {
    const goal = parseInt(this._goalValue) || undefined;
    this.model.setGoal(goal);
    this._showGoalInput = false;
    this.requestUpdate();
  }

  private _cancelGoal() {
    this._showGoalInput = false;
    this.requestUpdate();
  }

  private _refresh() {
    this.model.clearCache();
    this._updateStats();
  }

  private _getCurrentCount(): number {
    if (!this._result) return 0;
    
    switch (this.model.props.countType) {
      case 'characters':
        return this._result.characters;
      case 'words':
        return this._result.words;
      case 'paragraphs':
        return this._result.paragraphs;
      default:
        return this._result.words;
    }
  }

  private _getCountLabel(): string {
    switch (this.model.props.countType) {
      case 'characters':
        return '字符';
      case 'words':
        return '字数';
      case 'paragraphs':
        return '段落';
      default:
        return '字数';
    }
  }

  private _renderHeader() {
    const title = this.model.props.title || '字数统计';
    
    return html`
      <div class="word-count-header">
        <div class="word-count-title">
          <span class="icon">📊</span>
          ${title}
        </div>
        <div class="word-count-actions">
          <button 
            class=${classMap({ 'action-btn': true, 'active': this.model.props.realtime })}
            @click=${this._toggleRealtime}
            title="实时更新"
          >
            ⚡
          </button>
          <button 
            class="action-btn"
            @click=${this._toggleDetails}
            title="显示详情"
          >
            ${this.model.props.showDetails ? '👁' : '👁‍🗨'}
          </button>
          <button 
            class="action-btn"
            @click=${this._showGoalSetter}
            title="设置目标"
          >
            🎯
          </button>
          <button 
            class="action-btn"
            @click=${this._refresh}
            title="刷新"
          >
            🔄
          </button>
        </div>
      </div>
    `;
  }

  private _renderMain() {
    if (!this._result) return nothing;
    
    const currentCount = this._getCurrentCount();
    const label = this._getCountLabel();
    
    return html`
      <div class="word-count-main">
        <div class="count-primary">
          <span class="count-number">${currentCount.toLocaleString()}</span>
          <span class="count-label">${label}</span>
        </div>
        ${this._result.readingTime > 0 ? html`
          <div class="count-secondary">
            📖 ${this._result.readingTime} 分钟阅读
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderDetails() {
    if (!this._result || !this.model.props.showDetails) return nothing;
    
    return html`
      <div class="word-count-details">
        <div class="detail-item">
          <div class="detail-value">${this._result.characters.toLocaleString()}</div>
          <div class="detail-label">字符</div>
        </div>
        <div class="detail-item">
          <div class="detail-value">${this._result.words.toLocaleString()}</div>
          <div class="detail-label">字数</div>
        </div>
        <div class="detail-item">
          <div class="detail-value">${this._result.paragraphs}</div>
          <div class="detail-label">段落</div>
        </div>
        <div class="detail-item">
          <div class="detail-value">${this._result.sentences}</div>
          <div class="detail-label">句子</div>
        </div>
      </div>
    `;
  }

  private _renderProgress() {
    if (!this.model.props.goal) return nothing;
    
    const progress = this.model.getProgress();
    const currentCount = this._getCurrentCount();
    const isOverGoal = progress >= 100;
    
    return html`
      <div class="word-count-progress">
        <div class="progress-header">
          <span>进度</span>
          <span>${currentCount.toLocaleString()} / ${this.model.props.goal.toLocaleString()}</span>
        </div>
        <div class="progress-bar">
          <div 
            class=${classMap({ 'progress-fill': true, 'over-goal': isOverGoal })}
            style=${styleMap({ width: `${Math.min(progress, 100)}%` })}
          ></div>
        </div>
        <div class="progress-text">
          ${progress.toFixed(1)}% 完成
          ${isOverGoal ? html`<span style="color: var(--yunke-success-color)">🎉 已达成目标!</span>` : nothing}
        </div>
      </div>
    `;
  }

  private _renderGoalInput() {
    if (!this._showGoalInput) return nothing;
    
    return html`
      <div class="goal-input">
        <span>目标:</span>
        <input 
          type="number" 
          .value=${this._goalValue}
          @input=${(e: Event) => { this._goalValue = (e.target as HTMLInputElement).value; }}
          placeholder="设置目标"
        />
        <button @click=${this._setGoal}>确定</button>
        <button @click=${this._cancelGoal}>取消</button>
      </div>
    `;
  }

  private _renderFooter() {
    if (!this._result) return nothing;
    
    return html`
      <div class="word-count-footer">
        <div class="update-status">
          <div class=${classMap({ 'update-indicator': true, 'updating': this._isUpdating })}></div>
          <span>最后更新: ${this._result.lastUpdated.toLocaleTimeString()}</span>
        </div>
        <div>
          目标块: ${this.model.props.targetBlocks.length || '整个文档'}
        </div>
      </div>
    `;
  }

  override render() {
    const theme = this.model.props.theme;
    const position = this.model.props.position;
    
    return html`
      <div class=${classMap({
        'word-count-container': true,
        [theme]: true,
        [position]: true
      })}>
        ${theme !== 'compact' ? this._renderHeader() : nothing}
        ${this._renderMain()}
        ${this._renderDetails()}
        ${this._renderProgress()}
        ${this._renderGoalInput()}
        ${theme === 'detailed' ? this._renderFooter() : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'word-count-display': WordCountDisplay;
  }
}