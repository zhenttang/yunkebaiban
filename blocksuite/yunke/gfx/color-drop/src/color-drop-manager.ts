/**
 * ColorDrop 管理器
 * 
 * 实现类似 Procreate 的 ColorDrop 填充功能：
 * 
 * Procreate 原理：Flood Fill（洪水填充）算法
 * - 从放置点开始，向四周扩散填充
 * - 遇到边界（颜色差异超过阈值）停止
 * - 支持阈值调整控制填充范围
 * 
 * 我们的实现：
 * 1. 对于形状元素：直接设置 fillColor
 * 2. 对于画笔元素：创建填充多边形 + 改变线条颜色
 * 3. 支持阈值调整（拖动时左右滑动）
 */

import type { GfxController } from '@blocksuite/std/gfx';
import { Bound } from '@blocksuite/global/gfx';

export interface ColorDropOptions {
    gfx: GfxController;
    onColorApplied?: (elementId: string, color: string) => void;
    onClosedCheckFailed?: (elementId: string) => void;
    onFillCreated?: (fillElementId: string, originalElementId: string) => void;
}

// 封闭检测配置
const CLOSED_PATH_CONFIG = {
    // 起点终点距离阈值（模型坐标）
    distanceThreshold: 50,
    // 最小点数（至少需要3个点才能形成封闭区域）
    minPoints: 10,
    // 最小面积（太小的区域不填充）
    minArea: 200,
    // 自动闭合：如果距离在此范围内，自动连接起点终点
    autoCloseThreshold: 80,
    // 自交叉检测的采样间隔（每隔多少点检测一次）
    intersectionSampleInterval: 3,
};

export class ColorDropManager {
    private _gfx: GfxController;
    private _isDragging = false;
    private _currentColor: string = '#000000';
    private _previewElement: HTMLDivElement | null = null;
    private _onColorApplied?: (elementId: string, color: string) => void;
    private _onClosedCheckFailed?: (elementId: string) => void;

    private _onFillCreated?: (fillElementId: string, originalElementId: string) => void;

    constructor(options: ColorDropOptions) {
        this._gfx = options.gfx;
        this._onColorApplied = options.onColorApplied;
        this._onClosedCheckFailed = options.onClosedCheckFailed;
        this._onFillCreated = options.onFillCreated;
    }

    // ==================== 封闭检测算法 ====================

