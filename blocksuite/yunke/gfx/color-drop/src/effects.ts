/**
 * ColorDrop Effects - 注册自定义元素
 */

import { ColorDropToolButton } from './toolbar/color-drop-button.js';

export function effects() {
    // 注册 ColorDrop 工具按钮
    if (!customElements.get('color-drop-tool-button')) {
        customElements.define('color-drop-tool-button', ColorDropToolButton);
    }
}
