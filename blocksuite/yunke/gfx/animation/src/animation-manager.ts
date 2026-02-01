/**
 * Animation Manager - 动画系统核心管理器
 * 
 * 功能：
 * - 管理动画帧（添加、删除、复制、排序）
 * - 播放控制（播放、暂停、停止、跳帧）
 * - 洋葱皮渲染
 * - 导出功能（GIF、视频、精灵图）
 */

import { DisposableGroup } from '@blocksuite/global/disposable';
import { nanoid } from 'nanoid';

/**
 * 简单的事件槽实现（替代被移除的 @blocksuite/global Slot）
 */
class Slot<T = void> {
    private _listeners: Array<(data: T) => void> = [];
    
    on(listener: (data: T) => void): () => void {
        this._listeners.push(listener);
        return () => this.off(listener);
    }
    
    /**
     * 订阅事件，返回可被 DisposableGroup 管理的对象
     */
    subscribe(listener: (data: T) => void): { dispose: () => void } {
        this._listeners.push(listener);
        return {
            dispose: () => this.off(listener)
        };
    }
    
    off(listener: (data: T) => void): void {
        const index = this._listeners.indexOf(listener);
        if (index > -1) {
            this._listeners.splice(index, 1);
        }
    }
    
    emit(data: T): void {
        this._listeners.forEach(listener => listener(data));
    }
    
    dispose(): void {
        this._listeners = [];
    }
}

import { Easing, lerp } from './easing.js';
import type {
    AnimationFrame,
    AnimationProject,
    AnimationSettings,
    GifExportOptions,
    Keyframe,
    KeyframeProperties,
    OnionSkinSettings,
    SpriteSheetData,
    SpriteSheetOptions,
} from './types.js';
import { DEFAULT_ANIMATION_SETTINGS } from './types.js';

export interface AnimationManagerOptions {
    /** 获取画布容器 */
    getContainer: () => HTMLElement | null;
    /** 获取所有元素 ID */
    getAllElementIds: () => string[];
    /** 设置元素可见性 */
    setElementVisibility: (id: string, visible: boolean) => void;
    /** 渲染画布到指定 context */
    renderToContext: (
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number
    ) => void;
    /** 刷新画布 */
    refresh: () => void;
}

export class AnimationManager {
    private _disposables = new DisposableGroup();
    private _project: AnimationProject | null = null;
    private _currentFrameIndex = 0;
    private _isPlaying = false;
    private _isEnabled = false;
    private _rafId: number | null = null;
    private _lastFrameTime = 0;
    private _direction: 1 | -1 = 1;

    // 洋葱皮 Canvas
    private _onionCanvas: HTMLCanvasElement | null = null;
    private _onionCtx: CanvasRenderingContext2D | null = null;

    // 原始元素状态（用于恢复）
    private _originalElementStates: Map<string, boolean> = new Map();

    readonly options: AnimationManagerOptions;

    // 事件槽
    readonly slots = {
        frameChanged: new Slot<{ index: number; frame: AnimationFrame | null }>(),
        playStateChanged: new Slot<{ isPlaying: boolean }>(),
        projectChanged: new Slot<{ project: AnimationProject | null }>(),
        framesUpdated: new Slot<{ frames: AnimationFrame[] }>(),
        enabledChanged: new Slot<{ enabled: boolean }>(),
    };

    constructor(options: AnimationManagerOptions) {
        this.options = options;
    }

    // ==================== Getters ====================

    get isEnabled(): boolean {
        return this._isEnabled;
    }

    get isPlaying(): boolean {
        return this._isPlaying;
    }

    get project(): AnimationProject | null {
        return this._project;
    }

    get currentFrameIndex(): number {
        return this._currentFrameIndex;
    }

    get currentFrame(): AnimationFrame | null {
        return this._project?.frames[this._currentFrameIndex] ?? null;
    }

