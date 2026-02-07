/**
 * 图层面板组件
 * 
 * 功能：
 * - 图层列表显示
 * - 图层可见性/锁定
 * - 图层不透明度
 * - 混合模式
 * - 拖拽排序
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BlendMode } from '../types/index.js';
import type { Layer, LayerGroup } from '../core/layer-system/layer.js';

// 简化的图层数据接口
interface LayerInfo {
    id: string;
    name: string;
    type: 'raster' | 'group' | 'vector';
    visible: boolean;
    locked: boolean;
    opacity: number;
    blendMode: BlendMode;
    thumbnail?: ImageBitmap;
    children?: LayerInfo[];
    collapsed?: boolean;
}

@customElement('animation-layer-panel')
export class AnimationLayerPanel extends LitElement {
    static override styles = css`
        /* ========================================
         * 云客白板动画系统 - 图层面板
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
            height: 100%;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        /* 头部 */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 14px;
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
            background: var(--affine-background-tertiary-color, #ffffff);
        }
        
        .header-title {
            font-weight: 600;
            font-size: 14px;
        }
        
        .header-actions {
            display: flex;
            gap: 4px;
        }
        
        .action-btn {
            width: 28px;
            height: 28px;
            border: none;
            background: transparent;
            color: var(--affine-text-secondary-color, #7a7a7a);
            cursor: pointer;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .action-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-1px);
        }
        
        /* 图层列表 */
        .layer-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }
        
        .layer-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .layer-list::-webkit-scrollbar-thumb {
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 3px;
        }
        
        /* 图层项 */
        .layer-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 10px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            margin-bottom: 4px;
            background: var(--affine-background-tertiary-color, #ffffff);
            border: 1px solid transparent;
        }
        
        .layer-item:hover {
            border-color: var(--affine-border-color, #e3e2e4);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }
        
        .layer-item.selected {
            background: rgba(30, 150, 235, 0.1);
            border-color: var(--affine-primary-color, #1e96eb);
        }
        
        .layer-item.dragging {
            opacity: 0.5;
        }
        
        .layer-item.drop-before {
            box-shadow: inset 0 2px 0 var(--affine-primary-color, #1e96eb);
        }
        
        .layer-item.drop-after {
            box-shadow: inset 0 -2px 0 var(--affine-primary-color, #1e96eb);
        }
        
        /* 缩进（用于图层组子项） */
        .layer-item[data-depth="1"] { padding-left: 26px; }
        .layer-item[data-depth="2"] { padding-left: 42px; }
        .layer-item[data-depth="3"] { padding-left: 58px; }
        
        /* 可见性/锁定图标 */
        .layer-icon {
            width: 24px;
            height: 24px;
            border: none;
            background: transparent;
            color: var(--affine-text-secondary-color, #7a7a7a);
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            flex-shrink: 0;
            transition: all 0.15s;
        }
        
        .layer-icon:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--affine-primary-color, #1e96eb);
        }
        
        .layer-icon.hidden {
            opacity: 0.3;
        }
        
        .layer-icon.locked {
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 缩略图 */
        .layer-thumb {
            width: 38px;
            height: 38px;
            background: var(--affine-background-secondary-color, #f5f5f5);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 8px;
            overflow: hidden;
            flex-shrink: 0;
        }
        
        .layer-thumb canvas {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .layer-thumb.group {
            background: linear-gradient(135deg, #1e96eb, #8b5cf6);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            color: white;
        }
        
        /* 图层信息 */
        .layer-info {
            flex: 1;
            min-width: 0;
        }
        
        .layer-name {
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: var(--affine-text-primary-color, #141414);
        }
        
        .layer-name-input {
            background: transparent;
            border: none;
            color: inherit;
            font: inherit;
            width: 100%;
            outline: none;
        }
        
        .layer-meta {
            font-size: 11px;
            color: var(--affine-text-secondary-color, #7a7a7a);
            margin-top: 2px;
        }
        
        .layer-item.selected .layer-name {
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 不透明度滑块 */
        .opacity-slider {
            width: 60px;
            height: 4px;
            -webkit-appearance: none;
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 2px;
            flex-shrink: 0;
            accent-color: var(--affine-primary-color, #1e96eb);
        }
        
        .opacity-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            background: var(--affine-primary-color, #1e96eb);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(30, 150, 235, 0.4);
        }
        
        /* 底部工具栏 */
        .footer {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 10px 12px;
            border-top: 1px solid var(--affine-border-color, #e3e2e4);
            background: var(--affine-background-tertiary-color, #ffffff);
        }
        
        .footer-btn {
            flex: 1;
            height: 32px;
            border: 1px solid var(--affine-border-color, #e3e2e4);
            background: var(--affine-background-secondary-color, #f5f5f5);
            color: var(--affine-text-secondary-color, #7a7a7a);
            cursor: pointer;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .footer-btn:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-1px);
        }
        
        .footer-btn.danger:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: #ef4444;
            color: #ef4444;
        }
        
        /* 混合模式选择 */
        .blend-select {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--affine-background-tertiary-color, #ffffff);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 10px;
            padding: 6px;
            z-index: 100;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        .blend-option {
            padding: 8px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.15s;
        }
        
        .blend-option:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
        }
        
        .blend-option.active {
            background: rgba(30, 150, 235, 0.1);
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 空状态 */
        .empty-state {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: var(--affine-text-secondary-color, #7a7a7a);
            padding: 24px;
            text-align: center;
        }
        
        .empty-state-icon {
            font-size: 36px;
            margin-bottom: 12px;
            opacity: 0.5;
        }
    `;
    
    // ==================== 属性 ====================
    
    @property({ type: Array })
    layers: LayerInfo[] = [];
    
    @property({ type: String })
    selectedLayerId: string | null = null;
    
    // ==================== 状态 ====================
    
    @state()
    private draggedLayerId: string | null = null;
    
    @state()
    private dropTargetId: string | null = null;
    
    @state()
    private dropPosition: 'before' | 'after' | null = null;
    
    @state()
    private editingLayerId: string | null = null;
    
    // 混合模式列表
    private blendModes: { value: BlendMode; label: string }[] = [
        { value: 'normal', label: '正常' },
        { value: 'multiply', label: '正片叠底' },
        { value: 'screen', label: '滤色' },
        { value: 'overlay', label: '叠加' },
        { value: 'darken', label: '变暗' },
        { value: 'lighten', label: '变亮' },
        { value: 'color-dodge', label: '颜色减淡' },
        { value: 'color-burn', label: '颜色加深' },
        { value: 'hard-light', label: '强光' },
        { value: 'soft-light', label: '柔光' },
        { value: 'difference', label: '差值' },
        { value: 'exclusion', label: '排除' },
        { value: 'hue', label: '色相' },
        { value: 'saturation', label: '饱和度' },
        { value: 'color', label: '颜色' },
        { value: 'luminosity', label: '明度' },
    ];
    
    // ==================== 渲染 ====================
    
    override render() {
        return html`
            <div class="header">
                <span class="header-title">📑 图层</span>
                <div class="header-actions">
                    <button class="action-btn" @click=${this.handleAddGroup} title="新建图层组">📁</button>
                    <button class="action-btn" @click=${this.handleAddLayer} title="新建图层">➕</button>
                </div>
            </div>
            
            <div class="layer-list">
                ${this.layers.length === 0
                    ? this.renderEmptyState()
                    : this.renderLayers(this.layers, 0)
                }
            </div>
            
            <div class="footer">
                <button class="footer-btn" @click=${this.handleAddLayer} title="新建图层">➕</button>
                <button class="footer-btn" @click=${this.handleDuplicateLayer} title="复制图层">📋</button>
                <button class="footer-btn" @click=${this.handleMergeLayers} title="合并图层">⬇️</button>
                <button class="footer-btn danger" @click=${this.handleDeleteLayer} title="删除图层">🗑️</button>
            </div>
        `;
    }
    
    private renderEmptyState() {
        return html`
            <div class="empty-state">
                <div class="empty-state-icon">📑</div>
                <div>没有图层</div>
                <div style="font-size: 11px; margin-top: 4px;">点击下方按钮创建新图层</div>
            </div>
        `;
    }
    
    private renderLayers(layers: LayerInfo[], depth: number) {
        return repeat(
            layers,
            layer => layer.id,
            layer => this.renderLayerItem(layer, depth)
        );
    }
    
    private renderLayerItem(layer: LayerInfo, depth: number) {
        const isSelected = layer.id === this.selectedLayerId;
        const isDragging = layer.id === this.draggedLayerId;
        const isDropTarget = layer.id === this.dropTargetId;
        const isEditing = layer.id === this.editingLayerId;
        
        let dropClass = '';
        if (isDropTarget && this.dropPosition) {
            dropClass = `drop-${this.dropPosition}`;
        }
        
        const blendLabel = this.blendModes.find(b => b.value === layer.blendMode)?.label || '正常';
        
        return html`
            <div 
                class="layer-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${dropClass}"
                data-depth=${depth}
                draggable="true"
                @click=${() => this.handleSelectLayer(layer.id)}
                @dblclick=${() => this.handleStartRename(layer.id)}
                @dragstart=${(e: DragEvent) => this.handleDragStart(e, layer.id)}
                @dragover=${(e: DragEvent) => this.handleDragOver(e, layer.id)}
                @dragleave=${() => this.handleDragLeave()}
                @drop=${(e: DragEvent) => this.handleDrop(e, layer.id)}
                @dragend=${() => this.handleDragEnd()}
            >
                <button 
                    class="layer-icon ${!layer.visible ? 'hidden' : ''}"
                    @click=${(e: Event) => { e.stopPropagation(); this.handleToggleVisibility(layer.id); }}
                    title="${layer.visible ? '隐藏' : '显示'}"
                >
                    ${layer.visible ? '👁️' : '👁️‍🗨️'}
                </button>
                
                <button 
                    class="layer-icon ${layer.locked ? 'locked' : ''}"
                    @click=${(e: Event) => { e.stopPropagation(); this.handleToggleLock(layer.id); }}
                    title="${layer.locked ? '解锁' : '锁定'}"
                >
                    ${layer.locked ? '🔒' : '🔓'}
                </button>
                
                <div class="layer-thumb ${layer.type === 'group' ? 'group' : ''}">
                    ${layer.type === 'group'
                        ? html`📁`
                        : html`<canvas></canvas>`
                    }
                </div>
                
                <div class="layer-info">
                    ${isEditing
                        ? html`
                            <input 
                                class="layer-name-input"
                                type="text"
                                .value=${layer.name}
                                @blur=${(e: Event) => this.handleFinishRename(layer.id, (e.target as HTMLInputElement).value)}
                                @keydown=${(e: KeyboardEvent) => {
                                    if (e.key === 'Enter') {
                                        this.handleFinishRename(layer.id, (e.target as HTMLInputElement).value);
                                    }
                                    if (e.key === 'Escape') {
                                        this.editingLayerId = null;
                                    }
                                }}
                                @click=${(e: Event) => e.stopPropagation()}
                            >
                        `
                        : html`<div class="layer-name">${layer.name}</div>`
                    }
                    <div class="layer-meta">${blendLabel} · ${Math.round(layer.opacity * 100)}%</div>
                </div>
                
                <input 
                    type="range"
                    class="opacity-slider"
                    min="0"
                    max="100"
                    .value=${String(Math.round(layer.opacity * 100))}
                    @input=${(e: Event) => this.handleOpacityChange(layer.id, (e.target as HTMLInputElement).valueAsNumber / 100)}
                    @click=${(e: Event) => e.stopPropagation()}
                >
            </div>
            
            ${layer.type === 'group' && layer.children && !layer.collapsed
                ? this.renderLayers(layer.children, depth + 1)
                : ''
            }
        `;
    }
    
    // ==================== 事件处理 ====================
    
    private handleSelectLayer(id: string) {
        this.dispatchEvent(new CustomEvent('layer-select', { detail: { id } }));
    }
    
    private handleAddLayer() {
        this.dispatchEvent(new CustomEvent('layer-add', { detail: { type: 'raster' } }));
    }
    
    private handleAddGroup() {
        this.dispatchEvent(new CustomEvent('layer-add', { detail: { type: 'group' } }));
    }
    
    private handleDuplicateLayer() {
        if (this.selectedLayerId) {
            this.dispatchEvent(new CustomEvent('layer-duplicate', { 
                detail: { id: this.selectedLayerId } 
            }));
        }
    }
    
    private handleDeleteLayer() {
        if (this.selectedLayerId) {
            this.dispatchEvent(new CustomEvent('layer-delete', { 
                detail: { id: this.selectedLayerId } 
            }));
        }
    }
    
    private handleMergeLayers() {
        if (this.selectedLayerId) {
            this.dispatchEvent(new CustomEvent('layer-merge', { 
                detail: { id: this.selectedLayerId } 
            }));
        }
    }
    
    private handleToggleVisibility(id: string) {
        this.dispatchEvent(new CustomEvent('layer-visibility', { detail: { id } }));
    }
    
    private handleToggleLock(id: string) {
        this.dispatchEvent(new CustomEvent('layer-lock', { detail: { id } }));
    }
    
    private handleOpacityChange(id: string, opacity: number) {
        this.dispatchEvent(new CustomEvent('layer-opacity', { detail: { id, opacity } }));
    }
    
    private handleStartRename(id: string) {
        this.editingLayerId = id;
        // 聚焦输入框
        requestAnimationFrame(() => {
            const input = this.shadowRoot?.querySelector('.layer-name-input') as HTMLInputElement;
            if (input) {
                input.focus();
                input.select();
            }
        });
    }
    
    private handleFinishRename(id: string, name: string) {
        this.editingLayerId = null;
        if (name.trim()) {
            this.dispatchEvent(new CustomEvent('layer-rename', { detail: { id, name: name.trim() } }));
        }
    }
    
    // ==================== 拖拽 ====================
    
    private handleDragStart(e: DragEvent, id: string) {
        this.draggedLayerId = id;
        e.dataTransfer!.effectAllowed = 'move';
        e.dataTransfer!.setData('text/plain', id);
    }
    
    private handleDragOver(e: DragEvent, id: string) {
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
        
        if (id === this.draggedLayerId) return;
        
        this.dropTargetId = id;
        
        // 判断放置位置
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        this.dropPosition = e.clientY < midY ? 'before' : 'after';
    }
    
    private handleDragLeave() {
        this.dropTargetId = null;
        this.dropPosition = null;
    }
    
    private handleDrop(e: DragEvent, targetId: string) {
        e.preventDefault();
        
        if (this.draggedLayerId && this.draggedLayerId !== targetId && this.dropPosition) {
            this.dispatchEvent(new CustomEvent('layer-move', {
                detail: {
                    from: this.draggedLayerId,
                    to: targetId,
                    position: this.dropPosition,
                }
            }));
        }
        
        this.draggedLayerId = null;
        this.dropTargetId = null;
        this.dropPosition = null;
    }
    
    private handleDragEnd() {
        this.draggedLayerId = null;
        this.dropTargetId = null;
        this.dropPosition = null;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'animation-layer-panel': AnimationLayerPanel;
    }
}
