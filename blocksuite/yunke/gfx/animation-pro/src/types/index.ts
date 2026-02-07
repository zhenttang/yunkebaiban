/**
 * Professional Animation System - 类型定义
 * 
 * 包含所有核心类型、接口和枚举
 */

// ==================== 基础类型 ====================

export interface Point {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Color {
    r: number;  // 0-255
    g: number;
    b: number;
    a: number;  // 0-1
}

export interface Transform {
    x: number;
    y: number;
    rotation: number;      // 度
    scaleX: number;
    scaleY: number;
    anchorX: number;       // 0-1
    anchorY: number;       // 0-1
    skewX: number;
    skewY: number;
}

// ==================== 混合模式 ====================

export enum BlendMode {
    Normal = 'normal',
    Multiply = 'multiply',
    Screen = 'screen',
    Overlay = 'overlay',
    Darken = 'darken',
    Lighten = 'lighten',
    ColorDodge = 'color-dodge',
    ColorBurn = 'color-burn',
    HardLight = 'hard-light',
    SoftLight = 'soft-light',
    Difference = 'difference',
    Exclusion = 'exclusion',
    Hue = 'hue',
    Saturation = 'saturation',
    Color = 'color',
    Luminosity = 'luminosity',
    Add = 'add',
    Subtract = 'subtract',
}

// ==================== 图层类型 ====================

export enum LayerType {
    Raster = 'raster',
    Vector = 'vector',
    Group = 'group',
    Adjustment = 'adjustment',
    Reference = 'reference',
}

export interface LayerData {
    id: string;
    type: LayerType;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
    blendMode: BlendMode;
    transform: Transform;
    parentId?: string;
    children?: string[];
    metadata?: Record<string, unknown>;
}

export interface RasterLayerData extends LayerData {
    type: LayerType.Raster;
    tiles: Map<string, TileData>;
    bounds: Rect;
}

export interface TileData {
    x: number;
    y: number;
    width: number;
    height: number;
    data: Uint8ClampedArray | ImageBitmap;
    dirty: boolean;
}

// ==================== 帧类型 ====================

export interface FrameData {
    id: string;
    index: number;
    layers: LayerReference[];
    duration: number;       // 毫秒
    holdFrames: number;
    keyframes: Map<string, KeyframeData>;
    thumbnail?: ImageBitmap;
    metadata: FrameMetadata;
}

export interface LayerReference {
    layerId: string;
    mode: 'shared' | 'copy';  // 共享或独立副本
}

export interface FrameMetadata {
    label?: string;
    color?: string;
    notes?: string;
    markers?: FrameMarker[];
}

export interface FrameMarker {
    name: string;
    color: string;
    time: number;
}

// ==================== 关键帧类型 ====================

export interface KeyframeData {
    id: string;
    elementId: string;
    frameIndex: number;
    properties: KeyframeProperties;
    easing: EasingType;
    bezierHandles?: BezierHandles;
}

export interface KeyframeProperties {
    position?: Point;
    rotation?: number;
    scale?: Point;
    opacity?: number;
    anchor?: Point;
    path?: Point[];
}

export interface BezierHandles {
    inTangent: Point;
    outTangent: Point;
}

export type EasingType =
    | 'linear'
    | 'easeIn'
    | 'easeOut'
    | 'easeInOut'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInQuart'
    | 'easeOutQuart'
    | 'easeInOutQuart'
    | 'easeInQuint'
    | 'easeOutQuint'
    | 'easeInOutQuint'
    | 'easeInSine'
    | 'easeOutSine'
    | 'easeInOutSine'
    | 'easeInExpo'
    | 'easeOutExpo'
    | 'easeInOutExpo'
    | 'easeInCirc'
    | 'easeOutCirc'
    | 'easeInOutCirc'
    | 'easeInElastic'
    | 'easeOutElastic'
    | 'easeInOutElastic'
    | 'easeInBack'
    | 'easeOutBack'
    | 'easeInOutBack'
    | 'easeInBounce'
    | 'easeOutBounce'
    | 'easeInOutBounce'
    | 'custom';

// ==================== 笔刷类型 ====================

export interface BrushSettings {
    // 基础
    size: number;
    opacity: number;
    flow: number;
    hardness: number;
    spacing: number;
    
    // 压感
    pressureSize: PressureMapping;
    pressureOpacity: PressureMapping;
    pressureFlow: PressureMapping;
    
    // 倾斜
    tiltSize: PressureMapping;
    tiltOpacity: PressureMapping;
    tiltAngle: boolean;
    
    // 形状
    shape: BrushShape;
    
    // 纹理
    texture?: BrushTexture;
    
    // 颜色动态
    colorDynamics: ColorDynamics;
    
    // 平滑
    smoothing: SmoothingSettings;
    
