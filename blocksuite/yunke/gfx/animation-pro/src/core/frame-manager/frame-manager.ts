/**
 * Professional 帧管理器
 * 
 * 特性：
 * - 帧添加/删除/复制/移动
 * - 关键帧动画
 * - 补间计算
 * - 时间轴管理
 * - 帧缓存
 */

import type {
    FrameData,
    KeyframeData,
    KeyframeProperties,
    EasingType,
    LayerReference,
    FrameMetadata,
    AnimationSettings,
    Point,
} from '../../types/index.js';
import { DEFAULT_ANIMATION_SETTINGS } from '../../types/index.js';

// ==================== 缓动函数 ====================

const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
    'linear': t => t,
    'easeIn': t => t * t,
    'easeOut': t => t * (2 - t),
    'easeInOut': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'easeInQuad': t => t * t,
    'easeOutQuad': t => t * (2 - t),
    'easeInOutQuad': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'easeInCubic': t => t * t * t,
    'easeOutCubic': t => (--t) * t * t + 1,
    'easeInOutCubic': t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    'easeInQuart': t => t * t * t * t,
    'easeOutQuart': t => 1 - (--t) * t * t * t,
    'easeInOutQuart': t => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    'easeInQuint': t => t * t * t * t * t,
    'easeOutQuint': t => 1 + (--t) * t * t * t * t,
    'easeInOutQuint': t => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
    'easeInSine': t => 1 - Math.cos((t * Math.PI) / 2),
    'easeOutSine': t => Math.sin((t * Math.PI) / 2),
    'easeInOutSine': t => -(Math.cos(Math.PI * t) - 1) / 2,
    'easeInExpo': t => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    'easeOutExpo': t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    'easeInOutExpo': t => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return t < 0.5
            ? Math.pow(2, 20 * t - 10) / 2
            : (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    'easeInCirc': t => 1 - Math.sqrt(1 - t * t),
    'easeOutCirc': t => Math.sqrt(1 - (--t) * t),
    'easeInOutCirc': t => t < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
    'easeInElastic': t => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
    },
    'easeOutElastic': t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    'easeInOutElastic': t => {
        if (t === 0 || t === 1) return t;
        return t < 0.5
            ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2
            : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * ((2 * Math.PI) / 4.5))) / 2 + 1;
    },
    'easeInBack': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    'easeOutBack': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    'easeInOutBack': t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    'easeInBounce': t => 1 - EASING_FUNCTIONS['easeOutBounce'](1 - t),
    'easeOutBounce': t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    'easeInOutBounce': t => t < 0.5
        ? (1 - EASING_FUNCTIONS['easeOutBounce'](1 - 2 * t)) / 2
        : (1 + EASING_FUNCTIONS['easeOutBounce'](2 * t - 1)) / 2,
    'custom': t => t,  // 由贝塞尔曲线处理
};

// ==================== LRU 缓存 ====================

class LRUCache<K, V> {
    private cache: Map<K, V> = new Map();
    private maxSize: number;
    
    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }
    
    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // 移到末尾（最近使用）
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    
    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // 删除最旧的
            const firstKey = this.cache.keys().next().value;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }
    
    has(key: K): boolean {
        return this.cache.has(key);
    }
    
    delete(key: K): boolean {
        return this.cache.delete(key);
    }
    
    clear(): void {
        this.cache.clear();
    }
}

// ==================== 帧管理器 ====================

export class FrameManager {
    private frames: FrameData[] = [];
    private currentFrameIndex: number = 0;
    private settings: AnimationSettings = { ...DEFAULT_ANIMATION_SETTINGS };
    
    // 关键帧存储
    private keyframes: Map<string, KeyframeData[]> = new Map();
    
    // 缓存
    private thumbnailCache: LRUCache<string, ImageBitmap> = new LRUCache(100);
    private tweenCache: LRUCache<string, KeyframeProperties> = new LRUCache(500);
    
    // 事件回调
    onFrameAdded?: (frame: FrameData) => void;
    onFrameRemoved?: (frame: FrameData) => void;
    onFrameChanged?: (fromIndex: number, toIndex: number) => void;
    onKeyframeAdded?: (keyframe: KeyframeData) => void;
    onKeyframeRemoved?: (keyframe: KeyframeData) => void;

    constructor(settings?: Partial<AnimationSettings>) {
        if (settings) {
            this.settings = { ...this.settings, ...settings };
        }
    }

