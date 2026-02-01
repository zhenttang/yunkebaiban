/**
 * Animation View - 动画视图管理
 * 
 * 负责将动画管理器与 UI 组件连接
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { DisposableGroup } from '@blocksuite/global/disposable';

import type { AnimationManager } from './animation-manager.js';
import type { AnimationTimelinePanel } from './components/timeline-panel.js';
import { effects } from './effects.js';
import { animationSeniorTool } from './toolbar/animation-senior-tool.js';
import type { PlayMode } from './types.js';

/**
 * Animation View Extension - 动画视图扩展
 * 用于在 BlockSuite 中注册动画功能
 */
export class AnimationViewExtension extends ViewExtensionProvider {
    override name = 'yunke-animation-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        // 注册动画工具到工具栏
        context.register(animationSeniorTool);
    }
}

/**
 * Animation View - 动画视图管理器
 * 连接 AnimationManager 和 UI 组件
 */
export class AnimationView {
    private _disposables = new DisposableGroup();
    private _timelinePanel: AnimationTimelinePanel | null = null;
    private _container: HTMLElement | null = null;

    constructor(private manager: AnimationManager) {
        this._setupListeners();
    }

    private _setupListeners(): void {
        // 监听启用状态变化
        this._disposables.add(
            this.manager.slots.enabledChanged.subscribe(({ enabled }) => {
                if (enabled) {
                    this._showTimeline();
                } else {
                    this._hideTimeline();
                }
            })
        );

        // 监听帧变化
        this._disposables.add(
            this.manager.slots.frameChanged.subscribe(() => {
                this._updateTimeline();
            })
        );

        // 监听播放状态变化
        this._disposables.add(
            this.manager.slots.playStateChanged.subscribe(() => {
                this._updateTimeline();
            })
        );

        // 监听帧列表更新
        this._disposables.add(
            this.manager.slots.framesUpdated.subscribe(() => {
                this._updateTimeline();
            })
        );
    }

    /**
     * 设置容器
     */
    setContainer(container: HTMLElement): void {
        this._container = container;
    }

    /**
     * 显示时间线
     */
    private _showTimeline(): void {
        if (this._timelinePanel) return;

        this._timelinePanel = document.createElement(
            'animation-timeline-panel'
        ) as AnimationTimelinePanel;

        this._updateTimeline();
        this._setupTimelineEvents();

        // 添加到 body
        document.body.appendChild(this._timelinePanel);
    }

    /**
     * 隐藏时间线
     */
    private _hideTimeline(): void {
        if (!this._timelinePanel) return;

        this._timelinePanel.remove();
        this._timelinePanel = null;
    }

    /**
     * 更新时间线
     */
    private _updateTimeline(): void {
        if (!this._timelinePanel) return;

        const project = this.manager.project;
        if (!project) return;

        this._timelinePanel.frames = project.frames;
        this._timelinePanel.currentFrameIndex = this.manager.currentFrameIndex;
        this._timelinePanel.isPlaying = this.manager.isPlaying;
        this._timelinePanel.settings = project.settings;
    }

    /**
     * 设置时间线事件
     */
    private _setupTimelineEvents(): void {
        if (!this._timelinePanel) return;

        const panel = this._timelinePanel;

        // 播放控制
        panel.addEventListener('toggle-play', () => {
            this.manager.togglePlay();
        });

        panel.addEventListener('first-frame', () => {
            this.manager.firstFrame();
        });

        panel.addEventListener('last-frame', () => {
            this.manager.lastFrame();
        });

        panel.addEventListener('prev-frame', () => {
            this.manager.prevFrame();
        });

        panel.addEventListener('next-frame', () => {
            this.manager.nextFrame();
        });

        // 帧操作
        panel.addEventListener('go-to-frame', ((e: CustomEvent) => {
            this.manager.goToFrame(e.detail.index);
        }) as EventListener);

        panel.addEventListener('add-frame', () => {
            this.manager.addEmptyFrame();
        });

        panel.addEventListener('capture-frame', () => {
            this.manager.captureCurrentAsFrame();
            this._updateTimeline();
        });

        panel.addEventListener('duplicate-frame', ((e: CustomEvent) => {
            this.manager.duplicateFrame(e.detail.index);
        }) as EventListener);

        panel.addEventListener('delete-frame', ((e: CustomEvent) => {
            this.manager.deleteFrame(e.detail.index);
        }) as EventListener);

        // 设置
        panel.addEventListener('set-fps', ((e: CustomEvent) => {
            this.manager.setFps(e.detail.fps);
            this._updateTimeline();
        }) as EventListener);

        panel.addEventListener('set-play-mode', ((e: CustomEvent) => {
            this.manager.setPlayMode(e.detail.mode as PlayMode);
            this._updateTimeline();
        }) as EventListener);

        panel.addEventListener('toggle-onion-skin', ((e: CustomEvent) => {
            this.manager.updateOnionSkinSettings({ enabled: e.detail.enabled });
            this._updateTimeline();
        }) as EventListener);

        // 关闭
        panel.addEventListener('close', () => {
            this.manager.disable();
        });
    }

    /**
     * 销毁
     */
    dispose(): void {
        this._hideTimeline();
        this._disposables.dispose();
    }
}