    // 传递
    transfer: TransferSettings;
}

export interface PressureMapping {
    enabled: boolean;
    min: number;
    max: number;
    curve: BezierCurve;
}

export interface BezierCurve {
    p1: Point;
    p2: Point;
}

export interface BrushShape {
    texture?: ImageBitmap;
    roundness: number;
    angle: number;
    flipX: boolean;
    flipY: boolean;
    scatterX: number;
    scatterY: number;
    count: number;
    countJitter: number;
}

export interface BrushTexture {
    image: ImageBitmap;
    scale: number;
    brightness: number;
    contrast: number;
    mode: 'multiply' | 'subtract' | 'overlay' | 'height';
    depth: number;
}

export interface ColorDynamics {
    hueJitter: number;
    saturationJitter: number;
    brightnessJitter: number;
    purity: number;
    foregroundBackground: number;
}

export interface SmoothingSettings {
    enabled: boolean;
    amount: number;
    mode: 'pulled-string' | 'moving-average' | 'catmull-rom' | 'bezier';
    catchUp: boolean;
    catchUpSpeed: number;
    tailEnd: boolean;
}

export interface TransferSettings {
    buildUp: boolean;
    wetEdges: boolean;
    airbrush: boolean;
    noiseAmount: number;
}

// ==================== 笔画类型 ====================

export interface StrokePoint {
    x: number;
    y: number;
    pressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    timestamp: number;
    velocity?: number;
}

export interface BrushStroke {
    id: string;
    points: StrokePoint[];
    brush: BrushSettings;
    color: Color;
    bounds: Rect;
    layerId: string;
}

// ==================== 洋葱皮类型 ====================

export interface OnionSkinSettings {
    enabled: boolean;
    framesAhead: number;
    framesBehind: number;
    opacityAhead: number;
    opacityBehind: number;
    colorAhead: Color;
    colorBehind: Color;
    mode: 'tint' | 'outline' | 'silhouette';
    skinOpacityFalloff: 'linear' | 'exponential';
}

// ==================== 项目类型 ====================

export interface AnimationProject {
    id: string;
    name: string;
    version: string;
    createdAt: number;
    updatedAt: number;
    
    // 画布设置
    canvas: CanvasSettings;
    
    // 动画设置
    animation: AnimationSettings;
    
    // 数据
    frames: FrameData[];
    layers: Map<string, LayerData>;
    
    // 资源
    assets: Map<string, AssetData>;
    
    // 音频
    audioTracks: AudioTrack[];
}

export interface CanvasSettings {
    width: number;
    height: number;
    backgroundColor: Color;
    pixelRatio: number;
    colorSpace: 'srgb' | 'display-p3' | 'rec2020';
}

export interface AnimationSettings {
    fps: number;
    playMode: PlayMode;
    duration: number;
    loopStart: number;
    loopEnd: number;
    onionSkin: OnionSkinSettings;
}

export type PlayMode = 'once' | 'loop' | 'pingpong' | 'hold';

export interface AssetData {
    id: string;
    name: string;
    type: 'image' | 'brush' | 'palette' | 'audio';
    data: ArrayBuffer | ImageBitmap | AudioBuffer;
    metadata?: Record<string, unknown>;
}

export interface AudioTrack {
    id: string;
    name: string;
    buffer: AudioBuffer;
    startTime: number;
    duration: number;
    volume: number;
    muted: boolean;
}

// ==================== 导出类型 ====================

export interface ExportOptions {
    format: ExportFormat;
    width: number;
    height: number;
    quality: number;
    fps: number;
    frameRange?: [number, number];
    includeAudio: boolean;
    backgroundColor?: Color;
    transparent: boolean;
}

export type ExportFormat =
    | 'gif'
    | 'apng'
    | 'webp'
    | 'mp4'
    | 'webm'
    | 'mov'
    | 'png-sequence'
    | 'spritesheet'
    | 'lottie';

export interface GifExportOptions extends ExportOptions {
    format: 'gif';
    dithering: boolean;
    colors: number;
    loop: number;
}

export interface VideoExportOptions extends ExportOptions {
    format: 'mp4' | 'webm' | 'mov';
    bitrate: number;
    codec: string;
    audioCodec?: string;
    audioBitrate?: number;
}

export interface SpriteSheetOptions extends ExportOptions {
    format: 'spritesheet';
    packing: 'grid' | 'compact' | 'maxrects';
    maxWidth: number;
    maxHeight: number;
    padding: number;
    extrude: number;
    trimAlpha: boolean;
    dataFormat: 'json' | 'xml' | 'css';
}

export interface LottieExportOptions extends ExportOptions {
    format: 'lottie';
    includeAssets: boolean;
    compressAssets: boolean;
    precision: number;
}

// ==================== 事件类型 ====================

export interface AnimationEvents {
    // 播放事件
    'play': void;
    'pause': void;
    'stop': void;
    'seek': { frame: number };
    'frameChange': { from: number; to: number };
    
