/**
 * Animation Senior Tool - 动画工具栏注册
 */

import { SeniorToolExtension } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { html } from 'lit';

export const animationSeniorTool = SeniorToolExtension(
    'animation',
    ({ block, gfx }) => {
        return {
            name: '动画',
            content: html`
                <edgeless-animation-tool-button
                    .edgeless=${block}
                    .gfx=${gfx}
                ></edgeless-animation-tool-button>
            `,
        };
    }
);
