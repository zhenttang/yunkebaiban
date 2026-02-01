/**
 * 笔刷选择面板组件
 * 
 * 功能：
 * - 笔刷预设列表
 * - 分类筛选
 * - 笔刷参数调节
 * - 自定义笔刷
 */

import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import type { BrushSettings, Color } from '../types/index.js';
import { 
    ALL_PRESETS, 
    CATEGORY_INFO, 
    getPresetsByCategory,
    type BrushPreset,
    type BrushCategory,
} from '../core/brush-engine/brush-presets.js';

@customElement('animation-brush-panel')
export class AnimationBrushPanel extends LitElement {
    static override styles = css`
        /* ========================================
         * 云客白板动画系统 - 笔刷面板
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
            width: 280px;
            height: 100%;
            overflow: hidden;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        
        /* 头部 */
        .header {
            padding: 14px 16px;
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
            font-weight: 600;
            font-size: 15px;
            background: var(--affine-background-tertiary-color, #ffffff);
        }
        
        /* 分类标签 */
        .categories {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            padding: 10px 12px;
            border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
            background: var(--affine-background-tertiary-color, #ffffff);
        }
        
        .category-btn {
            padding: 5px 12px;
            background: var(--affine-background-secondary-color, #f5f5f5);
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 16px;
            color: var(--affine-text-secondary-color, #7a7a7a);
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .category-btn:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-1px);
        }
        
        .category-btn.active {
            background: rgba(30, 150, 235, 0.1);
            border-color: var(--affine-primary-color, #1e96eb);
            color: var(--affine-primary-color, #1e96eb);
        }
        
        /* 笔刷列表 */
        .brush-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
        }
        
        .brush-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .brush-list::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .brush-list::-webkit-scrollbar-thumb {
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 3px;
        }
        
        .brush-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .brush-item {
            aspect-ratio: 1;
            background: var(--affine-background-tertiary-color, #ffffff);
            border: 2px solid var(--affine-border-color, #e3e2e4);
            border-radius: 10px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .brush-item:hover {
            border-color: var(--affine-primary-color, #1e96eb);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .brush-item.selected {
            border-color: var(--affine-primary-color, #1e96eb);
            box-shadow: 0 0 0 3px rgba(30, 150, 235, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .brush-preview {
            width: 40px;
            height: 40px;
            background: #fafafa;
            border-radius: 50%;
            margin-bottom: 6px;
            position: relative;
            overflow: hidden;
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .brush-preview::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: var(--preview-size, 20px);
            height: var(--preview-size, 20px);
            background: var(--preview-color, #141414);
            border-radius: 50%;
            opacity: var(--preview-opacity, 1);
            filter: blur(var(--preview-blur, 0));
        }
        
        .brush-name {
            font-size: 11px;
            text-align: center;
            color: var(--affine-text-secondary-color, #7a7a7a);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            font-weight: 500;
        }
        
        /* 参数面板 */
        .params-panel {
            border-top: 1px solid var(--affine-border-color, #e3e2e4);
            padding: 14px;
            background: var(--affine-background-tertiary-color, #ffffff);
        }
        
        .param-section {
            margin-bottom: 16px;
        }
        
        .param-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--affine-text-secondary-color, #7a7a7a);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        
        .slider-row {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .slider-label {
            width: 65px;
            font-size: 13px;
            color: var(--affine-text-secondary-color, #7a7a7a);
        }
        
        .slider-input {
            flex: 1;
            -webkit-appearance: none;
            height: 4px;
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 2px;
            outline: none;
        }
        
        .slider-input::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px;
            height: 16px;
            background: var(--affine-primary-color, #1e96eb);
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 4px rgba(30, 150, 235, 0.4);
            transition: all 0.15s;
        }
        
        .slider-input::-webkit-slider-thumb:hover {
            transform: scale(1.1);
        }
        
        .slider-value {
            width: 45px;
            text-align: right;
            font-size: 13px;
            color: var(--affine-primary-color, #1e96eb);
            font-weight: 600;
        }
        
        /* 颜色选择 */
        .color-section {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }
        
        .color-preview {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            border: 2px solid var(--affine-border-color, #e3e2e4);
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        
        .color-preview:hover {
            border-color: var(--affine-primary-color, #1e96eb);
        }
        
        .color-presets {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 6px;
            flex: 1;
        }
        
        .color-preset {
            width: 26px;
            height: 26px;
            border-radius: 6px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .color-preset:hover {
            transform: scale(1.15);
        }
        
        .color-preset.active {
            border-color: var(--affine-primary-color, #1e96eb);
            box-shadow: 0 0 0 2px rgba(30, 150, 235, 0.3);
        }
        
        /* 切换开关 */
        .toggle-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        
        .toggle-switch {
            width: 40px;
            height: 22px;
            background: var(--affine-border-color, #e3e2e4);
            border-radius: 11px;
            position: relative;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .toggle-switch.active {
            background: var(--affine-primary-color, #1e96eb);
        }
        
        .toggle-switch::after {
            content: '';
            position: absolute;
            width: 18px;
            height: 18px;
            background: white;
            border-radius: 50%;
            top: 2px;
            left: 2px;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        .toggle-switch.active::after {
            left: 20px;
        }
    `;
    
