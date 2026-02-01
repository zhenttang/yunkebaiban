/**
 * 专业时间轴编辑器组件
 * 
 * 功能：
 * - 帧缩略图显示
 * - 拖拽排序
 * - 关键帧标记
 * - 播放头控制
 * - 缩放和滚动
 */

import { LitElement, html, css, type PropertyValues } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { FrameData, OnionSkinSettings, PlayMode } from '../types/index.js';

// ==================== 事件接口 ====================

export interface TimelineEvents {
    'frame-select': { index: number };
    'frame-add': { index: number };
    'frame-delete': { index: number };
    'frame-duplicate': { index: number };
    'frame-move': { from: number; to: number };
    'play': void;
    'pause': void;
    'stop': void;
    'seek': { frame: number };
    'fps-change': { fps: number };
    'play-mode-change': { mode: PlayMode };
    'onion-skin-toggle': { enabled: boolean };
    'onion-skin-change': OnionSkinSettings;
}

// ==================== 组件 ====================

@customElement('animation-timeline-editor')
export class AnimationTimelineEditor extends LitElement {
    static override styles = css`
        /* ========================================
         * 云客白板动画系统 - 时间轴编辑器
         * 设计规范：
         * - 主色: #1e96eb
         * - 圆角: 8px
         * - 过渡: cubic-bezier(0.4, 0, 0.2, 1)
         * ======================================== */
        
        :host {
            display: flex;
            flex-direction: column;
            background: var(--affine-background-secondary-color, #f5f5f5);
            color: var(--affine-text-primary-color, #141414);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            user-select: none;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        /* 深色模式 */
        :host([theme="dark"]) {
            --affine-background-secondary-color: #1e1e2e;
            --affine-background-tertiary-color: #2a2a3e;
            --affine-text-primary-color: #e6e6e6;
            --affine-text-secondary-color: #929292;
            --affine-border-color: #414141;
            --affine-hover-color: rgba(255, 255, 255, 0.08);
        }
        
        /* 控制栏 */
        .controls {
            display: flex;
            align-items: center;
            gap: 16px;
            padding: 12px 16px;
            background: var(--affine-background-tertiary-color, #ffffff);
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        /* 播放按钮 */
        .playback-btn {
            width: 32px;
            height: 32px;
            border: none;
            background: transparent;
            color: var(--affine-text-secondary-color, #7a7a7a);
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .playback-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-1px);
        }
        
        .playback-btn:active {
            transform: translateY(0);
        }
        
        .playback-btn.primary {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(30, 150, 235, 0.3);
        }
        
        .playback-btn.primary:hover {
            background: #1a85d4;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(30, 150, 235, 0.4);
        }
        
        .playback-btn.primary:active {
            transform: scale(1);
        }
        
        .playback-btn svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }
        
        /* 帧计数器 */
        .frame-counter {
            font-size: 14px;
            min-width: 100px;
            color: var(--affine-text-secondary-color, #7a7a7a);
        }
        
        .frame-counter .current {
            font-size: 18px;
            font-weight: 600;
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 选项 */
        .options {
            margin-left: auto;
            display: flex;
            gap: 8px;
            align-items: center;
        }
        
        .select-input {
            background: var(--affine-background-secondary-color, #f5f5f5);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            color: var(--affine-text-primary-color, #141414);
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .select-input:hover {
            border-color: var(--affine-primary-color, #1e96eb);
        }
        
        .select-input:focus {
            outline: none;
            border-color: var(--affine-primary-color, #1e96eb);
            box-shadow: 0 0 0 3px rgba(30, 150, 235, 0.15);
        }
        
        .toggle-btn {
            padding: 6px 12px;
            background: var(--affine-background-secondary-color, #f5f5f5);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            color: var(--affine-text-secondary-color, #7a7a7a);
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .toggle-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-1px);
        }
        
        .toggle-btn.active {
            background: rgba(30, 150, 235, 0.1);
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 时间轴区域 */
        .timeline-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: var(--affine-background-secondary-color, #f5f5f5);
        }
        
        /* 时间刻度 */
        .time-ruler {
            height: 24px;
            background: var(--affine-background-tertiary-color, #ffffff);
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
            position: relative;
        }
        
        .time-ruler canvas {
            width: 100%;
            height: 100%;
        }
        
        /* 帧轨道 */
        .frame-track {
            flex: 1;
            display: flex;
            align-items: center;
            padding: 12px 16px;
            gap: 8px;
            overflow-x: auto;
            overflow-y: hidden;
        }
        
        .frame-track::-webkit-scrollbar {
            height: 6px;
        }
        
        .frame-track::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .frame-track::-webkit-scrollbar-thumb {
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 3px;
        }
        
        .frame-track::-webkit-scrollbar-thumb:hover {
            background: var(--affine-text-secondary-color, #7a7a7a);
        }
        
        /* 帧缩略图 */
        .frame-item {
            flex-shrink: 0;
            width: var(--frame-width, 80px);
            height: var(--frame-height, 60px);
            background: var(--affine-background-tertiary-color, #ffffff);
            border: 2px solid var(--affine-border-color, #e3e2e4);
            border-radius: 8px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .frame-item:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .frame-item.selected {
            border-color: var(--affine-primary-color, #1e96eb);
            box-shadow: 0 0 0 3px rgba(30, 150, 235, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .frame-item.dragging {
            opacity: 0.5;
            transform: scale(0.95);
        }
        
        .frame-item.drop-target {
            border-color: var(--affine-primary-color, #1e96eb);
            border-style: dashed;
            background: rgba(30, 150, 235, 0.05);
        }
        
        .frame-item img,
        .frame-item canvas {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .frame-number {
            position: absolute;
            bottom: 4px;
            left: 4px;
            font-size: 10px;
            font-weight: 500;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .frame-duration {
            position: absolute;
            bottom: 4px;
            right: 4px;
            font-size: 10px;
            font-weight: 500;
            background: var(--affine-primary-color, #1e96eb);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
        }
        
        .frame-keyframe-marker {
            position: absolute;
            top: 4px;
            right: 4px;
            width: 10px;
            height: 10px;
            background: #fbbf24;
            border-radius: 2px;
            transform: rotate(45deg);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        /* 帧菜单 */
        .frame-menu {
            position: absolute;
            top: 4px;
            left: 4px;
            display: none;
            gap: 4px;
        }
        
        .frame-item:hover .frame-menu {
            display: flex;
        }
        
        .frame-menu-btn {
            width: 22px;
            height: 22px;
            border: none;
            background: rgba(0, 0, 0, 0.6);
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
        }
        
        .frame-menu-btn:hover {
            background: var(--affine-primary-color, #1e96eb);
        }
        
        /* 添加帧按钮 */
        .add-frame-btn {
            flex-shrink: 0;
            width: var(--frame-width, 80px);
            height: var(--frame-height, 60px);
            background: transparent;
            border: 2px dashed var(--affine-border-color, #e3e2e4);
            border-radius: 8px;
            color: var(--affine-text-secondary-color, #7a7a7a);
            font-size: 24px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .add-frame-btn:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
            background: rgba(30, 150, 235, 0.05);
            transform: translateY(-2px);
        }
        
        /* 播放头 */
        .playhead {
            position: absolute;
            top: 0;
            width: 2px;
            height: 100%;
            background: var(--affine-primary-color, #1e96eb);
            pointer-events: none;
            z-index: 10;
        }
        
        .playhead::before {
            content: '';
            position: absolute;
            top: 0;
            left: -6px;
            width: 14px;
            height: 14px;
            background: var(--affine-primary-color, #1e96eb);
            clip-path: polygon(50% 100%, 0 0, 100% 0);
        }
        
        /* 洋葱皮设置面板 */
        .onion-skin-panel {
            display: none;
            padding: 12px 16px;
            background: var(--affine-background-tertiary-color, #ffffff);
            border-top: 1px solid var(--affine-border-color, #e3e2e4);
            gap: 16px;
            flex-wrap: wrap;
        }
        
        .onion-skin-panel.visible {
            display: flex;
        }
        
        .onion-setting {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .onion-setting label {
            font-size: 13px;
            color: var(--affine-text-secondary-color, #7a7a7a);
        }
        
        .onion-setting input[type="range"] {
            width: 80px;
            accent-color: var(--affine-primary-color, #1e96eb);
        }
        
        .onion-setting input[type="color"] {
            width: 28px;
            height: 28px;
            border: 2px solid var(--affine-border-color, #e3e2e4);
            border-radius: 6px;
            cursor: pointer;
            padding: 2px;
        }
        
        .onion-setting input[type="color"]:hover {
            border-color: var(--affine-primary-color, #1e96eb);
        }
    `;

