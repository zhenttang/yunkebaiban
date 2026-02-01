/**
 * Animation Effects - 副作用注册
 * 
 * 用于注册组件和服务
 */

import { AnimationTimelinePanel } from './components/timeline-panel.js';
import { AnimationToolButton } from './toolbar/animation-tool-button.js';
import { EdgelessAnimationToolButton } from './toolbar/edgeless-animation-tool-button.js';

export { animationSeniorTool } from './toolbar/animation-senior-tool.js';

// 手动注册 Lit 组件（与 template 保持一致）
export function effects(): void {
    if (!customElements.get('animation-timeline-panel')) {
        customElements.define('animation-timeline-panel', AnimationTimelinePanel);
    }
    if (!customElements.get('animation-tool-button')) {
        customElements.define('animation-tool-button', AnimationToolButton);
    }
    if (!customElements.get('edgeless-animation-tool-button')) {
        customElements.define('edgeless-animation-tool-button', EdgelessAnimationToolButton);
    }
}

// 兼容旧的导出名称
export const registerAnimationEffects = effects;

declare global {
    interface HTMLElementTagNameMap {
        'animation-timeline-panel': AnimationTimelinePanel;
        'animation-tool-button': AnimationToolButton;
        'edgeless-animation-tool-button': EdgelessAnimationToolButton;
    }
}
