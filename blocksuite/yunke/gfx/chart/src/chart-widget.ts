import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

import type { ChartDataPoint, ChartDataSeries } from './data-parser.js';
import type { ChartTypeId } from './chart-templates.js';
import type { ThemeId } from './chart-themes.js';

import { parseData, generateSampleData } from './data-parser.js';
import { CHART_TYPES, generateChartOption, getDefaultData, getCommonChartTypes } from './chart-templates.js';
import { CHART_THEMES, getThemeById, themeToEChartsOption, getThemeList } from './chart-themes.js';

export type { ChartDataPoint, ChartDataSeries } from './data-parser.js';

export interface ChartData {
    title: string;
    type: ChartTypeId;
    theme: ThemeId;
    data: ChartDataPoint[] | ChartDataSeries[];
}

// 图标 SVG
const CloseIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
</svg>
`;

const AddIcon = html`
<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
</svg>
`;

const DeleteIcon = html`
<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
</svg>
`;

const DownloadIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
</svg>
`;

const ExpandIcon = html`
<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
  <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
</svg>
`;

// 数据输入模式
type DataInputMode = 'manual' | 'paste' | 'json' | 'template';

// 动态导入 ECharts
let echarts: any = null;
const loadECharts = async () => {
    if (!echarts) {
        try {
            echarts = await import('echarts');
        } catch (e) {
            console.warn('ECharts not available, using Canvas fallback');
        }
    }
    return echarts;
};

