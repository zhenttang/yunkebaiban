import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import type { AnimationFrame, AnimationSettings, PlayMode } from '../types.js';

/**
 * 动画时间线面板
 */
export class AnimationTimelinePanel extends LitElement {
    static override styles = css`
        :host {
            display: block;
            position: fixed;
            bottom: 80px; /* 留出底部工具栏空间 */
            left: 240px; /* 留出左侧边栏空间 */
            right: 16px;
            height: 120px;
            background: var(--affine-background-primary-color, #fff);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            font-family: var(--affine-font-family);
        }

        .timeline-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 8px 16px;
            box-sizing: border-box;
        }

        /* 控制栏 */
        .controls-bar {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
        }

        .control-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border: none;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .control-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
        }

        /* 快捷操作按钮 */
        .action-btn {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .capture-btn {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
        }

        .capture-btn:hover {
            background: #1a85d4;
        }

        .add-btn {
            background: #10b981;
            color: white;
        }

        .add-btn:hover {
            background: #059669;
        }

        .control-btn.primary {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
        }

        .control-btn.primary:hover {
            background: var(--affine-primary-color-dark, #1a85d4);
        }

        .control-btn svg {
            width: 18px;
            height: 18px;
        }

        .frame-counter {
            font-size: 13px;
            color: var(--affine-text-secondary-color, #8e8d91);
            min-width: 80px;
        }

        .divider {
            width: 1px;
            height: 24px;
            background: var(--affine-border-color, #e3e2e4);
        }

        /* FPS 选择器 */
        .fps-selector {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .fps-selector label {
            font-size: 12px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .fps-selector select {
            padding: 4px 8px;
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 4px;
            font-size: 12px;
            background: white;
            cursor: pointer;
        }

        /* 播放模式选择器 */
        .play-mode-selector {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .play-mode-selector label {
            font-size: 12px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .play-mode-btn {
            padding: 4px 8px;
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 4px;
            font-size: 11px;
            background: white;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .play-mode-btn.active {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
            border-color: var(--affine-primary-color, #1e96eb);
        }

        /* 洋葱皮开关 */
        .onion-skin-toggle {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .onion-skin-toggle input {
            cursor: pointer;
        }

        /* 帧列表 */
        .frames-container {
            flex: 1;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
            overflow-x: auto;
            overflow-y: hidden;
        }

        .frames-container::-webkit-scrollbar {
            height: 6px;
        }

        .frames-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }

        .frames-container::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
        }

        /* 帧缩略图 */
        .frame-item {
            flex-shrink: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        }

        .frame-thumbnail {
            width: 60px;
            height: 60px;
            border: 2px solid var(--affine-border-color, #e3e2e4);
            border-radius: 6px;
            background: #f5f5f5;
            overflow: hidden;
            transition: all 0.15s ease;
        }

        .frame-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .frame-item.active .frame-thumbnail {
            border-color: var(--affine-primary-color, #1e96eb);
            box-shadow: 0 0 0 2px rgba(30, 150, 235, 0.2);
        }

        .frame-item:hover .frame-thumbnail {
            border-color: var(--affine-primary-color, #1e96eb);
        }

        .frame-index {
            font-size: 10px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .frame-item.active .frame-index {
            color: var(--affine-primary-color, #1e96eb);
            font-weight: 600;
        }

        /* 添加帧按钮 */
        .add-frame-btn {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 60px;
            height: 60px;
            border: 2px dashed var(--affine-border-color, #e3e2e4);
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .add-frame-btn:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            background: rgba(30, 150, 235, 0.05);
        }

        .add-frame-btn svg {
            width: 24px;
            height: 24px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        /* 帧操作菜单 */
        .frame-actions {
            position: absolute;
            top: -4px;
            right: -4px;
            display: none;
            gap: 2px;
        }

        .frame-item:hover .frame-actions {
            display: flex;
        }

        .frame-action-btn {
            width: 18px;
            height: 18px;
            border: none;
            border-radius: 4px;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .frame-action-btn:hover {
            background: rgba(0, 0, 0, 0.8);
        }

        .frame-action-btn svg {
            width: 12px;
            height: 12px;
        }

        .frame-thumbnail-wrapper {
            position: relative;
        }

        /* 关闭按钮 */
        .close-btn {
            margin-left: auto;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border: none;
            border-radius: 6px;
            background: transparent;
            cursor: pointer;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .close-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--affine-error-color, #eb4335);
        }
    `;