    get frameCount(): number {
        return this._project?.frames.length ?? 0;
    }

    get settings(): AnimationSettings {
        return this._project?.settings ?? DEFAULT_ANIMATION_SETTINGS;
    }

    // ==================== 模式控制 ====================

    /**
     * 启用动画模式
     */
    enable(): void {
        if (this._isEnabled) return;

        this._isEnabled = true;

        // 创建新项目
        this._project = this._createDefaultProject();

        // 保存当前元素状态
        this._saveElementStates();

        // 将当前画布内容作为第一帧
        this.captureCurrentAsFrame();

        // 初始化洋葱皮 Canvas
        this._initOnionCanvas();

        this.slots.enabledChanged.emit({ enabled: true });
        this.slots.projectChanged.emit({ project: this._project });
    }

    /**
     * 禁用动画模式
     */
    disable(): void {
        if (!this._isEnabled) return;

        this.stop();
        this._destroyOnionCanvas();
        this._restoreElementStates();

        this._isEnabled = false;
        this._project = null;
        this._currentFrameIndex = 0;

        this.slots.enabledChanged.emit({ enabled: false });
        this.slots.projectChanged.emit({ project: null });
    }

    /**
     * 切换动画模式
     */
    toggle(): void {
        if (this._isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }

    // ==================== 帧操作 ====================

    /**
     * 捕获当前画布为新帧
     */
    captureCurrentAsFrame(): AnimationFrame | null {
        if (!this._project) return null;

        const elementIds = this.options.getAllElementIds();

        const frame: AnimationFrame = {
            id: nanoid(),
            index: this._project.frames.length,
            elementIds: [...elementIds],
            holdDuration: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // 生成缩略图
        frame.thumbnail = this._generateThumbnail();

        this._project.frames.push(frame);
        this.slots.framesUpdated.emit({ frames: this._project.frames });

        return frame;
    }

    /**
     * 添加空白帧
     */
    addEmptyFrame(): AnimationFrame | null {
        if (!this._project) return null;

        const frame: AnimationFrame = {
            id: nanoid(),
            index: this._project.frames.length,
            elementIds: [],
            holdDuration: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        this._project.frames.push(frame);
        this.slots.framesUpdated.emit({ frames: this._project.frames });

        // 切换到新帧
        this.goToFrame(frame.index);

        return frame;
    }

    /**
     * 复制帧
     */
    duplicateFrame(index: number): AnimationFrame | null {
        if (!this._project) return null;
        const sourceFrame = this._project.frames[index];
        if (!sourceFrame) return null;

        const newFrame: AnimationFrame = {
            id: nanoid(),
            index: index + 1,
            elementIds: [...sourceFrame.elementIds],
            holdDuration: sourceFrame.holdDuration,
            thumbnail: sourceFrame.thumbnail,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        // 插入到源帧后面
        this._project.frames.splice(index + 1, 0, newFrame);

        // 更新后续帧的索引
        this._reindexFrames();

        this.slots.framesUpdated.emit({ frames: this._project.frames });

        return newFrame;
    }

    /**
     * 删除帧
     */
    deleteFrame(index: number): boolean {
        if (!this._project || this._project.frames.length <= 1) return false;

        this._project.frames.splice(index, 1);
        this._reindexFrames();

        // 调整当前帧索引
        if (this._currentFrameIndex >= this._project.frames.length) {
            this._currentFrameIndex = this._project.frames.length - 1;
        }

        this.slots.framesUpdated.emit({ frames: this._project.frames });
        this._renderCurrentFrame();

        return true;
    }

    /**
     * 移动帧
     */
    moveFrame(fromIndex: number, toIndex: number): boolean {
        if (!this._project) return false;
        if (
            fromIndex < 0 ||
            fromIndex >= this._project.frames.length ||
            toIndex < 0 ||
            toIndex >= this._project.frames.length
        ) {
            return false;
        }

        const [frame] = this._project.frames.splice(fromIndex, 1);
        this._project.frames.splice(toIndex, 0, frame);
        this._reindexFrames();

        this.slots.framesUpdated.emit({ frames: this._project.frames });

        return true;
    }

    /**
     * 更新帧的元素列表
     */
    updateFrameElements(index: number, elementIds: string[]): boolean {
        if (!this._project) return false;
        const frame = this._project.frames[index];
        if (!frame) return false;

        frame.elementIds = [...elementIds];
        frame.updatedAt = Date.now();
        frame.thumbnail = this._generateThumbnail();

        this.slots.framesUpdated.emit({ frames: this._project.frames });

        return true;
    }

    /**
     * 设置帧的 holdDuration
     */
    setFrameHoldDuration(index: number, duration: number): boolean {
        if (!this._project) return false;
        const frame = this._project.frames[index];
        if (!frame) return false;

        frame.holdDuration = Math.max(1, Math.floor(duration));
        frame.updatedAt = Date.now();

        this.slots.framesUpdated.emit({ frames: this._project.frames });

        return true;
    }

    // ==================== 播放控制 ====================

    /**
     * 播放动画
     */
    play(): void {
        if (this._isPlaying || !this._project || this._project.frames.length < 2)
            return;

        this._isPlaying = true;
        this._lastFrameTime = performance.now();
        this._direction = 1;

        this.slots.playStateChanged.emit({ isPlaying: true });
        this._animationLoop();
    }

    /**
     * 暂停动画
     */
    pause(): void {
        if (!this._isPlaying) return;

        this._isPlaying = false;

        if (this._rafId !== null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        this.slots.playStateChanged.emit({ isPlaying: false });
    }

    /**
     * 停止动画（回到第一帧）
     */
    stop(): void {
        this.pause();
        this.goToFrame(0);
    }

    /**
     * 切换播放/暂停
     */
    togglePlay(): void {
        if (this._isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    /**
     * 跳转到指定帧
     */
    goToFrame(index: number): void {
        if (!this._project) return;
        if (index < 0 || index >= this._project.frames.length) return;

        this._currentFrameIndex = index;
        this._renderCurrentFrame();
        this._updateOnionSkin();

        this.slots.frameChanged.emit({
            index,
            frame: this._project.frames[index],
        });
    }

    /**
     * 上一帧
     */
    prevFrame(): void {
        if (!this._project) return;
        const newIndex =
            this._currentFrameIndex > 0
                ? this._currentFrameIndex - 1
                : this._project.frames.length - 1;
        this.goToFrame(newIndex);
    }

    /**
     * 下一帧
     */
    nextFrame(): void {
        if (!this._project) return;
        const newIndex =
            this._currentFrameIndex < this._project.frames.length - 1
                ? this._currentFrameIndex + 1
                : 0;
        this.goToFrame(newIndex);
    }

    /**
     * 第一帧
     */
    firstFrame(): void {
        this.goToFrame(0);
    }

    /**
     * 最后一帧
     */
    lastFrame(): void {
        if (!this._project) return;
        this.goToFrame(this._project.frames.length - 1);
    }

    // ==================== 设置 ====================

    /**
     * 设置 FPS
     */
    setFps(fps: number): void {
        if (!this._project) return;
        this._project.settings.fps = Math.max(1, Math.min(60, fps));
    }

    /**
     * 设置播放模式
     */
    setPlayMode(mode: 'loop' | 'pingpong' | 'oneshot'): void {
        if (!this._project) return;
        this._project.settings.playMode = mode;
    }

    /**
     * 更新洋葱皮设置
     */
    updateOnionSkinSettings(settings: Partial<OnionSkinSettings>): void {
        if (!this._project) return;
        Object.assign(this._project.settings.onionSkin, settings);
        this._updateOnionSkin();
    }

    // ==================== 导出 ====================

    /**
     * 导出为 GIF（简化版本，使用 canvas 生成）
     */
    async exportAsGif(options: GifExportOptions = {}): Promise<Blob> {
        if (!this._project || this._project.frames.length === 0) {
            throw new Error('No frames to export');
        }

        const { width = 800, height = 600 } = options;
        const frames = this._project.frames;
        const fps = this._project.settings.fps;

        // 创建临时 canvas 用于渲染
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;

        // 收集所有帧图像
        const frameImages: ImageData[] = [];

        for (let i = 0; i < frames.length; i++) {
            // 渲染帧
            this.goToFrame(i);
            await this._waitFrame();

            ctx.clearRect(0, 0, width, height);
            this.options.renderToContext(ctx, width, height);

            frameImages.push(ctx.getImageData(0, 0, width, height));
        }

        // 使用简单的 GIF 编码（这里返回动画 WebP 作为替代）
        // 实际项目中应该使用 gif.js 或类似库
        return this._createAnimatedWebP(frameImages, width, height, fps);
    }

    /**
     * 导出为精灵图
     */
    async exportAsSpriteSheet(
        options: SpriteSheetOptions = {}
    ): Promise<{ image: Blob; json: SpriteSheetData }> {
        if (!this._project || this._project.frames.length === 0) {
            throw new Error('No frames to export');
        }

        const { columns = 10, padding = 2 } = options;
        const frames = this._project.frames;
        const settings = this._project.settings;

        const frameWidth = settings.canvas.width;
        const frameHeight = settings.canvas.height;
        const frameCount = frames.length;
        const rows = Math.ceil(frameCount / columns);

        // 创建精灵图 canvas
        const canvas = document.createElement('canvas');
        canvas.width = columns * (frameWidth + padding) - padding;
        canvas.height = rows * (frameHeight + padding) - padding;
        const ctx = canvas.getContext('2d')!;

        // 创建帧数据
        const spriteData: SpriteSheetData = {
            frames: {},
            meta: {
                size: { w: canvas.width, h: canvas.height },
                frameTags: [],
            },
        };

        // 渲染每一帧
        for (let i = 0; i < frameCount; i++) {
            const col = i % columns;
            const row = Math.floor(i / columns);
            const x = col * (frameWidth + padding);
            const y = row * (frameHeight + padding);

            // 渲染帧
            this.goToFrame(i);
            await this._waitFrame();

            // 创建临时 canvas
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = frameWidth;
            tempCanvas.height = frameHeight;
            const tempCtx = tempCanvas.getContext('2d')!;

            this.options.renderToContext(tempCtx, frameWidth, frameHeight);
            ctx.drawImage(tempCanvas, x, y);

            // 记录帧数据
            spriteData.frames[`frame_${i}`] = {
                frame: { x, y, w: frameWidth, h: frameHeight },
                duration:
                    (1000 / settings.fps) * frames[i].holdDuration,
            };
        }

        // 导出为 PNG
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                blob => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
                'image/png'
            );
        });

        return { image: imageBlob, json: spriteData };
    }

    /**
     * 导出单帧为 PNG
     */
    async exportFrameAsPng(
        index: number,
        width?: number,
        height?: number
    ): Promise<Blob> {
        if (!this._project) {
            throw new Error('No project');
        }

        const settings = this._project.settings;
        const w = width ?? settings.canvas.width;
        const h = height ?? settings.canvas.height;

        // 切换到指定帧
        this.goToFrame(index);
        await this._waitFrame();

        // 渲染
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;

        this.options.renderToContext(ctx, w, h);

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                blob => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
                'image/png'
            );
        });
    }

    // ==================== 私有方法 ====================

    private _createDefaultProject(): AnimationProject {
        return {
            id: nanoid(),
            name: 'Untitled Animation',
            frames: [],
            keyframes: new Map(),
            settings: { ...DEFAULT_ANIMATION_SETTINGS },
            version: 1,
        };
    }

    private _reindexFrames(): void {
        if (!this._project) return;
        this._project.frames.forEach((frame, index) => {
            frame.index = index;
        });
    }

    private _saveElementStates(): void {
        this._originalElementStates.clear();
        const elementIds = this.options.getAllElementIds();
        elementIds.forEach(id => {
            this._originalElementStates.set(id, true);
        });
    }

    private _restoreElementStates(): void {
        // 恢复所有元素可见性
        this._originalElementStates.forEach((visible, id) => {
            this.options.setElementVisibility(id, visible);
        });
        this._originalElementStates.clear();
        this.options.refresh();
    }

    private _renderCurrentFrame(): void {
        if (!this._project) return;

        const frame = this._project.frames[this._currentFrameIndex];
        if (!frame) return;

        // 隐藏所有元素
        const allIds = this.options.getAllElementIds();
        allIds.forEach(id => {
            this.options.setElementVisibility(id, false);
        });

        // 显示当前帧的元素
        frame.elementIds.forEach(id => {
            this.options.setElementVisibility(id, true);
        });

        this.options.refresh();
    }

    private _animationLoop = (): void => {
        if (!this._isPlaying || !this._project) return;

        const now = performance.now();
        const frameInterval = 1000 / this._project.settings.fps;

        if (now - this._lastFrameTime >= frameInterval) {
            this._advanceFrame();
            this._lastFrameTime = now;
        }

        this._rafId = requestAnimationFrame(this._animationLoop);
    };

    private _advanceFrame(): void {
        if (!this._project) return;

        const currentFrame = this._project.frames[this._currentFrameIndex];
        if (!currentFrame) return;

        // 处理 holdDuration
        const holdRemaining = currentFrame._holdCounter ?? currentFrame.holdDuration;
        if (holdRemaining > 1) {
            currentFrame._holdCounter = holdRemaining - 1;
            return;
        }

        // 重置 hold 计数器
        currentFrame._holdCounter = currentFrame.holdDuration;

        const frameCount = this._project.frames.length;
        let nextIndex: number;

        switch (this._project.settings.playMode) {
            case 'loop':
                nextIndex = (this._currentFrameIndex + 1) % frameCount;
                break;

            case 'pingpong':
                nextIndex = this._currentFrameIndex + this._direction;
                if (nextIndex >= frameCount - 1 || nextIndex <= 0) {
                    this._direction *= -1;
                }
                nextIndex = Math.max(0, Math.min(frameCount - 1, nextIndex));
                break;

            case 'oneshot':
                if (this._currentFrameIndex >= frameCount - 1) {
                    this.pause();
                    return;
                }
                nextIndex = this._currentFrameIndex + 1;
                break;

            default:
                nextIndex = this._currentFrameIndex + 1;
        }

        this.goToFrame(nextIndex);
    }

    private _generateThumbnail(): string {
        const canvas = document.createElement('canvas');
        const thumbnailSize = 100;
        canvas.width = thumbnailSize;
        canvas.height = thumbnailSize;
        const ctx = canvas.getContext('2d')!;

        try {
            this.options.renderToContext(ctx, thumbnailSize, thumbnailSize);
        } catch {
            // 渲染失败时返回空白缩略图
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, thumbnailSize, thumbnailSize);
        }

        return canvas.toDataURL('image/png', 0.6);
    }

