/**
 * Professional 笔刷引擎
 * 
 * 特性：
 * - 压感感应（力度、倾斜、方位角）
 * - 多种平滑算法（Pulled-String、Moving Average、Catmull-Rom）
 * - 笔刷纹理和形状
 * - 颜色动态
 * - 湿边、累积、喷枪模式
 */

import type {
    BrushSettings,
    BrushStroke,
    Color,
    Point,
    Rect,
    StrokePoint,
    PressureMapping,
    BezierCurve,
} from '../../types/index.js';
import { DEFAULT_BRUSH_SETTINGS } from '../../types/index.js';

// ==================== 平滑状态 ====================

interface SmoothingState {
    // Pulled-String 状态
    anchor: Point | null;
    stringLength: number;
    
    // Moving Average 缓冲
    buffer: StrokePoint[];
    
    // Catmull-Rom 控制点
    controlPoints: StrokePoint[];
    
    // 尾部处理
    tailPoints: StrokePoint[];
    isTailPhase: boolean;
}

// ==================== 笔刷引擎类 ====================

export class BrushEngine {
    private settings: BrushSettings = { ...DEFAULT_BRUSH_SETTINGS };
    private currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
    
    // 当前笔画状态
    private currentStroke: BrushStroke | null = null;
    private strokePoints: StrokePoint[] = [];
    private processedPoints: StrokePoint[] = [];
    
    // 平滑状态
    private smoothingState: SmoothingState = {
        anchor: null,
        stringLength: 0,
        buffer: [],
        controlPoints: [],
        tailPoints: [],
        isTailPhase: false,
    };
    
    // 上一个输出点（用于间距计算）
    private lastOutputPoint: StrokePoint | null = null;
    
    // 累积误差（用于高精度间距）
    private spacingAccumulator: number = 0;
    
    // 压感支持检测
    private pressureSupportedPointers: Set<number> = new Set();

    // ==================== 配置 ====================
    
    setSettings(settings: Partial<BrushSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }
    
    getSettings(): BrushSettings {
        return { ...this.settings };
    }
    
    setColor(color: Color): void {
        this.currentColor = { ...color };
    }
    
    getColor(): Color {
        return { ...this.currentColor };
    }

    // ==================== 笔画生命周期 ====================
    
    /**
     * 开始新笔画
     */
    beginStroke(point: StrokePoint): void {
        this.currentStroke = {
            id: this.generateId(),
            points: [],
            brush: { ...this.settings },
            color: { ...this.currentColor },
            bounds: { x: point.x, y: point.y, width: 0, height: 0 },
            layerId: '',
        };
        
        this.strokePoints = [point];
        this.processedPoints = [];
        this.lastOutputPoint = null;
        this.spacingAccumulator = 0;
        
        // 重置平滑状态
        this.resetSmoothingState();
        
        // 检测压感支持
        this.detectPressureSupport(point);
        
        // 处理第一个点
        const processed = this.processPoint(point);
        if (processed) {
            this.processedPoints.push(processed);
            this.lastOutputPoint = processed;
        }
    }
    
    /**
     * 继续笔画
     */
    continueStroke(point: StrokePoint): StrokePoint[] {
        if (!this.currentStroke) {
            this.beginStroke(point);
            return this.processedPoints;
        }
        
        this.strokePoints.push(point);
        this.detectPressureSupport(point);
        
        // 计算速度
        const velocityPoint = this.calculateVelocity(point);
        
        // 应用平滑
        const smoothedPoint = this.applySmoothingAlgorithm(velocityPoint);
        
        if (smoothedPoint) {
            // 生成 dab 点
            const dabs = this.generateDabs(smoothedPoint);
            
            for (const dab of dabs) {
                this.processedPoints.push(dab);
            }
            
            // 更新边界
            this.updateBounds(smoothedPoint);
            
            return dabs;
        }
        
        return [];
    }
    
    /**
     * 结束笔画
     */
    endStroke(point?: StrokePoint): BrushStroke | null {
        if (!this.currentStroke) return null;
        
        // 处理最后一个点
        if (point) {
            this.strokePoints.push(point);
        }
        
        // 处理尾部（平滑追赶）
        if (this.settings.smoothing.enabled && this.settings.smoothing.tailEnd) {
            const tailDabs = this.processTail();
            this.processedPoints.push(...tailDabs);
        }
        
        // 完成笔画
        const stroke = this.currentStroke;
        stroke.points = [...this.processedPoints];
        
        // 重置状态
        this.currentStroke = null;
        this.strokePoints = [];
        this.processedPoints = [];
        this.resetSmoothingState();
        
        return stroke;
    }
    