    // ==================== 属性 ====================
    
    @property({ type: Array })
    frames: FrameData[] = [];
    
    @property({ type: Number })
    currentFrame = 0;
    
    @property({ type: Number })
    fps = 24;
    
    @property({ type: Boolean })
    isPlaying = false;
    
    @property({ type: String })
    playMode: PlayMode = 'loop';
    
    @property({ type: Object })
    onionSkin: OnionSkinSettings = {
        enabled: true,
        framesAhead: 2,
        framesBehind: 2,
        opacityAhead: 0.25,
        opacityBehind: 0.25,
        colorAhead: { r: 0, g: 200, b: 100, a: 0.5 },
        colorBehind: { r: 200, g: 100, b: 0, a: 0.5 },
        mode: 'tint',
        skinOpacityFalloff: 'linear',
    };
    
    @property({ type: Number })
    frameWidth = 80;
    
    @property({ type: Number })
    frameHeight = 60;
    
    // ==================== 状态 ====================
    
    @state()
    private showOnionPanel = false;
    
    @state()
    private draggedFrame: number | null = null;
    
    @state()
    private dropTarget: number | null = null;
    
    // ==================== 查询 ====================
    
    @query('.frame-track')
    private frameTrack!: HTMLElement;
    
    // ==================== 渲染 ====================
    
