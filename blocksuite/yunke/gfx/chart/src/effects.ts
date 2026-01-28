import { EdgelessChartToolButton } from './toolbar/chart-tool-button';
import { ChartWidget } from './chart-widget';

export function effects() {
    if (!customElements.get('edgeless-chart-tool-button')) {
        customElements.define('edgeless-chart-tool-button', EdgelessChartToolButton);
    }
    if (!customElements.get('chart-widget')) {
        customElements.define('chart-widget', ChartWidget);
    }
}

// 自动执行以注册自定义元素
effects();

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-chart-tool-button': EdgelessChartToolButton;
        'chart-widget': ChartWidget;
    }
}
