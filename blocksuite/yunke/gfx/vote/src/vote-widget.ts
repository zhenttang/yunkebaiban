import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

export type VoteType = 'single' | 'multiple';

export interface VoteOption {
    id: string;
    text: string;
    votes: number;
    voters: string[];
}

export interface VoteData {
    id: string;
    title: string;
    type: VoteType;
    options: VoteOption[];
    anonymous: boolean;
    closed: boolean;
    createdBy: string;
    createdAt: number;
}

// 图标
const CloseIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
</svg>
`;

const AddIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
</svg>
`;

const DeleteIcon = html`
<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
</svg>
`;

export class VoteWidget extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: block;
        }

        .vote-container {
            position: fixed;
            z-index: 100;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 20px;
            min-width: 320px;
            max-width: 400px;
            cursor: move;
            font-family: var(--yunke-font-family, sans-serif);
            user-select: none;
        }

        .vote-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }

        .vote-title-input {
            flex: 1;
            font-size: 16px;
            font-weight: 600;
            border: none;
            background: transparent;
            color: var(--yunke-text-primary-color, #333);
            padding: 4px 0;
            outline: none;
        }

        .vote-title-input::placeholder {
            color: var(--yunke-text-secondary-color, #999);
        }

        .close-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: var(--yunke-icon-color, #666);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-button:hover {
            background: var(--yunke-hover-color, #f0f0f0);
        }

        .vote-type-toggle {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
        }

        .type-button {
            flex: 1;
            padding: 8px 16px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            background: var(--yunke-background-secondary-color, #f5f5f5);
            cursor: pointer;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .type-button:first-child {
            border-radius: 6px 0 0 6px;
        }

        .type-button:last-child {
            border-radius: 0 6px 6px 0;
        }

        .type-button.active {
            background: var(--yunke-primary-color, #1e96eb);
            border-color: var(--yunke-primary-color, #1e96eb);
            color: white;
        }

        .vote-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 16px;
        }

        .option-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .option-input {
            flex: 1;
            padding: 10px 12px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 6px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
        }

        .option-input:focus {
            border-color: var(--yunke-primary-color, #1e96eb);
        }

        .delete-option {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: var(--yunke-icon-color, #666);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .delete-option:hover {
            opacity: 1;
            color: #f44336;
        }

        .add-option-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            padding: 10px;
            border: 1px dashed var(--yunke-border-color, #e0e0e0);
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .add-option-button:hover {
            border-color: var(--yunke-primary-color, #1e96eb);
            color: var(--yunke-primary-color, #1e96eb);
        }

        .vote-settings {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 16px;
            padding: 8px 0;
            border-top: 1px solid var(--yunke-border-color, #e0e0e0);
        }

        .setting-checkbox {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
            cursor: pointer;
        }

        .setting-checkbox input {
            cursor: pointer;
        }

        .submit-button {
            width: 100%;
            padding: 12px;
            background: var(--yunke-primary-color, #1e96eb);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }

        .submit-button:hover {
            background: var(--yunke-primary-hover-color, #1a85d4);
        }

        .submit-button:disabled {
            background: var(--yunke-secondary-color, #ccc);
            cursor: not-allowed;
        }

        /* 投票结果样式 */
        .vote-result {
            margin-bottom: 16px;
        }

        .result-item {
            margin-bottom: 12px;
        }

        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
        }

        .result-text {
            font-size: 14px;
            color: var(--yunke-text-primary-color, #333);
        }

        .result-count {
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
        }

        .result-bar {
            height: 8px;
            background: var(--yunke-background-secondary-color, #f0f0f0);
            border-radius: 4px;
            overflow: hidden;
        }

        .result-bar-fill {
            height: 100%;
            background: var(--yunke-primary-color, #1e96eb);
            border-radius: 4px;
            transition: width 0.3s ease;
        }

        .result-bar-fill.selected {
            background: #4caf50;
        }

        .total-votes {
            text-align: center;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
            margin-top: 12px;
        }
    `;

    @property({ attribute: false })
    accessor onClose: (() => void) | undefined;

    @property({ attribute: false })
    accessor onSubmit: ((data: VoteData) => void) | undefined;

    @state()
    private accessor _mode: 'create' | 'vote' | 'result' = 'create';

    @state()
    private accessor _title = '';

    @state()
    private accessor _type: VoteType = 'single';

    @state()
    private accessor _options: string[] = ['', ''];

    @state()
    private accessor _anonymous = false;

    @state()
    private accessor _selectedOptions: Set<number> = new Set();

    @state()
    private accessor _voteData: VoteData | null = null;

    @state()
    private accessor _posX = 100;

    @state()
    private accessor _posY = 100;

    private _isDragging = false;
    private _dragStartX = 0;
    private _dragStartY = 0;

    private _generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    private _addOption() {
        this._options = [...this._options, ''];
    }

    private _removeOption(index: number) {
        if (this._options.length <= 2) return;
        this._options = this._options.filter((_, i) => i !== index);
    }

    private _updateOption(index: number, value: string) {
        const newOptions = [...this._options];
        newOptions[index] = value;
        this._options = newOptions;
    }

    private _createVote() {
        const validOptions = this._options.filter(o => o.trim());
        if (!this._title.trim() || validOptions.length < 2) return;

        const voteData: VoteData = {
            id: this._generateId(),
            title: this._title,
            type: this._type,
            options: validOptions.map(text => ({
                id: this._generateId(),
                text,
                votes: 0,
                voters: [],
            })),
            anonymous: this._anonymous,
            closed: false,
            createdBy: '当前用户',
            createdAt: Date.now(),
        };

        this._voteData = voteData;
        this._mode = 'vote';
        this.onSubmit?.(voteData);
    }

    private _toggleOption(index: number) {
        if (this._type === 'single') {
            this._selectedOptions = new Set([index]);
        } else {
            const newSelected = new Set(this._selectedOptions);
            if (newSelected.has(index)) {
                newSelected.delete(index);
            } else {
                newSelected.add(index);
            }
            this._selectedOptions = newSelected;
        }
    }

    private _submitVote() {
        if (!this._voteData || this._selectedOptions.size === 0) return;

        // 模拟提交投票
        const newOptions = this._voteData.options.map((opt, index) => {
            if (this._selectedOptions.has(index)) {
                return {
                    ...opt,
                    votes: opt.votes + 1,
                    voters: [...opt.voters, '当前用户'],
                };
            }
            return opt;
        });

        this._voteData = {
            ...this._voteData,
            options: newOptions,
        };
        this._mode = 'result';
    }

    private _handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'BUTTON') return;
        this._isDragging = true;
        this._dragStartX = e.clientX - this._posX;
        this._dragStartY = e.clientY - this._posY;
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (!this._isDragging) return;
        this._posX = e.clientX - this._dragStartX;
        this._posY = e.clientY - this._dragStartY;
    };

    private _handleMouseUp = () => {
        this._isDragging = false;
    };

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
    }

    private _renderCreate() {
        const canSubmit = this._title.trim() && this._options.filter(o => o.trim()).length >= 2;

        return html`
            <input
                class="vote-title-input"
                type="text"
                placeholder="输入投票标题..."
                .value=${this._title}
                @input=${(e: Event) => this._title = (e.target as HTMLInputElement).value}
            />

            <div class="vote-type-toggle">
                <button
                    class="type-button ${this._type === 'single' ? 'active' : ''}"
                    @click=${() => this._type = 'single'}
                >
                    单选
                </button>
                <button
                    class="type-button ${this._type === 'multiple' ? 'active' : ''}"
                    @click=${() => this._type = 'multiple'}
                >
                    多选
                </button>
            </div>

            <div class="vote-options">
                ${this._options.map((option, index) => html`
                    <div class="option-item">
                        <input
                            class="option-input"
                            type="text"
                            placeholder="选项 ${index + 1}"
                            .value=${option}
                            @input=${(e: Event) => this._updateOption(index, (e.target as HTMLInputElement).value)}
                        />
                        ${this._options.length > 2 ? html`
                            <button
                                class="delete-option"
                                @click=${() => this._removeOption(index)}
                            >
                                ${DeleteIcon}
                            </button>
                        ` : ''}
                    </div>
                `)}
                <button class="add-option-button" @click=${this._addOption}>
                    ${AddIcon} 添加选项
                </button>
            </div>

            <div class="vote-settings">
                <label class="setting-checkbox">
                    <input
                        type="checkbox"
                        .checked=${this._anonymous}
                        @change=${(e: Event) => this._anonymous = (e.target as HTMLInputElement).checked}
                    />
                    匿名投票
                </label>
            </div>

            <button
                class="submit-button"
                ?disabled=${!canSubmit}
                @click=${this._createVote}
            >
                创建投票
            </button>
        `;
    }

    private _renderVote() {
        if (!this._voteData) return '';

        return html`
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--yunke-text-primary-color);">
                ${this._voteData.title}
            </h3>
            <p style="margin: 0 0 12px 0; font-size: 13px; color: var(--yunke-text-secondary-color);">
                ${this._voteData.type === 'single' ? '单选' : '多选'}
                ${this._voteData.anonymous ? '· 匿名' : ''}
            </p>

            <div class="vote-options">
                ${this._voteData.options.map((option, index) => html`
                    <div
                        class="option-item"
                        style="cursor: pointer; padding: 10px 12px; border: 1px solid ${this._selectedOptions.has(index) ? 'var(--yunke-primary-color)' : 'var(--yunke-border-color)'}; border-radius: 6px; background: ${this._selectedOptions.has(index) ? 'rgba(30, 150, 235, 0.1)' : 'transparent'};"
                        @click=${() => this._toggleOption(index)}
                    >
                        <input
                            type="${this._voteData?.type === 'single' ? 'radio' : 'checkbox'}"
                            name="vote-option"
                            .checked=${this._selectedOptions.has(index)}
                            style="pointer-events: none;"
                        />
                        <span style="flex: 1; font-size: 14px;">${option.text}</span>
                    </div>
                `)}
            </div>

            <button
                class="submit-button"
                ?disabled=${this._selectedOptions.size === 0}
                @click=${this._submitVote}
            >
                提交投票
            </button>
        `;
    }

    private _renderResult() {
        if (!this._voteData) return '';

        const totalVotes = this._voteData.options.reduce((sum, opt) => sum + opt.votes, 0);

        return html`
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: var(--yunke-text-primary-color);">
                ${this._voteData.title}
            </h3>

            <div class="vote-result">
                ${this._voteData.options.map((option, index) => {
                    const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                    const isSelected = this._selectedOptions.has(index);

                    return html`
                        <div class="result-item">
                            <div class="result-header">
                                <span class="result-text">${option.text}</span>
                                <span class="result-count">${option.votes} 票 (${percentage.toFixed(1)}%)</span>
                            </div>
                            <div class="result-bar">
                                <div
                                    class="result-bar-fill ${isSelected ? 'selected' : ''}"
                                    style="width: ${percentage}%"
                                ></div>
                            </div>
                        </div>
                    `;
                })}
            </div>

            <div class="total-votes">
                共 ${totalVotes} 人参与投票
            </div>
        `;
    }

    override render() {
        return html`
            <div
                class="vote-container"
                style="left: ${this._posX}px; top: ${this._posY}px;"
                @mousedown=${this._handleMouseDown}
            >
                <div class="vote-header">
                    ${this._mode === 'create' ? html`
                        <span style="font-size: 14px; font-weight: 600; color: var(--yunke-text-primary-color);">创建投票</span>
                    ` : ''}
                    <button class="close-button" @click=${() => this.onClose?.()}>
                        ${CloseIcon}
                    </button>
                </div>

                ${this._mode === 'create' ? this._renderCreate() : ''}
                ${this._mode === 'vote' ? this._renderVote() : ''}
                ${this._mode === 'result' ? this._renderResult() : ''}
            </div>
        `;
    }
}
