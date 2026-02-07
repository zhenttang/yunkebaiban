/**
 * Professional 笔刷预设库
 * 
 * 包含多种专业级笔刷预设：
 * - 基础笔刷（铅笔、钢笔、马克笔）
 * - 绘画笔刷（水彩、油画、丙烯）
 * - 特效笔刷（喷枪、像素、纹理）
 * - 动画笔刷（清线、填充、着色）
 */

import type { BrushSettings, BezierCurve, Point } from '../../types/index.js';

// ==================== 预设分类 ====================

export type BrushCategory = 
    | 'basic'      // 基础
    | 'painting'   // 绘画
    | 'sketch'     // 素描
    | 'ink'        // 墨水
    | 'effects'    // 特效
    | 'animation'  // 动画
    | 'texture';   // 纹理

// ==================== 预设接口 ====================

export interface BrushPreset {
    id: string;
    name: string;
    nameCN: string;
    category: BrushCategory;
    description: string;
    icon?: string;
    settings: BrushSettings;
    // 预览用的示例笔画参数
    previewStroke?: {
        points: Point[];
        pressures: number[];
    };
}

// ==================== 压感曲线预设 ====================

const LINEAR_CURVE: BezierCurve = {
    p1: { x: 0.25, y: 0.25 },
    p2: { x: 0.75, y: 0.75 },
};

const SOFT_CURVE: BezierCurve = {
    p1: { x: 0.25, y: 0.1 },
    p2: { x: 0.75, y: 0.9 },
};

const HEAVY_CURVE: BezierCurve = {
    p1: { x: 0.1, y: 0.4 },
    p2: { x: 0.9, y: 0.6 },
};

const LIGHT_CURVE: BezierCurve = {
    p1: { x: 0.4, y: 0.1 },
    p2: { x: 0.6, y: 0.9 },
};

const S_CURVE: BezierCurve = {
    p1: { x: 0.42, y: 0 },
    p2: { x: 0.58, y: 1 },
};

// ==================== 基础笔刷 ====================

export const PENCIL_PRESET: BrushPreset = {
    id: 'pencil',
    name: 'Pencil',
    nameCN: '铅笔',
    category: 'basic',
    description: '模拟真实铅笔的质感，适合素描和草稿',
    settings: {
        size: 8,
        opacity: 0.85,
        flow: 0.9,
        hardness: 0.7,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.2, max: 1.0, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.3, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.8, max: 1.5, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.85,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 2,
            scatterY: 2,
            count: 1,
            countJitter: 0,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0,
            brightnessJitter: 0.05,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 30,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 80,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.15,
        },
    },
};

