import { EdgelessLaserToolButton } from './toolbar/laser-tool-button';

export function effects() {
    customElements.define('edgeless-laser-tool-button', EdgelessLaserToolButton);
}

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-laser-tool-button': EdgelessLaserToolButton;
    }
}