    /**
     * 取消笔画
     */
    cancelStroke(): void {
        this.currentStroke = null;
        this.strokePoints = [];
        this.processedPoints = [];
        this.resetSmoothingState();
    }

    // ==================== 点处理 ====================
    
    private processPoint(point: StrokePoint): StrokePoint {
        // 应用压感曲线
        const adjustedPoint = { ...point };
        
        if (!this.hasPressureSupport(point)) {
            // 没有压感时使用默认值
            adjustedPoint.pressure = 0.5;
        }
        
        return adjustedPoint;
    }
    
    private calculateVelocity(point: StrokePoint): StrokePoint {
        if (this.strokePoints.length < 2) {
            return { ...point, velocity: 0 };
        }
        
        const prev = this.strokePoints[this.strokePoints.length - 2];
        const dx = point.x - prev.x;
        const dy = point.y - prev.y;
        const dt = Math.max(1, point.timestamp - prev.timestamp);
        
        const distance = Math.sqrt(dx * dx + dy * dy);
        const velocity = distance / dt;  // pixels per ms
        
        return { ...point, velocity };
    }

    // ==================== 平滑算法 ====================
    
    private resetSmoothingState(): void {
        this.smoothingState = {
            anchor: null,
            stringLength: 0,
            buffer: [],
            controlPoints: [],
            tailPoints: [],
            isTailPhase: false,
        };
    }
    
    private applySmoothingAlgorithm(point: StrokePoint): StrokePoint | null {
        if (!this.settings.smoothing.enabled) {
            return point;
        }
        
        switch (this.settings.smoothing.mode) {
            case 'pulled-string':
                return this.applyPulledStringSmoothing(point);
            case 'moving-average':
                return this.applyMovingAverageSmoothing(point);
            case 'catmull-rom':
                return this.applyCatmullRomSmoothing(point);
            case 'bezier':
                return this.applyBezierSmoothing(point);
            default:
                return point;
        }
    }
    
    /**
     * Pulled-String 平滑算法
     * 模拟绳子拖拽，产生非常平滑的曲线
     */
    private applyPulledStringSmoothing(point: StrokePoint): StrokePoint | null {
        const stringLength = this.settings.smoothing.amount * 0.5;
        const state = this.smoothingState;
        
        if (!state.anchor) {
            state.anchor = { x: point.x, y: point.y };
            state.stringLength = stringLength;
            return point;
        }
        
        const dx = point.x - state.anchor.x;
        const dy = point.y - state.anchor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= stringLength) {
            // 绳子还没拉直
            if (this.settings.smoothing.catchUp) {
                // 追赶模式：缓慢移动锚点
                const catchUpRate = this.settings.smoothing.catchUpSpeed / 100;
                state.anchor.x += dx * catchUpRate * 0.1;
                state.anchor.y += dy * catchUpRate * 0.1;
            }
            return null;
        }
        
        // 绳子拉直了，计算输出点
        const ratio = stringLength / distance;
        const outputX = point.x - dx * ratio;
        const outputY = point.y - dy * ratio;
        
        // 更新锚点
        state.anchor.x = outputX;
        state.anchor.y = outputY;
        
        // 保存尾部点
        state.tailPoints.push(point);
        if (state.tailPoints.length > 10) {
            state.tailPoints.shift();
        }
        
