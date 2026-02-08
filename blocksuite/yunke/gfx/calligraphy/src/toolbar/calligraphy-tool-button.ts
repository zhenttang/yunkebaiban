/**
 * 连笔字帖工具栏按钮
 */

import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

// 毛笔图标
const CalligraphyIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9.5 3C7.5 3 6 4.5 6 6.5C6 8.5 7 10 8.5 11.5L7 21H17L15.5 11.5C17 10 18 8.5 18 6.5C18 4.5 16.5 3 14.5 3H9.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <path d="M10 7C10 7.55228 10.4477 8 11 8H13C13.5523 8 14 7.55228 14 7V6C14 5.44772 13.5523 5 13 5H11C10.4477 5 10 5.44772 10 6V7Z" fill="currentColor"/>
</svg>
`;

export class EdgelessCalligraphyToolButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
        .calligraphy-button {
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
        .calligraphy-button:hover {
            background-color: var(--yunke-hover-color);
        }
        .calligraphy-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }
        .calligraphy-button svg {
            width: 24px;
            height: 24px;
        }
    `;

    @state()
    private accessor _widgetVisible = false;

    private _widgetElement: HTMLElement | null = null;

    private _toggleWidget(e: Event): void {
        e.stopPropagation();
        if (this._widgetVisible) {
            this._hideWidget();
        } else {
            this._showWidget();
        }
    }

    private _showWidget(): void {
        if (this._widgetElement) return;

        this._widgetElement = document.createElement('calligraphy-widget');
        // 设置弹窗位置到屏幕左上角
        (this._widgetElement as any).posX = 20;
        (this._widgetElement as any).posY = 80;
        (this._widgetElement as any).onClose = () => this._hideWidget();
        document.body.appendChild(this._widgetElement);
        this._widgetVisible = true;
    }

    private _hideWidget(): void {
        if (this._widgetElement) {
            this._widgetElement.remove();
            this._widgetElement = null;
        }
        this._widgetVisible = false;
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        this._hideWidget();
    }

    override render() {
        return html`
            <div
                class="calligraphy-button"
                data-active=${this._widgetVisible}
                @click=${this._toggleWidget}
            >
                ${CalligraphyIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    连笔字帖
                </yunke-tooltip>
            </div>
        `;
    }
}

export const calligraphyQuickTool = QuickToolExtension('calligraphy', () => {
    return {
        type: 'calligraphy',
        content: html`<edgeless-calligraphy-tool-button></edgeless-calligraphy-tool-button>`,
        priority: 5,
    };
});
