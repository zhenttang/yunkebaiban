/**
 * Edgeless Animation Tool Button - 基于 Frame 的动画播放器
 * 
 * 工作方式：
 * 1. 读取画板上的所有 Frame（按演示顺序排列）
 * 2. 每个 Frame 就是动画的一帧
 * 3. 播放时依次将视口切换到每个 Frame
 * 4. 专业模式支持关键帧补间动画
 */

import type { GfxController } from '@blocksuite/std/gfx';
import { Bound } from '@blocksuite/global/gfx';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

// 缓动函数类型
type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInBack' | 'easeOutBack' | 'easeInOutBack' | 'easeInElastic' | 'easeOutElastic' | 'easeOutBounce';

// 关键帧数据
interface KeyframeData {
    elementId: string;
    frameIndex: number;
    properties: {
        x?: number;
        y?: number;
        rotation?: number;
        scaleX?: number;
        scaleY?: number;
        opacity?: number;
    };
    easing: EasingType;
}

// 缓动函数实现
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
    'linear': t => t,
    'easeIn': t => t * t,
    'easeOut': t => t * (2 - t),
    'easeInOut': t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    'easeInCubic': t => t * t * t,
    'easeOutCubic': t => (--t) * t * t + 1,
    'easeInOutCubic': t => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    'easeInBack': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return c3 * t * t * t - c1 * t * t;
    },
    'easeOutBack': t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    'easeInOutBack': t => {
        const c1 = 1.70158;
        const c2 = c1 * 1.525;
        return t < 0.5
            ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
            : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    },
    'easeInElastic': t => {
        if (t === 0 || t === 1) return t;
        return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
    },
    'easeOutElastic': t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
    },
    'easeOutBounce': t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
};

// Frame 类型定义
interface FrameModel {
    id: string;
    xywh: string;
    flavour: string;
    props?: {
        title?: { toString(): string };
        presentationIndex?: string;
    };
}

// 子帧（Frame内的元素）
interface SubFrame {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    bound: any;
}

export class EdgelessAnimationToolButton extends LitElement {
    static override styles = css`
        :host {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
        }

        .animation-tool-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            transition: all 0.2s ease;
            color: var(--yunke-icon-color, #77757d);
            padding: 8px;
        }

        .animation-tool-btn:hover {
            background: var(--yunke-hover-color, rgba(0, 0, 0, 0.04));
            color: var(--yunke-primary-color, #1e96eb);
        }

        .animation-tool-btn.active {
            background: var(--yunke-hover-color-filled, rgba(30, 150, 235, 0.1));
            color: var(--yunke-primary-color, #1e96eb);
        }

        .animation-tool-btn svg {
            width: 24px;
            height: 24px;
        }

        .animation-tool-btn span {
            font-size: 11px;
            font-weight: 500;
        }

        .badge {
            position: absolute;
            top: 4px;
            right: 4px;
            background: var(--yunke-primary-color, #1e96eb);
            color: white;
            font-size: 10px;
            padding: 2px 4px;
            border-radius: 4px;
            font-weight: 600;
        }

        /* 动画控制面板 - 在画布顶部显示 */
        .animation-panel {
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #ffffff;
            border: 1px solid #e3e2e4;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            padding: 12px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            z-index: 9999;
            min-width: 300px;
        }

        .panel-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border: none;
            border-radius: 8px;
            background: transparent;
            cursor: pointer;
            transition: all 0.15s ease;
            color: var(--affine-text-primary-color, #121212);
        }

        .panel-btn:hover {
            background: var(--affine-hover-color, rgba(0, 0, 0, 0.04));
        }

        .panel-btn.primary {
            background: var(--affine-primary-color, #1e96eb);
            color: white;
        }

        .panel-btn.primary:hover {
            background: #1a85d4;
        }

        .panel-btn svg {
            width: 20px;
            height: 20px;
        }

        .frame-info {
            font-size: 14px;
            color: var(--affine-text-secondary-color, #8e8d91);
            min-width: 60px;
            text-align: center;
        }

        .fps-control {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .fps-control select {
            padding: 4px 8px;
            border: 1px solid var(--affine-border-color, #e3e2e4);
            border-radius: 6px;
            background: var(--affine-background-primary-color, #fff);
            font-size: 12px;
        }

        .divider {
            width: 1px;
            height: 24px;
            background: var(--affine-border-color, #e3e2e4);
        }

        .close-btn {
            color: var(--affine-text-secondary-color, #8e8d91);
        }

        .no-frames-tip {
            font-size: 13px;
            color: var(--affine-text-secondary-color, #8e8d91);
            padding: 8px 16px;
        }
    `;

    @property({ attribute: false })
    accessor edgeless: any = null;

    @property({ attribute: false })
    accessor gfx: GfxController | null = null;

    @state()
    accessor isPanelOpen = false;

    @state()
    accessor isPlaying = false;

    @state()
    accessor currentFrameIndex = 0;

    @state()
    accessor fps = 6;

    @state()
    accessor showOnionSkin = true;

    @state()
    accessor keepFrames = true; // true = 叠加模式（保留之前帧），false = 替换模式（只显示当前帧）

    @state()
    accessor loopPlay = true; // true = 循环播放，false = 播放一次

    @state()
    accessor isProMode = false; // 专业模式：显示时间轴和关键帧编辑

    @state()
    accessor selectedFrame: FrameModel | null = null;

    @state()
    accessor selectedElementId: string | null = null; // 当前选中的元素（用于关键帧编辑）

    @state()
    accessor currentEasing: EasingType = 'easeOutCubic'; // 当前缓动曲线

    @state()
    accessor enableTweenAnimation = false; // 是否启用补间动画

    @state()
    accessor brushSmoothing = 50; // 笔刷平滑度 0-100

    @state()
    accessor brushSmoothingMode: 'pulled-string' | 'moving-average' | 'catmull-rom' | 'bezier' = 'pulled-string'; // 平滑算法

    // Frame 列表和当前 Frame 内的子帧列表
    private _frames: FrameModel[] = [];
    private _subFrames: SubFrame[] = [];
    private _playInterval: number | null = null;
    private _panelContainer: HTMLDivElement | null = null;
    
    // 关键：存储每一帧包含的元素 ID 列表
    private _frameElementsMap: Map<number, string[]> = new Map();
    
    // 关键帧存储：elementId -> frameIndex -> KeyframeData
    private _keyframes: Map<string, Map<number, KeyframeData>> = new Map();
    
