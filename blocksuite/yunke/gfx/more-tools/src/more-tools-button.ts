import {
    QuickToolExtension,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { state } from 'lit/decorators.js';

// 更多工具图标
const MoreIcon = html`
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="2" fill="currentColor"/>
  <circle cx="6" cy="12" r="2" fill="currentColor"/>
  <circle cx="18" cy="12" r="2" fill="currentColor"/>
</svg>
`;

// 激光笔图标
const LaserIcon = html`
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 3L5 7l12 12 4-4L9 3zm3 10l-2-2m-5 9h4m4 0h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="17" cy="7" r="2" fill="currentColor"/>
</svg>
`;

// 计时器图标
const TimerIcon = html`
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="13" r="8" stroke="currentColor" stroke-width="2"/>
  <path d="M12 9v4l2.5 2.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9 2h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
</svg>
`;

// 表情图标
const EmojiIcon = html`
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
  <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="9" cy="10" r="1" fill="currentColor"/>
  <circle cx="15" cy="10" r="1" fill="currentColor"/>
</svg>
`;

// 投票图标
const VoteIcon = html`
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 13h-.68l-2 2h1.91L19 17H5l1.78-2h2.05l-2-2H6l-3 3v4c0 1.1.89 2 1.99 2H19c1.1 0 2-.89 2-2v-4l-3-3z" fill="currentColor"/>
  <path d="M12.76 2.29L6.39 8.66a.996.996 0 000 1.41l4.95 4.95c.39.39 1.02.39 1.41 0l6.36-6.36a.996.996 0 000-1.41l-4.95-4.95a.996.996 0 00-1.41 0z" fill="currentColor"/>
</svg>
`;

// 图表图标
const ChartIcon = html`
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 20h16v2H4v-2zm0-2h4v-6H4v6zm6 0h4V4h-4v14zm6 0h4v-8h-4v8z" fill="currentColor"/>
</svg>
`;

interface ToolItem {
    id: string;
    icon: ReturnType<typeof html>;
    label: string;
    action: () => void;
}

export class EdgelessMoreToolsButton extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            height: 100%;
            position: relative;
        }

        .more-button {
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

        .more-button:hover {
            background-color: var(--yunke-hover-color);
        }

        .more-button[data-active='true'] {
            background-color: var(--yunke-hover-color);
            color: var(--yunke-primary-color);
        }

        .more-button svg {
            width: 24px;
            height: 24px;
        }

        .tools-menu {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 8px;
            display: flex;
            flex-direction: column;
            gap: 4px;
            min-width: 140px;
            z-index: 1000;
        }

        .tool-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 12px;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            color: var(--yunke-text-color, #333);
            font-size: 13px;
            white-space: nowrap;
        }

        .tool-item:hover {
            background-color: var(--yunke-hover-color, #f5f5f5);
        }

        .tool-item svg {
            width: 20px;
            height: 20px;
            color: var(--yunke-icon-color, #666);
        }
    `;

    @state()
    private accessor _menuVisible = false;

    private _activeWidget: HTMLElement | null = null;
    private _activeToolId: string | null = null;

    private _tools: ToolItem[] = [
        {
            id: 'laser',
            icon: LaserIcon,
            label: '激光笔',
            action: () => this._activateLaser(),
        },
        {
            id: 'timer',
            icon: TimerIcon,
            label: '计时器',
            action: () => this._showTimer(),
        },
        {
            id: 'emoji',
            icon: EmojiIcon,
            label: '表情反馈',
            action: () => this._showEmoji(),
        },
        {
            id: 'vote',
            icon: VoteIcon,
            label: '投票',
            action: () => this._showVote(),
        },
        {
            id: 'chart',
            icon: ChartIcon,
            label: '图表',
            action: () => this._showChart(),
        },
    ];

    private _toggleMenu(e: Event) {
        e.stopPropagation();
        this._menuVisible = !this._menuVisible;

        if (this._menuVisible) {
            // 添加全局点击监听，点击其他地方关闭菜单
            setTimeout(() => {
                document.addEventListener('click', this._closeMenu);
            }, 0);
        }
    }

    private _closeMenu = () => {
        this._menuVisible = false;
        document.removeEventListener('click', this._closeMenu);
    };

    private _handleToolClick(tool: ToolItem, e: Event) {
        e.stopPropagation();
        this._menuVisible = false;
        document.removeEventListener('click', this._closeMenu);
        tool.action();
    }

    private _activateLaser() {
        // TODO: 切换到激光笔工具
        console.log('激光笔工具已激活');
    }

    private _showTimer() {
        this._hideActiveWidget();
        const widget = document.createElement('timer-widget');
        (widget as any).posX = 20;
        (widget as any).posY = 80;
        (widget as any).onClose = () => this._hideActiveWidget();
        document.body.appendChild(widget);
        this._activeWidget = widget;
        this._activeToolId = 'timer';
    }

    private _showEmoji() {
        // 表情工具比较特殊，直接发送表情
        const emojis = ['👍', '👏', '❤️', '😊', '🎉', '🤔', '❓', '✅', '❌', '🔥'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        
        const floatingEmoji = document.createElement('floating-emoji');
        (floatingEmoji as any).emoji = randomEmoji;
        (floatingEmoji as any).posX = Math.random() * (window.innerWidth - 100) + 50;
        (floatingEmoji as any).posY = window.innerHeight - 150;
        document.body.appendChild(floatingEmoji);
        
        // 2秒后自动移除
        setTimeout(() => {
            floatingEmoji.remove();
        }, 2000);
    }

    private _showVote() {
        this._hideActiveWidget();
        const widget = document.createElement('vote-widget');
        (widget as any).posX = 20;
        (widget as any).posY = 80;
        (widget as any).onClose = () => this._hideActiveWidget();
        document.body.appendChild(widget);
        this._activeWidget = widget;
        this._activeToolId = 'vote';
    }

    private _showChart() {
        this._hideActiveWidget();
        const widget = document.createElement('chart-widget');
        
        // 计算弹窗位置到屏幕中央
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        (widget as any)._posX = Math.max(20, (viewportWidth - 640) / 2 - 100);
        (widget as any)._posY = Math.max(20, (viewportHeight - 600) / 2);
        
        (widget as any).onClose = () => this._hideActiveWidget();
        (widget as any).onSubmit = async (data: any, imageDataUrl: string) => {
            console.log('图表数据:', data);
            // 尝试插入图片到画板
            if (imageDataUrl) {
                await this._insertImageToCanvas(imageDataUrl, data.title || 'chart');
            }
            this._hideActiveWidget();
        };
        document.body.appendChild(widget);
        this._activeWidget = widget;
        this._activeToolId = 'chart';
    }

    /**
     * 将图片插入到画板
     */
    private async _insertImageToCanvas(imageDataUrl: string, title: string) {
        try {
            // 将 base64 数据转换为 Blob
            const response = await fetch(imageDataUrl);
            const blob = await response.blob();
            const file = new File([blob], `${title}.png`, { type: 'image/png' });

            // 查找 edgeless 编辑器
            const edgelessRoot = document.querySelector('affine-edgeless-root');
            if (!edgelessRoot) {
                console.warn('Edgeless root not found, downloading image');
                this._downloadImage(imageDataUrl, title);
                return;
            }

            // 获取 std 实例
            const std = (edgelessRoot as any).std;
            if (!std) {
                this._downloadImage(imageDataUrl, title);
                return;
            }

            // 尝试使用文件管理器添加图片
            const fileDropManager = std.get?.('affineFileDropManager');
            if (fileDropManager && typeof fileDropManager.addFiles === 'function') {
                const service = std.getService?.('affine:page');
                const viewport = service?.viewport;
                const centerX = viewport ? viewport.centerX : 400;
                const centerY = viewport ? viewport.centerY : 300;
                await fileDropManager.addFiles([file], { x: centerX, y: centerY });
                console.log('Chart image inserted successfully');
                return;
            }

            // 备选方案：下载图片
            this._downloadImage(imageDataUrl, title);
        } catch (error) {
            console.error('Failed to insert chart image:', error);
            this._downloadImage(imageDataUrl, title);
        }
    }

    private _downloadImage(dataUrl: string, title: string) {
        const link = document.createElement('a');
        link.download = `${title}.png`;
        link.href = dataUrl;
        link.click();
    }

    private _hideActiveWidget() {
        if (this._activeWidget) {
            this._activeWidget.remove();
            this._activeWidget = null;
            this._activeToolId = null;
        }
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._hideActiveWidget();
        document.removeEventListener('click', this._closeMenu);
    }

    override render() {
        return html`
            <div
                class="more-button"
                data-active=${this._menuVisible}
                @click=${this._toggleMenu}
            >
                ${MoreIcon}
                <yunke-tooltip tip-position="top" .offset=${12}>
                    更多工具
                </yunke-tooltip>
            </div>
            ${this._menuVisible
                ? html`
                    <div class="tools-menu" @click=${(e: Event) => e.stopPropagation()}>
                        ${this._tools.map(
                            tool => html`
                                <div
                                    class="tool-item"
                                    @click=${(e: Event) => this._handleToolClick(tool, e)}
                                >
                                    ${tool.icon}
                                    <span>${tool.label}</span>
                                </div>
                            `
                        )}
                    </div>
                `
                : ''}
        `;
    }
}

export const moreToolsQuickTool = QuickToolExtension('more-tools', () => {
    return {
        type: 'more-tools',
        content: html`<edgeless-more-tools-button></edgeless-more-tools-button>`,
        priority: 1,
    };
});