    // ==================== 属性 ====================
    
    @property({ type: Object })
    currentSettings: BrushSettings | null = null;
    
    @property({ type: Object })
    currentColor: Color = { r: 0, g: 0, b: 0, a: 1 };
    
    @property({ type: String })
    selectedPresetId: string = 'pen';
    
    // ==================== 状态 ====================
    
    @state()
    private selectedCategory: BrushCategory | 'all' = 'all';
    
    // 颜色预设
    private colorPresets = [
        '#000000', '#ffffff', '#e94560', '#ff6b6b', '#fbbf24',
        '#4ade80', '#60a5fa', '#a855f7', '#ec4899', '#6b7280',
    ];
    
    // ==================== 渲染 ====================
    
    override render() {
        const filteredPresets = this.selectedCategory === 'all'
            ? ALL_PRESETS
            : getPresetsByCategory(this.selectedCategory);
        
        return html`
            <div class="header">🖌️ 笔刷</div>
            
            <div class="categories">
                <button 
                    class="category-btn ${this.selectedCategory === 'all' ? 'active' : ''}"
                    @click=${() => this.selectedCategory = 'all'}
                >
                    全部
                </button>
                ${Object.entries(CATEGORY_INFO).map(([key, info]) => html`
                    <button 
                        class="category-btn ${this.selectedCategory === key ? 'active' : ''}"
                        @click=${() => this.selectedCategory = key as BrushCategory}
                    >
                        ${info.icon} ${info.nameCN}
                    </button>
                `)}
            </div>
            
            <div class="brush-list">
                <div class="brush-grid">
                    ${repeat(
                        filteredPresets,
                        preset => preset.id,
                        preset => this.renderBrushItem(preset)
                    )}
                </div>
            </div>
            
            <div class="params-panel">
                <div class="param-section">
                    <div class="param-title">颜色</div>
                    <div class="color-section">
                        <div 
                            class="color-preview" 
                            style="background: rgb(${this.currentColor.r}, ${this.currentColor.g}, ${this.currentColor.b})"
                            @click=${this.handleColorClick}
                        ></div>
                        <div class="color-presets">
                            ${this.colorPresets.map(color => html`
                                <div 
                                    class="color-preset ${this.isColorActive(color) ? 'active' : ''}"
                                    style="background: ${color}"
                                    @click=${() => this.handleColorSelect(color)}
                                ></div>
                            `)}
                        </div>
                    </div>
                </div>
                
                <div class="param-section">
                    <div class="param-title">参数</div>
                    
                    ${this.renderSlider('大小', 'size', 1, 200, this.currentSettings?.size || 20, 'px')}
                    ${this.renderSlider('透明度', 'opacity', 0, 100, (this.currentSettings?.opacity || 1) * 100, '%')}
                    ${this.renderSlider('硬度', 'hardness', 0, 100, (this.currentSettings?.hardness || 0.8) * 100, '%')}
                    ${this.renderSlider('平滑', 'smoothing', 0, 100, this.currentSettings?.smoothing.amount || 50, '%')}
                </div>
                
                <div class="param-section">
                    <div class="param-title">压感</div>
                    
                    <div class="toggle-row">
                        <span class="slider-label">大小</span>
                        <div 
                            class="toggle-switch ${this.currentSettings?.pressureSize.enabled ? 'active' : ''}"
                            @click=${() => this.handleToggle('pressureSize')}
                        ></div>
                    </div>
                    
                    <div class="toggle-row">
                        <span class="slider-label">透明度</span>
                        <div 
                            class="toggle-switch ${this.currentSettings?.pressureOpacity.enabled ? 'active' : ''}"
                            @click=${() => this.handleToggle('pressureOpacity')}
                        ></div>
                    </div>
                </div>
            </div>
        `;
    }
    
