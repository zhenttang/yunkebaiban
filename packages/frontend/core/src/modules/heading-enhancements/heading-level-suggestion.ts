import { WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { ParagraphBlockModel } from '@blocksuite/yunke-model';
import type { LevelSuggestion, LevelIssue } from './smart-level-detector';
import { SmartHeadingLevelDetector } from './smart-level-detector';

export class HeadingLevelSuggestion extends WithDisposable(ShadowlessElement) {
  static override styles = css`
    .heading-level-suggestion {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(91, 156, 255, 0.1);
      border: 1px solid rgba(91, 156, 255, 0.3);
      border-radius: 6px;
      font-size: 12px;
      color: #5B9CFF;
      transition: all 0.2s ease;
      cursor: pointer;
      user-select: none;
      margin-left: 8px;
    }

    .heading-level-suggestion:hover {
      background: rgba(91, 156, 255, 0.15);
      border-color: rgba(91, 156, 255, 0.4);
      transform: translateY(-1px);
    }

    .heading-level-suggestion.high-confidence {
      background: rgba(76, 175, 80, 0.1);
      border-color: rgba(76, 175, 80, 0.3);
      color: #4CAF50;
    }

    .heading-level-suggestion.low-confidence {
      background: rgba(255, 152, 0, 0.1);
      border-color: rgba(255, 152, 0, 0.3);
      color: #FF9800;
    }

    .suggestion-icon {
      font-size: 14px;
      line-height: 1;
    }

    .suggestion-text {
      font-weight: 500;
      white-space: nowrap;
    }

    .suggestion-actions {
      display: flex;
      gap: 4px;
      margin-left: 8px;
    }

    .suggestion-btn {
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      font-size: 10px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .suggestion-btn:hover {
      background: rgba(255, 255, 255, 1);
      border-color: rgba(0, 0, 0, 0.2);
    }

    .suggestion-btn.apply {
      background: rgba(76, 175, 80, 0.8);
      color: white;
      border-color: rgba(76, 175, 80, 0.3);
    }

    .suggestion-btn.apply:hover {
      background: rgba(76, 175, 80, 1);
    }

    .suggestion-btn.dismiss {
      background: rgba(158, 158, 158, 0.8);
      color: white;
      border-color: rgba(158, 158, 158, 0.3);
    }

    .suggestion-btn.dismiss:hover {
      background: rgba(158, 158, 158, 1);
    }

    .suggestion-details {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      padding: 8px;
      font-size: 11px;
      color: #666;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      margin-top: 4px;
    }

    .suggestion-reason {
      margin-bottom: 6px;
      line-height: 1.4;
    }

    .suggestion-confidence {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      color: #999;
    }

    .confidence-bar {
      width: 40px;
      height: 3px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 2px;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #FF9800, #4CAF50);
      transition: width 0.3s ease;
    }

    .hidden {
      display: none;
    }
  `;

  @property({ attribute: false })
  model!: ParagraphBlockModel;

  @state()
  private _suggestion: LevelSuggestion | null = null;

  @state()
  private _issues: LevelIssue[] = [];

  @state()
  private _showDetails = false;

  @state()
  private _detector = new SmartHeadingLevelDetector();

  override connectedCallback() {
    super.connectedCallback();
    this._updateSuggestion();
    this._setupModelObserver();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
  }

  private _setupModelObserver() {
    // 监听模型变化
    this.disposables.add(
      this.model.propsUpdated.on(() => {
        this._updateSuggestion();
      })
    );

    // 监听文本变化
    this.disposables.add(
      this.model.text.yText.observe(() => {
        this._updateSuggestion();
      })
    );
  }

  private _updateSuggestion() {
    this._suggestion = this._detector.generateLevelSuggestion(this.model);
    this._issues = this._detector.detectLevelIssues(this.model);
    this.requestUpdate();
  }

  private _applySuggestion() {
    if (!this._suggestion) return;

    const newLevel = parseInt(this._suggestion.suggestedLevel.replace('h', ''));
    this._detector.applyLevelAdjustment(this.model, newLevel);
    
    // 发送应用事件
    this.dispatchEvent(new CustomEvent('suggestion-applied', {
      detail: {
        blockId: this.model.id,
        fromLevel: this._suggestion.currentLevel,
        toLevel: this._suggestion.suggestedLevel,
        reason: this._suggestion.reason
      }
    }));

    this._suggestion = null;
    this.requestUpdate();
  }

  private _dismissSuggestion() {
    this._suggestion = null;
    this.requestUpdate();
    
    // 发送忽略事件
    this.dispatchEvent(new CustomEvent('suggestion-dismissed', {
      detail: {
        blockId: this.model.id,
        suggestion: this._suggestion
      }
    }));
  }

  private _toggleDetails() {
    this._showDetails = !this._showDetails;
    this.requestUpdate();
  }

  private _getConfidenceClass(confidence: number): string {
    if (confidence >= 0.8) return 'high-confidence';
    if (confidence <= 0.4) return 'low-confidence';
    return '';
  }

  private _getConfidenceIcon(confidence: number): string {
    if (confidence >= 0.8) return '✨';
    if (confidence >= 0.6) return '💡';
    if (confidence >= 0.4) return '🤔';
    return '❓';
  }

  override render() {
    if (!this._suggestion) return nothing;

    const confidenceClass = this._getConfidenceClass(this._suggestion.confidence);
    const confidenceIcon = this._getConfidenceIcon(this._suggestion.confidence);

    return html`
      <div 
        class=${classMap({
          'heading-level-suggestion': true,
          [confidenceClass]: true
        })}
        @click=${this._toggleDetails}
      >
        <span class="suggestion-icon">${confidenceIcon}</span>
        <span class="suggestion-text">
          建议使用 ${this._suggestion.suggestedLevel}
        </span>
        
        <div class="suggestion-actions" @click=${(e: Event) => e.stopPropagation()}>
          <button 
            class="suggestion-btn apply"
            @click=${this._applySuggestion}
            title="应用建议"
          >
            ✓
          </button>
          <button 
            class="suggestion-btn dismiss"
            @click=${this._dismissSuggestion}
            title="忽略建议"
          >
            ✕
          </button>
        </div>

        <div class=${classMap({
          'suggestion-details': true,
          'hidden': !this._showDetails
        })}>
          <div class="suggestion-reason">
            ${this._suggestion.reason}
          </div>
          <div class="suggestion-confidence">
            <span>置信度:</span>
            <div class="confidence-bar">
              <div 
                class="confidence-fill"
                style="width: ${this._suggestion.confidence * 100}%"
              ></div>
            </div>
            <span>${Math.round(this._suggestion.confidence * 100)}%</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'heading-level-suggestion': HeadingLevelSuggestion;
  }
}