    // 帧事件
    'frameAdded': FrameData;
    'frameRemoved': FrameData;
    'frameMoved': { from: number; to: number };
    'frameUpdated': FrameData;
    
    // 图层事件
    'layerAdded': LayerData;
    'layerRemoved': LayerData;
    'layerMoved': { layerId: string; from: number; to: number };
    'layerUpdated': { layerId: string; changes: Partial<LayerData> };
    'layerSelected': string[];
    
    // 关键帧事件
    'keyframeAdded': KeyframeData;
    'keyframeRemoved': KeyframeData;
    'keyframeUpdated': KeyframeData;
    
    // 绘制事件
    'strokeStart': StrokePoint;
    'strokeMove': StrokePoint;
    'strokeEnd': BrushStroke;
    
    // 历史事件
    'undo': void;
    'redo': void;
    'historyChanged': { canUndo: boolean; canRedo: boolean };
    
    // 项目事件
    'projectLoaded': AnimationProject;
    'projectSaved': void;
    'projectModified': void;
    
    // 导出事件
    'exportStart': ExportOptions;
    'exportProgress': { progress: number; stage: string };
    'exportComplete': Blob;
    'exportError': Error;
}

// ==================== 渲染类型 ====================

export interface RenderContext {
    gl: WebGL2RenderingContext;
    canvas: HTMLCanvasElement;
    viewport: Viewport;
    time: number;
    deltaTime: number;
}

export interface Viewport {
    x: number;
    y: number;
    width: number;
    height: number;
    zoom: number;
    rotation: number;
}

export interface RenderOptions {
    quality: 'draft' | 'preview' | 'final';
    showGrid: boolean;
    showGuides: boolean;
    showOnionSkin: boolean;
    backgroundColor?: Color;
}

// ==================== 性能统计 ====================

export interface PerformanceStats {
    fps: number;
    frameTime: number;
    drawCalls: number;
    triangles: number;
    textureMemory: number;
    bufferMemory: number;
    heapUsed: number;
    heapTotal: number;
}

// ==================== 默认值 ====================

export const DEFAULT_TRANSFORM: Transform = {
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    anchorX: 0.5,
    anchorY: 0.5,
    skewX: 0,
    skewY: 0,
};

export const DEFAULT_COLOR: Color = {
    r: 0,
    g: 0,
    b: 0,
    a: 1,
};

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
    width: 1920,
    height: 1080,
    backgroundColor: { r: 255, g: 255, b: 255, a: 1 },
    pixelRatio: 1,
    colorSpace: 'srgb',
};

export const DEFAULT_ANIMATION_SETTINGS: AnimationSettings = {
    fps: 24,
    playMode: 'loop',
    duration: 0,
    loopStart: 0,
    loopEnd: -1,
    onionSkin: {
        enabled: true,
        framesAhead: 2,
        framesBehind: 2,
        opacityAhead: 0.25,
        opacityBehind: 0.25,
        colorAhead: { r: 0, g: 200, b: 100, a: 0.5 },
        colorBehind: { r: 200, g: 100, b: 0, a: 0.5 },
        mode: 'tint',
        skinOpacityFalloff: 'linear',
    },
};

export const DEFAULT_BRUSH_SETTINGS: BrushSettings = {
    size: 20,
    opacity: 1,
    flow: 1,
    hardness: 0.8,
    spacing: 10,
    pressureSize: { enabled: true, min: 0.1, max: 1, curve: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } } },
    pressureOpacity: { enabled: false, min: 0.3, max: 1, curve: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } } },
    pressureFlow: { enabled: false, min: 0.3, max: 1, curve: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } } },
    tiltSize: { enabled: false, min: 0.5, max: 1, curve: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } } },
    tiltOpacity: { enabled: false, min: 0.5, max: 1, curve: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } } },
    tiltAngle: false,
    shape: {
        roundness: 1,
        angle: 0,
        flipX: false,
        flipY: false,
        scatterX: 0,
        scatterY: 0,
        count: 1,
        countJitter: 0,
    },
    colorDynamics: {
        hueJitter: 0,
        saturationJitter: 0,
        brightnessJitter: 0,
        purity: 0,
        foregroundBackground: 0,
    },
    smoothing: {
        enabled: true,
        amount: 50,
        mode: 'pulled-string',
        catchUp: true,
        catchUpSpeed: 75,
        tailEnd: true,
    },
    transfer: {
        buildUp: false,
        wetEdges: false,
        airbrush: false,
        noiseAmount: 0,
    },
};
