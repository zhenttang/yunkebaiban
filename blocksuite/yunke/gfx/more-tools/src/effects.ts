import { EdgelessMoreToolsButton } from './more-tools-button.js';

// 引入其他工具的 effects 以确保它们的自定义元素被注册
import '@blocksuite/yunke-gfx-timer/effects';
import '@blocksuite/yunke-gfx-emoji-reaction/effects';
import '@blocksuite/yunke-gfx-vote/effects';
import '@blocksuite/yunke-gfx-chart/effects';

export function effects() {
    if (!customElements.get('edgeless-more-tools-button')) {
        customElements.define('edgeless-more-tools-button', EdgelessMoreToolsButton);
    }
}