export class ChartWidget extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: block;
        }

        .chart-container {
            position: fixed;
            z-index: 100;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 24px;
            width: 640px;
            max-height: 90vh;
            overflow-y: auto;
            cursor: move;
            user-select: none;
            font-family: var(--yunke-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
        }

        .chart-container::-webkit-scrollbar {
            width: 6px;
        }

        .chart-container::-webkit-scrollbar-thumb {
            background: #ccc;
            border-radius: 3px;
        }

        .chart-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--yunke-border-color, #e8e8e8);
        }

        .chart-title-section {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .chart-logo {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .chart-title-input {
            font-size: 18px;
            font-weight: 600;
            border: none;
            background: transparent;
            color: var(--yunke-text-primary-color, #1a1a1a);
            padding: 4px 0;
            outline: none;
            width: 200px;
        }

        .chart-title-input:focus {
            border-bottom: 2px solid var(--yunke-primary-color, #667eea);
        }

        .close-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 8px;
            color: var(--yunke-icon-color, #666);
            display: flex;
            transition: all 0.2s;
        }

        .close-button:hover {
            background: var(--yunke-hover-color, #f0f0f0);
            color: var(--yunke-text-primary-color, #333);
        }

        /* 图表类型选择器 */
        .section-label {
            font-size: 13px;
            font-weight: 600;
            color: var(--yunke-text-secondary-color, #666);
            margin-bottom: 10px;
            display: block;
        }

        .chart-type-selector {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        }

        .type-button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            background: var(--yunke-background-secondary-color, #fafafa);
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .type-button:hover {
            border-color: var(--yunke-primary-color, #667eea);
            color: var(--yunke-primary-color, #667eea);
        }

        .type-button.active {
            background: var(--yunke-primary-color, #667eea);
            border-color: var(--yunke-primary-color, #667eea);
            color: white;
        }

        .type-button .icon {
            font-size: 16px;
        }

        .more-types-button {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            border: 1px dashed var(--yunke-border-color, #d0d0d0);
            background: transparent;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #888);
            transition: all 0.2s;
        }

        .more-types-button:hover {
            border-color: var(--yunke-primary-color, #667eea);
            color: var(--yunke-primary-color, #667eea);
        }

        /* 数据输入切换 */
        .data-input-tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            background: var(--yunke-background-secondary-color, #f5f5f5);
            padding: 4px;
            border-radius: 8px;
        }

        .data-tab {
            flex: 1;
            padding: 8px 12px;
            border: none;
            background: transparent;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .data-tab:hover {
            color: var(--yunke-text-primary-color, #333);
        }

        .data-tab.active {
            background: white;
            color: var(--yunke-primary-color, #667eea);
            font-weight: 500;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* 数据编辑器 */
        .data-editor {
            margin-bottom: 20px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
        }

        .data-table th {
            text-align: left;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: 500;
            color: var(--yunke-text-secondary-color, #888);
            background: var(--yunke-background-secondary-color, #f9f9f9);
            border-bottom: 1px solid var(--yunke-border-color, #e8e8e8);
        }

        .data-table td {
            padding: 4px;
        }

        .data-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 6px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
            box-sizing: border-box;
        }

        .data-input:focus {
            border-color: var(--yunke-primary-color, #667eea);
        }

        .color-picker {
            width: 36px;
            height: 36px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 6px;
            cursor: pointer;
            padding: 2px;
        }

        .delete-row {
            background: none;
            border: none;
            cursor: pointer;
            padding: 8px;
            border-radius: 6px;
            color: var(--yunke-icon-color, #999);
            display: flex;
            opacity: 0.6;
            transition: all 0.2s;
        }

        .delete-row:hover {
            opacity: 1;
            color: #e53935;
            background: #ffebee;
        }

        .add-row-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px;
            border: 1px dashed var(--yunke-border-color, #d0d0d0);
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            font-size: 13px;
            color: var(--yunke-text-secondary-color, #888);
            width: 100%;
            transition: all 0.2s;
        }

        .add-row-button:hover {
            border-color: var(--yunke-primary-color, #667eea);
            color: var(--yunke-primary-color, #667eea);
            background: rgba(102, 126, 234, 0.05);
        }

        /* 粘贴/JSON 输入区域 */
        .paste-area {
            width: 100%;
            min-height: 120px;
            padding: 12px;
            border: 1px dashed var(--yunke-border-color, #d0d0d0);
            border-radius: 8px;
            font-size: 13px;
            font-family: 'Monaco', 'Menlo', monospace;
            resize: vertical;
            outline: none;
            background: var(--yunke-background-secondary-color, #fafafa);
            box-sizing: border-box;
        }

        .paste-area:focus {
            border-color: var(--yunke-primary-color, #667eea);
            border-style: solid;
        }

        .paste-hint {
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #888);
            margin-top: 8px;
        }

        .parse-button {
            margin-top: 12px;
            padding: 10px 20px;
            background: var(--yunke-primary-color, #667eea);
            border: none;
            border-radius: 8px;
            color: white;
            font-size: 13px;
            cursor: pointer;
            transition: background 0.2s;
        }

        .parse-button:hover {
            background: var(--yunke-primary-hover-color, #5a6fd6);
        }

        .error-message {
            color: #e53935;
            font-size: 12px;
            margin-top: 8px;
            padding: 8px 12px;
            background: #ffebee;
            border-radius: 6px;
        }

        .success-message {
            color: #43a047;
            font-size: 12px;
            margin-top: 8px;
            padding: 8px 12px;
            background: #e8f5e9;
            border-radius: 6px;
        }

        /* 模板选择 */
        .template-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .template-card {
            padding: 16px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 10px;
            background: var(--yunke-background-secondary-color, #fafafa);
            cursor: pointer;
            transition: all 0.2s;
            text-align: center;
        }

        .template-card:hover {
            border-color: var(--yunke-primary-color, #667eea);
            background: rgba(102, 126, 234, 0.05);
        }

        .template-card.active {
            border-color: var(--yunke-primary-color, #667eea);
            background: rgba(102, 126, 234, 0.1);
        }

        .template-icon {
            font-size: 28px;
            margin-bottom: 8px;
        }

        .template-name {
            font-size: 13px;
            font-weight: 500;
            color: var(--yunke-text-primary-color, #333);
        }

        /* 主题选择器 */
        .theme-selector {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .theme-button {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 14px;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .theme-button:hover {
            border-color: var(--yunke-primary-color, #667eea);
        }

        .theme-button.active {
            border-color: var(--yunke-primary-color, #667eea);
            background: rgba(102, 126, 234, 0.1);
            color: var(--yunke-primary-color, #667eea);
        }

        .theme-dot {
            width: 14px;
            height: 14px;
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.3);
        }

        /* 图表预览 */
        .chart-preview {
            background: var(--yunke-background-secondary-color, #f9f9f9);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 20px;
            position: relative;
        }

        .chart-preview.dark-bg {
            background: #1a1a2e;
        }

        .echarts-container {
            width: 100%;
            height: 280px;
        }

        .chart-canvas {
            width: 100%;
            height: 280px;
        }

        .loading-text {
            text-align: center;
            padding: 40px;
            color: var(--yunke-text-secondary-color, #888);
        }

        /* 底部按钮 */
        .action-buttons {
            display: flex;
            gap: 12px;
        }

        .action-button {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 14px;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .action-button.primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }

        .action-button.primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .action-button.secondary {
            background: var(--yunke-background-secondary-color, #f0f0f0);
            color: var(--yunke-text-primary-color, #333);
        }

        .action-button.secondary:hover {
            background: var(--yunke-hover-color, #e8e8e8);
        }

        /* 更多图表类型弹出层 */
        .more-types-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15);
            padding: 16px;
            z-index: 10;
            margin-top: 8px;
        }

        .dropdown-category {
            margin-bottom: 16px;
        }

        .dropdown-category:last-child {
            margin-bottom: 0;
        }

        .dropdown-category-title {
            font-size: 11px;
            font-weight: 600;
            color: var(--yunke-text-secondary-color, #888);
            text-transform: uppercase;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }

        .dropdown-types {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .types-wrapper {
            position: relative;
        }
    `;

    @property({ attribute: false })
    accessor onClose: (() => void) | undefined;

    @property({ attribute: false })
    accessor onSubmit: ((data: ChartData, imageDataUrl: string) => void) | undefined;

    @state()
    accessor _title = '我的图表';

    @state()
    accessor _type: ChartTypeId = 'bar';

    @state()
    accessor _theme: ThemeId = 'default';

    @state()
    accessor _data: ChartDataPoint[] = getDefaultData('bar');

    @state()
    accessor _inputMode: DataInputMode = 'manual';

    @state()
    accessor _pasteText = '';

    @state()
    accessor _parseError = '';

    @state()
    accessor _parseSuccess = '';

    @state()
    accessor _showMoreTypes = false;

    @state()
    accessor _posX = 100;

    @state()
    accessor _posY = 50;

    @state()
    accessor _echartsLoaded = false;

    private _isDragging = false;
    private _dragStartX = 0;
    private _dragStartY = 0;
    private _echartsInstance: any = null;
    private _canvasRef: HTMLCanvasElement | null = null;

    // 默认颜色
    private _defaultColors = CHART_THEMES.default.colors;

    private _addRow() {
        const colorIndex = this._data.length % this._defaultColors.length;
        this._data = [
            ...this._data,
            { label: `项目${this._data.length + 1}`, value: 0, color: this._defaultColors[colorIndex] },
        ];
        this._renderChart();
    }

    private _removeRow(index: number) {
        if (this._data.length <= 1) return;
        this._data = this._data.filter((_, i) => i !== index);
        this._renderChart();
    }

    private _updateData(index: number, field: 'label' | 'value' | 'color', value: string | number) {
        const newData = [...this._data];
        if (field === 'value') {
            newData[index] = { ...newData[index], [field]: Number(value) || 0 };
        } else {
            newData[index] = { ...newData[index], [field]: value };
        }
        this._data = newData;
        this._renderChart();
    }

    private _handleTypeChange(type: ChartTypeId) {
        this._type = type;
        this._data = getDefaultData(type);
        this._showMoreTypes = false;
        this._renderChart();
    }

    private _handleThemeChange(theme: ThemeId) {
        this._theme = theme;
        this._defaultColors = CHART_THEMES[theme].colors;
        this._renderChart();
    }

    private _handleInputModeChange(mode: DataInputMode) {
        this._inputMode = mode;
        this._parseError = '';
        this._parseSuccess = '';
    }

    private _handlePasteData() {
        const result = parseData(this._pasteText);
        if (result.error) {
            this._parseError = result.error;
            this._parseSuccess = '';
            return;
        }

        if (result.data) {
            if (Array.isArray(result.data) && result.data.length > 0) {
                if ('label' in result.data[0]) {
                    this._data = result.data as ChartDataPoint[];
                } else if ('name' in result.data[0]) {
                    const series = result.data as ChartDataSeries[];
                    this._data = series[0].data;
                }
            }
            this._parseError = '';
            this._parseSuccess = `成功解析 ${this._data.length} 条数据`;
            this._inputMode = 'manual';
            this._renderChart();
        }
    }

    private _handleTemplateSelect(type: 'simple' | 'multi' | 'time') {
        const templateData = generateSampleData(type);
        if (Array.isArray(templateData) && templateData.length > 0 && 'label' in templateData[0]) {
            this._data = templateData as ChartDataPoint[];
        }
        this._renderChart();
    }

    private async _initECharts() {
        const ec = await loadECharts();
        if (ec) {
            this._echartsLoaded = true;
            const container = this.shadowRoot?.querySelector('.echarts-container') as HTMLElement;
            if (container) {
                this._echartsInstance = ec.init(container);
                this._renderChart();
            }
        } else {
            // 使用 Canvas 后备方案
            this._canvasRef = this.shadowRoot?.querySelector('.chart-canvas') as HTMLCanvasElement;
            if (this._canvasRef) {
                this._canvasRef.width = this._canvasRef.offsetWidth * 2;
                this._canvasRef.height = this._canvasRef.offsetHeight * 2;
                const ctx = this._canvasRef.getContext('2d');
                if (ctx) {
                    ctx.scale(2, 2);
                }
            }
            this._renderChart();
        }
    }

    private _renderChart() {
        if (this._echartsInstance) {
            this._renderECharts();
        } else if (this._canvasRef) {
            this._renderCanvas();
        }
    }

    private _renderECharts() {
        if (!this._echartsInstance) return;

        const theme = getThemeById(this._theme);
        const themeOption = themeToEChartsOption(theme);
        const chartOption = generateChartOption(this._type, this._data, '');

        const option = {
            ...themeOption,
            ...chartOption,
            backgroundColor: theme.backgroundColor,
        };

        this._echartsInstance.setOption(option, true);
    }

    private _renderCanvas() {
        if (!this._canvasRef) return;

        const ctx = this._canvasRef.getContext('2d');
        if (!ctx) return;

        const width = this._canvasRef.width / 2;
        const height = this._canvasRef.height / 2;
        const theme = getThemeById(this._theme);
        const colors = theme.colors;

        ctx.clearRect(0, 0, width * 2, height * 2);

        // 简化的 Canvas 渲染
        const padding = 50;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        const maxValue = Math.max(...this._data.map(d => d.value), 1);

        if (this._type === 'pie' || this._type === 'pie-ring' || this._type === 'pie-rose') {
            this._drawPieChart(ctx, width, height, colors);
        } else {
            this._drawBarChart(ctx, width, height, padding, chartWidth, chartHeight, maxValue, colors);
        }
    }

    private _drawBarChart(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        padding: number,
        chartWidth: number,
        chartHeight: number,
        maxValue: number,
        colors: string[]
    ) {
        // 绘制坐标轴
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        const barWidth = chartWidth / this._data.length * 0.6;
        const gap = chartWidth / this._data.length * 0.4;

        this._data.forEach((item, index) => {
            const x = padding + index * (barWidth + gap) + gap / 2;
            const barHeight = (item.value / maxValue) * chartHeight;
            const y = height - padding - barHeight;

            ctx.fillStyle = item.color || colors[index % colors.length];
            ctx.fillRect(x, y, barWidth, barHeight);

            ctx.fillStyle = '#666';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth / 2, height - padding + 15);
            ctx.fillText(String(item.value), x + barWidth / 2, y - 5);
        });
    }

    private _drawPieChart(
        ctx: CanvasRenderingContext2D,
        width: number,
        height: number,
        colors: string[]
    ) {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 50;
        const total = this._data.reduce((sum, item) => sum + item.value, 0) || 1;

        let startAngle = -Math.PI / 2;

        this._data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;
            const endAngle = startAngle + sliceAngle;

            ctx.fillStyle = item.color || colors[index % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            const midAngle = startAngle + sliceAngle / 2;
            const labelRadius = radius * 0.7;
            const labelX = centerX + Math.cos(midAngle) * labelRadius;
            const labelY = centerY + Math.sin(midAngle) * labelRadius;

            if (item.value > 0) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const percentage = Math.round((item.value / total) * 100);
                ctx.fillText(`${percentage}%`, labelX, labelY);
            }

            startAngle = endAngle;
        });
    }

    private async _exportImage(): Promise<string> {
        if (this._echartsInstance) {
            return this._echartsInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: this._theme === 'dark' ? '#1a1a2e' : '#fff',
            });
        } else if (this._canvasRef) {
            return this._canvasRef.toDataURL('image/png');
        }
        return '';
    }

    private async _handleDownload() {
        const dataUrl = await this._exportImage();
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `${this._title || 'chart'}.png`;
        link.href = dataUrl;
        link.click();
    }

    private async _handleSubmit() {
        const imageDataUrl = await this._exportImage();
        this.onSubmit?.({
            title: this._title,
            type: this._type,
            theme: this._theme,
            data: this._data,
        }, imageDataUrl);
    }

    private _handleMouseDown(e: MouseEvent) {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'BUTTON' ||
            target.tagName === 'TEXTAREA' ||
            target.closest('.chart-preview') ||
            target.closest('.data-editor')
        ) return;
        this._isDragging = true;
        this._dragStartX = e.clientX - this._posX;
        this._dragStartY = e.clientY - this._posY;
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (!this._isDragging) return;
        this._posX = e.clientX - this._dragStartX;
        this._posY = e.clientY - this._dragStartY;
    };

    private _handleMouseUp = () => {
        this._isDragging = false;
    };

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        this._echartsInstance?.dispose?.();
    }

    override firstUpdated() {
        setTimeout(() => this._initECharts(), 100);
    }

    override updated(changedProperties: Map<string, unknown>) {
        if (changedProperties.has('_type') || changedProperties.has('_data') || changedProperties.has('_theme')) {
            this._renderChart();
        }
    }

    private _renderManualEditor() {
        return html`
            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 45%">标签</th>
                        <th style="width: 25%">数值</th>
                        <th style="width: 15%">颜色</th>
                        <th style="width: 15%"></th>
                    </tr>
                </thead>
                <tbody>
                    ${this._data.map((item, index) => html`
                        <tr>
                            <td>
                                <input
                                    class="data-input"
                                    type="text"
                                    placeholder="标签"
                                    .value=${item.label}
                                    @input=${(e: Event) => this._updateData(index, 'label', (e.target as HTMLInputElement).value)}
                                />
                            </td>
                            <td>
                                <input
                                    class="data-input"
                                    type="number"
                                    placeholder="数值"
                                    .value=${String(item.value)}
                                    @input=${(e: Event) => this._updateData(index, 'value', (e.target as HTMLInputElement).value)}
                                />
                            </td>
                            <td>
                                <input
                                    class="color-picker"
                                    type="color"
                                    .value=${item.color || this._defaultColors[index % this._defaultColors.length]}
                                    @input=${(e: Event) => this._updateData(index, 'color', (e.target as HTMLInputElement).value)}
                                />
                            </td>
                            <td>
                                ${this._data.length > 1 ? html`
                                    <button class="delete-row" @click=${() => this._removeRow(index)}>
                                        ${DeleteIcon}
                                    </button>
                                ` : nothing}
                            </td>
                        </tr>
                    `)}
                </tbody>
            </table>
            <button class="add-row-button" @click=${this._addRow}>
                ${AddIcon} 添加数据行
            </button>
        `;
    }

    private _renderPasteEditor() {
        return html`
            <textarea
                class="paste-area"
                placeholder="从 Excel 或 Google Sheets 粘贴数据...

示例格式：
产品A    120
产品B    200
产品C    150"
                .value=${this._pasteText}
                @input=${(e: Event) => this._pasteText = (e.target as HTMLTextAreaElement).value}
            ></textarea>
            <div class="paste-hint">支持 Tab 分隔或逗号分隔的表格数据</div>
            ${this._parseError ? html`<div class="error-message">${this._parseError}</div>` : nothing}
            ${this._parseSuccess ? html`<div class="success-message">${this._parseSuccess}</div>` : nothing}
            <button class="parse-button" @click=${this._handlePasteData}>解析数据</button>
        `;
    }

    private _renderJSONEditor() {
        return html`
            <textarea
                class="paste-area"
                placeholder='粘贴 JSON 数据...

示例格式：
[
  {"label": "产品A", "value": 120},
  {"label": "产品B", "value": 200},
  {"label": "产品C", "value": 150}
]'
                .value=${this._pasteText}
                @input=${(e: Event) => this._pasteText = (e.target as HTMLTextAreaElement).value}
            ></textarea>
            ${this._parseError ? html`<div class="error-message">${this._parseError}</div>` : nothing}
            ${this._parseSuccess ? html`<div class="success-message">${this._parseSuccess}</div>` : nothing}
            <button class="parse-button" @click=${this._handlePasteData}>解析 JSON</button>
        `;
    }

    private _renderTemplateSelector() {
        return html`
            <div class="template-grid">
                <div class="template-card" @click=${() => this._handleTemplateSelect('simple')}>
                    <div class="template-icon">📊</div>
                    <div class="template-name">简单数据</div>
                </div>
                <div class="template-card" @click=${() => this._handleTemplateSelect('time')}>
                    <div class="template-icon">📈</div>
                    <div class="template-name">时间序列</div>
                </div>
                <div class="template-card" @click=${() => this._handleTemplateSelect('multi')}>
                    <div class="template-icon">📉</div>
                    <div class="template-name">多系列对比</div>
                </div>
            </div>
        `;
    }

    private _renderDataEditor() {
        switch (this._inputMode) {
            case 'paste':
                return this._renderPasteEditor();
            case 'json':
                return this._renderJSONEditor();
            case 'template':
                return this._renderTemplateSelector();
            default:
                return this._renderManualEditor();
        }
    }

    private _renderChartPreview() {
        if (this._echartsLoaded) {
            return html`<div class="echarts-container"></div>`;
        } else {
            return html`<canvas class="chart-canvas"></canvas>`;
        }
    }

    override render() {
        const commonTypes = getCommonChartTypes();
        const themes = getThemeList();

        return html`
            <div
                class="chart-container"
                style="left: ${this._posX}px; top: ${this._posY}px;"
                @mousedown=${this._handleMouseDown}
            >
                <!-- 头部 -->
                <div class="chart-header">
                    <div class="chart-title-section">
                        <div class="chart-logo">📊</div>
                        <input
                            class="chart-title-input"
                            type="text"
                            placeholder="图表标题"
                            .value=${this._title}
                            @input=${(e: Event) => this._title = (e.target as HTMLInputElement).value}
                        />
                    </div>
                    <button class="close-button" @click=${() => this.onClose?.()}>
                        ${CloseIcon}
                    </button>
                </div>

                <!-- 图表类型选择 -->
                <span class="section-label">图表类型</span>
                <div class="types-wrapper">
                    <div class="chart-type-selector">
                        ${commonTypes.map(t => html`
                            <button
                                class="type-button ${this._type === t.id ? 'active' : ''}"
                                @click=${() => this._handleTypeChange(t.id)}
                                title=${t.description}
                            >
                                <span class="icon">${t.icon}</span>
                                ${t.name}
                            </button>
                        `)}
                        <button
                            class="more-types-button"
                            @click=${() => this._showMoreTypes = !this._showMoreTypes}
                        >
                            更多 ${ExpandIcon}
                        </button>
                    </div>

                    ${this._showMoreTypes ? html`
                        <div class="more-types-dropdown">
                            ${Object.entries({
                                basic: { name: '基础图表', types: CHART_TYPES.filter(t => t.category === 'basic') },
                                comparison: { name: '对比图表', types: CHART_TYPES.filter(t => t.category === 'comparison') },
                                proportion: { name: '比例图表', types: CHART_TYPES.filter(t => t.category === 'proportion') },
                                distribution: { name: '分布图表', types: CHART_TYPES.filter(t => t.category === 'distribution') },
                                flow: { name: '流程图表', types: CHART_TYPES.filter(t => t.category === 'flow') },
                            }).map(([_, category]) => html`
                                <div class="dropdown-category">
                                    <div class="dropdown-category-title">${category.name}</div>
                                    <div class="dropdown-types">
                                        ${category.types.map(t => html`
                                            <button
                                                class="type-button ${this._type === t.id ? 'active' : ''}"
                                                @click=${() => this._handleTypeChange(t.id)}
                                                title=${t.description}
                                            >
                                                <span class="icon">${t.icon}</span>
                                                ${t.name}
                                            </button>
                                        `)}
                                    </div>
                                </div>
                            `)}
                        </div>
                    ` : nothing}
                </div>

                <!-- 数据输入 -->
                <span class="section-label">数据输入</span>
                <div class="data-input-tabs">
                    <button
                        class="data-tab ${this._inputMode === 'manual' ? 'active' : ''}"
                        @click=${() => this._handleInputModeChange('manual')}
                    >手动编辑</button>
                    <button
                        class="data-tab ${this._inputMode === 'paste' ? 'active' : ''}"
                        @click=${() => this._handleInputModeChange('paste')}
                    >粘贴表格</button>
                    <button
                        class="data-tab ${this._inputMode === 'json' ? 'active' : ''}"
                        @click=${() => this._handleInputModeChange('json')}
                    >JSON</button>
                    <button
                        class="data-tab ${this._inputMode === 'template' ? 'active' : ''}"
                        @click=${() => this._handleInputModeChange('template')}
                    >模板数据</button>
                </div>
                <div class="data-editor">
                    ${this._renderDataEditor()}
                </div>

                <!-- 主题选择 -->
                <span class="section-label">配色主题</span>
                <div class="theme-selector">
                    ${themes.map(t => html`
                        <button
                            class="theme-button ${this._theme === t.id ? 'active' : ''}"
                            @click=${() => this._handleThemeChange(t.id)}
                        >
                            <span
                                class="theme-dot"
                                style="background: linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})"
                            ></span>
                            ${t.name}
                        </button>
                    `)}
                </div>

                <!-- 图表预览 -->
                <div class="chart-preview ${this._theme === 'dark' ? 'dark-bg' : ''}">
                    ${this._renderChartPreview()}
                </div>

                <!-- 操作按钮 -->
                <div class="action-buttons">
                    <button class="action-button secondary" @click=${this._handleDownload}>
                        ${DownloadIcon}
                        下载图片
                    </button>
                    <button class="action-button primary" @click=${this._handleSubmit}>
                        插入到画板
                    </button>
                </div>
            </div>
        `;
    }
}
