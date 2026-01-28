import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

import { EMOJI_LIST } from '../emoji-reaction-widget';

// 表情图标
const EmojiIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/>
  <circle cx="9" cy="10" r="1.5" fill="currentColor"/>
  <circle cx="15" cy="10" r="1.5" fill="currentColor"/>
  <path d="M8 14c.5 1.5 2 3 4 3s3.5-1.5 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

export class EdgelessEmojiToolButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            position: relative;
        }

        .emoji-button {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            color: var(--yunke-icon-color, #666);
        }

        .emoji-button:hover {
            background-color: var(--yunke-hover-color);
        }

        .emoji-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }

        .emoji-button svg {
            width: 24px;
            height: 24px;
        }

        .emoji-popover {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 8px;
            display: flex;
            gap: 4px;
            z-index: 100;
        }

        .emoji-popover[hidden] {
            display: none;
        }

        .emoji-item {
            width: 36px;
            height: 36px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            font-size: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .emoji-item:hover {
            background: var(--yunke-hover-color, #e8e8e8);
            transform: scale(1.15);
        }
    `;

    @state()
    private accessor _popoverVisible = false;

    private _floatingEmojis: HTMLElement[] = [];

    private _togglePopover(e: Event) {
        e.stopPropagation();
        this._popoverVisible = !this._popoverVisible;
    }

    private _hidePopover() {
        this._popoverVisible = false;
    }

    private _sendEmoji(emoji: string) {
        // 创建飘动的表情
        this._createFloatingEmoji(emoji);
        this._hidePopover();
    }

    private _createFloatingEmoji(emoji: string) {
        const floatingEmoji = document.createElement('floating-emoji');
        (floatingEmoji as any).emoji = emoji;
        (floatingEmoji as any).userName = '我';

        // 随机位置在屏幕底部中央区域
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
        const y = window.innerHeight - 100;
        (floatingEmoji as any).posX = x;
        (floatingEmoji as any).posY = y;

        document.body.appendChild(floatingEmoji);
        this._floatingEmojis.push(floatingEmoji);

        // 动画结束后移除
        setTimeout(() => {
            floatingEmoji.remove();
            this._floatingEmojis = this._floatingEmojis.filter(e => e !== floatingEmoji);
        }, 2000);
    }

    private _handleClickOutside = (e: MouseEvent) => {
        if (!this.contains(e.target as Node)) {
            this._hidePopover();
        }
    };

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('click', this._handleClickOutside);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('click', this._handleClickOutside);
        // 清理所有飘动的表情
        this._floatingEmojis.forEach(e => e.remove());
        this._floatingEmojis = [];
    }

    override render() {
        return html`
            <div
                class="emoji-button"
                data-active=${this._popoverVisible}
                @click=${this._togglePopover}
            >
                ${EmojiIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    表情反馈
                </yunke-tooltip>
            </div>

            <div class="emoji-popover" ?hidden=${!this._popoverVisible}>
                ${EMOJI_LIST.slice(0, 6).map(
                    item => html`
                        <button
                            class="emoji-item"
                            @click=${(e: Event) => {
                                e.stopPropagation();
                                this._sendEmoji(item.emoji);
                            }}
                            title=${item.label}
                        >
                            ${item.emoji}
                        </button>
                    `
                )}
            </div>
        `;
    }
}

export const emojiQuickTool = QuickToolExtension('emoji-reaction', () => {
    return {
        type: 'emoji-reaction',
        content: html`<edgeless-emoji-tool-button></edgeless-emoji-tool-button>`,
        priority: 3,
    };
});
