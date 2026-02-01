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
}

export class ColorDropManager {
    private _gfx: GfxController;
    private _isDragging = false;
    private _currentColor: string = '#000000';
    private _previewElement: HTMLDivElement | null = null;
    private _onColorApplied?: (elementId: string, color: string) => void;

    constructor(options: ColorDropOptions) {
        this._gfx = options.gfx;
        this._onColorApplied = options.onColorApplied;
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
                this._previewElement.style.transform = 'translate(-50%, -50%) scale(1.2)';
                this._previewElement.style.boxShadow = '0 6px 24px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(0, 122, 255, 0.5)';
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
     */
    private _applyColorToElement(element: any, color: string): boolean {
        if (!element) return false;
        
        try {
            // 根据元素类型应用颜色
            if (element.flavour?.includes('shape') || element.type === 'shape') {
                // 形状元素 - 设置填充颜色
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
                return true;
            } else if (element.flavour?.includes('brush') || element.type === 'brush') {
                // 画笔元素 - 设置颜色
                if (element.store && typeof element.store.updateBlock === 'function') {
                    element.store.updateBlock(element, {
                        color: color,
                    });
                } else if (typeof element.color !== 'undefined') {
                    element.color = color;
                }
                console.log('[ColorDrop] ✅ 已填充画笔颜色:', color);
                this._onColorApplied?.(element.id, color);
                return true;
            }
        } catch (e) {
            console.warn('[ColorDrop] 应用颜色失败:', e);
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
            const success = this._applyColorToElement(targetElement, this._currentColor);
            if (success) {
                // 显示成功动画
                this._showSuccessAnimation(x, y);
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