    override render() {
        return html`
            <div class="controls">
                <div class="control-group">
                    <button class="playback-btn" @click=${this.handleFirstFrame} title="第一帧">
                        <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/></svg>
                    </button>
                    <button class="playback-btn" @click=${this.handlePrevFrame} title="上一帧">
                        <svg viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                    </button>
                    <button class="playback-btn primary" @click=${this.handlePlayPause} title="${this.isPlaying ? '暂停' : '播放'}">
                        ${this.isPlaying
                            ? html`<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`
                            : html`<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>`
                        }
                    </button>
                    <button class="playback-btn" @click=${this.handleNextFrame} title="下一帧">
                        <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zm2 0V6l6.5 6L8 18zm8-12h2v12h-2z"/></svg>
                    </button>
                    <button class="playback-btn" @click=${this.handleLastFrame} title="最后一帧">
                        <svg viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                    </button>
                </div>
                
                <div class="frame-counter">
                    <span class="current">${this.currentFrame + 1}</span>
                    <span> / ${this.frames.length}</span>
                </div>
                
                <div class="options">
                    <select class="select-input" @change=${this.handleFpsChange}>
                        ${[8, 12, 15, 24, 25, 30, 60].map(fps => html`
                            <option value=${fps} ?selected=${fps === this.fps}>${fps} FPS</option>
                        `)}
                    </select>
                    
                    <select class="select-input" @change=${this.handlePlayModeChange}>
                        <option value="once" ?selected=${this.playMode === 'once'}>单次</option>
                        <option value="loop" ?selected=${this.playMode === 'loop'}>循环</option>
                        <option value="pingpong" ?selected=${this.playMode === 'pingpong'}>往返</option>
                    </select>
                    
                    <button 
                        class="toggle-btn ${this.onionSkin.enabled ? 'active' : ''}"
                        @click=${this.handleOnionSkinToggle}
                    >
                        🧅 洋葱皮
                    </button>
                    
                    <button 
                        class="toggle-btn ${this.showOnionPanel ? 'active' : ''}"
                        @click=${() => this.showOnionPanel = !this.showOnionPanel}
                    >
                        ⚙️
                    </button>
                </div>
            </div>
            
            <div class="timeline-area">
                <div class="frame-track" @scroll=${this.handleTrackScroll}>
                    ${repeat(
                        this.frames,
                        frame => frame.id,
                        (frame, index) => this.renderFrame(frame, index)
                    )}
                    <button class="add-frame-btn" @click=${this.handleAddFrame}>+</button>
                </div>
            </div>
            
            <div class="onion-skin-panel ${this.showOnionPanel ? 'visible' : ''}">
                <div class="onion-setting">
                    <label>前帧:</label>
                    <input type="range" min="0" max="5" 
                        .value=${String(this.onionSkin.framesAhead)}
                        @input=${(e: Event) => this.handleOnionChange('framesAhead', (e.target as HTMLInputElement).valueAsNumber)}
                    >
                    <span>${this.onionSkin.framesAhead}</span>
                </div>
                
                <div class="onion-setting">
                    <label>后帧:</label>
                    <input type="range" min="0" max="5"
                        .value=${String(this.onionSkin.framesBehind)}
                        @input=${(e: Event) => this.handleOnionChange('framesBehind', (e.target as HTMLInputElement).valueAsNumber)}
                    >
                    <span>${this.onionSkin.framesBehind}</span>
                </div>
                
                <div class="onion-setting">
                    <label>前帧色:</label>
                    <input type="color" value="#00c864"
                        @input=${(e: Event) => this.handleOnionColorChange('colorAhead', (e.target as HTMLInputElement).value)}
                    >
                </div>
                
                <div class="onion-setting">
                    <label>后帧色:</label>
                    <input type="color" value="#c86400"
                        @input=${(e: Event) => this.handleOnionColorChange('colorBehind', (e.target as HTMLInputElement).value)}
                    >
                </div>
                
                <div class="onion-setting">
                    <label>模式:</label>
                    <select class="select-input" @change=${this.handleOnionModeChange}>
                        <option value="tint" ?selected=${this.onionSkin.mode === 'tint'}>着色</option>
                        <option value="outline" ?selected=${this.onionSkin.mode === 'outline'}>轮廓</option>
                        <option value="silhouette" ?selected=${this.onionSkin.mode === 'silhouette'}>剪影</option>
                    </select>
                </div>
            </div>
        `;
    }
    
