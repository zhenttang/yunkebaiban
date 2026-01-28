import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

import type { ChartData } from '../chart-widget.js';

// 图表图标
const ChartIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20h16v2H4v-2zm0-2h4v-6H4v6zm6 0h4V4h-4v14zm6 0h4v-8h-4v8z" fill="currentColor"/>
</svg>
`;

export class EdgelessChartToolButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
        }

        .chart-button {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 36px;
            height: 36px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            color: var(--yunke-icon-color, #666);
        }

        .chart-button:hover {
            background-color: var(--yunke-hover-color);
        }

        .chart-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }

        .chart-button svg {
            width: 24px;
            height: 24px;
        }
    `;

    @state()
    private accessor _chartVisible = false;

    private _chartWidget: HTMLElement | null = null;

    private _toggleChart(e: Event) {
        e.stopPropagation();
        if (this._chartVisible) {
            this._hideChart();
        } else {
            this._showChart();
        }
    }

    private _showChart() {
        if (this._chartWidget) return;

        this._chartWidget = document.createElement('chart-widget');
        // 设置弹窗位置到屏幕中央偏左
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        (this._chartWidget as any)._posX = Math.max(20, (viewportWidth - 640) / 2 - 100);
        (this._chartWidget as any)._posY = Math.max(20, (viewportHeight - 600) / 2);
        (this._chartWidget as any).onClose = () => this._hideChart();
        (this._chartWidget as any).onSubmit = (data: ChartData, imageDataUrl: string) => {
            this._insertChartToCanvas(data, imageDataUrl);
            this._hideChart();
        };
        document.body.appendChild(this._chartWidget);
        this._chartVisible = true;
    }

    private _hideChart() {
        if (this._chartWidget) {
            this._chartWidget.remove();
            this._chartWidget = null;
        }
        this._chartVisible = false;
    }

    /**
     * 将图表图片插入到画板中
     */
    private async _insertChartToCanvas(data: ChartData, imageDataUrl: string) {
        if (!imageDataUrl) {
            console.error('No image data to insert');
            return;
        }

        try {
            // 将 base64 数据转换为 Blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();

            // 创建一个临时的 File 对象
            const file = new File([blob], `${data.title || 'chart'}.png`, { type: 'image/png' });

            // 查找 edgeless 编辑器
            const edgelessRoot = document.querySelector('affine-edgeless-root');
            if (!edgelessRoot) {
                console.warn('Edgeless root not found, downloading image instead');
                this._downloadImage(imageDataUrl, data.title);
                return;
            }

            // 获取 std 实例
            const std = (edgelessRoot as any).std;
            if (!std) {
                console.warn('Std instance not found');
                this._downloadImage(imageDataUrl, data.title);
                return;
            }

            // 使用 std 的文件上传能力
            const fileDropManager = std.get?.('affineFileDropManager');
            if (fileDropManager && typeof fileDropManager.addFiles === 'function') {
                // 计算插入位置（画布中心）
                const service = std.getService?.('affine:page');
                const viewport = service?.viewport;
                const centerX = viewport ? viewport.centerX : 400;
                const centerY = viewport ? viewport.centerY : 300;

                await fileDropManager.addFiles([file], { x: centerX, y: centerY });
                console.log('Chart inserted successfully');
                return;
            }

            // 备选方案：直接创建图片元素
            const doc = std.doc;
            if (doc) {
                // 尝试使用 BlockSuite 的图片 block 创建
                const imageService = std.getService?.('affine:image');
                if (imageService && typeof imageService.addImage === 'function') {
                    await imageService.addImage(file);
                    console.log('Chart inserted via image service');
                    return;
                }
            }

            // 最后的备选方案：下载图片
            console.warn('Could not find a way to insert image, downloading instead');
            this._downloadImage(imageDataUrl, data.title);
        } catch (error) {
            console.error('Failed to insert chart:', error);
            this._downloadImage(imageDataUrl, data.title);
        }
    }

    /**
     * 下载图片作为备选方案
     */
    private _downloadImage(dataUrl: string, title: string) {
        const link = document.createElement('a');
        link.download = `${title || 'chart'}.png`;
        link.href = dataUrl;
        link.click();
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._hideChart();
    }

    override render() {
        return html`
            <div
                class="chart-button"
                data-active=${this._chartVisible}
                @click=${this._toggleChart}
            >
                ${ChartIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    图表生成器
                </yunke-tooltip>
            </div>
        `;
    }
}

export const chartQuickTool = QuickToolExtension('chart', () => {
    return {
        type: 'chart',
        content: html`<edgeless-chart-tool-button></edgeless-chart-tool-button>`,
        priority: 1,
    };
});
