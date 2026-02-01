/**
 * ColorDrop 工具按钮
 * 
 * 提供一个颜色选择面板，可以拖动颜色到画布元素上填充
 */

import type { GfxController } from '@blocksuite/std/gfx';
import { LitElement, css, html } from 'lit';
import { property, state } from 'lit/decorators.js';
import { ColorDropManager } from '../color-drop-manager.js';

// 预设颜色
const PRESET_COLORS = [
    // 基础色
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    // 暖色
    '#ff6b6b', '#ffa500', '#ffd93d', '#ff8c94',
    // 冷色
    '#6bcb77', '#4d96ff', '#9b59b6', '#00d2d3',
    // 中性色
    '#95a5a6', '#7f8c8d', '#34495e', '#2c3e50',
];

export class ColorDropToolButton extends LitElement {
    static override styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .color-drop-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--yunke-icon-color, #77757d);
            padding: 8px;
        }

        .color-drop-btn:hover {
            background: var(--yunke-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--yunke-primary-color, #1e96eb);
        }

        .color-drop-btn.active {
            background: var(--yunke-hover-color-filled, rgba(30, 150, 235, 0.1));
            color: var(--yunke-primary-color, #1e96eb);
        }

        .color-drop-btn svg {
            width: 24px;
            height: 24px;
        }

        .color-drop-btn span {
            font-size: 11px;
            font-weight: 500;
        }

        /* 颜色面板 */
        .color-panel {
            position: fixed;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
            padding: 16px;
            z-index: 99999;
            display: none;
        }

        .color-panel.open {
            display: block;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .panel-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            font-weight: 700;
            color: #333;
        }

        .close-btn {
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: rgba(0, 0, 0, 0.05);
            color: #666;
        }

        .color-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin-bottom: 16px;
        }

        .color-item {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: grab;
            transition: all 0.2s;
            position: relative;
        }

        .color-item:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        .color-item:active {
            cursor: grabbing;
            transform: scale(1.15);
        }

        .color-item.selected::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 18px;
            font-weight: bold;
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .panel-tip {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            background: rgba(30, 150, 235, 0.08);
            border-radius: 8px;
            font-size: 11px;
            color: #666;
            line-height: 1.4;
        }

        .panel-tip svg {
            flex-shrink: 0;
            width: 16px;
            height: 16px;
            color: #1e96eb;
        }

        /* 自定义颜色 */
        .custom-color-section {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .custom-color-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .custom-color-input {
            flex: 1;
            height: 36px;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 0 12px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }

        .custom-color-input:focus {
            border-color: #1e96eb;
        }

        .custom-color-preview {
            width: 36px;
            height: 36px;
            border-radius: 8px;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            cursor: grab;
        }
    `;

    @property({ attribute: false })
    accessor gfx: GfxController | null = null;

    @state()
    accessor isPanelOpen = false;

    @state()
    accessor selectedColor = '#ff6b6b';

    @state()
    accessor customColor = '#1e96eb';

    private _colorDropManager: ColorDropManager | null = null;
    private _panelElement: HTMLDivElement | null = null;

    override connectedCallback() {
        super.connectedCallback();
        this._createPanel();
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._removePanel();
        this._colorDropManager?.dispose();
    }

    private _createPanel(): void {
        if (this._panelElement) return;

        const panel = document.createElement('div');
        panel.className = 'color-panel';
        panel.innerHTML = this._getPanelHTML();
        document.body.appendChild(panel);
        this._panelElement = panel;

        // 绑定事件
        this._bindPanelEvents();
    }

    private _removePanel(): void {
        if (this._panelElement) {
            this._panelElement.remove();
            this._panelElement = null;
        }
    }

    private _getPanelHTML(): string {
        const colorsHTML = PRESET_COLORS.map(color => `
            <div class="color-item ${color === this.selectedColor ? 'selected' : ''}" 
                 data-color="${color}" 
                 style="background: ${color};"
                 title="拖动填充: ${color}">
            </div>
        `).join('');

        return `
            <div class="panel-header">
                <div class="panel-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                    </svg>
                    <span>拖放填色</span>
                </div>
                <button class="close-btn" id="close-color-panel">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div class="color-grid">
                ${colorsHTML}
            </div>
            <div class="custom-color-section">
                <div class="custom-color-row">
                    <input type="text" class="custom-color-input" id="custom-color-input" 
                           value="${this.customColor}" placeholder="#1e96eb"/>
                    <div class="custom-color-preview" id="custom-color-preview" 
                         style="background: ${this.customColor};"
                         title="拖动填充自定义颜色">
                    </div>
                </div>
            </div>
            <div class="panel-tip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>拖动颜色块到形状或画笔上，松开即可填充颜色</span>
            </div>
        `;
    }

    private _bindPanelEvents(): void {
        if (!this._panelElement) return;

        // 关闭按钮
        this._panelElement.querySelector('#close-color-panel')?.addEventListener('click', () => {
            this._closePanel();
        });

        // 颜色项拖动
        this._panelElement.querySelectorAll('.color-item').forEach(item => {
            item.addEventListener('mousedown', (e) => this._startColorDrag(e as MouseEvent));
            item.addEventListener('touchstart', (e) => this._startColorDrag(e as TouchEvent), { passive: false });
            item.addEventListener('click', (e) => {
                const color = (e.target as HTMLElement).dataset.color;
                if (color) {
                    this.selectedColor = color;
                    this._updatePanelColors();
                }
            });
        });

        // 自定义颜色输入
        const customInput = this._panelElement.querySelector('#custom-color-input') as HTMLInputElement;
        const customPreview = this._panelElement.querySelector('#custom-color-preview') as HTMLDivElement;

        customInput?.addEventListener('input', (e) => {
            const value = (e.target as HTMLInputElement).value;
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.customColor = value;
                if (customPreview) {
                    customPreview.style.background = value;
                }
            }
        });

        // 自定义颜色拖动
        customPreview?.addEventListener('mousedown', (e) => this._startCustomColorDrag(e as MouseEvent));
        customPreview?.addEventListener('touchstart', (e) => this._startCustomColorDrag(e as TouchEvent), { passive: false });
    }

    private _updatePanelColors(): void {
        if (!this._panelElement) return;

        this._panelElement.querySelectorAll('.color-item').forEach(item => {
            const color = (item as HTMLElement).dataset.color;
            if (color === this.selectedColor) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    private _startColorDrag(event: MouseEvent | TouchEvent): void {
        const target = event.target as HTMLElement;
        const color = target.dataset.color;
        if (!color || !this.gfx) return;

        this._ensureManager();
        this._colorDropManager?.startDrag(color, event);
    }

    private _startCustomColorDrag(event: MouseEvent | TouchEvent): void {
        if (!this.gfx) return;

        this._ensureManager();
        this._colorDropManager?.startDrag(this.customColor, event);
    }

    private _ensureManager(): void {
        if (!this._colorDropManager && this.gfx) {
            this._colorDropManager = new ColorDropManager({
                gfx: this.gfx,
                onColorApplied: (elementId, color) => {
                    console.log('[ColorDrop] 颜色已应用到元素:', elementId, color);
                }
            });
        }
    }

    private _handleClick(): void {
        if (this.isPanelOpen) {
            this._closePanel();
        } else {
            this._openPanel();
        }
    }

    private _openPanel(): void {
        if (!this._panelElement) {
            this._createPanel();
        }
        
        if (this._panelElement) {
            // 定位面板
            const btn = this.shadowRoot?.querySelector('.color-drop-btn');
            if (btn) {
                const rect = btn.getBoundingClientRect();
                this._panelElement.style.left = `${rect.left}px`;
                this._panelElement.style.bottom = `${window.innerHeight - rect.top + 10}px`;
            }
            
            this._panelElement.classList.add('open');
            this.isPanelOpen = true;
        }
    }

    private _closePanel(): void {
        if (this._panelElement) {
            this._panelElement.classList.remove('open');
        }
        this.isPanelOpen = false;
    }

    override render() {
        return html`
            <button 
                class="color-drop-btn ${this.isPanelOpen ? 'active' : ''}"
                @click=${this._handleClick}
                title="拖放填色 - 拖动颜色到形状上填充"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                </svg>
                <span>填色</span>
            </button>
        `;
    }
}

// 注册自定义元素
if (!customElements.get('color-drop-tool-button')) {
    customElements.define('color-drop-tool-button', ColorDropToolButton);
}