    private renderFrame(frame: FrameData, index: number) {
        const isSelected = index === this.currentFrame;
        const isDragging = index === this.draggedFrame;
        const isDropTarget = index === this.dropTarget;
        const hasKeyframe = frame.keyframes.size > 0;
        
        return html`
            <div 
                class="frame-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}"
                style="--frame-width: ${this.frameWidth}px; --frame-height: ${this.frameHeight}px;"
                draggable="true"
                @click=${() => this.handleFrameSelect(index)}
                @dragstart=${(e: DragEvent) => this.handleDragStart(e, index)}
                @dragover=${(e: DragEvent) => this.handleDragOver(e, index)}
                @dragleave=${() => this.handleDragLeave()}
                @drop=${(e: DragEvent) => this.handleDrop(e, index)}
                @dragend=${() => this.handleDragEnd()}
            >
                ${frame.thumbnail
                    ? html`<canvas></canvas>`
                    : html`<div style="background: #333; width: 100%; height: 100%;"></div>`
                }
                
                <span class="frame-number">${index + 1}</span>
                
                ${frame.holdFrames > 1 ? html`
                    <span class="frame-duration">${frame.holdFrames}x</span>
                ` : ''}
                
                ${hasKeyframe ? html`
                    <div class="frame-keyframe-marker"></div>
                ` : ''}
                
                <div class="frame-menu">
                    <button class="frame-menu-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleDuplicateFrame(index); }} title="复制">📋</button>
                    <button class="frame-menu-btn" @click=${(e: Event) => { e.stopPropagation(); this.handleDeleteFrame(index); }} title="删除">🗑️</button>
                </div>
            </div>
        `;
    }
    
    // ==================== 事件处理 ====================
    
    private handlePlayPause() {
        if (this.isPlaying) {
            this.dispatchEvent(new CustomEvent('pause'));
        } else {
            this.dispatchEvent(new CustomEvent('play'));
        }
    }
    
    private handleFirstFrame() {
        this.dispatchEvent(new CustomEvent('seek', { detail: { frame: 0 } }));
    }
    
    private handlePrevFrame() {
        if (this.currentFrame > 0) {
            this.dispatchEvent(new CustomEvent('seek', { detail: { frame: this.currentFrame - 1 } }));
        }
    }
    
    private handleNextFrame() {
        if (this.currentFrame < this.frames.length - 1) {
            this.dispatchEvent(new CustomEvent('seek', { detail: { frame: this.currentFrame + 1 } }));
        }
    }
    
    private handleLastFrame() {
        this.dispatchEvent(new CustomEvent('seek', { detail: { frame: this.frames.length - 1 } }));
    }
    