    // 元素初始状态缓存（用于补间动画）
    private _elementInitialStates: Map<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; opacity: number }> = new Map();
    
    // 帧的固定大小（每帧的宽高）
    private readonly FRAME_WIDTH = 300;
    private readonly FRAME_HEIGHT = 300;
    private readonly FRAME_GAP = 50;

    override connectedCallback() {
        super.connectedCallback();
        // 恢复面板状态（如果之前打开过）
        const existingPanel = document.getElementById('animation-panel-portal');
        if (existingPanel) {
            this._panelContainer = existingPanel as HTMLDivElement;
            this.isPanelOpen = true;
            // 从面板的 data 属性恢复状态
            const frameId = existingPanel.dataset.frameId;
            if (frameId) {
                this._frames = this._getAllFrames();
                this.selectedFrame = this._frames.find(f => f.id === frameId) || null;
                if (this.selectedFrame) {
                    this._loadAnimationFrames();
                }
            }
        }
        
        // 监听页面切换，清理面板
        this._setupPageChangeListener();
    }
    
    private _pageChangeHandler = () => {
        // 检查 edgeless 编辑器是否还存在
        const edgelessEditor = document.querySelector('edgeless-editor');
        if (!edgelessEditor) {
            this._removePanelFromBody();
        }
    };
    
    private _setupPageChangeListener() {
        // 使用 MutationObserver 监听 DOM 变化
        // 当 edgeless-editor 被移除时，关闭面板
        const observer = new MutationObserver((mutations) => {
            const edgelessEditor = document.querySelector('edgeless-editor');
            if (!edgelessEditor && this._panelContainer) {
                this._removePanelFromBody();
                observer.disconnect();
            }
        });
        
        observer.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        this._stopAnimation();
        // 注意：不在这里移除面板，因为切换工具时组件会被重新创建
        // 面板只在用户明确关闭时移除（点击关闭按钮或再次点击动画按钮）
    }

    private _createPanelContainer(): HTMLDivElement {
        // 先检查是否已存在
        const existing = document.getElementById('animation-panel-portal');
        if (existing) {
            return existing as HTMLDivElement;
        }
        
        const container = document.createElement('div');
        container.id = 'animation-panel-portal';
        container.style.cssText = `
            position: fixed;
            top: 64px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 99999;
            min-width: 320px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        return container;
    }

    private _removePanelFromBody(): void {
        const panel = document.getElementById('animation-panel-portal');
        if (panel) {
            panel.remove();
        }
        this._panelContainer = null;
    }

    private _updatePanelContent(): void {
        if (!this._panelContainer) return;

        // 专业模式：显示高级时间轴编辑器
        if (this.isProMode && this.selectedFrame) {
            this._renderProModePanel();
            if (!this.isPlaying) {
                this._applyOnionSkin();
            }
            return;
        }

        // 如果已选择 Frame，显示子帧控制
        if (this.selectedFrame) {
            this._renderSubFramePlayerToContainer();
            // 关键：在非播放模式下，更新面板时应用洋葱皮
            if (!this.isPlaying) {
                this._applyOnionSkin();
            }
        } else {
            this._renderFrameListToContainer();
        }
    }

    private _renderFrameListToContainer(): void {
        if (!this._panelContainer) return;
        const frameCount = this._frames.length;

        if (frameCount === 0) {
            this._panelContainer.innerHTML = `
                <div style="font-size: 13px; color: #8e8d91; padding: 8px 16px;">
                    请先在画板上添加 Frame（框架），<br/>
                    每个 Frame 是一个独立的动画
                </div>
                <button id="close-panel-btn" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 10px; background: transparent; cursor: pointer; color: #8e8d91; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;
            this._panelContainer.querySelector('#close-panel-btn')?.addEventListener('click', () => this._closePanel());
            return;
        }

        // 渲染 Frame 列表
        let framesHtml = '';
        this._frames.forEach((frame, index) => {
            const title = frame.props?.title?.toString() || `Frame ${index + 1}`;
            framesHtml += `
                <button class="frame-item" data-index="${index}" style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; background: rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s; min-width: 120px;" onmouseover="this.style.background='#fff';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)';this.style.borderColor='rgba(0,0,0,0.12)'" onmouseout="this.style.background='rgba(0,0,0,0.03)';this.style.boxShadow='none';this.style.borderColor='rgba(0,0,0,0.08)'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color: #666;">
                        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <line x1="2" y1="7" x2="7" y2="7"></line>
                        <line x1="2" y1="17" x2="7" y2="17"></line>
                        <line x1="17" y1="17" x2="22" y2="17"></line>
                        <line x1="17" y1="7" x2="22" y2="7"></line>
                    </svg>
                    <span style="font-size: 13px; font-weight: 600; color: #1a1a1a;">${title}</span>
                </button>
            `;
        });

        this._panelContainer.style.flexDirection = 'column';
        this._panelContainer.style.alignItems = 'stretch';
        this._panelContainer.style.minWidth = '320px';
        
        this._panelContainer.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 4px 4px 8px 4px; border-bottom: 0.5px solid rgba(0,0,0,0.08); margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #007AFF;"></div>
                    <span style="font-size: 13px; font-weight: 700; color: #1a1a1a;">选择动画 (${frameCount})</span>
                </div>
                <button id="close-panel-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 8px; background: transparent; cursor: pointer; color: #999; transition: all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)';this.style.color='#666'" onmouseout="this.style.background='transparent';this.style.color='#999'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap; max-height: 240px; overflow-y: auto; padding: 2px;">
                ${framesHtml}
            </div>
        `;

        // 绑定事件
        this._panelContainer.querySelector('#close-panel-btn')?.addEventListener('click', () => this._closePanel());
        this._panelContainer.querySelectorAll('.frame-item').forEach((btn) => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index') || '0');
                this._selectFrame(this._frames[index]);
            });
        });
    }

    private _renderSubFramePlayerToContainer(): void {
        if (!this._panelContainer || !this.selectedFrame) return;

        const title = this.selectedFrame.props?.title?.toString() || '未命名动画';
        const subFrameCount = this._frameElementsMap.size;
        const currentFrame = this.currentFrameIndex + 1;

        // 重置面板样式（从专业模式切换回来时需要）
        this._panelContainer.style.cssText = `
            position: fixed;
            top: 64px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.12);
            padding: 8px 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 99999;
            min-width: 320px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex-direction: row;
            flex-wrap: nowrap;
            white-space: nowrap;
            width: auto;
            max-width: none;
        `;
        
        this._panelContainer.innerHTML = `
            <button id="back-btn" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border: none; border-radius: 10px; background: transparent; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
            <div style="flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(0, 0, 0, 0.04); border-radius: 10px; margin: 0 4px;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" style="color: #666;">
                    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                    <line x1="7" y1="2" x2="7" y2="22"></line>
                    <line x1="17" y1="2" x2="17" y2="22"></line>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="2" y1="7" x2="7" y2="7"></line>
                    <line x1="2" y1="17" x2="7" y2="17"></line>
                    <line x1="17" y1="17" x2="22" y2="17"></line>
                    <line x1="17" y1="7" x2="22" y2="7"></line>
                </svg>
                <span style="font-size: 13px; font-weight: 600; color: #1a1a1a; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${title}</span>
            </div>
            
            <div style="flex-shrink: 0; display: flex; align-items: center; background: rgba(0, 0, 0, 0.04); border-radius: 12px; padding: 2px; margin: 0 4px;">
                <button id="prev-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 10px; background: transparent; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fff';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent';this.style.boxShadow='none'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="m15 18-6-6 6-6"/>
                    </svg>
                </button>
                <span id="frame-counter" style="font-size: 12px; font-weight: 600; color: #4a4a4a; min-width: 48px; text-align: center; font-variant-numeric: tabular-nums;">${currentFrame} / ${Math.max(subFrameCount, currentFrame)}</span>
                <button id="next-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 10px; background: transparent; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fff';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.05)'" onmouseout="this.style.background='transparent';this.style.boxShadow='none'">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <path d="m9 18 6-6-6-6"/>
                    </svg>
                </button>
            </div>

            <button id="add-frame-btn" style="flex-shrink: 0; display: flex; align-items: center; gap: 6px; padding: 0 12px; height: 32px; border: none; border-radius: 10px; background: #000; color: #fff; cursor: pointer; font-size: 12px; font-weight: 600; transition: transform 0.2s, opacity 0.2s; margin: 0 4px;" onmouseover="this.style.transform='scale(1.02)';this.style.opacity='0.9'" onmouseout="this.style.transform='scale(1)';this.style.opacity='1'">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>新帧</span>
            </button>

            <button id="play-btn" style="flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; border-radius: 14px; background: #007AFF; color: white; cursor: pointer; transition: all 0.1s ease-out; box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3); margin: 0 4px; position: relative; z-index: 10;" onmouseover="this.style.transform='scale(1.08)';this.style.boxShadow='0 6px 16px rgba(0, 122, 255, 0.4)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(0, 122, 255, 0.3)'" onmousedown="this.style.transform='scale(0.92)'" onmouseup="this.style.transform='scale(1.08)'">
                ${this.isPlaying 
                    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" style="pointer-events: none;"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
                    : '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="pointer-events: none;"><path d="M8 5.14v14c0 .86.84 1.4 1.58.97l12-7a1.12 1.12 0 0 0 0-1.94l-12-7c-.74-.43-1.58.11-1.58.97Z"/></svg>'}
            </button>

            <div style="flex-shrink: 0; width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 8px;"></div>

            <div style="flex-shrink: 0; display: flex; align-items: center; gap: 6px;">
                <div style="position: relative; display: flex; align-items: center;">
                    <select id="fps-select" style="padding: 4px 24px 4px 8px; border: none; border-radius: 8px; background: rgba(0,0,0,0.04); font-size: 11px; font-weight: 700; cursor: pointer; outline: none; appearance: none; text-align: center; color: #1a1a1a; transition: background 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.08)'" onmouseout="this.style.background='rgba(0,0,0,0.04)'">
                        ${[2, 4, 6, 8, 12, 15, 24, 30].map(f => `<option value="${f}" ${f === this.fps ? 'selected' : ''}>${f} 帧/秒</option>`).join('')}
                    </select>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" width="10" height="10" style="position: absolute; right: 8px; pointer-events: none; color: #666;">
                        <path d="m6 9 6 6 6-6"/>
                    </svg>
                </div>
                
                <button id="mode-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; border: none; border-radius: 8px; background: ${this.keepFrames ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.04)'}; cursor: pointer; font-size: 11px; font-weight: 700; color: ${this.keepFrames ? '#059669' : '#4a4a4a'}; transition: all 0.2s;" onmouseover="this.style.filter='brightness(0.95)'" onmouseout="this.style.filter='none'">
                    <span>${this.keepFrames ? '叠加' : '替换'}</span>
                </button>
                
                <button id="loop-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; border: none; border-radius: 8px; background: ${this.loopPlay ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.04)'}; cursor: pointer; font-size: 11px; font-weight: 700; color: ${this.loopPlay ? '#4f46e5' : '#4a4a4a'}; transition: all 0.2s;" onmouseover="this.style.filter='brightness(0.95)'" onmouseout="this.style.filter='none'">
                    <span>${this.loopPlay ? '循环' : '单次'}</span>
                </button>

                <button id="onion-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; border: none; border-radius: 8px; background: ${this.showOnionSkin ? 'rgba(245, 158, 11, 0.1)' : 'rgba(0,0,0,0.04)'}; cursor: pointer; font-size: 11px; font-weight: 700; color: ${this.showOnionSkin ? '#d97706' : '#4a4a4a'}; transition: all 0.2s;" title="洋葱皮：淡化非当前帧内容">
                    <span>${this.showOnionSkin ? '👁️' : '👓'}</span>
                    <span>洋葱皮</span>
                </button>

                <button id="pro-mode-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 10px; border: none; border-radius: 8px; background: ${this.isProMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(0,0,0,0.04)'}; cursor: pointer; font-size: 11px; font-weight: 700; color: ${this.isProMode ? '#fff' : '#4a4a4a'}; transition: all 0.2s; box-shadow: ${this.isProMode ? '0 2px 8px rgba(102, 126, 234, 0.4)' : 'none'};" title="专业模式：关键帧动画编辑">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                    <span>专业</span>
                </button>
            </div>
        `;

        // 重新绑定所有事件
        this._panelContainer.querySelector('#back-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._backToFrameList();
        });
        this._panelContainer.querySelector('#prev-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._gotoPrevFrame();
        });
        this._panelContainer.querySelector('#next-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._gotoNextFrame();
        });
        this._panelContainer.querySelector('#add-frame-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._addNewFrame();
        });
        this._panelContainer.querySelector('#play-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this._togglePlay();
        });
        this._panelContainer.querySelector('#fps-select')?.addEventListener('change', (e) => {
            this.fps = parseInt((e.target as HTMLSelectElement).value);
            if (this.isPlaying) {
                this._stopAnimation();
                this._startAnimation();
            }
        });
        this._panelContainer.querySelector('#mode-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.keepFrames = !this.keepFrames;
            this._updatePanelContent();
            if (this.isPlaying) {
                this._stopAnimation();
                this._startAnimation();
            }
        });
        this._panelContainer.querySelector('#loop-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.loopPlay = !this.loopPlay;
            this._updatePanelContent();
        });
        this._panelContainer.querySelector('#onion-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showOnionSkin = !this.showOnionSkin;
            this._updatePanelContent();
            // 立即应用洋葱皮效果
            if (!this.isPlaying) {
                this._applyOnionSkin();
            }
        });
        this._panelContainer.querySelector('#pro-mode-btn')?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.isProMode = !this.isProMode;
            this._updatePanelContent();
        });
    }

    /**
     * 渲染专业模式面板 - 时间轴和关键帧编辑
     */
    private _renderProModePanel(): void {
        if (!this._panelContainer || !this.selectedFrame) return;

        const title = this.selectedFrame.props?.title?.toString() || '未命名动画';
        const subFrameCount = this._frameElementsMap.size;
        const currentFrame = this.currentFrameIndex + 1;

        // 专业面板更大，显示时间轴
        this._panelContainer.style.cssText = `
            position: fixed;
            top: 64px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 0.5px solid rgba(0, 0, 0, 0.1);
            border-radius: 16px;
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
            padding: 0;
            display: flex;
            flex-direction: column;
            z-index: 99999;
            width: 680px;
            max-width: 90vw;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        // 生成时间轴帧
        let timelineFramesHtml = '';
        for (let i = 0; i < Math.max(subFrameCount, 1); i++) {
            const isActive = i === this.currentFrameIndex;
            const hasContent = this._frameElementsMap.has(i);
            timelineFramesHtml += `
                <div class="timeline-frame" data-index="${i}" style="
                    flex-shrink: 0;
                    width: 60px;
                    height: 60px;
                    border: 2px solid ${isActive ? '#007AFF' : 'rgba(0,0,0,0.1)'};
                    border-radius: 8px;
                    background: ${isActive ? 'rgba(0, 122, 255, 0.1)' : hasContent ? '#fff' : 'rgba(0,0,0,0.02)'};
                    cursor: pointer;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    transition: all 0.2s;
                    position: relative;
                ">
                    <span style="font-size: 16px; font-weight: 700; color: ${isActive ? '#007AFF' : '#666'};">${i + 1}</span>
                    <span style="font-size: 9px; color: #999;">${hasContent ? (this._frameElementsMap.get(i)?.length || 0) + '个元素' : '空帧'}</span>
                    ${isActive ? '<div style="position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #007AFF;"></div>' : ''}
                </div>
            `;
        }

        this._panelContainer.innerHTML = `
            <!-- 标题栏 -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button id="back-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 6px; background: rgba(255,255,255,0.2); cursor: pointer; transition: all 0.2s; color: #fff;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                        <span style="font-size: 14px; font-weight: 700; color: #fff;">专业动画 - ${title}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="exit-pro-btn" style="display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: none; border-radius: 6px; background: rgba(255,255,255,0.2); cursor: pointer; font-size: 11px; font-weight: 600; color: #fff; transition: all 0.2s;">
                        <span>简易模式</span>
                    </button>
                    <button id="close-panel-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; border-radius: 6px; background: rgba(255,255,255,0.2); cursor: pointer; color: #fff; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- 播放控制栏 -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.06);">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="first-frame-btn" class="pro-btn" style="width: 32px; height: 32px; border: none; border-radius: 8px; background: rgba(0,0,0,0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <polygon points="19 20 9 12 19 4 19 20"></polygon>
                            <line x1="5" y1="19" x2="5" y2="5"></line>
                        </svg>
                    </button>
                    <button id="prev-btn" class="pro-btn" style="width: 32px; height: 32px; border: none; border-radius: 8px; background: rgba(0,0,0,0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                    </button>
                    <button id="play-btn" style="width: 44px; height: 44px; border: none; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #fff; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.2s;">
                        ${this.isPlaying 
                            ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="20" height="20"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>'
                            : '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5.14v14c0 .86.84 1.4 1.58.97l12-7a1.12 1.12 0 0 0 0-1.94l-12-7c-.74-.43-1.58.11-1.58.97Z"/></svg>'}
                    </button>
                    <button id="next-btn" class="pro-btn" style="width: 32px; height: 32px; border: none; border-radius: 8px; background: rgba(0,0,0,0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <path d="m9 18 6-6-6-6"/>
                        </svg>
                    </button>
                    <button id="last-frame-btn" class="pro-btn" style="width: 32px; height: 32px; border: none; border-radius: 8px; background: rgba(0,0,0,0.04); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                            <polygon points="5 4 15 12 5 20 5 4"></polygon>
                            <line x1="19" y1="5" x2="19" y2="19"></line>
                        </svg>
                    </button>
                </div>
                
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: rgba(0,0,0,0.04); border-radius: 8px;">
                        <span style="font-size: 24px; font-weight: 700; color: #667eea;">${currentFrame}</span>
                        <span style="font-size: 13px; color: #999;">/ ${Math.max(subFrameCount, currentFrame)}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <select id="fps-select" style="padding: 6px 28px 6px 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: #fff; font-size: 12px; font-weight: 600; cursor: pointer; outline: none; appearance: none;">
                            ${[1, 2, 4, 6, 8, 12, 15, 24, 30].map(f => `<option value="${f}" ${f === this.fps ? 'selected' : ''}>${f} FPS</option>`).join('')}
                        </select>
                        
                        <button id="loop-btn" style="padding: 6px 12px; border: 1px solid ${this.loopPlay ? '#667eea' : 'rgba(0,0,0,0.1)'}; border-radius: 8px; background: ${this.loopPlay ? 'rgba(102, 126, 234, 0.1)' : '#fff'}; cursor: pointer; font-size: 11px; font-weight: 600; color: ${this.loopPlay ? '#667eea' : '#666'}; transition: all 0.2s;">
                            ${this.loopPlay ? '🔁 循环' : '▶️ 单次'}
                        </button>
                        
                        <button id="onion-btn" style="padding: 6px 12px; border: 1px solid ${this.showOnionSkin ? '#f59e0b' : 'rgba(0,0,0,0.1)'}; border-radius: 8px; background: ${this.showOnionSkin ? 'rgba(245, 158, 11, 0.1)' : '#fff'}; cursor: pointer; font-size: 11px; font-weight: 600; color: ${this.showOnionSkin ? '#d97706' : '#666'}; transition: all 0.2s;">
                            ${this.showOnionSkin ? '👁️ 洋葱皮' : '👓 洋葱皮'}
                        </button>
                    </div>
                </div>
            </div>

            <!-- 时间轴区域 -->
            <div style="padding: 16px; background: rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-size: 12px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px;">时间轴</span>
                    <button id="add-frame-btn" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; border-radius: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; cursor: pointer; font-size: 11px; font-weight: 600; transition: all 0.2s; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        <span>新建帧</span>
                    </button>
                </div>
                <div id="timeline-container" style="display: flex; gap: 8px; overflow-x: auto; padding: 8px 4px 16px 4px; min-height: 80px;">
                    ${timelineFramesHtml}
                </div>
            </div>

            <!-- 关键帧编辑区域 -->
            <div style="padding: 16px; border-top: 1px solid rgba(0,0,0,0.06);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #667eea;">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span style="font-size: 12px; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">关键帧补间</span>
                    </div>
                    <button id="tween-toggle-btn" style="
                        display: flex; align-items: center; gap: 6px; padding: 6px 12px;
                        border: 1px solid ${this.enableTweenAnimation ? '#10b981' : 'rgba(0,0,0,0.1)'};
                        border-radius: 8px;
                        background: ${this.enableTweenAnimation ? 'rgba(16, 185, 129, 0.1)' : '#fff'};
                        cursor: pointer; font-size: 11px; font-weight: 600;
                        color: ${this.enableTweenAnimation ? '#059669' : '#666'};
                        transition: all 0.2s;
                    ">
                        <div style="width: 32px; height: 18px; border-radius: 9px; background: ${this.enableTweenAnimation ? '#10b981' : '#ddd'}; position: relative; transition: all 0.2s;">
                            <div style="position: absolute; top: 2px; ${this.enableTweenAnimation ? 'right: 2px' : 'left: 2px'}; width: 14px; height: 14px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: all 0.2s;"></div>
                        </div>
                        <span>${this.enableTweenAnimation ? '已启用' : '未启用'}</span>
                    </button>
                </div>

                ${this.enableTweenAnimation ? `
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <!-- 缓动曲线选择 -->
                        <div style="flex: 1; min-width: 200px;">
                            <label style="display: block; font-size: 11px; font-weight: 600; color: #666; margin-bottom: 6px;">缓动曲线</label>
                            <select id="easing-select" style="width: 100%; padding: 8px 12px; border: 1px solid rgba(0,0,0,0.1); border-radius: 8px; background: #fff; font-size: 12px; cursor: pointer; outline: none;">
                                <optgroup label="基础">
                                    <option value="linear" ${this.currentEasing === 'linear' ? 'selected' : ''}>线性 (Linear)</option>
                                    <option value="easeIn" ${this.currentEasing === 'easeIn' ? 'selected' : ''}>渐入 (Ease In)</option>
                                    <option value="easeOut" ${this.currentEasing === 'easeOut' ? 'selected' : ''}>渐出 (Ease Out)</option>
                                    <option value="easeInOut" ${this.currentEasing === 'easeInOut' ? 'selected' : ''}>渐入渐出 (Ease In Out)</option>
                                </optgroup>
                                <optgroup label="三次方">
                                    <option value="easeInCubic" ${this.currentEasing === 'easeInCubic' ? 'selected' : ''}>渐入三次方</option>
                                    <option value="easeOutCubic" ${this.currentEasing === 'easeOutCubic' ? 'selected' : ''}>渐出三次方</option>
                                    <option value="easeInOutCubic" ${this.currentEasing === 'easeInOutCubic' ? 'selected' : ''}>渐入渐出三次方</option>
                                </optgroup>
                                <optgroup label="回弹">
                                    <option value="easeInBack" ${this.currentEasing === 'easeInBack' ? 'selected' : ''}>回弹渐入</option>
                                    <option value="easeOutBack" ${this.currentEasing === 'easeOutBack' ? 'selected' : ''}>回弹渐出</option>
                                    <option value="easeInOutBack" ${this.currentEasing === 'easeInOutBack' ? 'selected' : ''}>回弹渐入渐出</option>
                                </optgroup>
                                <optgroup label="弹性">
                                    <option value="easeInElastic" ${this.currentEasing === 'easeInElastic' ? 'selected' : ''}>弹性渐入</option>
                                    <option value="easeOutElastic" ${this.currentEasing === 'easeOutElastic' ? 'selected' : ''}>弹性渐出</option>
                                    <option value="easeOutBounce" ${this.currentEasing === 'easeOutBounce' ? 'selected' : ''}>弹跳</option>
                                </optgroup>
                            </select>
                        </div>

                        <!-- 缓动曲线预览 -->
                        <div style="width: 80px; height: 80px; background: #f5f5f5; border-radius: 8px; position: relative; overflow: hidden;">
                            <svg viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                                <path d="M 10 90 ${this._getEasingPath(this.currentEasing)} L 90 10" fill="none" stroke="#667eea" stroke-width="3" stroke-linecap="round"/>
                                <circle cx="10" cy="90" r="4" fill="#667eea"/>
                                <circle cx="90" cy="10" r="4" fill="#667eea"/>
                            </svg>
                        </div>
                    </div>

                    <!-- 当前帧元素 -->
                    <div style="margin-top: 12px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; color: #666; margin-bottom: 6px;">当前帧元素 (帧 ${currentFrame})</label>
                        <div id="frame-elements-list" style="display: flex; flex-wrap: wrap; gap: 6px; max-height: 80px; overflow-y: auto;">
                            ${this._renderFrameElementsList()}
                        </div>
                    </div>

                    <!-- 操作提示 -->
                    <div style="margin-top: 12px; padding: 8px 12px; background: rgba(102, 126, 234, 0.05); border-radius: 8px; border-left: 3px solid #667eea;">
                        <div style="font-size: 11px; color: #666; line-height: 1.5;">
                            💡 <strong>使用方法：</strong>选择元素，在不同帧调整位置/大小/旋转，播放时自动补间。
                        </div>
                    </div>
                ` : `
                    <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
                        启用补间动画后，可以为元素设置关键帧，自动生成平滑的过渡动画。
                    </div>
                `}
            </div>

            <!-- 笔刷设置区域 -->
            <div style="padding: 16px; border-top: 1px solid rgba(0,0,0,0.06);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color: #10b981;">
                            <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                            <path d="M2 2l7.586 7.586"></path>
                            <circle cx="11" cy="11" r="2"></circle>
                        </svg>
                        <span style="font-size: 12px; font-weight: 700; color: #333; text-transform: uppercase; letter-spacing: 0.5px;">笔刷增强</span>
                    </div>
                    <div style="font-size: 10px; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 2px 8px; border-radius: 10px;">
                        ✓ 已启用压感
                    </div>
                </div>

                <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                    <!-- 平滑度滑块 -->
                    <div style="flex: 1; min-width: 150px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <label style="font-size: 11px; font-weight: 600; color: #666;">平滑度</label>
                            <span style="font-size: 11px; font-weight: 700; color: #10b981;">${this.brushSmoothing}%</span>
                        </div>
                        <input type="range" id="brush-smoothing-slider" min="0" max="100" value="${this.brushSmoothing}" style="
                            width: 100%;
                            height: 6px;
                            -webkit-appearance: none;
                            background: linear-gradient(to right, #10b981 0%, #10b981 ${this.brushSmoothing}%, #e5e5e5 ${this.brushSmoothing}%, #e5e5e5 100%);
                            border-radius: 3px;
                            outline: none;
                            cursor: pointer;
                        "/>
                    </div>

                    <!-- 平滑算法选择 -->
                    <div style="flex: 1; min-width: 150px;">
                        <label style="display: block; font-size: 11px; font-weight: 600; color: #666; margin-bottom: 6px;">平滑算法</label>
                        <select id="smoothing-mode-select" style="width: 100%; padding: 6px 10px; border: 1px solid rgba(0,0,0,0.1); border-radius: 6px; background: #fff; font-size: 11px; cursor: pointer; outline: none;">
                            <option value="pulled-string" ${this.brushSmoothingMode === 'pulled-string' ? 'selected' : ''}>拉绳平滑 (推荐)</option>
                            <option value="moving-average" ${this.brushSmoothingMode === 'moving-average' ? 'selected' : ''}>移动平均</option>
                            <option value="catmull-rom" ${this.brushSmoothingMode === 'catmull-rom' ? 'selected' : ''}>Catmull-Rom 样条</option>
                            <option value="bezier" ${this.brushSmoothingMode === 'bezier' ? 'selected' : ''}>贝塞尔曲线</option>
                        </select>
                    </div>
                </div>

                <!-- 平滑效果说明 -->
                <div style="margin-top: 12px; padding: 8px 10px; background: rgba(16, 185, 129, 0.05); border-radius: 6px; font-size: 10px; color: #666; line-height: 1.5;">
                    ${this.brushSmoothingMode === 'pulled-string' 
                        ? '🎯 <strong>拉绳平滑</strong>：模拟绳子拖拽效果，产生非常流畅的曲线，适合签名和手写'
                        : this.brushSmoothingMode === 'moving-average'
                        ? '📊 <strong>移动平均</strong>：使用加权平均算法，响应较快，适合快速绘制'
                        : this.brushSmoothingMode === 'catmull-rom'
                        ? '🔄 <strong>Catmull-Rom</strong>：数学样条曲线，产生自然的曲线过渡'
                        : '📐 <strong>贝塞尔曲线</strong>：经典平滑算法，适合精细绘制'}
                </div>
            </div>
        `;

        // 绑定事件
        this._bindProModePanelEvents();
    }

    /**
     * 生成缓动曲线的 SVG 路径
     */
    private _getEasingPath(easing: EasingType): string {
        const easingFn = EASING_FUNCTIONS[easing] || EASING_FUNCTIONS['linear'];
        const points: string[] = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const y = easingFn(t);
            const x = 10 + t * 80;
            const svgY = 90 - y * 80;
            points.push(`L ${x.toFixed(1)} ${svgY.toFixed(1)}`);
        }
        
        return points.join(' ');
    }

    /**
     * 渲染当前帧的元素列表
     */
    private _renderFrameElementsList(): string {
        const elementIds = this._frameElementsMap.get(this.currentFrameIndex) || [];
        
        if (elementIds.length === 0) {
            return '<div style="color: #999; font-size: 11px; padding: 8px;">当前帧没有元素</div>';
        }
        
        return elementIds.map((id, index) => {
            const isSelected = this.selectedElementId === id;
            const hasKeyframe = this._keyframes.get(id)?.has(this.currentFrameIndex);
            return `
                <button class="element-item" data-element-id="${id}" style="
                    display: flex; align-items: center; gap: 4px;
                    padding: 4px 8px;
                    border: 1px solid ${isSelected ? '#667eea' : hasKeyframe ? '#f59e0b' : 'rgba(0,0,0,0.1)'};
                    border-radius: 6px;
                    background: ${isSelected ? 'rgba(102, 126, 234, 0.1)' : hasKeyframe ? 'rgba(245, 158, 11, 0.1)' : '#fff'};
                    cursor: pointer;
                    font-size: 10px;
                    font-weight: 500;
                    color: ${isSelected ? '#667eea' : '#666'};
                    transition: all 0.2s;
                ">
                    ${hasKeyframe ? '<span style="color: #f59e0b;">◆</span>' : '<span style="color: #ccc;">○</span>'}
                    <span>元素 ${index + 1}</span>
                </button>
            `;
        }).join('');
    }

    /**
     * 绑定专业模式面板事件
     */
    private _bindProModePanelEvents(): void {
        if (!this._panelContainer) return;

        // 返回按钮
        this._panelContainer.querySelector('#back-btn')?.addEventListener('click', () => {
            this._backToFrameList();
        });

        // 退出专业模式
        this._panelContainer.querySelector('#exit-pro-btn')?.addEventListener('click', () => {
            this.isProMode = false;
            this._updatePanelContent();
        });

        // 关闭面板
        this._panelContainer.querySelector('#close-panel-btn')?.addEventListener('click', () => {
            this._closePanel();
        });

        // 播放控制
        this._panelContainer.querySelector('#first-frame-btn')?.addEventListener('click', () => {
            this.currentFrameIndex = 0;
            this._applyOnionSkin();
            this._updatePanelContent();
        });
        this._panelContainer.querySelector('#prev-btn')?.addEventListener('click', () => this._gotoPrevFrame());
        this._panelContainer.querySelector('#play-btn')?.addEventListener('click', () => this._togglePlay());
        this._panelContainer.querySelector('#next-btn')?.addEventListener('click', () => this._gotoNextFrame());
        this._panelContainer.querySelector('#last-frame-btn')?.addEventListener('click', () => {
            const maxFrame = Math.max(this._frameElementsMap.size - 1, 0);
            this.currentFrameIndex = maxFrame;
            this._applyOnionSkin();
            this._updatePanelContent();
        });

        // 帧率
        this._panelContainer.querySelector('#fps-select')?.addEventListener('change', (e) => {
            this.fps = parseInt((e.target as HTMLSelectElement).value);
            if (this.isPlaying) {
                this._stopAnimation();
                this._startAnimation();
            }
        });

        // 循环/单次
        this._panelContainer.querySelector('#loop-btn')?.addEventListener('click', () => {
            this.loopPlay = !this.loopPlay;
            this._updatePanelContent();
        });

        // 洋葱皮
        this._panelContainer.querySelector('#onion-btn')?.addEventListener('click', () => {
            this.showOnionSkin = !this.showOnionSkin;
            if (!this.isPlaying) this._applyOnionSkin();
            this._updatePanelContent();
        });

        // 新建帧
        this._panelContainer.querySelector('#add-frame-btn')?.addEventListener('click', () => {
            this._addNewFrame();
        });

        // 时间轴帧点击
        this._panelContainer.querySelectorAll('.timeline-frame').forEach((frame) => {
            frame.addEventListener('click', () => {
                const index = parseInt(frame.getAttribute('data-index') || '0');
                this.currentFrameIndex = index;
                this._applyOnionSkin();
                this._updatePanelContent();
            });
        });

        // 补间动画开关
        this._panelContainer.querySelector('#tween-toggle-btn')?.addEventListener('click', () => {
            this.enableTweenAnimation = !this.enableTweenAnimation;
            this._updatePanelContent();
        });

        // 缓动曲线选择
        this._panelContainer.querySelector('#easing-select')?.addEventListener('change', (e) => {
            this.currentEasing = (e.target as HTMLSelectElement).value as EasingType;
            this._updatePanelContent();
        });

        // 元素选择
        this._panelContainer.querySelectorAll('.element-item').forEach((item) => {
            item.addEventListener('click', () => {
                const elementId = item.getAttribute('data-element-id');
                if (elementId) {
                    this.selectedElementId = this.selectedElementId === elementId ? null : elementId;
                    this._updatePanelContent();
                    
                    // 高亮选中的元素
                    if (this.selectedElementId && this.gfx) {
                        const element = this.gfx.getElementById(this.selectedElementId);
                        if (element) {
                            // 记录初始状态（如果还没记录）
                            if (!this._elementInitialStates.has(this.selectedElementId)) {
                                const bound = Bound.deserialize((element as any).xywh);
                                this._elementInitialStates.set(this.selectedElementId, {
                                    x: bound.x,
                                    y: bound.y,
                                    rotation: (element as any).rotate || 0,
                                    scaleX: 1,
                                    scaleY: 1,
                                    opacity: 1,
                                });
                            }
                        }
                    }
                }
            });
        });

        // 笔刷平滑度滑块
        this._panelContainer.querySelector('#brush-smoothing-slider')?.addEventListener('input', (e) => {
            this.brushSmoothing = parseInt((e.target as HTMLInputElement).value);
            // 更新滑块背景
            const slider = e.target as HTMLInputElement;
            slider.style.background = `linear-gradient(to right, #10b981 0%, #10b981 ${this.brushSmoothing}%, #e5e5e5 ${this.brushSmoothing}%, #e5e5e5 100%)`;
            // 更新显示的数值
            const valueSpan = this._panelContainer?.querySelector('#brush-smoothing-slider')?.parentElement?.querySelector('span:last-child');
            if (valueSpan) {
                valueSpan.textContent = `${this.brushSmoothing}%`;
            }
            // 应用到笔刷
            this._applyBrushSmoothing();
        });

        // 平滑算法选择
        this._panelContainer.querySelector('#smoothing-mode-select')?.addEventListener('change', (e) => {
            this.brushSmoothingMode = (e.target as HTMLSelectElement).value as any;
            this._updatePanelContent();
            this._applyBrushSmoothing();
        });
    }

    /**
     * 应用笔刷平滑设置到画布
     */
    private _applyBrushSmoothing(): void {
        // 这里可以将平滑设置应用到 BrushTool
        // 由于 BlockSuite 的笔刷工具封装较深，需要通过事件或全局状态传递
        console.log('[Animation] 笔刷平滑设置:', {
            smoothing: this.brushSmoothing,
            mode: this.brushSmoothingMode
        });
        
        // 保存设置到 localStorage，供 BrushTool 读取
        try {
            localStorage.setItem('yunke-brush-smoothing', JSON.stringify({
                amount: this.brushSmoothing,
                mode: this.brushSmoothingMode,
                enabled: this.brushSmoothing > 0
            }));
        } catch (e) {
            // 忽略存储错误
        }
    }

    /**
     * 获取所有 Frame（按演示顺序）
     */
    private _getAllFrames(): FrameModel[] {
        if (!this.gfx) return [];

        try {
            const frames: FrameModel[] = [];
            
            // 方法1: 从 gfx.grid 搜索所有元素
            if (this.gfx.grid) {
                const allElements = this.gfx.grid.search(
                    new Bound(-100000, -100000, 200000, 200000),
                    { strict: false }
                );
                for (const el of allElements) {
                    const element = el as any;
                    if (element?.flavour === 'yunke:frame' || element?.flavour === 'affine:frame') {
                        frames.push({
                            id: element.id,
                            xywh: element.xywh,
                            flavour: element.flavour,
                            props: element.props || element,
                        });
                    }
                }
            }


            // 按 presentationIndex 排序
            frames.sort((a, b) => {
                const aIndex = a.props?.presentationIndex || '';
                const bIndex = b.props?.presentationIndex || '';
                return aIndex.localeCompare(bIndex);
            });

            return frames;
        } catch (e) {
            console.warn('Failed to get frames:', e);
            return [];
        }
    }

    /**
     * 获取 Frame 内的所有元素（按从左到右排序）
     */
    private _getSubFramesInFrame(frame: FrameModel): SubFrame[] {
        if (!this.gfx || !frame) return [];

        try {
            const frameBound = Bound.deserialize(frame.xywh);
            const subFrames: SubFrame[] = [];

            // 使用 grid 搜索 Frame 范围内的所有元素
            if (this.gfx.grid) {
                const elementsInBound = this.gfx.grid.search(frameBound, { strict: true });
                
                for (const el of elementsInBound) {
                    const element = el as any;
                    if (element.id === frame.id) continue; // 跳过 Frame 本身
                    if (!element.xywh) continue;

                    // 跳过其他 Frame
                    if (element.flavour === 'yunke:frame' || element.flavour === 'affine:frame') {
                        continue;
                    }

                    const elBound = Bound.deserialize(element.xywh);
                    
                    subFrames.push({
                        id: element.id,
                        x: elBound.x,
                        y: elBound.y,
                        w: elBound.w,
                        h: elBound.h,
                        bound: elBound,
                    });
                }
            }

            // 按创建顺序排序（ID 通常是递增的）
            // 这样用户可以在同一位置画多帧，按画的先后顺序播放
            subFrames.sort((a, b) => a.id.localeCompare(b.id));

            return subFrames;
        } catch (e) {
            console.warn('Failed to get sub frames:', e);
            return [];
        }
    }

    /**
     * 选择一个 Frame 进行编辑/播放
     */
    private _selectFrame(frame: FrameModel): void {
        this._stopAnimation();
        
        // 先保存当前 Frame 的帧映射
        this._saveAnimationFrames();
        
        this.selectedFrame = frame;
        
        // 从 Frame 属性加载帧映射
        this._loadAnimationFrames();
        
        // 保存 Frame ID 到面板，以便恢复状态
        if (this._panelContainer) {
            this._panelContainer.dataset.frameId = frame.id;
        }
        
        // 跳转到 Frame 的中心位置（整体视图）
        if (this.gfx) {
            const frameBound = Bound.deserialize(frame.xywh);
            this.gfx.viewport.setViewportByBound(frameBound, [50, 50, 50, 50], true);
        }
        
        this._updatePanelContent();
    }
    
    /**
     * 从 Frame 属性加载动画帧信息
     */
    private _loadAnimationFrames(): void {
        if (!this.selectedFrame || !this.gfx) return;
        
        this._frameElementsMap.clear();
        this.currentFrameIndex = 0;
        
        // 尝试从 Frame 属性读取保存的帧信息
        const frameModel = this.gfx.getElementById(this.selectedFrame.id) as any;
        console.log('[Animation] 加载帧信息 - Frame ID:', this.selectedFrame.id);
        console.log('[Animation] 加载帧信息 - frameModel:', frameModel);
        console.log('[Animation] 加载帧信息 - props:', frameModel?.props);
        
        // 尝试多种方式读取 animationFrames
        let animationFramesJson = frameModel?.props?.animationFrames;
        if (!animationFramesJson) {
            animationFramesJson = frameModel?.animationFrames;
        }
        // 如果是 BlockModel，属性可能直接在模型上
        if (!animationFramesJson && frameModel) {
            // 遍历查找属性
            for (const key of Object.keys(frameModel)) {
                if (key === 'animationFrames' || key === '_animationFrames') {
                    animationFramesJson = frameModel[key];
                    break;
                }
            }
        }
        
        console.log('[Animation] 加载帧信息 - animationFramesJson:', animationFramesJson);
        
        if (animationFramesJson) {
            try {
                const data = JSON.parse(animationFramesJson);
                if (data.frames && Array.isArray(data.frames)) {
                    data.frames.forEach((elementIds: string[], index: number) => {
                        this._frameElementsMap.set(index, elementIds);
                    });
                    this.currentFrameIndex = Math.max(0, this._frameElementsMap.size - 1);
                    console.log('[Animation] ✅ 从 Frame 加载帧信息成功:', this._frameElementsMap.size, '帧');
                    return;
                }
            } catch (e) {
                console.warn('[Animation] ❌ 解析帧信息失败:', e);
            }
        }
        
        console.log('[Animation] ⚠️ 没有找到保存的帧信息，初始化帧 0');
        // 没有保存的帧信息，初始化帧 0
        const existingElements = this._getSubFramesInFrame(this.selectedFrame);
        if (existingElements.length > 0) {
            this._frameElementsMap.set(0, existingElements.map(el => el.id));
        } else {
            this._frameElementsMap.set(0, []);
        }
    }
    
    /**
     * 保存动画帧信息到 Frame 属性
     */
    private _saveAnimationFrames(): void {
        if (!this.selectedFrame || !this.gfx) return;
        
        const frameId = this.selectedFrame.id;
        console.log('[Animation] 开始保存 - Frame ID:', frameId);
        console.log('[Animation] 开始保存 - _frameElementsMap.size:', this._frameElementsMap.size);
        
        // 打印详细的帧映射
        this._frameElementsMap.forEach((ids, index) => {
            console.log(`[Animation] 帧 ${index}: ${ids.length} 个元素`, ids);
        });
        
        // 构建帧数据
        const frames: string[][] = [];
        const mapSize = this._frameElementsMap.size;
        
        // 按顺序遍历所有帧
        for (let i = 0; i < mapSize; i++) {
            const frameElements = this._frameElementsMap.get(i);
            if (frameElements !== undefined) {
                frames.push(frameElements);
            }
        }
        
        // 如果没有帧或只有一个空帧，不保存
        if (frames.length === 0 || (frames.length === 1 && frames[0].length === 0)) {
            console.log('[Animation] 跳过保存：没有有效的帧数据');
            return;
        }
        
        const animationFramesJson = JSON.stringify({ frames });
        console.log('[Animation] 准备保存 - 帧数:', frames.length, '- JSON:', animationFramesJson);
        
        // 获取 Frame 模型并更新属性
        try {
            const frameModel = this.gfx.getElementById(frameId) as any;
            
            if (frameModel && frameModel.store) {
                frameModel.store.updateBlock(frameModel, {
                    animationFrames: animationFramesJson
                });
                console.log('[Animation] ✅ 保存成功 - Frame ID:', frameId, '- 帧数:', frames.length);
            } else {
                console.warn('[Animation] ❌ 无法保存：frameModel 或 store 不存在');
            }
        } catch (e) {
            console.warn('[Animation] ❌ 保存帧信息失败:', e);
        }
    }

    /**
     * 刷新子帧列表并按帧组织元素
     * 
     * 工作流程：
     * 1. 用户选择 Frame 后，currentFrameIndex = 0，所有已有内容归入帧 0
     * 2. 用户画新内容，新内容归入 currentFrameIndex（帧 0）
     * 3. 用户点击"新帧"，currentFrameIndex++ 变成 1，创建新的空帧 1
     * 4. 用户继续画，新内容归入帧 1
     * 5. 以此类推...
     */
    private _refreshSubFrames(): void {
        if (!this.selectedFrame || !this.gfx) return;
        
        // 1. 获取 Frame 内所有元素
        const allElements = this._getSubFramesInFrame(this.selectedFrame);
        
        // 2. 找出尚未分配到帧的新元素
        const assignedElementIds = new Set<string>();
        this._frameElementsMap.forEach(ids => ids.forEach(id => assignedElementIds.add(id)));
        
        const newElements = allElements.filter(el => !assignedElementIds.has(el.id));
        
        if (newElements.length > 0) {
            // 将新画的元素归入当前正在编辑的这一帧
            const currentIds = this._frameElementsMap.get(this.currentFrameIndex) || [];
            this._frameElementsMap.set(this.currentFrameIndex, [...currentIds, ...newElements.map(el => el.id)]);
        }
        
        // 3. 更新 _subFrames 为逻辑帧列表（长度等于已有的帧数）
        const totalFrames = this._frameElementsMap.size;
        this._subFrames = new Array(totalFrames).fill(null).map((_, i) => ({
            id: `logical-frame-${i}`,
            x: 0, y: 0, w: 0, h: 0, bound: null
        }));
    }

    /**
     * 添加新帧（点击按钮才创建新的一帧）
     */
    private _addNewFrame(): void {
        this._refreshSubFrames();
        
        // 创建下一帧的空列表
        const nextFrameIndex = this._frameElementsMap.size;
        this._frameElementsMap.set(nextFrameIndex, []);
        
        this.currentFrameIndex = nextFrameIndex;
        
        // 保存帧信息到 Frame 属性
        this._saveAnimationFrames();
        
        this._updatePanelContent();
    }

    /**
     * 应用洋葱皮效果
     */
    private _applyOnionSkin(): void {
        if (!this.gfx || this.isPlaying) return;

        this._frameElementsMap.forEach((elementIds, frameIndex) => {
            elementIds.forEach(id => {
                const element = this.gfx!.getElementById(id);
                if (!element) return;

                if (!this.showOnionSkin) {
                    (element as any).opacity = 1;
                    return;
                }

                if (frameIndex < this.currentFrameIndex) {
                    (element as any).opacity = 0.2; // 之前的帧：淡化
                } else if (frameIndex === this.currentFrameIndex) {
                    (element as any).opacity = 1;   // 当前帧：全显
                } else {
                    (element as any).opacity = 0;   // 之后的帧：隐藏
                }
            });
        });
    }

    /**
     * 显示/隐藏指定帧的所有元素
     */
    private _setFrameVisibility(frameIndex: number, visible: boolean): void {
        const ids = this._frameElementsMap.get(frameIndex) || [];
        ids.forEach(id => {
            const element = this.gfx?.getElementById(id);
            if (element) {
                (element as any).opacity = visible ? 1 : 0;
            }
        });
    }

    private _hideAllSubFrames(): void {
        this._frameElementsMap.forEach((_, index) => {
            this._setFrameVisibility(index, false);
        });
    }

    private _showAllSubFrames(): void {
        this._frameElementsMap.forEach((_, index) => {
            this._setFrameVisibility(index, true);
        });
    }

    private _showSubFrame(index: number): void {
        this._setFrameVisibility(index, true);
    }

    private _hideSubFrame(index: number): void {
        this._setFrameVisibility(index, false);
    }

    /**
     * 返回 Frame 列表
     */
    private _backToFrameList(): void {
        this._stopAnimation();
        this.selectedFrame = null;
        this._subFrames = [];
        this.currentFrameIndex = 0;
        this._updatePanelContent();
    }

    /**
     * 计算第 N 帧的绘制位置（在 Frame 内从左到右排列）
     */
    private _getDrawPosition(frameIndex: number): { x: number; y: number } {
        if (!this.selectedFrame) return { x: 0, y: 0 };
        
        const frameBound = Bound.deserialize(this.selectedFrame.xywh);
        const padding = 30;
        
        // 从 Frame 左上角开始，每帧向右排列
        const x = frameBound.x + padding + frameIndex * (this.FRAME_WIDTH + this.FRAME_GAP);
        const y = frameBound.y + padding;
        
        return { x, y };
    }

    /**
     * 跳转到指定帧的绘制位置
     */
    private _goToDrawPosition(frameIndex: number): void {
        if (!this.gfx) return;
        
        const pos = this._getDrawPosition(frameIndex);
        const bound = new Bound(pos.x, pos.y, this.FRAME_WIDTH, this.FRAME_HEIGHT);
        
        this.gfx.viewport.setViewportByBound(bound, [50, 50, 50, 50], true);
        this.currentFrameIndex = frameIndex;
    }

    /**
     * 跳转到上一帧
     */
    private _gotoPrevFrame(): void {
        this._refreshSubFrames();
        if (this.currentFrameIndex > 0) {
            this.currentFrameIndex--;
            this._updatePanelContent();
        }
    }

    /**
     * 跳转到下一帧
     */
    private _gotoNextFrame(): void {
        this._refreshSubFrames();
        if (this.currentFrameIndex < this._frameElementsMap.size - 1) {
            this.currentFrameIndex++;
            this._updatePanelContent();
        }
    }

    /**
     * 切换到指定 Frame（移动视口）
     */
    private _goToFrame(index: number): void {
        if (!this.gfx || index < 0 || index >= this._frames.length) return;

        const frame = this._frames[index];
        if (!frame?.xywh) return;

        try {
            const bound = Bound.deserialize(frame.xywh);
            
            // 设置视口到 Frame 位置
            this.gfx.viewport.setViewportByBound(bound, [40, 40, 40, 40], true);
            
            this.currentFrameIndex = index;
        } catch (e) {
            console.warn('Failed to go to frame:', e);
        }
    }

    /**
     * 开始播放动画 - 原地播放，支持两种模式
     * keepFrames = true: 叠加模式，展示绘画过程（1 → 1+2 → 1+2+3...）
     * keepFrames = false: 替换模式，标准动画（1 → 2 → 3...）
     */
    private _startAnimation(): void {
        this._refreshSubFrames();
        
        // 检查是否有足够的帧来播放（需要至少 2 帧）
        const totalPlayableFrames = this._frameElementsMap.size;
        
        if (totalPlayableFrames < 2) {
            console.log('[Animation] 需要至少 2 帧才能播放，当前帧数:', totalPlayableFrames);
            return;
        }

        // 先将视口定位到 Frame 整体（不动）
        if (this.selectedFrame && this.gfx) {
            const frameBound = Bound.deserialize(this.selectedFrame.xywh);
            this.gfx.viewport.setViewportByBound(frameBound, [50, 50, 50, 50], true);
        }

        this.isPlaying = true;
        this.currentFrameIndex = 0;

        // 如果启用了补间动画，使用平滑播放
        if (this.enableTweenAnimation && this.isProMode) {
            this._startTweenAnimation();
            return;
        }
        
        if (this.keepFrames) {
            // 叠加模式：先隐藏所有帧，然后依次累加显示
            this._hideAllSubFrames();
            this._showSubFrame(0);
        } else {
            // 替换模式：先隐藏所有帧，只显示第一帧
            this._hideAllSubFrames();
            this._showSubFrame(0);
        }
        
        const interval = 1000 / this.fps;

        this._playInterval = window.setInterval(() => {
            const frameCount = this._frameElementsMap.size;
            const isLastFrame = this.currentFrameIndex === frameCount - 1;
            
            // 如果是最后一帧且不循环，停止播放
            if (isLastFrame && !this.loopPlay) {
                this._stopAnimation();
                this._updatePanelContent(); // 停止时需要更新按钮图标
                return;
            }
            
            const nextIndex = (this.currentFrameIndex + 1) % frameCount;
            
            if (this.keepFrames) {
                // 叠加模式：如果回到第一帧，重新开始（隐藏所有，显示第一帧）
                if (nextIndex === 0) {
                    this._hideAllSubFrames();
                }
                // 显示下一帧（之前的帧保持显示）
                this._showSubFrame(nextIndex);
            } else {
                // 替换模式：隐藏当前帧，显示下一帧
                this._hideSubFrame(this.currentFrameIndex);
                this._showSubFrame(nextIndex);
            }
            
            this.currentFrameIndex = nextIndex;
            
            // 关键优化：只更新帧数文字，不重建整个面板 DOM
            // 这样播放按钮的事件监听器不会被销毁
            this._updateFrameCounter();
        }, interval);
    }

    // 补间动画相关状态
    private _tweenAnimationId: number | null = null;
    private _tweenStartTime: number = 0;

    /**
     * 开始补间动画播放（使用 requestAnimationFrame 实现平滑补间）
     */
    private _startTweenAnimation(): void {
        const frameCount = this._frameElementsMap.size;
        const frameDuration = 1000 / this.fps; // 每帧持续时间
        const totalDuration = frameDuration * frameCount; // 总动画时间

        // 缓存所有元素的初始状态
        this._cacheAllElementStates();

        // 显示所有元素（补间动画模式下都可见）
        this._showAllSubFrames();

        this._tweenStartTime = performance.now();

        const animate = (currentTime: number) => {
            if (!this.isPlaying) return;

            const elapsed = currentTime - this._tweenStartTime;
            let progress = elapsed / totalDuration;

            // 循环或停止
            if (progress >= 1) {
                if (this.loopPlay) {
                    this._tweenStartTime = currentTime;
                    progress = 0;
                } else {
                    this._stopAnimation();
                    this._updatePanelContent();
                    return;
                }
            }

            // 计算当前帧和帧内进度
            const totalProgress = progress * frameCount;
            const currentFrame = Math.floor(totalProgress);
            const frameProgress = totalProgress - currentFrame;

            this.currentFrameIndex = Math.min(currentFrame, frameCount - 1);

            // 应用补间变换 - 通过透明度实现帧过渡
            this._applyTweenFade(this.currentFrameIndex, frameProgress);

            // 更新帧计数器
            this._updateFrameCounter();

            this._tweenAnimationId = requestAnimationFrame(animate);
        };

        this._tweenAnimationId = requestAnimationFrame(animate);
    }

    // 每帧元素状态缓存：frameIndex -> elementIndex -> state
    private _frameElementStates: Map<number, Map<number, { x: number; y: number; w: number; h: number; rotation: number }>> = new Map();

    /**
     * 缓存所有元素的初始状态（按帧和元素索引）
     */
    private _cacheAllElementStates(): void {
        if (!this.gfx) return;

        this._elementInitialStates.clear();
        this._frameElementStates.clear();

        // 遍历所有帧，记录每个帧中每个元素的状态
        this._frameElementsMap.forEach((elementIds, frameIndex) => {
            const frameStates = new Map<number, { x: number; y: number; w: number; h: number; rotation: number }>();
            
            elementIds.forEach((elementId, elementIndex) => {
                const element = this.gfx!.getElementById(elementId) as any;
                if (element && element.xywh) {
                    const bound = Bound.deserialize(element.xywh);
                    frameStates.set(elementIndex, {
                        x: bound.x,
                        y: bound.y,
                        w: bound.w,
                        h: bound.h,
                        rotation: element.rotate || 0,
                    });
                    
                    // 也缓存到 elementInitialStates（保持兼容）
                    if (!this._elementInitialStates.has(elementId)) {
                        this._elementInitialStates.set(elementId, {
                            x: bound.x,
                            y: bound.y,
                            rotation: element.rotate || 0,
                            scaleX: 1,
                            scaleY: 1,
                            opacity: 1,
                        });
                    }
                }
            });
            
            this._frameElementStates.set(frameIndex, frameStates);
        });
        
        console.log('[Animation] 缓存帧状态:', this._frameElementStates.size, '帧');
    }

    /**
     * 应用补间变换（位置 + 透明度）
     */
    private _applyTweenFade(currentFrame: number, frameProgress: number): void {
        if (!this.gfx) return;

        const easingFn = EASING_FUNCTIONS[this.currentEasing] || EASING_FUNCTIONS['linear'];
        const easedProgress = easingFn(frameProgress);
        const frameCount = this._frameElementsMap.size;
        const nextFrame = (currentFrame + 1) % frameCount;

        // 获取当前帧和下一帧的元素
        const currentElementIds = this._frameElementsMap.get(currentFrame) || [];
        const nextElementIds = this._frameElementsMap.get(nextFrame) || [];
        const currentFrameStates = this._frameElementStates.get(currentFrame);
        const nextFrameStates = this._frameElementStates.get(nextFrame);

        // 隐藏所有帧的元素
        for (let i = 0; i < frameCount; i++) {
            if (i === currentFrame || i === nextFrame) continue;
            const elementIds = this._frameElementsMap.get(i) || [];
            for (const id of elementIds) {
                const element = this.gfx.getElementById(id) as any;
                if (element) {
                    element.opacity = 0;
                }
            }
        }

        // 对当前帧的元素应用补间
        currentElementIds.forEach((elementId, elementIndex) => {
            const element = this.gfx!.getElementById(elementId) as any;
            if (!element) return;

            const currentState = currentFrameStates?.get(elementIndex);
            const nextState = nextFrameStates?.get(elementIndex);

            if (currentState && nextState) {
                // 有对应的下一帧状态，进行位置补间
                const tweenedX = currentState.x + (nextState.x - currentState.x) * easedProgress;
                const tweenedY = currentState.y + (nextState.y - currentState.y) * easedProgress;
                const tweenedW = currentState.w + (nextState.w - currentState.w) * easedProgress;
                const tweenedH = currentState.h + (nextState.h - currentState.h) * easedProgress;

                // 更新元素位置
                const newXywh = new Bound(tweenedX, tweenedY, tweenedW, tweenedH).serialize();
                
                try {
                    // 直接更新 xywh（这是 GfxModel 的属性）
                    if (element.xywh !== newXywh) {
                        element.xywh = newXywh;
                    }
                } catch (e) {
                    // 忽略错误
                }

                // 当前帧元素淡出
                element.opacity = 1 - easedProgress;
            } else {
                // 没有对应的下一帧，只做淡出
                element.opacity = 1 - easedProgress;
            }
        });

        // 对下一帧的元素应用补间
        nextElementIds.forEach((elementId, elementIndex) => {
            const element = this.gfx!.getElementById(elementId) as any;
            if (!element) return;

            const currentState = currentFrameStates?.get(elementIndex);
            const nextState = nextFrameStates?.get(elementIndex);

            if (currentState && nextState) {
                // 有对应的当前帧状态，进行位置补间（从当前位置过渡）
                const tweenedX = currentState.x + (nextState.x - currentState.x) * easedProgress;
                const tweenedY = currentState.y + (nextState.y - currentState.y) * easedProgress;
                const tweenedW = currentState.w + (nextState.w - currentState.w) * easedProgress;
                const tweenedH = currentState.h + (nextState.h - currentState.h) * easedProgress;

                const newXywh = new Bound(tweenedX, tweenedY, tweenedW, tweenedH).serialize();
                
                try {
                    if (element.xywh !== newXywh) {
                        element.xywh = newXywh;
                    }
                } catch (e) {
                    // 忽略错误
                }

                // 下一帧元素淡入
                element.opacity = easedProgress;
            } else {
                // 没有对应的当前帧，只做淡入
                element.opacity = easedProgress;
            }
        });
    }

    /**
     * 只更新帧数显示，不重建整个面板（解决播放时暂停按钮不灵敏的问题）
     */
    private _updateFrameCounter(): void {
        const counter = document.getElementById('frame-counter');
        if (counter) {
            const currentFrame = this.currentFrameIndex + 1;
            const totalFrames = Math.max(this._frameElementsMap.size, currentFrame);
            counter.textContent = `${currentFrame} / ${totalFrames}`;
        }
    }

    /**
     * 停止播放动画
     */
    private _stopAnimation(): void {
        // 停止普通动画
        if (this._playInterval !== null) {
            clearInterval(this._playInterval);
            this._playInterval = null;
        }
        
        // 停止补间动画
        if (this._tweenAnimationId !== null) {
            cancelAnimationFrame(this._tweenAnimationId);
            this._tweenAnimationId = null;
        }
        
        this.isPlaying = false;
        
        // 恢复所有元素的透明度
        this._restoreElementOpacity();
        
        // 停止播放后，显示所有帧（所有元素都可见）
        this._showAllSubFrames();
        
        // 回到第一帧的编辑状态（便于重新播放或编辑）
        this.currentFrameIndex = 0;
    }

    /**
     * 恢复所有元素的原始状态（透明度和位置）
     */
    private _restoreElementOpacity(): void {
        if (!this.gfx) return;
        
        // 恢复每个帧元素的原始位置和透明度
        this._frameElementStates.forEach((frameStates, frameIndex) => {
            const elementIds = this._frameElementsMap.get(frameIndex) || [];
            
            elementIds.forEach((elementId, elementIndex) => {
                const element = this.gfx!.getElementById(elementId) as any;
                if (!element) return;
                
                // 恢复透明度
                element.opacity = 1;
                
                // 恢复位置
                const originalState = frameStates.get(elementIndex);
                if (originalState) {
                    try {
                        const originalXywh = new Bound(
                            originalState.x,
                            originalState.y,
                            originalState.w,
                            originalState.h
                        ).serialize();
                        element.xywh = originalXywh;
                    } catch (e) {
                        // 忽略错误
                    }
                }
            });
        });
    }

    /**
     * 切换播放/暂停
     */
    private _togglePlay(): void {
        if (this.isPlaying) {
            this._stopAnimation();
        } else {
            this._startAnimation();
        }
        this._updatePanelContent();
    }

    /**
     * 打开动画面板
     */
    private _openPanel(): void {
        console.log('[Animation] Opening panel, gfx:', this.gfx);
        this._frames = this._getAllFrames();
        console.log('[Animation] Found frames:', this._frames.length, this._frames);
        this.isPanelOpen = true;
        this.currentFrameIndex = 0;
        this.selectedFrame = null;
        this._subFrames = [];
        this._frameElementsMap.clear(); // 清空之前的映射
        
        // 创建面板容器到 body
        if (!this._panelContainer) {
            this._panelContainer = this._createPanelContainer();
            document.body.appendChild(this._panelContainer);
        }

        // 简化流程：如果只有一个 Frame，直接选中它
        if (this._frames.length === 1) {
            this._selectFrame(this._frames[0]);
            return;
        }
        
        // 简化流程：检查当前是否选中了 Frame，直接进入编辑
        const selectedElement = this._getSelectedFrame();
        if (selectedElement) {
            this._selectFrame(selectedElement);
            return;
        }

        this._updatePanelContent();
    }

    /**
     * 获取当前选中的 Frame（如果有）
     */
    private _getSelectedFrame(): FrameModel | null {
        if (!this.gfx) return null;
        
        try {
            const selection = this.gfx.selection?.selectedElements;
            if (selection && selection.length === 1) {
                const el = selection[0] as any;
                if (el?.flavour === 'yunke:frame' || el?.flavour === 'affine:frame') {
                    return {
                        id: el.id,
                        xywh: el.xywh,
                        flavour: el.flavour,
                        props: el.props || el,
                    };
                }
            }
        } catch (e) {
            console.warn('Failed to get selected frame:', e);
        }
        return null;
    }

    /**
     * 关闭动画面板
     */
    private _closePanel(): void {
        // 重要：先刷新和保存，再停止动画
        // 因为 _stopAnimation 会重置 currentFrameIndex 为 0
        
        // 先刷新，确保最新画的内容被归入当前帧
        this._refreshSubFrames();
        
        // 保存帧信息到 Frame 属性（持久化）
        this._saveAnimationFrames();
        
        // 最后停止动画
        this._stopAnimation();
        
        this.isPanelOpen = false;
        this.selectedFrame = null;
        this._subFrames = [];
        this._removePanelFromBody();
    }

    /**
     * 上一帧（播放模式用）
     */
    private _prevFrame(): void {
        this._refreshSubFrames();
        const frameCount = this._frameElementsMap.size;
        if (frameCount === 0) return;
        const newIndex = this.currentFrameIndex > 0 
            ? this.currentFrameIndex - 1 
            : frameCount - 1;
        this.currentFrameIndex = newIndex;
        this._applyOnionSkin();
        this._updatePanelContent();
    }

    /**
     * 下一帧（播放模式用）
     */
    private _nextFrame(): void {
        this._refreshSubFrames();
        const frameCount = this._frameElementsMap.size;
        if (frameCount === 0) return;
        const newIndex = (this.currentFrameIndex + 1) % frameCount;
        this.currentFrameIndex = newIndex;
        this._applyOnionSkin();
        this._updatePanelContent();
    }

    /**
     * 处理 FPS 变化
     */
    private _handleFpsChange(e: Event): void {
        const select = e.target as HTMLSelectElement;
        this.fps = parseInt(select.value, 10);
        
        // 如果正在播放，重新启动以应用新的 FPS
        if (this.isPlaying) {
            this._stopAnimation();
            this._startAnimation();
        }
    }

    private _handleClick(): void {
        console.log('[Animation] Button clicked, isPanelOpen:', this.isPanelOpen);
        if (this.isPanelOpen) {
            this._closePanel();
        } else {
            this._openPanel();
        }
        console.log('[Animation] After click, isPanelOpen:', this.isPanelOpen);
    }

    // 移除 updated 中的自动更新，避免事件重复触发
    // 面板内容更新由各个方法手动调用 _updatePanelContent()

    override render() {
        const frameCount = this._frames.length;

        return html`
            <button
                class="animation-tool-btn ${this.isPanelOpen ? 'active' : ''}"
                @click=${this._handleClick}
                title="Frame 动画播放器"
            >
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                    <path d="M10 8l6 4-6 4V8z" />
                </svg>
                <span>动画</span>
                ${frameCount > 0 ? html`<div class="badge">${frameCount}</div>` : nothing}
            </button>
        `;
    }

    private _renderPanel() {
        // 如果已选择 Frame，显示子帧播放控制
        if (this.selectedFrame) {
            return this._renderSubFramePlayer();
        }
        
        // 否则显示 Frame 列表
        return this._renderFrameList();
    }

    /**
     * 渲染 Frame 列表（选择哪个动画）
     */
    private _renderFrameList() {
        const frameCount = this._frames.length;

        if (frameCount === 0) {
            return html`
                <div class="animation-panel">
                    <div class="no-frames-tip">
                        请先在画板上添加 Frame（框架），<br/>
                        每个 Frame 是一个独立的动画
                    </div>
                    <button class="panel-btn close-btn" @click=${this._closePanel}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
            `;
        }

        return html`
            <div class="animation-panel" style="flex-direction: column; gap: 8px; align-items: stretch;">
                <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid var(--affine-border-color, #e3e2e4);">
                    <span style="font-size: 14px; font-weight: 500;">选择动画 (${frameCount} 个 Frame)</span>
                    <button class="panel-btn close-btn" @click=${this._closePanel}>
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                    </button>
                </div>
                <div style="display: flex; gap: 8px; flex-wrap: wrap; max-height: 200px; overflow-y: auto;">
                    ${this._frames.map((frame, index) => {
                        const title = frame.props?.title?.toString() || `Frame ${index + 1}`;
                        return html`
                            <button 
                                class="frame-select-btn"
                                style="
                                    padding: 8px 16px;
                                    border: 1px solid var(--affine-border-color, #e3e2e4);
                                    border-radius: 8px;
                                    background: var(--affine-background-secondary-color, #f5f5f5);
                                    cursor: pointer;
                                    font-size: 13px;
                                    transition: all 0.15s ease;
                                "
                                @click=${() => this._selectFrame(frame)}
                                @mouseover=${(e: Event) => {
                                    (e.target as HTMLElement).style.background = 'var(--affine-primary-color, #1e96eb)';
                                    (e.target as HTMLElement).style.color = 'white';
                                }}
                                @mouseout=${(e: Event) => {
                                    (e.target as HTMLElement).style.background = 'var(--affine-background-secondary-color, #f5f5f5)';
                                    (e.target as HTMLElement).style.color = 'inherit';
                                }}
                            >
                                🎬 ${title}
                            </button>
                        `;
                    })}
                </div>
            </div>
        `;
    }

    /**
     * 渲染动画编辑/播放面板
     */
    private _renderSubFramePlayer() {
        this._refreshSubFrames();
        const subFrameCount = this._frameElementsMap.size;
        const frameTitle = this.selectedFrame?.props?.title?.toString() || 'Frame';
        const totalFrames = Math.max(subFrameCount, this.currentFrameIndex + 1);

        return html`
            <div class="animation-panel">
                <!-- 返回按钮 -->
                <button class="panel-btn" @click=${this._backToFrameList} title="返回 Frame 列表">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                    </svg>
                </button>

                <div class="divider"></div>

                <!-- 当前 Frame 名称 -->
                <span style="font-size: 12px; color: var(--affine-primary-color, #1e96eb); font-weight: 500;">
                    🎬 ${frameTitle}
                </span>

                <div class="divider"></div>

                <!-- 绘制控制 -->
                <button class="panel-btn" @click=${this._gotoPrevFrame} title="上一帧" ?disabled=${this.currentFrameIndex <= 0}>
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                </button>

                <!-- 帧信息 -->
                <span class="frame-info" style="min-width: 80px;">
                    第 ${this.currentFrameIndex + 1} 帧
                    ${subFrameCount > 0 ? html`<br/><small style="color: #999;">(已画 ${subFrameCount} 帧)</small>` : ''}
                </span>

                <button class="panel-btn" @click=${this._gotoNextFrame} title="下一帧">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                </button>

                <div class="divider"></div>

                <!-- 添加新帧按钮 -->
                <button 
                    class="panel-btn" 
                    style="background: #10b981; color: white; padding: 6px 12px; border-radius: 6px; width: auto;"
                    @click=${this._addNewFrame} 
                    title="添加新帧"
                >
                    ➕ 新帧
                </button>

                <div class="divider"></div>

                <!-- 播放控制 -->
                <button 
                    class="panel-btn primary" 
                    @click=${this._togglePlay} 
                    title="${this.isPlaying ? '停止' : '播放'}"
                    ?disabled=${subFrameCount < 2}
                >
                    ${this.isPlaying 
                        ? html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z" /></svg>`
                        : html`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>`
                    }
                </button>

                <div class="divider"></div>

                <!-- FPS 设置 -->
                <div class="fps-control">
                    <label>FPS:</label>
                    <select .value=${String(this.fps)} @change=${this._handleFpsChange}>
                        ${[2, 4, 6, 8, 10, 12, 15, 24, 30].map(
                            fps => html`<option value=${fps}>${fps}</option>`
                        )}
                    </select>
                </div>

                <div class="divider"></div>

                <!-- 关闭按钮 -->
                <button class="panel-btn close-btn" @click=${this._closePanel} title="关闭">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'edgeless-animation-tool-button': EdgelessAnimationToolButton;
    }
}
