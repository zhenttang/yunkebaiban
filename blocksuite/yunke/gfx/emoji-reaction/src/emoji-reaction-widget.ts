import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

export interface EmojiReaction {
    id: string;
    emoji: string;
    userId: string;
    userName: string;
    timestamp: number;
    x: number;
    y: number;
}

// 预定义的表情列表
export const EMOJI_LIST = [
    { emoji: '👍', label: '赞' },
    { emoji: '👏', label: '鼓掌' },
    { emoji: '❤️', label: '喜欢' },
    { emoji: '😊', label: '开心' },
    { emoji: '🎉', label: '庆祝' },
    { emoji: '🤔', label: '思考' },
    { emoji: '❓', label: '疑问' },
    { emoji: '✅', label: '同意' },
    { emoji: '❌', label: '反对' },
    { emoji: '🔥', label: '火热' },
];

export class EmojiReactionWidget extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            position: fixed;
            z-index: 9999;
            font-family: var(--yunke-font-family);
        }

        .emoji-container {
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 12px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            max-width: 280px;
        }

        .emoji-button {
            width: 44px;
            height: 44px;
            border: none;
            background: var(--yunke-background-secondary-color, #f5f5f5);
            border-radius: 8px;
            cursor: pointer;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            position: relative;
        }

        .emoji-button:hover {
            background: var(--yunke-hover-color, #e8e8e8);
            transform: scale(1.1);
        }

        .emoji-button:active {
            transform: scale(0.95);
        }

        .emoji-label {
            position: absolute;
            bottom: -20px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            color: var(--yunke-text-secondary-color, #666);
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }

        .emoji-button:hover .emoji-label {
            opacity: 1;
        }
    `;

    @property({ attribute: false })
    accessor onSelect: ((emoji: string) => void) | undefined;

    @property({ attribute: false })
    accessor onClose: (() => void) | undefined;

    @property({ type: Number })
    accessor posX = 100;

    @property({ type: Number })
    accessor posY = 100;

    private _handleEmojiClick(emoji: string) {
        this.onSelect?.(emoji);
    }

    override render() {
        return html`
            <div
                class="emoji-container"
                style="left: ${this.posX}px; top: ${this.posY}px;"
            >
                ${EMOJI_LIST.map(
                    item => html`
                        <button
                            class="emoji-button"
                            @click=${() => this._handleEmojiClick(item.emoji)}
                            title=${item.label}
                        >
                            ${item.emoji}
                            <span class="emoji-label">${item.label}</span>
                        </button>
                    `
                )}
            </div>
        `;
    }
}

// 飘动的表情组件
export class FloatingEmoji extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }

        .floating-emoji {
            position: fixed;
            pointer-events: none;
            z-index: 100;
            font-size: 32px;
            animation: float-up 2s ease-out forwards;
        }

        @keyframes float-up {
            0% {
                transform: translateY(0) scale(0.5);
                opacity: 0;
            }
            10% {
                opacity: 1;
                transform: translateY(-10px) scale(1);
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100px) scale(0.8);
                opacity: 0;
            }
        }

        .user-name {
            position: absolute;
            bottom: -16px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10px;
            color: var(--yunke-text-secondary-color, #666);
            background: rgba(255, 255, 255, 0.9);
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }
    `;

    @property({ type: String })
    accessor emoji = '';

    @property({ type: String })
    accessor userName = '';

    @property({ type: Number })
    accessor posX = 0;

    @property({ type: Number })
    accessor posY = 0;

    override render() {
        return html`
            <div
                class="floating-emoji"
                style="left: ${this.posX}px; top: ${this.posY}px;"
            >
                ${this.emoji}
                ${this.userName ? html`<span class="user-name">${this.userName}</span>` : ''}
            </div>
        `;
    }
}
