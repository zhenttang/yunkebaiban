/**
 * Animation Assist 类型定义
 */

/** 动画帧 */
export interface AnimationFrame {
    id: string;
    index: number;
    /** 该帧包含的元素 ID 列表 */
    elementIds: string[];
    /** 持续帧数（默认1，设为2则这帧显示2倍时间） */
    holdDuration: number;
    /** 缩略图 Base64 */
    thumbnail?: string;
    /** 内部使用：当前 hold 计数 */
    _holdCounter?: number;
    createdAt: number;
    updatedAt: number;
}

/** 关键帧属性 */
export interface KeyframeProperties {
    x?: number;
    y?: number;
    rotation?: number;
    scale?: { x: number; y: number };
    opacity?: number;
}

/** 关键帧数据（用于补间动画） */
export interface Keyframe {
    frameIndex: number;
    elementId: string;
    properties: KeyframeProperties;
    easing: EasingType;
}

/** 缓动类型 */
export type EasingType =
    | 'linear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInElastic'
    | 'easeOutElastic'
    | 'easeOutBounce';

/** 播放模式 */
export type PlayMode = 'loop' | 'pingpong' | 'oneshot';

/** 洋葱皮设置 */
export interface OnionSkinSettings {
    enabled: boolean;
    /** 显示后面几帧 */
    framesAhead: number;
    /** 显示前面几帧 */
    framesBehind: number;
    /** 前帧透明度 (0-1) */
    opacityAhead: number;
    /** 后帧透明度 (0-1) */
    opacityBehind: number;
    /** 前帧着色（绿色） */
    colorAhead: string;
    /** 后帧着色（红色） */
    colorBehind: string;
}

/** 画布设置 */
export interface CanvasSettings {
    width: number;
    height: number;
    backgroundColor: string;
}

/** 动画设置 */
export interface AnimationSettings {
    /** 帧率 (1-60) */
    fps: number;
    /** 播放模式 */
    playMode: PlayMode;
    /** 洋葱皮设置 */
    onionSkin: OnionSkinSettings;
    /** 画布设置 */
    canvas: CanvasSettings;
}

/** 动画项目 */
export interface AnimationProject {
    id: string;
    name: string;
    frames: AnimationFrame[];
    keyframes: Map<string, Keyframe[]>;
    settings: AnimationSettings;
    version: number;
}

/** GIF 导出选项 */
export interface GifExportOptions {
    width?: number;
    height?: number;
    quality?: number;
}

/** 视频导出选项 */
export interface VideoExportOptions {
    width?: number;
    height?: number;
    bitrate?: number;
    codec?: string;
}

/** 精灵图导出选项 */
export interface SpriteSheetOptions {
    columns?: number;
    padding?: number;
}

/** 精灵图数据 */
export interface SpriteSheetData {
    frames: Record<
        string,
        {
            frame: { x: number; y: number; w: number; h: number };
            duration: number;
        }
    >;
    meta: {
        size: { w: number; h: number };
        frameTags: unknown[];
    };
}

/** 默认动画设置 */
export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
    fps: 12,
    playMode: 'loop',
    onionSkin: {
        enabled: true,
        framesAhead: 2,
        framesBehind: 2,
        opacityAhead: 0.3,
        opacityBehind: 0.3,
        colorAhead: 'rgba(0, 200, 100, 0.5)',
        colorBehind: 'rgba(200, 100, 0, 0.5)',
    },
    canvas: {
        width: 1920,
        height: 1080,
        backgroundColor: '#ffffff',
    },
};