    // ==================== 基础操作 ====================
    
    getFrameCount(): number {
        return this.frames.length;
    }
    
    getCurrentFrameIndex(): number {
        return this.currentFrameIndex;
    }
    
    getCurrentFrame(): FrameData | null {
        return this.frames[this.currentFrameIndex] || null;
    }
    
    getFrame(index: number): FrameData | null {
        return this.frames[index] || null;
    }
    
    getAllFrames(): FrameData[] {
        return [...this.frames];
    }
    
    getSettings(): AnimationSettings {
        return { ...this.settings };
    }
    
    setSettings(settings: Partial<AnimationSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    // ==================== 帧操作 ====================
    
    /**
     * 添加帧
     */
    addFrame(options: {
        index?: number;
        copyFrom?: number;
        layers?: LayerReference[];
        duration?: number;
    } = {}): FrameData {
        const {
            index = this.frames.length,
            copyFrom,
            layers = [],
            duration = 1000 / this.settings.fps,
        } = options;
        
        const frame: FrameData = {
            id: this.generateId(),
            index,
            layers: copyFrom !== undefined
                ? this.cloneLayerReferences(this.frames[copyFrom]?.layers || [])
                : layers,
            duration,
            holdFrames: 1,
            keyframes: new Map(),
            metadata: {},
        };
        
        // 插入
        this.frames.splice(index, 0, frame);
        this.reindexFrames();
        
        this.onFrameAdded?.(frame);
        
        return frame;
    }
    
    /**
     * 删除帧
     */
    removeFrame(index: number): FrameData | null {
        if (this.frames.length <= 1) return null;
        if (index < 0 || index >= this.frames.length) return null;
        
        const [removed] = this.frames.splice(index, 1);
        this.reindexFrames();
        
        // 清理缓存
        this.thumbnailCache.delete(removed.id);
        
        // 清理关键帧
        for (const [elementId, kfs] of this.keyframes) {
            const filtered = kfs.filter(kf => kf.frameIndex !== index);
            if (filtered.length !== kfs.length) {
                this.keyframes.set(elementId, filtered);
            }
        }
        
        // 调整当前帧
        if (this.currentFrameIndex >= this.frames.length) {
            this.currentFrameIndex = this.frames.length - 1;
        }
        
        this.onFrameRemoved?.(removed);
        
        return removed;
    }
    
    /**
     * 复制帧
     */
    duplicateFrame(index: number): FrameData | null {
        const source = this.frames[index];
        if (!source) return null;
        
        return this.addFrame({
            index: index + 1,
            copyFrom: index,
            duration: source.duration,
        });
    }
    
    /**
     * 移动帧
     */
    moveFrame(fromIndex: number, toIndex: number): boolean {
        if (
            fromIndex < 0 || fromIndex >= this.frames.length ||
            toIndex < 0 || toIndex >= this.frames.length
        ) {
            return false;
        }
        
        const [frame] = this.frames.splice(fromIndex, 1);
        this.frames.splice(toIndex, 0, frame);
        this.reindexFrames();
        
        // 更新关键帧索引
        this.updateKeyframeIndices(fromIndex, toIndex);
        
        return true;
    }
    
    /**
     * 跳转到帧
     */
    goToFrame(index: number): boolean {
        if (index < 0 || index >= this.frames.length) return false;
        
        const oldIndex = this.currentFrameIndex;
        this.currentFrameIndex = index;
        
        if (oldIndex !== index) {
            this.onFrameChanged?.(oldIndex, index);
        }
        
        return true;
    }
    
    /**
     * 下一帧
     */
    nextFrame(): boolean {
        return this.goToFrame(this.currentFrameIndex + 1);
    }
    
    /**
     * 上一帧
     */
    prevFrame(): boolean {
        return this.goToFrame(this.currentFrameIndex - 1);
    }
    
    /**
     * 第一帧
     */
    firstFrame(): boolean {
        return this.goToFrame(0);
    }
    
    /**
     * 最后一帧
     */
    lastFrame(): boolean {
        return this.goToFrame(this.frames.length - 1);
    }
    
    /**
     * 设置帧持续时间
     */
    setFrameDuration(index: number, duration: number): boolean {
        const frame = this.frames[index];
        if (!frame) return false;
        
        frame.duration = Math.max(1, duration);
        return true;
    }
    
    /**
     * 设置帧保持数
     */
    setFrameHold(index: number, holdFrames: number): boolean {
        const frame = this.frames[index];
        if (!frame) return false;
        
        frame.holdFrames = Math.max(1, Math.floor(holdFrames));
        return true;
    }

    // ==================== 关键帧操作 ====================
    
    /**
     * 添加关键帧
     */
    addKeyframe(
        elementId: string,
        frameIndex: number,
        properties: Partial<KeyframeProperties>,
        easing: EasingType = 'easeInOutCubic'
    ): KeyframeData {
        const keyframe: KeyframeData = {
            id: this.generateId(),
            elementId,
            frameIndex,
            properties: { ...properties },
            easing,
        };
        
        // 存储
        let elementKeyframes = this.keyframes.get(elementId);
        if (!elementKeyframes) {
            elementKeyframes = [];
            this.keyframes.set(elementId, elementKeyframes);
        }
        
        // 替换或添加
        const existingIndex = elementKeyframes.findIndex(kf => kf.frameIndex === frameIndex);
        if (existingIndex !== -1) {
            elementKeyframes[existingIndex] = keyframe;
        } else {
            elementKeyframes.push(keyframe);
            elementKeyframes.sort((a, b) => a.frameIndex - b.frameIndex);
        }
        
        // 清除补间缓存
        this.invalidateTweenCache(elementId);
        
        this.onKeyframeAdded?.(keyframe);
        
        return keyframe;
    }
    
    /**
     * 删除关键帧
     */
    removeKeyframe(elementId: string, frameIndex: number): boolean {
        const elementKeyframes = this.keyframes.get(elementId);
        if (!elementKeyframes) return false;
        
        const index = elementKeyframes.findIndex(kf => kf.frameIndex === frameIndex);
        if (index === -1) return false;
        
        const [removed] = elementKeyframes.splice(index, 1);
        
        // 清除补间缓存
        this.invalidateTweenCache(elementId);
        
        this.onKeyframeRemoved?.(removed);
        
        return true;
    }
    
    /**
     * 获取元素的关键帧
     */
    getKeyframes(elementId: string): KeyframeData[] {
        return this.keyframes.get(elementId) || [];
    }
    
    /**
     * 获取帧上的所有关键帧
     */
    getKeyframesAtFrame(frameIndex: number): KeyframeData[] {
        const result: KeyframeData[] = [];
        
        for (const keyframes of this.keyframes.values()) {
            for (const kf of keyframes) {
                if (kf.frameIndex === frameIndex) {
                    result.push(kf);
                }
            }
        }
        
        return result;
    }
    
    /**
     * 检查是否有关键帧
     */
    hasKeyframe(elementId: string, frameIndex: number): boolean {
        const elementKeyframes = this.keyframes.get(elementId);
        return elementKeyframes?.some(kf => kf.frameIndex === frameIndex) || false;
    }

    // ==================== 补间计算 ====================
    
    /**
     * 获取补间后的属性
     */
    getTweenedProperties(
        elementId: string,
        frameIndex: number,
        subframeProgress: number = 0
    ): KeyframeProperties {
        // 检查缓存
        const cacheKey = `${elementId}_${frameIndex}_${subframeProgress.toFixed(3)}`;
        const cached = this.tweenCache.get(cacheKey);
        if (cached) return cached;
        
        const elementKeyframes = this.keyframes.get(elementId);
        if (!elementKeyframes || elementKeyframes.length === 0) {
            return {};
        }
        
        // 查找前后关键帧
        const { prev, next } = this.findSurroundingKeyframes(elementKeyframes, frameIndex);
        
        if (!prev && !next) {
            return {};
        }
        
        if (!prev) {
            return { ...next!.properties };
        }
        
        if (!next || prev.frameIndex === next.frameIndex) {
            return { ...prev.properties };
        }
        
        // 计算进度
        const totalFrames = next.frameIndex - prev.frameIndex;
        const currentProgress = (frameIndex - prev.frameIndex + subframeProgress) / totalFrames;
        
        // 应用缓动
        const easedProgress = this.applyEasing(currentProgress, prev.easing, prev.bezierHandles);
        
        // 插值计算
        const result = this.interpolateProperties(prev.properties, next.properties, easedProgress);
        
        // 缓存
        this.tweenCache.set(cacheKey, result);
        
        return result;
    }
    
    /**
     * 查找前后关键帧
     */
    private findSurroundingKeyframes(
        keyframes: KeyframeData[],
        frameIndex: number
    ): { prev: KeyframeData | null; next: KeyframeData | null } {
        let prev: KeyframeData | null = null;
        let next: KeyframeData | null = null;
        
        for (const kf of keyframes) {
            if (kf.frameIndex <= frameIndex) {
                prev = kf;
            }
            if (kf.frameIndex >= frameIndex && !next) {
                next = kf;
            }
        }
        
        return { prev, next };
    }
    
    /**
     * 应用缓动函数
     */
    private applyEasing(
        t: number,
        easing: EasingType,
        bezierHandles?: { inTangent: Point; outTangent: Point }
    ): number {
        if (easing === 'custom' && bezierHandles) {
            return this.cubicBezier(
                t,
                bezierHandles.outTangent.x,
                bezierHandles.outTangent.y,
                bezierHandles.inTangent.x,
                bezierHandles.inTangent.y
            );
        }
        
        const easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS['linear'];
        return easingFn(t);
    }
    
    /**
     * 三次贝塞尔曲线
     */
    private cubicBezier(t: number, x1: number, y1: number, x2: number, y2: number): number {
        // 牛顿迭代法求解
        let x = t;
        for (let i = 0; i < 8; i++) {
            const currentX = this.bezierX(x, x1, x2) - t;
            if (Math.abs(currentX) < 1e-6) break;
            const dx = this.bezierDX(x, x1, x2);
            if (Math.abs(dx) < 1e-6) break;
            x -= currentX / dx;
        }
        return this.bezierY(x, y1, y2);
    }
    
    private bezierX(t: number, x1: number, x2: number): number {
        return 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t;
    }
    
    private bezierY(t: number, y1: number, y2: number): number {
        return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
    }
    
    private bezierDX(t: number, x1: number, x2: number): number {
        return 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
    }
    
    /**
     * 属性插值
     */
    private interpolateProperties(
        from: KeyframeProperties,
        to: KeyframeProperties,
        t: number
    ): KeyframeProperties {
        const result: KeyframeProperties = {};
        
        // 位置
        if (from.position && to.position) {
            result.position = {
                x: this.lerp(from.position.x, to.position.x, t),
                y: this.lerp(from.position.y, to.position.y, t),
            };
        } else if (from.position) {
            result.position = { ...from.position };
        } else if (to.position) {
            result.position = { ...to.position };
        }
        
        // 旋转（考虑最短路径）
        if (from.rotation !== undefined && to.rotation !== undefined) {
            result.rotation = this.lerpAngle(from.rotation, to.rotation, t);
        } else if (from.rotation !== undefined) {
            result.rotation = from.rotation;
        } else if (to.rotation !== undefined) {
            result.rotation = to.rotation;
        }
        
        // 缩放
        if (from.scale && to.scale) {
            result.scale = {
                x: this.lerp(from.scale.x, to.scale.x, t),
                y: this.lerp(from.scale.y, to.scale.y, t),
            };
        } else if (from.scale) {
            result.scale = { ...from.scale };
        } else if (to.scale) {
            result.scale = { ...to.scale };
        }
        
        // 透明度
        if (from.opacity !== undefined && to.opacity !== undefined) {
            result.opacity = this.lerp(from.opacity, to.opacity, t);
        } else if (from.opacity !== undefined) {
            result.opacity = from.opacity;
        } else if (to.opacity !== undefined) {
            result.opacity = to.opacity;
        }
        
        // 锚点
        if (from.anchor && to.anchor) {
            result.anchor = {
                x: this.lerp(from.anchor.x, to.anchor.x, t),
                y: this.lerp(from.anchor.y, to.anchor.y, t),
            };
        } else if (from.anchor) {
            result.anchor = { ...from.anchor };
        } else if (to.anchor) {
            result.anchor = { ...to.anchor };
        }
        
        // 路径（逐点插值）
        if (from.path && to.path && from.path.length === to.path.length) {
            result.path = from.path.map((p, i) => ({
                x: this.lerp(p.x, to.path![i].x, t),
                y: this.lerp(p.y, to.path![i].y, t),
            }));
        }
        
        return result;
    }
    
    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * t;
    }
    