    private handleFrameSelect(index: number) {
        this.dispatchEvent(new CustomEvent('frame-select', { detail: { index } }));
    }
    
    private handleAddFrame() {
        this.dispatchEvent(new CustomEvent('frame-add', { detail: { index: this.currentFrame + 1 } }));
    }
    
    private handleDuplicateFrame(index: number) {
        this.dispatchEvent(new CustomEvent('frame-duplicate', { detail: { index } }));
    }
    
    private handleDeleteFrame(index: number) {
        if (this.frames.length > 1) {
            this.dispatchEvent(new CustomEvent('frame-delete', { detail: { index } }));
        }
    }
    
    private handleFpsChange(e: Event) {
        const fps = parseInt((e.target as HTMLSelectElement).value);
        this.dispatchEvent(new CustomEvent('fps-change', { detail: { fps } }));
    }
    
    private handlePlayModeChange(e: Event) {
        const mode = (e.target as HTMLSelectElement).value as PlayMode;
        this.dispatchEvent(new CustomEvent('play-mode-change', { detail: { mode } }));
    }
    
    private handleOnionSkinToggle() {
        this.dispatchEvent(new CustomEvent('onion-skin-toggle', { 
            detail: { enabled: !this.onionSkin.enabled } 
        }));
    }
    
    private handleOnionChange(key: string, value: number) {
        this.dispatchEvent(new CustomEvent('onion-skin-change', {
            detail: { ...this.onionSkin, [key]: value }
        }));
    }
    
    private handleOnionColorChange(key: 'colorAhead' | 'colorBehind', hex: string) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        this.dispatchEvent(new CustomEvent('onion-skin-change', {
            detail: { ...this.onionSkin, [key]: { r, g, b, a: 0.5 } }
        }));
    }
    
    private handleOnionModeChange(e: Event) {
        const mode = (e.target as HTMLSelectElement).value as 'tint' | 'outline' | 'silhouette';
        this.dispatchEvent(new CustomEvent('onion-skin-change', {
            detail: { ...this.onionSkin, mode }
        }));
    }
    
    // ==================== 拖拽 ====================
    
    private handleDragStart(e: DragEvent, index: number) {
        this.draggedFrame = index;
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', String(index));
    }
    
    private handleDragOver(e: DragEvent, index: number) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        this.dropTarget = index;
    }
    
    private handleDragLeave() {
        this.dropTarget = null;
    }
    
    private handleDrop(e: DragEvent, index: number) {
        e.preventDefault();
        
        if (this.draggedFrame !== null && this.draggedFrame !== index) {
            this.dispatchEvent(new CustomEvent('frame-move', {
                detail: { from: this.draggedFrame, to: index }
            }));
        }
        
        this.draggedFrame = null;
        this.dropTarget = null;
    }
    
    private handleDragEnd() {
        this.draggedFrame = null;
        this.dropTarget = null;
    }
    
    private handleTrackScroll() {
        // 可以在这里处理滚动同步等逻辑
    }
    
    // ==================== 生命周期 ====================
    
    override updated(changedProperties: PropertyValues) {
        super.updated(changedProperties);
        
        // 更新帧缩略图
        if (changedProperties.has('frames') || changedProperties.has('currentFrame')) {
            this.updateThumbnails();
        }
        
        // 滚动到当前帧
        if (changedProperties.has('currentFrame')) {
            this.scrollToCurrentFrame();
        }
    }
    
    private updateThumbnails() {
        const canvases = this.shadowRoot?.querySelectorAll('.frame-item canvas');
        if (!canvases) return;
        
        canvases.forEach((canvas, index) => {
            const frame = this.frames[index];
            if (frame?.thumbnail && canvas instanceof HTMLCanvasElement) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.width = this.frameWidth;
                    canvas.height = this.frameHeight;
                    ctx.drawImage(frame.thumbnail, 0, 0, this.frameWidth, this.frameHeight);
                }
            }
        });
    }
    
    private scrollToCurrentFrame() {
        if (!this.frameTrack) return;
        
        const frameElements = this.frameTrack.querySelectorAll('.frame-item');
        const currentElement = frameElements[this.currentFrame];
        
        if (currentElement) {
            currentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'animation-timeline-editor': AnimationTimelineEditor;
    }
}