        return {
            ...point,
            x: outputX,
            y: outputY,
        };
    }
    
    /**
     * 移动平均平滑算法
     */
    private applyMovingAverageSmoothing(point: StrokePoint): StrokePoint {
        const state = this.smoothingState;
        const windowSize = Math.max(3, Math.floor(this.settings.smoothing.amount / 10));
        
        state.buffer.push(point);
        if (state.buffer.length > windowSize) {
            state.buffer.shift();
        }
        
        // 加权平均（越新的点权重越大）
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;
        let weightedPressure = 0;
        
        for (let i = 0; i < state.buffer.length; i++) {
            const weight = Math.pow(i + 1, 1.5);  // 非线性权重
            const p = state.buffer[i];
            
            weightedX += p.x * weight;
            weightedY += p.y * weight;
            weightedPressure += p.pressure * weight;
            totalWeight += weight;
        }
        
        return {
            ...point,
            x: weightedX / totalWeight,
            y: weightedY / totalWeight,
            pressure: weightedPressure / totalWeight,
        };
    }
    
    /**
     * Catmull-Rom 样条平滑
     */
    private applyCatmullRomSmoothing(point: StrokePoint): StrokePoint | null {
        const state = this.smoothingState;
        
        state.controlPoints.push(point);
        
        if (state.controlPoints.length < 4) {
            return state.controlPoints.length === 1 ? point : null;
        }
        
        // 使用最后 4 个点计算 Catmull-Rom 样条
        const p0 = state.controlPoints[state.controlPoints.length - 4];
        const p1 = state.controlPoints[state.controlPoints.length - 3];
        const p2 = state.controlPoints[state.controlPoints.length - 2];
        const p3 = state.controlPoints[state.controlPoints.length - 1];
        
        // 计算 t=0.5 处的点（中间点）
        const t = 0.5;
        const t2 = t * t;
        const t3 = t2 * t;
        
        const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * t +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        
        const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * t +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );
        
        const pressure = 0.5 * (
            (2 * p1.pressure) +
            (-p0.pressure + p2.pressure) * t +
            (2 * p0.pressure - 5 * p1.pressure + 4 * p2.pressure - p3.pressure) * t2 +
            (-p0.pressure + 3 * p1.pressure - 3 * p2.pressure + p3.pressure) * t3
        );
        
        // 保持缓冲区大小
        if (state.controlPoints.length > 10) {
            state.controlPoints.shift();
        }
        
        return {
            ...point,
            x,
            y,
            pressure: Math.max(0, Math.min(1, pressure)),
        };
    }
    
    /**
     * 贝塞尔平滑
     */
    private applyBezierSmoothing(point: StrokePoint): StrokePoint | null {
        const state = this.smoothingState;
        
        state.controlPoints.push(point);
        
        if (state.controlPoints.length < 3) {
            return state.controlPoints.length === 1 ? point : null;
        }
        
        // 使用最后 3 个点作为二次贝塞尔曲线控制点
        const p0 = state.controlPoints[state.controlPoints.length - 3];
        const p1 = state.controlPoints[state.controlPoints.length - 2];
        const p2 = state.controlPoints[state.controlPoints.length - 1];
        
        // 计算 t=0.5 处的点
        const t = 0.5;
        const mt = 1 - t;
        
        const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
        const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
        const pressure = mt * mt * p0.pressure + 2 * mt * t * p1.pressure + t * t * p2.pressure;
        
        if (state.controlPoints.length > 6) {
            state.controlPoints.shift();
        }
        
        return {
            ...point,
            x,
            y,
            pressure,
        };
    }
    
    /**
     * 处理尾部（平滑追赶到最终位置）
     */
    private processTail(): StrokePoint[] {
        const state = this.smoothingState;
        const result: StrokePoint[] = [];
        
        if (state.tailPoints.length === 0 || !state.anchor) {
            return result;
        }
        
        // 追赶到最后一个实际点
        const target = state.tailPoints[state.tailPoints.length - 1];
        const steps = Math.ceil(this.settings.smoothing.amount / 5);
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const eased = this.easeOutQuad(t);
            
            const x = state.anchor.x + (target.x - state.anchor.x) * eased;
            const y = state.anchor.y + (target.y - state.anchor.y) * eased;
            
            const tailPoint: StrokePoint = {
                ...target,
                x,
                y,
                pressure: target.pressure * (1 - t * 0.3),  // 压感渐弱
            };
            
            const dabs = this.generateDabs(tailPoint);
            result.push(...dabs);
        }
        
        return result;
    }

    // ==================== Dab 生成 ====================
    
    /**
     * 根据间距生成 dab 点
     */
    private generateDabs(point: StrokePoint): StrokePoint[] {
        const dabs: StrokePoint[] = [];
        
        if (!this.lastOutputPoint) {
            this.lastOutputPoint = point;
            dabs.push(this.createDab(point));
            return dabs;
        }
        
        // 计算距离
        const dx = point.x - this.lastOutputPoint.x;
        const dy = point.y - this.lastOutputPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算间距
        const size = this.calculateSize(point);
        const spacing = (size * this.settings.spacing) / 100;
        
        if (spacing <= 0) {
            dabs.push(this.createDab(point));
            this.lastOutputPoint = point;
            return dabs;
        }
        
        // 生成中间点
        let traveled = this.spacingAccumulator;
        
        while (traveled < distance) {
            const t = traveled / distance;
            
            const dabPoint = this.interpolatePoint(this.lastOutputPoint, point, t);
            dabs.push(this.createDab(dabPoint));
            
            traveled += spacing;
        }
        
        // 保存累积误差
        this.spacingAccumulator = traveled - distance;
        this.lastOutputPoint = point;
        
        return dabs;
    }
    
    /**
     * 创建单个 dab
     */
    private createDab(point: StrokePoint): StrokePoint {
        const dab = { ...point };
        
        // 应用形状散布
        if (this.settings.shape.scatterX > 0 || this.settings.shape.scatterY > 0) {
            const size = this.calculateSize(point);
            dab.x += (Math.random() - 0.5) * this.settings.shape.scatterX * size;
            dab.y += (Math.random() - 0.5) * this.settings.shape.scatterY * size;
        }
        
        return dab;
    }
    
    /**
     * 插值两点
     */
    private interpolatePoint(
        from: StrokePoint,
        to: StrokePoint,
        t: number
    ): StrokePoint {
        return {
            x: from.x + (to.x - from.x) * t,
            y: from.y + (to.y - from.y) * t,
            pressure: from.pressure + (to.pressure - from.pressure) * t,
            tiltX: from.tiltX + (to.tiltX - from.tiltX) * t,
            tiltY: from.tiltY + (to.tiltY - from.tiltY) * t,
            twist: from.twist + (to.twist - from.twist) * t,
            timestamp: from.timestamp + (to.timestamp - from.timestamp) * t,
            velocity: from.velocity !== undefined && to.velocity !== undefined
                ? from.velocity + (to.velocity - from.velocity) * t
                : undefined,
        };
    }

    // ==================== 压感映射 ====================
    
    /**
     * 计算笔刷大小（考虑压感）
     */
    calculateSize(point: StrokePoint): number {
        let size = this.settings.size;
        
        // 压感映射
        if (this.settings.pressureSize.enabled) {
            const mapped = this.applyPressureCurve(
                point.pressure,
                this.settings.pressureSize
            );
            size *= mapped;
        }
        
        // 倾斜映射
        if (this.settings.tiltSize.enabled) {
            const tilt = Math.sqrt(point.tiltX * point.tiltX + point.tiltY * point.tiltY) / 90;
            const mapped = this.applyPressureCurve(tilt, this.settings.tiltSize);
            size *= mapped;
        }
        
        return Math.max(1, size);
    }
    
    /**
     * 计算透明度（考虑压感）
     */
    calculateOpacity(point: StrokePoint): number {
        let opacity = this.settings.opacity;
        
        if (this.settings.pressureOpacity.enabled) {
            const mapped = this.applyPressureCurve(
                point.pressure,
                this.settings.pressureOpacity
            );
            opacity *= mapped;
        }
        
        if (this.settings.tiltOpacity.enabled) {
            const tilt = Math.sqrt(point.tiltX * point.tiltX + point.tiltY * point.tiltY) / 90;
            const mapped = this.applyPressureCurve(tilt, this.settings.tiltOpacity);
            opacity *= mapped;
        }
        
        return Math.max(0, Math.min(1, opacity));
    }
    
    /**
     * 计算流量（考虑压感）
     */
    calculateFlow(point: StrokePoint): number {
        let flow = this.settings.flow;
        
        if (this.settings.pressureFlow.enabled) {
            const mapped = this.applyPressureCurve(
                point.pressure,
                this.settings.pressureFlow
            );
            flow *= mapped;
        }
        
        return Math.max(0, Math.min(1, flow));
    }
    
    /**
     * 应用压感曲线
     */
    private applyPressureCurve(value: number, mapping: PressureMapping): number {
        // 贝塞尔曲线映射
        const { curve, min, max } = mapping;
        const t = this.evaluateBezier(value, curve);
        return min + (max - min) * t;
    }
    
    /**
     * 评估贝塞尔曲线
     */
    private evaluateBezier(t: number, curve: BezierCurve): number {
        // 三次贝塞尔曲线：(0,0) -> p1 -> p2 -> (1,1)
        const p0 = { x: 0, y: 0 };
        const p3 = { x: 1, y: 1 };
        
        const mt = 1 - t;
        const mt2 = mt * mt;
        const mt3 = mt2 * mt;
        const t2 = t * t;
        const t3 = t2 * t;
        
        // 只需要 y 值
        const y = mt3 * p0.y + 
                  3 * mt2 * t * curve.p1.y + 
                  3 * mt * t2 * curve.p2.y + 
                  t3 * p3.y;
        
        return Math.max(0, Math.min(1, y));
    }

    // ==================== 颜色动态 ====================
    
    /**
     * 计算动态颜色
     */
    calculateColor(point: StrokePoint): Color {
        const color = { ...this.currentColor };
        const dynamics = this.settings.colorDynamics;
        
        // 转换到 HSL
        const hsl = this.rgbToHsl(color.r, color.g, color.b);
        
        // 应用抖动
        if (dynamics.hueJitter > 0) {
            hsl.h += (Math.random() - 0.5) * dynamics.hueJitter;
            if (hsl.h < 0) hsl.h += 1;
            if (hsl.h > 1) hsl.h -= 1;
        }
        
        if (dynamics.saturationJitter > 0) {
            hsl.s += (Math.random() - 0.5) * dynamics.saturationJitter;
            hsl.s = Math.max(0, Math.min(1, hsl.s));
        }
        
        if (dynamics.brightnessJitter > 0) {
            hsl.l += (Math.random() - 0.5) * dynamics.brightnessJitter;
            hsl.l = Math.max(0, Math.min(1, hsl.l));
        }
        
        // 转回 RGB
        const rgb = this.hslToRgb(hsl.h, hsl.s, hsl.l);
        
        return {
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            a: color.a,
        };
    }

    // ==================== 辅助方法 ====================
    
    private generateId(): string {
        return `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    private detectPressureSupport(point: StrokePoint): void {
        // 检测是否有压感变化
        if (point.pressure !== 0.5 && point.pressure !== 0 && point.pressure !== 1) {
            this.pressureSupportedPointers.add(0);  // 简化：只跟踪主指针
        }
    }
    
    private hasPressureSupport(point: StrokePoint): boolean {
        return this.pressureSupportedPointers.has(0) || point.pressure !== 0.5;
    }
    
    private updateBounds(point: StrokePoint): void {
        if (!this.currentStroke) return;
        
        const size = this.calculateSize(point);
        const halfSize = size / 2;
        
        const bounds = this.currentStroke.bounds;
        
        const minX = point.x - halfSize;
        const minY = point.y - halfSize;
        const maxX = point.x + halfSize;
        const maxY = point.y + halfSize;
        
        if (bounds.width === 0 && bounds.height === 0) {
            bounds.x = minX;
            bounds.y = minY;
            bounds.width = size;
            bounds.height = size;
        } else {
            const newMinX = Math.min(bounds.x, minX);
            const newMinY = Math.min(bounds.y, minY);
            const newMaxX = Math.max(bounds.x + bounds.width, maxX);
            const newMaxY = Math.max(bounds.y + bounds.height, maxY);
            
            bounds.x = newMinX;
            bounds.y = newMinY;
            bounds.width = newMaxX - newMinX;
            bounds.height = newMaxY - newMinY;
        }
    }
    
    // 缓动函数
    private easeOutQuad(t: number): number {
        return t * (2 - t);
    }
    
    // RGB to HSL
    private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const l = (max + min) / 2;
        
        if (max === min) {
            return { h: 0, s: 0, l };
        }
        
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        let h: number;
        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            default:
                h = ((r - g) / d + 4) / 6;
        }
        
        return { h, s, l };
    }
    
    // HSL to RGB
    private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
        if (s === 0) {
            const v = Math.round(l * 255);
            return { r: v, g: v, b: v };
        }
        
        const hue2rgb = (p: number, q: number, t: number): number => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        return {
            r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
            g: Math.round(hue2rgb(p, q, h) * 255),
            b: Math.round(hue2rgb(p, q, h - 1/3) * 255),
        };
    }
}