    private renderBrushItem(preset: BrushPreset) {
        const isSelected = preset.id === this.selectedPresetId;
        const previewSize = Math.min(30, preset.settings.size);
        const previewBlur = (1 - preset.settings.hardness) * 5;
        
        return html`
            <div 
                class="brush-item ${isSelected ? 'selected' : ''}"
                @click=${() => this.handlePresetSelect(preset)}
                title="${preset.description}"
            >
                <div 
                    class="brush-preview"
                    style="
                        --preview-size: ${previewSize}px;
                        --preview-opacity: ${preset.settings.opacity};
                        --preview-blur: ${previewBlur}px;
                    "
                ></div>
                <div class="brush-name">${preset.nameCN}</div>
            </div>
        `;
    }
    
    private renderSlider(
        label: string,
        key: string,
        min: number,
        max: number,
        value: number,
        unit: string
    ) {
        return html`
            <div class="slider-row">
                <span class="slider-label">${label}</span>
                <input 
                    type="range" 
                    class="slider-input"
                    min=${min}
                    max=${max}
                    .value=${String(Math.round(value))}
                    @input=${(e: Event) => this.handleSliderChange(key, (e.target as HTMLInputElement).valueAsNumber)}
                >
                <span class="slider-value">${Math.round(value)}${unit}</span>
            </div>
        `;
    }
    
    // ==================== 事件处理 ====================
    
    private handlePresetSelect(preset: BrushPreset) {
        this.dispatchEvent(new CustomEvent('brush-select', {
            detail: { preset }
        }));
    }
    
    private handleSliderChange(key: string, value: number) {
        let actualValue = value;
        
        // 转换百分比
        if (key === 'opacity' || key === 'hardness') {
            actualValue = value / 100;
        }
        
        this.dispatchEvent(new CustomEvent('brush-change', {
            detail: { key, value: actualValue }
        }));
    }
    
    private handleToggle(key: 'pressureSize' | 'pressureOpacity') {
        const current = this.currentSettings?.[key].enabled || false;
        this.dispatchEvent(new CustomEvent('brush-change', {
            detail: { key: `${key}.enabled`, value: !current }
        }));
    }
    
    private handleColorClick() {
        // 可以打开颜色选择器对话框
        const input = document.createElement('input');
        input.type = 'color';
        input.value = this.rgbToHex(this.currentColor);
        input.click();
        
        input.onchange = () => {
            this.handleColorSelect(input.value);
        };
    }
    
    private handleColorSelect(hex: string) {
        const color = this.hexToRgb(hex);
        this.dispatchEvent(new CustomEvent('color-change', {
            detail: { color }
        }));
    }
    
    private isColorActive(hex: string): boolean {
        const rgb = this.hexToRgb(hex);
        return (
            rgb.r === this.currentColor.r &&
            rgb.g === this.currentColor.g &&
            rgb.b === this.currentColor.b
        );
    }
    
    // ==================== 辅助方法 ====================
    
    private hexToRgb(hex: string): Color {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
                a: 1,
            }
            : { r: 0, g: 0, b: 0, a: 1 };
    }
    
    private rgbToHex(color: Color): string {
        return '#' + [color.r, color.g, color.b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'animation-brush-panel': AnimationBrushPanel;
    }
}
