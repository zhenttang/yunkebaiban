/**
 * ColorDrop 管理器
 * 
 * 负责：
 * 1. 创建拖动预览
 * 2. 检测放置目标
 * 3. 应用颜色填充
 */

import type { GfxController } from '@blocksuite/std/gfx';
import { Bound } from '@blocksuite/global/gfx';

export interface ColorDropOptions {
    gfx: GfxController;
    onColorApplied?: (elementId: string, color: string) => void;
    onClosedCheckFailed?: (elementId: string) => void;
}

// 封闭检测阈值（像素）
const CLOSED_PATH_THRESHOLD = 20;

export class ColorDropManager {
    private _gfx: GfxController;
    private _isDragging = false;
    private _currentColor: string = '#000000';
    private _previewElement: HTMLDivElement | null = null;
    private _onColorApplied?: (elementId: string, color: string) => void;
    private _onClosedCheckFailed?: (elementId: string) => void;

    constructor(options: ColorDropOptions) {
        this._gfx = options.gfx;
        this._onColorApplied = options.onColorApplied;
        this._onClosedCheckFailed = options.onClosedCheckFailed;
    }

    /**
     * 检测画笔路径是否封闭
     * @param points 路径点数组 [[x, y], [x, y], ...]
     * @returns { isClosed: boolean, distance: number }
     */
    private _checkPathClosed(points: number[][]): { isClosed: boolean; distance: number } {
        if (!points || points.length < 3) {
            return { isClosed: false, distance: Infinity };
        }

        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];

        // 计算起点和终点的距离
        const dx = lastPoint[0] - firstPoint[0];
        const dy = lastPoint[1] - firstPoint[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        return {
            isClosed: distance <= CLOSED_PATH_THRESHOLD,
            distance
        };
    }

    /**
     * 显示未封闭提示
     */
    private _showNotClosedTip(x: number, y: number): void {
        const tip = document.createElement('div');
        tip.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y - 60}px;
            transform: translateX(-50%);
            background: rgba(255, 59, 48, 0.95);
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
            pointer-events: none;
            z-index: 999999;
            animation: tipFadeInOut 2s ease-out forwards;
            white-space: nowrap;
        `;
        tip.textContent = '路径未封闭，无法填充';

        // 添加动画样式
        if (!document.getElementById('color-drop-tip-styles')) {
            const style = document.createElement('style');
            style.id = 'color-drop-tip-styles';
            style.textContent = `
                @keyframes tipFadeInOut {
                    0% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                    100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(tip);
        setTimeout(() => tip.remove(), 2000);
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
                if ((targetElement.flavour?.includes('brush') || targetElement.type === 'brush') && targetElement.points) {
                    const { isClosed } = this._checkPathClosed(targetElement.points);
                    canFill = isClosed;
                }
                
                if (canFill) {
                    // 可以填充 - 蓝色高亮
                    this._previewElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                    this._previewElement.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(0, 122, 255, 0.5)';
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
     * 应用颜色到元素
     * @returns { success: boolean, notClosed?: boolean }
     */
    private _applyColorToElement(element: any, color: string): { success: boolean; notClosed?: boolean } {
        if (!element) return { success: false };
        
        try {
            // 根据元素类型应用颜色
            if (element.flavour?.includes('shape') || element.type === 'shape') {
                // 形状元素 - 本身就是封闭的，直接填充
                if (element.store && typeof element.store.updateBlock === 'function') {
                    element.store.updateBlock(element, {
                        fillColor: color,
                        filled: true,
                    });
                } else if (typeof element.fillColor !== 'undefined') {
                    element.fillColor = color;
                    element.filled = true;
                }
                console.log('[ColorDrop] ✅ 已填充形状颜色:', color);
                this._onColorApplied?.(element.id, color);
                return { success: true };
            } else if (element.flavour?.includes('brush') || element.type === 'brush') {
                // 画笔元素 - 需要检测是否封闭
                const points = element.points;
                if (points && Array.isArray(points)) {
                    const { isClosed, distance } = this._checkPathClosed(points);
                    
                    if (!isClosed) {
                        console.log('[ColorDrop] ⚠️ 画笔路径未封闭，距离:', distance.toFixed(2), 'px');
                        this._onClosedCheckFailed?.(element.id);
                        return { success: false, notClosed: true };
                    }
                }
                
                // 路径封闭，可以填充
                if (element.store && typeof element.store.updateBlock === 'function') {
                    element.store.updateBlock(element, {
                        color: color,
                    });
                } else if (typeof element.color !== 'undefined') {
                    element.color = color;
                }
                console.log('[ColorDrop] ✅ 已填充封闭画笔颜色:', color);
                this._onColorApplied?.(element.id, color);
                return { success: true };
            }
        } catch (e) {
            console.warn('[ColorDrop] 应用颜色失败:', e);
        }
        
        return { success: false };
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
                // 显示未封闭提示
                this._showNotClosedTip(x, y);
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