    /**
     * 综合封闭检测（支持多种封闭方式）
     * 
     * 封闭方式：
     * 1. 起点终点相连（传统封闭）
     * 2. 路径自交叉形成封闭区域（如"8"字形）
     * 3. 面积足够大的近似封闭区域
     * 
     * @param points 路径点数组 [[x, y], [x, y], ...]
     * @returns 检测结果
     */
    private _checkPathClosed(points: number[][]): {
        isClosed: boolean;
        distance: number;
        area: number;
        canAutoClose: boolean;
        hasSelfIntersection: boolean;
        intersectionPoints: number[][];
        reason?: string;
    } {
        // 基本验证
        if (!points || points.length < CLOSED_PATH_CONFIG.minPoints) {
            return {
                isClosed: false,
                distance: Infinity,
                area: 0,
                canAutoClose: false,
                hasSelfIntersection: false,
                intersectionPoints: [],
                reason: `点数不足（需要至少 ${CLOSED_PATH_CONFIG.minPoints} 个点）`
            };
        }

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        // 1. 计算起点和终点的距离
        const dx = lastPoint[0] - firstPoint[0];
        const dy = lastPoint[1] - firstPoint[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 2. 检测自交叉
        const intersectionResult = this._findSelfIntersections(points);
        const hasSelfIntersection = intersectionResult.intersections.length > 0;

        // 3. 计算面积
        let area = 0;
        if (hasSelfIntersection && intersectionResult.closedRegion) {
            // 如果有自交叉形成的封闭区域，计算该区域面积
            area = this._calculatePolygonArea(intersectionResult.closedRegion);
        } else {
            // 否则计算整体路径面积
            area = this._calculatePolygonArea(points);
        }

        // 4. 判断是否可以自动闭合
        const canAutoClose = distance <= CLOSED_PATH_CONFIG.autoCloseThreshold;

        // 5. 综合判断是否封闭
        const isDistanceClosed = distance <= CLOSED_PATH_CONFIG.distanceThreshold;
        const hasEnoughArea = Math.abs(area) >= CLOSED_PATH_CONFIG.minArea;

        // 封闭条件：
        // A) 起点终点相连 且 面积足够
        // B) 有自交叉形成封闭区域 且 面积足够
        // C) 面积很大（说明是近似封闭的大图形）
        const isClosed = 
            (isDistanceClosed && hasEnoughArea) ||
            (hasSelfIntersection && hasEnoughArea) ||
            (Math.abs(area) >= CLOSED_PATH_CONFIG.minArea * 3); // 大面积直接认为封闭

        let reason: string | undefined;
        if (!isClosed) {
            if (!isDistanceClosed && !hasSelfIntersection) {
                reason = `路径未封闭（起点终点距离 ${distance.toFixed(0)}px，无自交叉）`;
            } else if (!hasEnoughArea) {
                reason = `封闭面积过小（${Math.abs(area).toFixed(0)}px²）`;
            }
        }

        return {
            isClosed,
            distance,
            area: Math.abs(area),
            canAutoClose,
            hasSelfIntersection,
            intersectionPoints: intersectionResult.intersections,
            reason
        };
    }

    /**
     * 检测路径自交叉
     * 使用线段相交算法找到所有交叉点
     */
    private _findSelfIntersections(points: number[][]): {
        intersections: number[][];
        closedRegion: number[][] | null;
    } {
        const intersections: number[][] = [];
        const n = points.length;
        const interval = CLOSED_PATH_CONFIG.intersectionSampleInterval;

        // 遍历所有线段对，检测相交
        for (let i = 0; i < n - 1; i += interval) {
            const p1 = points[i];
            const p2 = points[Math.min(i + interval, n - 1)];

            // 跳过相邻的线段，从 i+2*interval 开始检测
            for (let j = i + 2 * interval; j < n - 1; j += interval) {
                const p3 = points[j];
                const p4 = points[Math.min(j + interval, n - 1)];

                const intersection = this._lineSegmentIntersection(p1, p2, p3, p4);
                if (intersection) {
                    intersections.push(intersection);

                    // 找到第一个交叉点后，提取封闭区域
                    if (intersections.length === 1) {
                        // 封闭区域是从 i 到 j 之间的点
                        const closedRegion = points.slice(i, j + 1);
                        closedRegion.push(intersection); // 添加交叉点闭合
                        return { intersections, closedRegion };
                    }
                }
            }
        }

        return { intersections, closedRegion: null };
    }

    /**
     * 计算两条线段的交点
     * 使用参数方程求解
     */
    private _lineSegmentIntersection(
        p1: number[], p2: number[], 
        p3: number[], p4: number[]
    ): number[] | null {
        const x1 = p1[0], y1 = p1[1];
        const x2 = p2[0], y2 = p2[1];
        const x3 = p3[0], y3 = p3[1];
        const x4 = p4[0], y4 = p4[1];

        const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        
        // 平行线段
        if (Math.abs(denom) < 0.0001) return null;

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

        // 检查交点是否在两条线段上
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            const x = x1 + t * (x2 - x1);
            const y = y1 + t * (y2 - y1);
            return [x, y];
        }

        return null;
    }

    /**
     * 使用 Shoelace 公式计算多边形面积
     * 正值表示逆时针，负值表示顺时针
     */
    private _calculatePolygonArea(points: number[][]): number {
        if (points.length < 3) return 0;

        let area = 0;
        const n = points.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const xi = points[i][0];
            const yi = points[i][1];
            const xj = points[j][0];
            const yj = points[j][1];
            area += xi * yj - xj * yi;
        }

