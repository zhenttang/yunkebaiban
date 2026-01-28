import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

// 计时器图标
const TimerIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2"/>
  <path d="M12 9v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M12 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

export class EdgelessTimerToolButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
        .timer-button {
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
        .timer-button:hover {
            background-color: var(--yunke-hover-color);
        }
        .timer-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }
        .timer-button svg {
            width: 24px;
            height: 24px;
        }
    `;

    @state()
    private accessor _timerVisible = false;

    private _timerWidget: HTMLElement | null = null;

    private _toggleTimer(e: Event) {
        e.stopPropagation();
        console.log('Timer button clicked, visible:', this._timerVisible);
        if (this._timerVisible) {
            this._hideTimer();
        } else {
            this._showTimer();
        }
    }

    private _showTimer() {
        if (this._timerWidget) return;

        this._timerWidget = document.createElement('timer-widget');
        // 设置弹窗位置到屏幕左上角，避免遮挡右侧面板
        (this._timerWidget as any).posX = 20;
        (this._timerWidget as any).posY = 80;
        (this._timerWidget as any).onClose = () => this._hideTimer();
        document.body.appendChild(this._timerWidget);
        this._timerVisible = true;
    }

    private _hideTimer() {
        if (this._timerWidget) {
            this._timerWidget.remove();
            this._timerWidget = null;
        }
        this._timerVisible = false;
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._hideTimer();
    }

    override render() {
        return html`
            <div
                class="timer-button"
                data-active=${this._timerVisible}
                @click=${this._toggleTimer}
            >
                ${TimerIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    计时器
                </yunke-tooltip>
            </div>
        `;
    }
}

export const timerQuickTool = QuickToolExtension('timer', () => {
    return {
        type: 'timer',
        content: html`<edgeless-timer-tool-button></edgeless-timer-tool-button>`,
        priority: 4,
    };
});
