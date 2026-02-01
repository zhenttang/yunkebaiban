/**
 * Edgeless Animation Tool Button - 基于 Frame 的动画播放器
 * 
 * 工作方式：
 * 1. 读取画板上的所有 Frame（按演示顺序排列）
 * 2. 每个 Frame 就是动画的一帧
 * 3. 播放时依次将视口切换到每个 Frame
 */

import type { GfxController } from '@blocksuite/std/gfx';
import { Bound } from '@blocksuite/global/gfx';
import { LitElement, css, html, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

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
    accessor selectedFrame: FrameModel | null = null;

    // Frame 列表和当前 Frame 内的子帧列表
    private _frames: FrameModel[] = [];
    private _subFrames: SubFrame[] = [];
    private _playInterval: number | null = null;
    private _panelContainer: HTMLDivElement | null = null;
    
    // 关键：存储每一帧包含的元素 ID 列表
    private _frameElementsMap: Map<number, string[]> = new Map();
    
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

        this._panelContainer.style.flexDirection = 'row';
        this._panelContainer.style.alignItems = 'center';
        this._panelContainer.style.flexWrap = 'nowrap';
        this._panelContainer.style.whiteSpace = 'nowrap';
        
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
        if (this._playInterval !== null) {
            clearInterval(this._playInterval);
            this._playInterval = null;
        }
        this.isPlaying = false;
        
        // 停止播放后，显示所有帧（所有元素都可见）
        this._showAllSubFrames();
        
        // 回到第一帧的编辑状态（便于重新播放或编辑）
        this.currentFrameIndex = 0;
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