        return area / 2;
    }

    /**
     * 简化路径点（Douglas-Peucker 算法）
     * 减少点数以优化填充多边形的性能
     */
    private _simplifyPath(points: number[][], tolerance: number = 2): number[][] {
        if (points.length <= 2) return points;

        // 找到距离首尾连线最远的点
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        let maxDistance = 0;
        let maxIndex = 0;

        for (let i = 1; i < points.length - 1; i++) {
            const distance = this._pointToLineDistance(
                points[i],
                firstPoint,
                lastPoint
            );
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        // 如果最大距离大于容差，递归简化
        if (maxDistance > tolerance) {
            const left = this._simplifyPath(points.slice(0, maxIndex + 1), tolerance);
            const right = this._simplifyPath(points.slice(maxIndex), tolerance);
            return [...left.slice(0, -1), ...right];
        }

        return [firstPoint, lastPoint];
    }

    /**
     * 计算点到直线的距离
     */
    private _pointToLineDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;

        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        let param = -1;
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx: number, yy: number;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 闭合路径（连接起点和终点）
     */
    private _closePath(points: number[][]): number[][] {
        if (points.length < 2) return points;

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        // 如果起点终点不同，添加起点到末尾
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
            return [...points, [firstPoint[0], firstPoint[1]]];
        }

        return points;
    }

    /**
     * 显示未封闭提示
     */
    private _showNotClosedTip(x: number, y: number, reason?: string): void {
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y - 70}px;
            transform: translateX(-50%);
            background: rgba(255, 59, 48, 0.95);
            color: white;
            padding: 10px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 16px rgba(255, 59, 48, 0.4);
            pointer-events: none;
            z-index: 999999;
            animation: tipFadeInOut 2.5s ease-out forwards;
            max-width: 280px;
            text-align: center;
            line-height: 1.4;
        `;
        
        tip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; justify-content: center;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
                <span>路径未封闭</span>
            </div>
            ${reason ? `<div style="font-size: 11px; opacity: 0.9; margin-top: 4px;">${reason}</div>` : ''}
            <div style="font-size: 11px; opacity: 0.8; margin-top: 6px;">请画一个封闭的图形（起点和终点连接）</div>
        `;

        // 添加动画样式
        if (!document.getElementById('color-drop-tip-styles')) {
            const style = document.createElement('style');
            style.id = 'color-drop-tip-styles';
            style.textContent = `
                @keyframes tipFadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    10% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 2500);
    }

    /**
     * 开始拖动颜色
     */
    startDrag(color: string, event: MouseEvent | TouchEvent): void {
        this._isDragging = true;
        this._currentColor = color;
        
        // 创建预览元素
        this._createPreview(color);
        
        // 更新位置
        const pos = this._getEventPosition(event);
        this._updatePreviewPosition(pos.x, pos.y);
        
        // 添加全局事件监听
        document.addEventListener('mousemove', this._onMouseMove);
        document.addEventListener('mouseup', this._onMouseUp);
        document.addEventListener('touchmove', this._onTouchMove, { passive: false });
        document.addEventListener('touchend', this._onTouchEnd);
        
        // 阻止默认行为
        event.preventDefault();
    }

    /**
     * 创建拖动预览元素
     */
    private _createPreview(color: string): void {
        // 移除旧的预览
        this._removePreview();
        
        const preview = document.createElement('div');
        preview.id = 'color-drop-preview';
        preview.style.cssText = `
            position: fixed;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            background: ${color};
            border: 3px solid white;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
            pointer-events: none;
            z-index: 999999;
            transform: translate(-50%, -50%) scale(1);
            transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        `;
        
        // 添加中心点指示器
        const centerDot = document.createElement('div');
        centerDot.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        `;
        preview.appendChild(centerDot);
        
        document.body.appendChild(preview);
        this._previewElement = preview;
    }

    /**
     * 移除预览元素
     */
    private _removePreview(): void {
        if (this._previewElement) {
            this._previewElement.remove();
            this._previewElement = null;
        }
    }

    /**
     * 更新预览位置
     */
    private _updatePreviewPosition(x: number, y: number): void {
        if (this._previewElement) {
            this._previewElement.style.left = `${x}px`;
            this._previewElement.style.top = `${y}px`;
            
            // 检测是否悬停在可填充元素上
            const targetElement = this._findTargetElement(x, y);
            if (targetElement) {
                // 检查是否是画笔元素且未封闭
                let canFill = true;
                let hasIntersection = false;
                
                if ((targetElement.flavour?.includes('brush') || targetElement.type === 'brush') && targetElement.points) {
                    const checkResult = this._checkPathClosed(targetElement.points);
                    canFill = checkResult.isClosed;
                    hasIntersection = checkResult.hasSelfIntersection;
                }
                
                if (canFill) {
                    // 可以填充
                    if (hasIntersection) {
                        // 自交叉封闭 - 绿色高亮
                        this._previewElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                        this._previewElement.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(52, 199, 89, 0.6)';
                    } else {
                        // 正常封闭 - 蓝色高亮
                        this._previewElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                        this._previewElement.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(0, 122, 255, 0.5)';
                    }
                } else {
                    // 未封闭 - 红色警告
                    this._previewElement.style.transform = 'translate(-50%, -50%) scale(1.1)';
                    this._previewElement.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 59, 48, 0.5)';
                }
            } else {
                this._previewElement.style.transform = 'translate(-50%, -50%) scale(1)';
                this._previewElement.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1)';
            }
        }
    }

    /**
     * 查找目标元素
     */
    private _findTargetElement(x: number, y: number): any | null {
        if (!this._gfx) return null;
        
        try {
            // 获取画布容器的位置
            const viewport = this._gfx.viewport;
            if (!viewport) return null;
            
            // 转换屏幕坐标到模型坐标
            const container = document.querySelector('.yunke-edgeless-viewport, edgeless-editor');
            if (!container) return null;
            
            const rect = container.getBoundingClientRect();
            const localX = x - rect.left;
            const localY = y - rect.top;
            
            const [modelX, modelY] = viewport.toModelCoord(localX, localY);
            
            // 在该位置搜索元素
            if (this._gfx.grid) {
                const searchBound = new Bound(modelX - 5, modelY - 5, 10, 10);
                const elements = this._gfx.grid.search(searchBound, { strict: false });
                
                // 过滤可填充的元素（形状、画笔等）
                for (const element of elements) {
                    const el = element as any;
                    // 检查是否是可填充的元素类型
                    if (el.flavour === 'yunke:shape' || 
                        el.flavour === 'affine:shape' ||
                        el.type === 'shape' ||
                        el.flavour === 'yunke:brush' ||
                        el.flavour === 'affine:brush' ||
                        el.type === 'brush') {
                        // 检查点是否在元素边界内
                        if (el.xywh) {
                            const elBound = Bound.deserialize(el.xywh);
                            if (elBound.containsPoint([modelX, modelY])) {
                                return el;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('[ColorDrop] 查找目标元素失败:', e);
        }
        
        return null;
    }

    /**
     * 应用颜色到元素（创建填充区域）
     * @returns { success: boolean, notClosed?: boolean, reason?: string }
     */
    private _applyColorToElement(element: any, color: string): { 
        success: boolean; 
        notClosed?: boolean;
        reason?: string;
    } {
        if (!element) return { success: false };
        
        try {
            // 根据元素类型应用颜色
            if (element.flavour?.includes('shape') || element.type === 'shape') {
                // 形状元素 - 本身就是封闭的，直接设置填充
                this._fillShapeElement(element, color);
                console.log('[ColorDrop] ✅ 已填充形状颜色:', color);
                this._onColorApplied?.(element.id, color);
                return { success: true };
            } else if (element.flavour?.includes('brush') || element.type === 'brush') {
                // 画笔元素 - 需要检测是否封闭并创建填充多边形
                return this._fillBrushElement(element, color);
            }
        } catch (e) {
            console.warn('[ColorDrop] 应用颜色失败:', e);
        }
        
        return { success: false };
    }

    /**
     * 填充形状元素
     */
    private _fillShapeElement(element: any, color: string): void {
        // 尝试多种方式更新填充颜色
        if (this._gfx && typeof this._gfx.updateElement === 'function') {
            this._gfx.updateElement(element, {
                fillColor: color,
                filled: true,
            });
        } else if (element.store && typeof element.store.updateBlock === 'function') {
            element.store.updateBlock(element, {
                fillColor: color,
                filled: true,
            });
        } else {
            element.fillColor = color;
            element.filled = true;
        }
    }

    /**
     * 填充画笔元素（创建填充多边形）
     */
    private _fillBrushElement(element: any, color: string): {
        success: boolean;
        notClosed?: boolean;
        reason?: string;
    } {
        const points = element.points;
        if (!points || !Array.isArray(points)) {
            return { success: false, reason: '无法获取路径点' };
        }

        // 检测是否封闭
        const checkResult = this._checkPathClosed(points);
        console.log('[ColorDrop] 封闭检测结果:', {
            isClosed: checkResult.isClosed,
            distance: checkResult.distance.toFixed(1),
            area: checkResult.area.toFixed(0),
            hasSelfIntersection: checkResult.hasSelfIntersection,
            intersectionCount: checkResult.intersectionPoints.length
        });

        if (!checkResult.isClosed) {
            // 检查是否可以自动闭合
            if (checkResult.canAutoClose) {
                console.log('[ColorDrop] 尝试自动闭合路径...');
                return this._createFillPolygon(element, points, color, true);
            }
            
            this._onClosedCheckFailed?.(element.id);
            return { 
                success: false, 
                notClosed: true,
                reason: checkResult.reason 
            };
        }

        // 如果有自交叉，使用交叉点形成的封闭区域
        if (checkResult.hasSelfIntersection && checkResult.intersectionPoints.length > 0) {
            console.log('[ColorDrop] 检测到自交叉封闭区域，使用交叉点填充');
        }

        // 创建填充多边形
        return this._createFillPolygon(element, points, color, false);
    }

    /**
     * 创建填充多边形
     * 
     * 使用扫描线填充算法：
     * 1. 计算多边形的边界
     * 2. 生成水平扫描线
     * 3. 创建填充画笔元素
     */
    private _createFillPolygon(
        originalElement: any, 
        points: number[][], 
        color: string,
        autoClose: boolean
    ): { success: boolean; notClosed?: boolean; reason?: string } {
        try {
            console.log('[ColorDrop] 开始填充，点数:', points.length);
            
            const elementBound = originalElement.xywh 
                ? Bound.deserialize(originalElement.xywh) 
                : null;
            
            if (!elementBound) {
                return { success: false, reason: '无法获取元素边界' };
            }

            // 使用扫描线算法生成填充路径
            const fillPaths = this._generateScanLineFill(points, elementBound);
            
            let fillCreated = false;
            
            if (fillPaths.length > 0 && this._gfx?.surface) {
                // 创建填充画笔（使用扫描线路径）
                for (const path of fillPaths) {
                    if (path.length < 2) continue;
                    
                    try {
                        const fillId = this._gfx.surface.addElement({
                            type: 'brush',
                            points: path,
                            color: color,
                            lineWidth: 3, // 扫描线宽度
                        });
                        
                        if (fillId) {
                            fillCreated = true;
                            this._onFillCreated?.(fillId, originalElement.id);
                        }
                    } catch (e) {
                        // 继续处理其他扫描线
                    }
                }
                
                if (fillCreated) {
                    console.log('[ColorDrop] ✅ 已创建扫描线填充，共', fillPaths.length, '条');
                }
            }

            // 更新原画笔颜色
            const colorUpdated = this._updateElementColor(originalElement, color);

            if (fillCreated || colorUpdated) {
                this._onColorApplied?.(originalElement.id, color);
                return { success: true };
            }

            return { success: false, reason: '无法创建填充' };
        } catch (e) {
            console.error('[ColorDrop] 创建填充失败:', e);
            return { success: false, reason: String(e) };
        }
    }

    /**
     * 扫描线填充算法
     * 生成水平扫描线来填充多边形内部
     */
    private _generateScanLineFill(points: number[][], bound: Bound): number[][][] {
        const fillPaths: number[][][] = [];
        
        // 简化路径
        const polygon = this._simplifyPath(points, 3);
        if (polygon.length < 3) return fillPaths;

        // 闭合多边形
        const closedPolygon = [...polygon];
        if (polygon[0][0] !== polygon[polygon.length - 1][0] || 
            polygon[0][1] !== polygon[polygon.length - 1][1]) {
            closedPolygon.push([polygon[0][0], polygon[0][1]]);
        }

        // 计算边界
        let minY = Infinity, maxY = -Infinity;
        for (const [, y] of closedPolygon) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        }

        // 扫描线间隔（越小填充越密）
        const scanInterval = 4;

        // 生成扫描线
        for (let y = minY + scanInterval / 2; y < maxY; y += scanInterval) {
            // 找到扫描线与多边形的交点
            const intersections = this._findScanLineIntersections(closedPolygon, y);
            
            // 排序交点
            intersections.sort((a, b) => a - b);

            // 成对处理交点，生成填充线段
            for (let i = 0; i < intersections.length - 1; i += 2) {
                const x1 = intersections[i];
                const x2 = intersections[i + 1];
                
                if (x2 - x1 > 2) {
                    // 转换为绝对坐标
                    fillPaths.push([
                        [bound.x + x1, bound.y + y],
                        [bound.x + x2, bound.y + y]
                    ]);
                }
            }
        }

        return fillPaths;
    }

    /**
     * 找到扫描线与多边形的所有交点
     */
    private _findScanLineIntersections(polygon: number[][], scanY: number): number[] {
        const intersections: number[] = [];
        const n = polygon.length;

        for (let i = 0; i < n - 1; i++) {
            const [x1, y1] = polygon[i];
            const [x2, y2] = polygon[i + 1];

            // 检查扫描线是否与边相交
            if ((y1 <= scanY && y2 > scanY) || (y2 <= scanY && y1 > scanY)) {
                // 计算交点 x 坐标
                const t = (scanY - y1) / (y2 - y1);
                const x = x1 + t * (x2 - x1);
                intersections.push(x);
            }
        }

        return intersections;
    }

    /**
     * 更新元素颜色
     */
    private _updateElementColor(element: any, color: string): boolean {
        // 方式1：通过 gfx.updateElement
        if (this._gfx && typeof this._gfx.updateElement === 'function') {
            try {
                this._gfx.updateElement(element, { color: color });
                console.log('[ColorDrop] ✅ 已更新线条颜色');
                return true;
            } catch (e) {
                // 继续尝试其他方式
            }
        }

        // 方式2：通过 store.updateBlock
        if (element.store?.updateBlock) {
            try {
                element.store.updateBlock(element, { color: color });
                console.log('[ColorDrop] ✅ 已通过 store 更新颜色');
                return true;
            } catch (e) {
                // 继续尝试
            }
        }

        // 方式3：直接赋值
        if (typeof element.color !== 'undefined') {
            element.color = color;
            console.log('[ColorDrop] ✅ 已直接设置颜色');
            return true;
        }

        return false;
    }

    /**
     * 获取事件位置
     */
    private _getEventPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
        if ('touches' in event) {
            const touch = event.touches[0] || event.changedTouches[0];
            return { x: touch.clientX, y: touch.clientY };
        }
        return { x: event.clientX, y: event.clientY };
    }

    /**
     * 鼠标移动处理
     */
    private _onMouseMove = (event: MouseEvent): void => {
        if (!this._isDragging) return;
        this._updatePreviewPosition(event.clientX, event.clientY);
    };

    /**
     * 鼠标释放处理
     */
    private _onMouseUp = (event: MouseEvent): void => {
        if (!this._isDragging) return;
        this._endDrag(event.clientX, event.clientY);
    };

    /**
     * 触摸移动处理
     */
    private _onTouchMove = (event: TouchEvent): void => {
        if (!this._isDragging) return;
        event.preventDefault();
        const pos = this._getEventPosition(event);
        this._updatePreviewPosition(pos.x, pos.y);
    };

    /**
     * 触摸结束处理
     */
    private _onTouchEnd = (event: TouchEvent): void => {
        if (!this._isDragging) return;
        const pos = this._getEventPosition(event);
        this._endDrag(pos.x, pos.y);
    };

    /**
     * 结束拖动
     */
    private _endDrag(x: number, y: number): void {
        // 查找目标元素并应用颜色
        const targetElement = this._findTargetElement(x, y);
        if (targetElement) {
            const result = this._applyColorToElement(targetElement, this._currentColor);
            if (result.success) {
                // 显示成功动画
                this._showSuccessAnimation(x, y);
            } else if (result.notClosed) {
                // 显示未封闭提示（带详细原因）
                this._showNotClosedTip(x, y, result.reason);
            }
        }
        
        // 清理
        this._isDragging = false;
        this._removePreview();
        
        // 移除事件监听
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);
    }

    /**
     * 显示成功动画
     */
    private _showSuccessAnimation(x: number, y: number): void {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: ${this._currentColor};
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
            pointer-events: none;
            z-index: 999999;
            animation: colorDropRipple 0.4s ease-out forwards;
        `;
        
        // 添加动画样式
        if (!document.getElementById('color-drop-styles')) {
            const style = document.createElement('style');
            style.id = 'color-drop-styles';
            style.textContent = `
                @keyframes colorDropRipple {
                    0% {
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(3);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(ripple);
        setTimeout(() => ripple.remove(), 400);
    }

    /**
     * 销毁管理器
     */
    dispose(): void {
        this._removePreview();
        document.removeEventListener('mousemove', this._onMouseMove);
        document.removeEventListener('mouseup', this._onMouseUp);
        document.removeEventListener('touchmove', this._onTouchMove);
        document.removeEventListener('touchend', this._onTouchEnd);
    }
}
