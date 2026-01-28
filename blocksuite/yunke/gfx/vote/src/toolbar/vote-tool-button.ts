import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

// 投票图标
const VoteIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19c1.1 0 2-.89 2-2v-4l-3-3zm-1-5.05l-4.95 4.95-3.54-3.54 4.95-4.95L17 7.95zm-4.24-5.66L6.39 8.66a.996.996 0 000 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36a.996.996 0 000-1.41l-4.95-4.95a.996.996 0 00-1.41 0z" fill="currentColor"/>
</svg>
`;

export class EdgelessVoteToolButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }

        .vote-button {
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

        .vote-button:hover {
            background-color: var(--yunke-hover-color);
        }

        .vote-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }

        .vote-button svg {
            width: 24px;
            height: 24px;
        }
    `;

    @state()
    private accessor _voteVisible = false;

    private _voteWidget: HTMLElement | null = null;

    private _toggleVote(e: Event) {
        e.stopPropagation();
        console.log('Vote button clicked, visible:', this._voteVisible);
        if (this._voteVisible) {
            this._hideVote();
        } else {
            this._showVote();
        }
    }

    private _showVote() {
        if (this._voteWidget) return;

        this._voteWidget = document.createElement('vote-widget');
        // 设置弹窗位置到屏幕左上角，避免遮挡右侧面板
        (this._voteWidget as any).posX = 20;
        (this._voteWidget as any).posY = 80;
        (this._voteWidget as any).onClose = () => this._hideVote();
        document.body.appendChild(this._voteWidget);
        this._voteVisible = true;
    }

    private _hideVote() {
        if (this._voteWidget) {
            this._voteWidget.remove();
            this._voteWidget = null;
        }
        this._voteVisible = false;
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._hideVote();
    }

    override render() {
        return html`
            <div
                class="vote-button"
                data-active=${this._voteVisible}
                @click=${this._toggleVote}
            >
                ${VoteIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    投票
                </yunke-tooltip>
            </div>
        `;
    }
}

export const voteQuickTool = QuickToolExtension('vote', () => {
    return {
        type: 'vote',
        content: html`<edgeless-vote-tool-button></edgeless-vote-tool-button>`,
        priority: 2,
    };
});
