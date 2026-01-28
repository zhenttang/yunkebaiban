import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

// 预定义的便签颜色
export const NOTE_COLORS = [
    { name: '黄色', value: '--yunke-note-background-yellow', hex: '#FFF9C4' },
    { name: '粉色', value: '--yunke-note-background-pink', hex: '#F8BBD9' },
    { name: '蓝色', value: '--yunke-note-background-blue', hex: '#BBDEFB' },
    { name: '绿色', value: '--yunke-note-background-green', hex: '#C8E6C9' },
    { name: '紫色', value: '--yunke-note-background-purple', hex: '#E1BEE7' },
    { name: '橙色', value: '--yunke-note-background-orange', hex: '#FFE0B2' },
    { name: '青色', value: '--yunke-note-background-cyan', hex: '#B2EBF2' },
    { name: '灰色', value: '--yunke-note-background-grey', hex: '#E0E0E0' },
    { name: '白色', value: '--yunke-note-background-white', hex: '#FFFFFF' },
];

export class NoteColorPanel extends LitElement {
    static override styles = css`
        :host {
            display: block;
        }

        .color-panel {
            padding: 8px;
        }

        .color-panel-title {
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            margin-bottom: 8px;
            padding: 0 4px;
        }

        .color-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
        }

        .color-item {
            width: 28px;
            height: 28px;
            border-radius: 6px;
            cursor: pointer;
            border: 2px solid transparent;
            transition: all 0.2s;
            position: relative;
        }

        .color-item:hover {
            transform: scale(1.1);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .color-item.selected {
            border-color: var(--yunke-primary-color, #1e96eb);
        }

        .color-item.selected::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            color: var(--yunke-text-primary-color, #333);
        }

        .color-item[data-color='white'] {
            border: 1px solid var(--yunke-border-color, #e0e0e0);
        }
    `;

    @property({ type: String })
    accessor selectedColor = NOTE_COLORS[0].value;

    @property({ attribute: false })
    accessor onColorChange: ((color: string) => void) | undefined;

    private _handleColorClick(color: string) {
        this.selectedColor = color;
        this.onColorChange?.(color);
    }

    override render() {
        return html`
            <div class="color-panel">
                <div class="color-panel-title">便签颜色</div>
                <div class="color-grid">
                    ${NOTE_COLORS.map(
                        color => html`
                            <div
                                class="color-item ${this.selectedColor === color.value ? 'selected' : ''}"
                                data-color=${color.name === '白色' ? 'white' : ''}
                                style="background-color: ${color.hex}"
                                title=${color.name}
                                @click=${() => this._handleColorClick(color.value)}
                            ></div>
                        `
                    )}
                </div>
            </div>
        `;
    }
}
