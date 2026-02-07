/**
 * ColorDrop Senior Tool - 拖放填色工具栏注册
 */

import { SeniorToolExtension } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { html } from 'lit';

export const colorDropSeniorTool = SeniorToolExtension(
    'color-drop',
    ({ block, gfx }) => {
        return {
            name: '填色',
            content: html`
                <color-drop-tool-button
                    .edgeless=${block}
                    .gfx=${gfx}
                ></color-drop-tool-button>
            `,
        };
    }
);
