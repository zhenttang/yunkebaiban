import { EdgelessTimerToolButton } from './toolbar/timer-tool-button';
import { TimerWidget } from './timer-widget';

export function effects() {
    if (!customElements.get('edgeless-timer-tool-button')) {
        customElements.define('edgeless-timer-tool-button', EdgelessTimerToolButton);
    }
    if (!customElements.get('timer-widget')) {
        customElements.define('timer-widget', TimerWidget);
    }
}

// 自动执行以注册自定义元素
effects();

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-timer-tool-button': EdgelessTimerToolButton;
        'timer-widget': TimerWidget;
    }
}