export const PEN_PRESET: BrushPreset = {
    id: 'pen',
    name: 'Pen',
    nameCN: '钢笔',
    category: 'basic',
    description: '清晰锐利的线条，适合勾线和签名',
    settings: {
        size: 6,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.95,
        spacing: 6,
        pressureSize: { enabled: true, min: 0.3, max: 1.0, curve: HEAVY_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            catchUpSpeed: 70,
            tailEnd: true,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const MARKER_PRESET: BrushPreset = {
    id: 'marker',
    name: 'Marker',
    nameCN: '马克笔',
    category: 'basic',
    description: '饱和度高的马克笔效果，边缘略微模糊',
    settings: {
        size: 24,
        opacity: 0.75,
        flow: 0.85,
        hardness: 0.6,
        spacing: 12,
        pressureSize: { enabled: true, min: 0.7, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.5, max: 1.0, curve: SOFT_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.8, max: 1.3, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.7,
            angle: 30,
            flipX: false,
            flipY: false,
            scatterX: 0,
            scatterY: 0,
            count: 1,
            countJitter: 0,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0.05,
            brightnessJitter: 0.03,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 25,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 90,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: true,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const HIGHLIGHTER_PRESET: BrushPreset = {
    id: 'highlighter',
    name: 'Highlighter',
    nameCN: '荧光笔',
    category: 'basic',
    description: '半透明的荧光笔效果，适合标注',
    settings: {
        size: 32,
        opacity: 0.4,
        flow: 0.7,
        hardness: 0.3,
        spacing: 15,
        pressureSize: { enabled: false, min: 0.9, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.2, max: 0.5, curve: SOFT_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 0.3,
            angle: 45,
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
            amount: 15,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 95,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

// ==================== 绘画笔刷 ====================

export const WATERCOLOR_PRESET: BrushPreset = {
    id: 'watercolor',
    name: 'Watercolor',
    nameCN: '水彩',
    category: 'painting',
    description: '模拟水彩的湿润效果，颜色会自然扩散',
    settings: {
        size: 40,
        opacity: 0.6,
        flow: 0.5,
        hardness: 0.15,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.5, max: 1.2, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.2, max: 0.8, curve: S_CURVE },
        pressureFlow: { enabled: true, min: 0.3, max: 0.8, curve: SOFT_CURVE },
        tiltSize: { enabled: true, min: 0.7, max: 1.5, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: true, min: 0.4, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.9,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 5,
            scatterY: 5,
            count: 2,
            countJitter: 0.3,
        },
        colorDynamics: {
            hueJitter: 0.02,
            saturationJitter: 0.1,
            brightnessJitter: 0.08,
            purity: 0.1,
            foregroundBackground: 0.05,
        },
        smoothing: {
            enabled: true,
            amount: 40,
            mode: 'catmull-rom',
            catchUp: true,
            catchUpSpeed: 60,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: true,
            airbrush: false,
            noiseAmount: 0.2,
        },
    },
};

export const OIL_PAINT_PRESET: BrushPreset = {
    id: 'oil-paint',
    name: 'Oil Paint',
    nameCN: '油画',
    category: 'painting',
    description: '厚重的油画质感，笔触明显',
    settings: {
        size: 35,
        opacity: 0.9,
        flow: 0.85,
        hardness: 0.5,
        spacing: 10,
        pressureSize: { enabled: true, min: 0.6, max: 1.1, curve: HEAVY_CURVE },
        pressureOpacity: { enabled: true, min: 0.7, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.8, max: 1.4, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.6,
            angle: 15,
            flipX: false,
            flipY: false,
            scatterX: 3,
            scatterY: 3,
            count: 1,
            countJitter: 0.2,
        },
        colorDynamics: {
            hueJitter: 0.01,
            saturationJitter: 0.05,
            brightnessJitter: 0.05,
            purity: 0.15,
            foregroundBackground: 0.1,
        },
        smoothing: {
            enabled: true,
            amount: 35,
            mode: 'bezier',
            catchUp: true,
            catchUpSpeed: 65,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.1,
        },
    },
};

export const ACRYLIC_PRESET: BrushPreset = {
    id: 'acrylic',
    name: 'Acrylic',
    nameCN: '丙烯',
    category: 'painting',
    description: '快干的丙烯颜料效果，覆盖力强',
    settings: {
        size: 30,
        opacity: 0.95,
        flow: 0.9,
        hardness: 0.65,
        spacing: 12,
        pressureSize: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.8, max: 1.0, curve: HEAVY_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.7, max: 1.3, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.75,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 2,
            scatterY: 2,
            count: 1,
            countJitter: 0.1,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0.03,
            brightnessJitter: 0.03,
            purity: 0.05,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 30,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 75,
            tailEnd: true,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.05,
        },
    },
};

export const GOUACHE_PRESET: BrushPreset = {
    id: 'gouache',
    name: 'Gouache',
    nameCN: '水粉',
    category: 'painting',
    description: '不透明水彩效果，适合动画背景',
    settings: {
        size: 28,
        opacity: 0.88,
        flow: 0.8,
        hardness: 0.45,
        spacing: 10,
        pressureSize: { enabled: true, min: 0.6, max: 1.0, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.6, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: true, min: 0.4, max: 0.9, curve: SOFT_CURVE },
        tiltSize: { enabled: true, min: 0.8, max: 1.2, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.8,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 3,
            scatterY: 3,
            count: 1,
            countJitter: 0.15,
        },
        colorDynamics: {
            hueJitter: 0.01,
            saturationJitter: 0.06,
            brightnessJitter: 0.04,
            purity: 0.08,
            foregroundBackground: 0.03,
        },
        smoothing: {
            enabled: true,
            amount: 35,
            mode: 'catmull-rom',
            catchUp: true,
            catchUpSpeed: 70,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: true,
            airbrush: false,
            noiseAmount: 0.08,
        },
    },
};

// ==================== 素描笔刷 ====================

export const CHARCOAL_PRESET: BrushPreset = {
    id: 'charcoal',
    name: 'Charcoal',
    nameCN: '炭笔',
    category: 'sketch',
    description: '粗糙的炭笔质感，适合速写',
    settings: {
        size: 18,
        opacity: 0.8,
        flow: 0.75,
        hardness: 0.4,
        spacing: 6,
        pressureSize: { enabled: true, min: 0.4, max: 1.2, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.4, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: true, min: 0.3, max: 0.9, curve: SOFT_CURVE },
        tiltSize: { enabled: true, min: 0.6, max: 2.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.5,
            angle: 25,
            flipX: false,
            flipY: false,
            scatterX: 4,
            scatterY: 4,
            count: 2,
            countJitter: 0.4,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0,
            brightnessJitter: 0.1,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 20,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 85,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.25,
        },
    },
};

export const CRAYON_PRESET: BrushPreset = {
    id: 'crayon',
    name: 'Crayon',
    nameCN: '蜡笔',
    category: 'sketch',
    description: '蜡笔的粗糙纹理，色彩鲜艳',
    settings: {
        size: 22,
        opacity: 0.85,
        flow: 0.8,
        hardness: 0.55,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.6, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.5, max: 1.0, curve: SOFT_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.7, max: 1.5, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: true, min: 0.6, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.65,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 3,
            scatterY: 3,
            count: 1,
            countJitter: 0.2,
        },
        colorDynamics: {
            hueJitter: 0.02,
            saturationJitter: 0.05,
            brightnessJitter: 0.08,
            purity: 0.05,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 25,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 80,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.2,
        },
    },
};

export const PASTEL_PRESET: BrushPreset = {
    id: 'pastel',
    name: 'Pastel',
    nameCN: '色粉笔',
    category: 'sketch',
    description: '柔和的色粉笔效果，适合肖像',
    settings: {
        size: 25,
        opacity: 0.7,
        flow: 0.65,
        hardness: 0.25,
        spacing: 7,
        pressureSize: { enabled: true, min: 0.5, max: 1.1, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.3, max: 0.85, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.3, max: 0.8, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.6, max: 1.8, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: true, min: 0.4, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.7,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 5,
            scatterY: 5,
            count: 2,
            countJitter: 0.3,
        },
        colorDynamics: {
            hueJitter: 0.01,
            saturationJitter: 0.08,
            brightnessJitter: 0.06,
            purity: 0.1,
            foregroundBackground: 0.05,
        },
        smoothing: {
            enabled: true,
            amount: 35,
            mode: 'catmull-rom',
            catchUp: true,
            catchUpSpeed: 70,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.15,
        },
    },
};

// ==================== 墨水笔刷 ====================

export const INK_BRUSH_PRESET: BrushPreset = {
    id: 'ink-brush',
    name: 'Ink Brush',
    nameCN: '毛笔',
    category: 'ink',
    description: '中国毛笔效果，笔锋变化丰富',
    settings: {
        size: 20,
        opacity: 0.95,
        flow: 0.9,
        hardness: 0.7,
        spacing: 5,
        pressureSize: { enabled: true, min: 0.1, max: 1.5, curve: S_CURVE },
        pressureOpacity: { enabled: true, min: 0.6, max: 1.0, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.4, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.5, max: 2.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.4,
            angle: 45,
            flipX: false,
            flipY: false,
            scatterX: 1,
            scatterY: 1,
            count: 1,
            countJitter: 0.1,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0,
            brightnessJitter: 0.05,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 45,
            mode: 'pulled-string',
            catchUp: true,
            catchUpSpeed: 60,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: true,
            airbrush: false,
            noiseAmount: 0.05,
        },
    },
};

export const CALLIGRAPHY_PRESET: BrushPreset = {
    id: 'calligraphy',
    name: 'Calligraphy',
    nameCN: '书法笔',
    category: 'ink',
    description: '西方书法笔效果，适合字体设计',
    settings: {
        size: 15,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.85,
        spacing: 4,
        pressureSize: { enabled: true, min: 0.2, max: 1.0, curve: HEAVY_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: true, min: 0.3, max: 1.5, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: true,
        shape: {
            roundness: 0.2,
            angle: 45,
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
            amount: 55,
            mode: 'pulled-string',
            catchUp: true,
            catchUpSpeed: 55,
            tailEnd: true,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const FELT_TIP_PRESET: BrushPreset = {
    id: 'felt-tip',
    name: 'Felt Tip',
    nameCN: '签字笔',
    category: 'ink',
    description: '签字笔效果，线条均匀',
    settings: {
        size: 4,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.9,
        spacing: 5,
        pressureSize: { enabled: true, min: 0.8, max: 1.0, curve: HEAVY_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 40,
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
    },
};

// ==================== 特效笔刷 ====================

export const AIRBRUSH_PRESET: BrushPreset = {
    id: 'airbrush',
    name: 'Airbrush',
    nameCN: '喷枪',
    category: 'effects',
    description: '柔和的喷枪效果，适合上色和阴影',
    settings: {
        size: 60,
        opacity: 0.3,
        flow: 0.25,
        hardness: 0.05,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.1, max: 0.5, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.1, max: 0.4, curve: SOFT_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 20,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 90,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: true,
            noiseAmount: 0,
        },
    },
};

export const SPRAY_PRESET: BrushPreset = {
    id: 'spray',
    name: 'Spray',
    nameCN: '喷雾',
    category: 'effects',
    description: '喷雾效果，有颗粒感',
    settings: {
        size: 80,
        opacity: 0.5,
        flow: 0.6,
        hardness: 0.1,
        spacing: 5,
        pressureSize: { enabled: true, min: 0.6, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.2, max: 0.7, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.3, max: 0.8, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 30,
            scatterY: 30,
            count: 5,
            countJitter: 0.5,
        },
        colorDynamics: {
            hueJitter: 0.02,
            saturationJitter: 0.05,
            brightnessJitter: 0.1,
            purity: 0.05,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: false,
            amount: 0,
            mode: 'moving-average',
            catchUp: false,
            catchUpSpeed: 100,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: true,
            noiseAmount: 0.3,
        },
    },
};

export const PIXEL_PRESET: BrushPreset = {
    id: 'pixel',
    name: 'Pixel',
    nameCN: '像素',
    category: 'effects',
    description: '像素风格笔刷，无抗锯齿',
    settings: {
        size: 1,
        opacity: 1.0,
        flow: 1.0,
        hardness: 1.0,
        spacing: 100,
        pressureSize: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            enabled: false,
            amount: 0,
            mode: 'moving-average',
            catchUp: false,
            catchUpSpeed: 100,
            tailEnd: false,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const GLOW_PRESET: BrushPreset = {
    id: 'glow',
    name: 'Glow',
    nameCN: '发光',
    category: 'effects',
    description: '发光效果笔刷，适合特效',
    settings: {
        size: 50,
        opacity: 0.4,
        flow: 0.35,
        hardness: 0.0,
        spacing: 6,
        pressureSize: { enabled: true, min: 0.5, max: 1.2, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.2, max: 0.6, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.2, max: 0.5, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 2,
            scatterY: 2,
            count: 1,
            countJitter: 0,
        },
        colorDynamics: {
            hueJitter: 0.05,
            saturationJitter: 0.1,
            brightnessJitter: 0.1,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 30,
            mode: 'catmull-rom',
            catchUp: true,
            catchUpSpeed: 75,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: true,
            noiseAmount: 0,
        },
    },
};

// ==================== 动画专用笔刷 ====================

export const CLEAN_LINE_PRESET: BrushPreset = {
    id: 'clean-line',
    name: 'Clean Line',
    nameCN: '清线',
    category: 'animation',
    description: '专为动画清线设计，线条干净平滑',
    settings: {
        size: 5,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.92,
        spacing: 4,
        pressureSize: { enabled: true, min: 0.4, max: 1.0, curve: S_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 60,
            mode: 'pulled-string',
            catchUp: true,
            catchUpSpeed: 55,
            tailEnd: true,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const ROUGH_SKETCH_PRESET: BrushPreset = {
    id: 'rough-sketch',
    name: 'Rough Sketch',
    nameCN: '草稿',
    category: 'animation',
    description: '快速草稿笔刷，适合动画前期',
    settings: {
        size: 10,
        opacity: 0.7,
        flow: 0.8,
        hardness: 0.6,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.3, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.4, max: 0.85, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 0.9,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 1,
            scatterY: 1,
            count: 1,
            countJitter: 0,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0,
            brightnessJitter: 0.03,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: true,
            amount: 20,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 90,
            tailEnd: true,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.08,
        },
    },
};

export const FLAT_FILL_PRESET: BrushPreset = {
    id: 'flat-fill',
    name: 'Flat Fill',
    nameCN: '平涂',
    category: 'animation',
    description: '大面积平涂笔刷，无纹理',
    settings: {
        size: 100,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.95,
        spacing: 15,
        pressureSize: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 15,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 95,
            tailEnd: false,
        },
        transfer: {
            buildUp: false,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0,
        },
    },
};

export const SOFT_SHADE_PRESET: BrushPreset = {
    id: 'soft-shade',
    name: 'Soft Shade',
    nameCN: '柔光阴影',
    category: 'animation',
    description: '柔和的阴影笔刷，适合动画上色',
    settings: {
        size: 45,
        opacity: 0.35,
        flow: 0.4,
        hardness: 0.1,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.6, max: 1.0, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.15, max: 0.5, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.2, max: 0.6, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 25,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 85,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: true,
            noiseAmount: 0,
        },
    },
};

// ==================== 纹理笔刷 ====================

export const NOISE_TEXTURE_PRESET: BrushPreset = {
    id: 'noise-texture',
    name: 'Noise Texture',
    nameCN: '噪点纹理',
    category: 'texture',
    description: '添加噪点纹理效果',
    settings: {
        size: 60,
        opacity: 0.5,
        flow: 0.6,
        hardness: 0.3,
        spacing: 10,
        pressureSize: { enabled: true, min: 0.7, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.3, max: 0.7, curve: SOFT_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 8,
            scatterY: 8,
            count: 3,
            countJitter: 0.4,
        },
        colorDynamics: {
            hueJitter: 0,
            saturationJitter: 0,
            brightnessJitter: 0.15,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: false,
            amount: 0,
            mode: 'moving-average',
            catchUp: false,
            catchUpSpeed: 100,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.4,
        },
    },
};

export const GRAIN_PRESET: BrushPreset = {
    id: 'grain',
    name: 'Grain',
    nameCN: '颗粒',
    category: 'texture',
    description: '胶片颗粒效果',
    settings: {
        size: 40,
        opacity: 0.4,
        flow: 0.5,
        hardness: 0.2,
        spacing: 6,
        pressureSize: { enabled: true, min: 0.8, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: true, min: 0.2, max: 0.6, curve: SOFT_CURVE },
        pressureFlow: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
            angle: 0,
            flipX: false,
            flipY: false,
            scatterX: 12,
            scatterY: 12,
            count: 4,
            countJitter: 0.6,
        },
        colorDynamics: {
            hueJitter: 0.01,
            saturationJitter: 0.03,
            brightnessJitter: 0.2,
            purity: 0,
            foregroundBackground: 0,
        },
        smoothing: {
            enabled: false,
            amount: 0,
            mode: 'moving-average',
            catchUp: false,
            catchUpSpeed: 100,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: false,
            noiseAmount: 0.5,
        },
    },
};

// ==================== 橡皮擦预设 ====================

export const HARD_ERASER_PRESET: BrushPreset = {
    id: 'hard-eraser',
    name: 'Hard Eraser',
    nameCN: '硬橡皮',
    category: 'basic',
    description: '硬边橡皮擦，边缘清晰',
    settings: {
        size: 20,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.95,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        pressureOpacity: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        pressureFlow: { enabled: false, min: 1.0, max: 1.0, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 30,
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
    },
};

export const SOFT_ERASER_PRESET: BrushPreset = {
    id: 'soft-eraser',
    name: 'Soft Eraser',
    nameCN: '软橡皮',
    category: 'basic',
    description: '柔边橡皮擦，渐变过渡',
    settings: {
        size: 40,
        opacity: 0.6,
        flow: 0.5,
        hardness: 0.15,
        spacing: 8,
        pressureSize: { enabled: true, min: 0.6, max: 1.0, curve: SOFT_CURVE },
        pressureOpacity: { enabled: true, min: 0.3, max: 0.8, curve: SOFT_CURVE },
        pressureFlow: { enabled: true, min: 0.2, max: 0.7, curve: LINEAR_CURVE },
        tiltSize: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltOpacity: { enabled: false, min: 0.5, max: 1.0, curve: LINEAR_CURVE },
        tiltAngle: false,
        shape: {
            roundness: 1.0,
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
            amount: 25,
            mode: 'moving-average',
            catchUp: true,
            catchUpSpeed: 80,
            tailEnd: false,
        },
        transfer: {
            buildUp: true,
            wetEdges: false,
            airbrush: true,
            noiseAmount: 0,
        },
    },
};

// ==================== 预设集合 ====================

export const ALL_PRESETS: BrushPreset[] = [
    // 基础
    PENCIL_PRESET,
    PEN_PRESET,
    MARKER_PRESET,
    HIGHLIGHTER_PRESET,
    HARD_ERASER_PRESET,
    SOFT_ERASER_PRESET,
    
    // 绘画
    WATERCOLOR_PRESET,
    OIL_PAINT_PRESET,
    ACRYLIC_PRESET,
    GOUACHE_PRESET,
    
    // 素描
    CHARCOAL_PRESET,
    CRAYON_PRESET,
    PASTEL_PRESET,
    
    // 墨水
    INK_BRUSH_PRESET,
    CALLIGRAPHY_PRESET,
    FELT_TIP_PRESET,
    
    // 特效
    AIRBRUSH_PRESET,
    SPRAY_PRESET,
    PIXEL_PRESET,
    GLOW_PRESET,
    
    // 动画
    CLEAN_LINE_PRESET,
    ROUGH_SKETCH_PRESET,
    FLAT_FILL_PRESET,
    SOFT_SHADE_PRESET,
    
    // 纹理
    NOISE_TEXTURE_PRESET,
    GRAIN_PRESET,
];

// ==================== 按分类获取预设 ====================

export function getPresetsByCategory(category: BrushCategory): BrushPreset[] {
    return ALL_PRESETS.filter(preset => preset.category === category);
}

export function getPresetById(id: string): BrushPreset | undefined {
    return ALL_PRESETS.find(preset => preset.id === id);
}

// ==================== 分类信息 ====================

export const CATEGORY_INFO: Record<BrushCategory, { name: string; nameCN: string; icon: string }> = {
    basic: { name: 'Basic', nameCN: '基础', icon: '✏️' },
    painting: { name: 'Painting', nameCN: '绘画', icon: '🎨' },
    sketch: { name: 'Sketch', nameCN: '素描', icon: '📝' },
    ink: { name: 'Ink', nameCN: '墨水', icon: '🖋️' },
    effects: { name: 'Effects', nameCN: '特效', icon: '✨' },
    animation: { name: 'Animation', nameCN: '动画', icon: '🎬' },
    texture: { name: 'Texture', nameCN: '纹理', icon: '🔲' },
};