    private lerpAngle(a: number, b: number, t: number): number {
        // 找最短路径
        let delta = b - a;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return a + delta * t;
    }

    // ==================== 时间计算 ====================
    
    /**
     * 获取帧的开始时间（毫秒）
     */
    getFrameStartTime(frameIndex: number): number {
        let time = 0;
        for (let i = 0; i < frameIndex && i < this.frames.length; i++) {
            time += this.frames[i].duration * this.frames[i].holdFrames;
        }
        return time;
    }
    
    /**
     * 根据时间获取帧索引
     */
    getFrameAtTime(timeMs: number): { frameIndex: number; progress: number } {
        let accumulated = 0;
        
        for (let i = 0; i < this.frames.length; i++) {
            const frameDuration = this.frames[i].duration * this.frames[i].holdFrames;
            
            if (accumulated + frameDuration > timeMs) {
                const progress = (timeMs - accumulated) / frameDuration;
                return { frameIndex: i, progress };
            }
            
            accumulated += frameDuration;
        }
        
        return { frameIndex: this.frames.length - 1, progress: 1 };
    }
    
    /**
     * 获取总时长
     */
    getTotalDuration(): number {
        return this.frames.reduce(
            (sum, frame) => sum + frame.duration * frame.holdFrames,
            0
        );
    }

