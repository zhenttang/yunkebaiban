/**
 * 注册自定义元素
 */

import { EdgelessCalligraphyToolButton } from './toolbar/calligraphy-tool-button';
import { CalligraphyWidget } from './calligraphy-widget';

export function effects(): void {
    if (!customElements.get('edgeless-calligraphy-tool-button')) {
        customElements.define('edgeless-calligraphy-tool-button', EdgelessCalligraphyToolButton);
    }
    if (!customElements.get('calligraphy-widget')) {
        customElements.define('calligraphy-widget', CalligraphyWidget);
    }
}

// 自动执行以注册自定义元素
effects();

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-calligraphy-tool-button': EdgelessCalligraphyToolButton;
        'calligraphy-widget': CalligraphyWidget;
    }
}