    @property({ type: Array })
    accessor frames: AnimationFrame[] = [];

    @property({ type: Number })
    accessor currentFrameIndex = 0;

    @property({ type: Boolean })
    accessor isPlaying = false;

    @property({ type: Object })
    accessor settings: AnimationSettings | null = null;

    override render() {
        const settings = this.settings;
        if (!settings) return nothing;

        return html`
            <div class="timeline-container">
                <!-- 控制栏 -->
                <div class="controls-bar">
                    <!-- 播放控制 -->
                    <button
                        class="control-btn"
                        title="第一帧"
                        @click=${() => this._emit('first-frame')}
                    >
                        ${this._renderIcon('skip-back')}
                    </button>
                    <button
                        class="control-btn"
                        title="上一帧"
                        @click=${() => this._emit('prev-frame')}
                    >
                        ${this._renderIcon('step-back')}
                    </button>
                    <button
                        class="control-btn primary"
                        title="${this.isPlaying ? '暂停' : '播放'}"
                        @click=${() => this._emit('toggle-play')}
                    >
                        ${this.isPlaying
                            ? this._renderIcon('pause')
                            : this._renderIcon('play')}
                    </button>
                    <button
                        class="control-btn"
                        title="下一帧"
                        @click=${() => this._emit('next-frame')}
                    >
                        ${this._renderIcon('step-forward')}
                    </button>
                    <button
                        class="control-btn"
                        title="最后一帧"
                        @click=${() => this._emit('last-frame')}
                    >
                        ${this._renderIcon('skip-forward')}
                    </button>

                    <!-- 帧计数器 -->
                    <span class="frame-counter">
                        ${this.currentFrameIndex + 1} / ${this.frames.length}
                    </span>

                    <div class="divider"></div>

                    <!-- 快捷操作按钮 -->
                    <button
                        class="action-btn capture-btn"
                        title="📷 捕获当前画面到此帧"
                        @click=${() => this._emit('capture-frame')}
                    >
                        📷 捕获
                    </button>
                    <button
                        class="action-btn add-btn"
                        title="➕ 添加新帧并切换"
                        @click=${() => this._emit('add-frame')}
                    >
                        ➕ 新帧
                    </button>

                    <div class="divider"></div>

                    <!-- FPS 选择器 -->
                    <div class="fps-selector">
                        <label>FPS:</label>
                        <select
                            .value=${String(settings.fps)}
                            @change=${this._handleFpsChange}
                        >
                            ${[6, 8, 10, 12, 15, 24, 30, 60].map(
                                fps => html`
                                    <option value=${fps}>${fps}</option>
                                `
                            )}
                        </select>
                    </div>

                    <div class="divider"></div>

                    <!-- 播放模式 -->
                    <div class="play-mode-selector">
                        <label>模式:</label>
                        ${(['loop', 'pingpong', 'oneshot'] as PlayMode[]).map(
                            mode => html`
                                <button
                                    class="play-mode-btn ${settings.playMode ===
                                    mode
                                        ? 'active'
                                        : ''}"
                                    @click=${() =>
                                        this._emit('set-play-mode', { mode })}
                                >
                                    ${this._getPlayModeLabel(mode)}
                                </button>
                            `
                        )}
                    </div>

                    <div class="divider"></div>

                    <!-- 洋葱皮开关 -->
                    <label class="onion-skin-toggle">
                        <input
                            type="checkbox"
                            .checked=${settings.onionSkin.enabled}
                            @change=${this._handleOnionSkinToggle}
                        />
                        洋葱皮
                    </label>

                    <!-- 关闭按钮 -->
                    <button
                        class="close-btn"
                        title="关闭动画模式"
                        @click=${() => this._emit('close')}
                    >
                        ${this._renderIcon('close')}
                    </button>
                </div>

                <!-- 帧列表 -->
                <div class="frames-container">
                    ${repeat(
                        this.frames,
                        frame => frame.id,
                        (frame, index) => this._renderFrame(frame, index)
                    )}

                    <!-- 添加帧按钮 -->
                    <button
                        class="add-frame-btn"
                        title="添加新帧"
                        @click=${() => this._emit('add-frame')}
                    >
                        ${this._renderIcon('plus')}
                    </button>
                </div>
            </div>
        `;
    }

    private _renderFrame(frame: AnimationFrame, index: number) {
        const isActive = index === this.currentFrameIndex;

        return html`
            <div
                class="frame-item ${isActive ? 'active' : ''}"
                @click=${() => this._emit('go-to-frame', { index })}
            >
                <div class="frame-thumbnail-wrapper">
                    <div class="frame-thumbnail">
                        ${frame.thumbnail
                            ? html`<img
                                  src=${frame.thumbnail}
                                  alt="Frame ${index + 1}"
                              />`
                            : nothing}
                    </div>
                    <div class="frame-actions">
                        <button
                            class="frame-action-btn"
                            title="复制帧"
                            @click=${(e: Event) => {
                                e.stopPropagation();
                                this._emit('duplicate-frame', { index });
                            }}
                        >
                            ${this._renderIcon('copy')}
                        </button>
                        ${this.frames.length > 1
                            ? html`
                                  <button
                                      class="frame-action-btn"
                                      title="删除帧"
                                      @click=${(e: Event) => {
                                          e.stopPropagation();
                                          this._emit('delete-frame', { index });
                                      }}
                                  >
                                      ${this._renderIcon('trash')}
                                  </button>
                              `
                            : nothing}
                    </div>
                </div>
                <span class="frame-index">${index + 1}</span>
            </div>
        `;
    }

    private _renderIcon(name: string) {
        const icons: Record<string, string> = {
            'skip-back': 'M19 5v14l-7-7 7-7zm-9 0H8v14h2V5z',
            'step-back': 'M15 5v14l-9-7 9-7z',
            play: 'M8 5v14l11-7L8 5z',
            pause: 'M6 5h4v14H6V5zm8 0h4v14h-4V5z',
            'step-forward': 'M9 5v14l9-7-9-7z',
            'skip-forward': 'M5 5v14l7-7-7-7zm9 0h2v14h-2V5z',
            plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
            copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
            trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
            close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
        };

        return html`
            <svg viewBox="0 0 24 24" fill="currentColor">
                <path d=${icons[name] || ''} />
            </svg>
        `;
    }

    private _getPlayModeLabel(mode: PlayMode): string {
        const labels: Record<PlayMode, string> = {
            loop: '循环',
            pingpong: '来回',
            oneshot: '单次',
        };
        return labels[mode];
    }

    private _handleFpsChange(e: Event) {
        const select = e.target as HTMLSelectElement;
        const fps = parseInt(select.value, 10);
        this._emit('set-fps', { fps });
    }

    private _handleOnionSkinToggle(e: Event) {
        const checkbox = e.target as HTMLInputElement;
        this._emit('toggle-onion-skin', { enabled: checkbox.checked });
    }

    private _emit(eventName: string, detail: Record<string, unknown> = {}) {
        this.dispatchEvent(
            new CustomEvent(eventName, {
                bubbles: true,
                composed: true,
                detail,
            })
        );
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'animation-timeline-panel': AnimationTimelinePanel;
    }
}
