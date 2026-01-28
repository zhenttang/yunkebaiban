import { DefaultTool } from '@blocksuite/yunke-block-surface';
import {
    EdgelessToolbarToolMixin,
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

import { LaserTool } from '../laser-tool';

// 激光笔图标
const LaserIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="18" cy="6" r="3" fill="currentColor" opacity="0.3"/>
  <circle cx="18" cy="6" r="1.5" fill="currentColor"/>
  <line x1="15.5" y1="8.5" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="5" cy="19" r="2" fill="currentColor" opacity="0.5"/>
</svg>
`;

export class EdgelessLaserToolButton extends EdgelessToolbarToolMixin(
    SignalWatcher(LitElement)
) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }
        .laser-button {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .laser-button:hover {
            background-color: var(--yunke-hover-color);
        }
        .laser-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }
        .laser-button svg {
            width: 24px;
            height: 24px;
        }
    `;

    override type = LaserTool;

    @state()
    accessor color: string = '#FF0000';

    @state()
    accessor size: number = 8;

    private _onClick() {
        if (this.edgelessTool.toolType === LaserTool) {
            // 如果已经是激光笔工具，则退出
            this.setEdgelessTool(DefaultTool);
        } else {
            this.setEdgelessTool(LaserTool, {
                color: this.color,
                size: this.size,
            });
        }
    }

    override render() {
        const isActive = this.edgelessTool.toolType === LaserTool;

        return html`
            <div
                class="laser-button"
                data-active=${isActive}
                @click=${this._onClick}
            >
                ${LaserIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    激光笔
                </yunke-tooltip>
            </div>
        `;
    }
}

export const laserQuickTool = QuickToolExtension('laser', ({ block, gfx }) => {
    const toolType = gfx.tool.currentToolName$.value;
    return {
        type: LaserTool.toolName,
        content: html`<edgeless-laser-tool-button
            .edgeless=${block}
        ></edgeless-laser-tool-button>`,
        priority: 5,
    };
});