    // ==================== 缩略图 ====================
    
    /**
     * 设置帧缩略图
     */
    setThumbnail(frameIndex: number, thumbnail: ImageBitmap): void {
        const frame = this.frames[frameIndex];
        if (!frame) return;
        
        frame.thumbnail = thumbnail;
        this.thumbnailCache.set(frame.id, thumbnail);
    }
    
    /**
     * 获取帧缩略图
     */
    getThumbnail(frameIndex: number): ImageBitmap | undefined {
        const frame = this.frames[frameIndex];
        if (!frame) return undefined;
        
        return this.thumbnailCache.get(frame.id) || frame.thumbnail;
    }
    
    /**
     * 清除缩略图缓存
     */
    clearThumbnailCache(): void {
        this.thumbnailCache.clear();
    }

    // ==================== 辅助方法 ====================
    
    private generateId(): string {
        return `frame_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    private reindexFrames(): void {
        this.frames.forEach((frame, index) => {
            frame.index = index;
        });
    }
    
    private cloneLayerReferences(refs: LayerReference[]): LayerReference[] {
        return refs.map(ref => ({ ...ref }));
    }
    
    private updateKeyframeIndices(fromIndex: number, toIndex: number): void {
        for (const keyframes of this.keyframes.values()) {
            for (const kf of keyframes) {
                if (kf.frameIndex === fromIndex) {
                    kf.frameIndex = toIndex;
                } else if (fromIndex < toIndex) {
                    if (kf.frameIndex > fromIndex && kf.frameIndex <= toIndex) {
                        kf.frameIndex--;
                    }
                } else {
                    if (kf.frameIndex >= toIndex && kf.frameIndex < fromIndex) {
                        kf.frameIndex++;
                    }
                }
            }
            keyframes.sort((a, b) => a.frameIndex - b.frameIndex);
        }
        
        this.tweenCache.clear();
    }
    
    private invalidateTweenCache(elementId: string): void {
        // 简单实现：清除所有缓存
        // 更优化的实现应该只清除相关的缓存项
        this.tweenCache.clear();
    }

    // ==================== 序列化 ====================
    
    serialize(): {
        frames: FrameData[];
        keyframes: Record<string, KeyframeData[]>;
        settings: AnimationSettings;
    } {
        const keyframesObj: Record<string, KeyframeData[]> = {};
        for (const [elementId, kfs] of this.keyframes) {
            keyframesObj[elementId] = kfs;
        }
        
        return {
            frames: this.frames.map(f => ({
                ...f,
                thumbnail: undefined,  // 不序列化缩略图
            })),
            keyframes: keyframesObj,
            settings: this.settings,
        };
    }
    
    deserialize(data: {
        frames: FrameData[];
        keyframes: Record<string, KeyframeData[]>;
        settings: AnimationSettings;
    }): void {
        this.frames = data.frames.map(f => ({
            ...f,
            keyframes: new Map(Object.entries(f.keyframes || {})),
        }));
        
        this.keyframes.clear();
        for (const [elementId, kfs] of Object.entries(data.keyframes)) {
            this.keyframes.set(elementId, kfs);
        }
        
        this.settings = data.settings;
        this.currentFrameIndex = 0;
        
        // 清除缓存
        this.thumbnailCache.clear();
        this.tweenCache.clear();
    }
}