    private _initOnionCanvas(): void {
        const container = this.options.getContainer();
        if (!container) return;

        this._onionCanvas = document.createElement('canvas');
        this._onionCanvas.className = 'animation-onion-skin-layer';
        this._onionCanvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1;
        `;

        container.appendChild(this._onionCanvas);
        this._onionCtx = this._onionCanvas.getContext('2d');

        // 设置 canvas 尺寸
        this._resizeOnionCanvas();
    }

    private _destroyOnionCanvas(): void {
        if (this._onionCanvas) {
            this._onionCanvas.remove();
            this._onionCanvas = null;
            this._onionCtx = null;
        }
    }

    private _resizeOnionCanvas(): void {
        if (!this._onionCanvas) return;

        const container = this.options.getContainer();
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this._onionCanvas.width = rect.width * dpr;
        this._onionCanvas.height = rect.height * dpr;
        this._onionCanvas.style.width = `${rect.width}px`;
        this._onionCanvas.style.height = `${rect.height}px`;

        if (this._onionCtx) {
            this._onionCtx.scale(dpr, dpr);
        }
    }

    private _updateOnionSkin(): void {
        if (!this._onionCtx || !this._onionCanvas || !this._project) return;

        const settings = this._project.settings.onionSkin;
        const ctx = this._onionCtx;
        const canvas = this._onionCanvas;

        // 清除
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!settings.enabled) return;

        const currentIndex = this._currentFrameIndex;
        const frames = this._project.frames;

        // 渲染前面的帧（红色调）
        for (let i = 1; i <= settings.framesBehind; i++) {
            const idx = currentIndex - i;
            if (idx < 0) continue;

            const opacity = settings.opacityBehind * (1 - i / (settings.framesBehind + 1));
            this._renderOnionFrame(frames[idx], settings.colorBehind, opacity);
        }

        // 渲染后面的帧（绿色调）
        for (let i = 1; i <= settings.framesAhead; i++) {
            const idx = currentIndex + i;
            if (idx >= frames.length) continue;

            const opacity = settings.opacityAhead * (1 - i / (settings.framesAhead + 1));
            this._renderOnionFrame(frames[idx], settings.colorAhead, opacity);
        }
    }

    private _renderOnionFrame(
        frame: AnimationFrame,
        tintColor: string,
        opacity: number
    ): void {
        if (!this._onionCtx || !this._onionCanvas) return;

        // 保存当前帧状态
        const currentFrame = this._project?.frames[this._currentFrameIndex];
        const currentElementIds = currentFrame?.elementIds ?? [];

        // 临时切换到目标帧渲染
        const allIds = this.options.getAllElementIds();

        // 隐藏当前帧元素，显示目标帧元素
        allIds.forEach(id => {
            const inTarget = frame.elementIds.includes(id);
            this.options.setElementVisibility(id, inTarget);
        });

        // 创建离屏 canvas
        const offscreen = document.createElement('canvas');
        offscreen.width = this._onionCanvas.width;
        offscreen.height = this._onionCanvas.height;
        const offCtx = offscreen.getContext('2d')!;

        // 渲染帧
        this.options.renderToContext(
            offCtx,
            this._onionCanvas.width / (window.devicePixelRatio || 1),
            this._onionCanvas.height / (window.devicePixelRatio || 1)
        );

        // 应用着色
        offCtx.globalCompositeOperation = 'source-atop';
        offCtx.fillStyle = tintColor;
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

        // 绘制到洋葱皮层
        this._onionCtx.globalAlpha = opacity;
        this._onionCtx.drawImage(offscreen, 0, 0);
        this._onionCtx.globalAlpha = 1;

        // 恢复当前帧元素可见性
        allIds.forEach(id => {
            const inCurrent = currentElementIds.includes(id);
            this.options.setElementVisibility(id, inCurrent);
        });
    }

    private _waitFrame(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }

    private async _createAnimatedWebP(
        frames: ImageData[],
        width: number,
        height: number,
        fps: number
    ): Promise<Blob> {
        // 简化实现：返回第一帧的 PNG
        // 实际项目中应该使用 gif.js 或 WebCodecs API
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        if (frames.length > 0) {
            ctx.putImageData(frames[0], 0, 0);
        }

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                blob => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
                'image/png'
            );
        });
    }

    /**
     * 销毁
     */
    dispose(): void {
        this.disable();
        this._disposables.dispose();
    }
}
