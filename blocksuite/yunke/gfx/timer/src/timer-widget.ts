import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';
import { Signal } from '@preact/signals-core';

export type TimerMode = 'countdown' | 'countup';

export interface TimerState {
    mode: TimerMode;
    running: boolean;
    totalSeconds: number;
    remainingSeconds: number;
}

// 计时器图标
const PlayIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M8 5v14l11-7z"/>
</svg>
`;

const PauseIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
</svg>
`;

const ResetIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
</svg>
`;

const CloseIcon = html`
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
</svg>
`;

export class TimerWidget extends SignalWatcher(LitElement) {
    static override styles = css`
        :host {
            display: block;
        }

        .timer-container {
            position: fixed;
            z-index: 100;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 16px;
            min-width: 200px;
            cursor: move;
            user-select: none;
            font-family: var(--yunke-font-family, sans-serif);
        }

        .timer-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .timer-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--yunke-text-primary-color, #333);
        }

        .close-button {
            background: none;
            border: none;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            color: var(--yunke-icon-color, #666);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .close-button:hover {
            background: var(--yunke-hover-color, #f0f0f0);
        }

        .timer-display {
            font-size: 48px;
            font-weight: 700;
            text-align: center;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
            color: var(--yunke-text-primary-color, #333);
            padding: 16px 0;
            letter-spacing: 2px;
        }

        .timer-display.warning {
            color: #ff9800;
        }

        .timer-display.danger {
            color: #f44336;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .timer-controls {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 12px;
        }

        .control-button {
            background: var(--yunke-primary-color, #1e96eb);
            border: none;
            border-radius: 8px;
            padding: 8px 16px;
            cursor: pointer;
            color: white;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background 0.2s;
        }

        .control-button:hover {
            background: var(--yunke-primary-hover-color, #1a85d4);
        }

        .control-button.secondary {
            background: var(--yunke-secondary-color, #6c757d);
        }

        .control-button.secondary:hover {
            background: #5a6268;
        }

        .timer-presets {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            justify-content: center;
        }

        .preset-button {
            background: var(--yunke-background-secondary-color, #f5f5f5);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 6px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .preset-button:hover {
            background: var(--yunke-hover-color, #e8e8e8);
            border-color: var(--yunke-primary-color, #1e96eb);
        }

        .mode-toggle {
            display: flex;
            justify-content: center;
            margin-bottom: 12px;
            gap: 4px;
        }

        .mode-button {
            background: var(--yunke-background-secondary-color, #f5f5f5);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            padding: 6px 16px;
            cursor: pointer;
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
            transition: all 0.2s;
        }

        .mode-button:first-child {
            border-radius: 6px 0 0 6px;
        }

        .mode-button:last-child {
            border-radius: 0 6px 6px 0;
        }

        .mode-button.active {
            background: var(--yunke-primary-color, #1e96eb);
            border-color: var(--yunke-primary-color, #1e96eb);
            color: white;
        }
    `;

    @property({ attribute: false })
    accessor onClose: (() => void) | undefined;

    @state()
    private accessor _mode: TimerMode = 'countdown';

    @state()
    private accessor _running = false;

    @state()
    private accessor _totalSeconds = 300; // 默认5分钟

    @state()
    private accessor _elapsedSeconds = 0;

    @state()
    private accessor _posX = 100;

    @state()
    private accessor _posY = 100;

    private _intervalId: number | null = null;
    private _isDragging = false;
    private _dragStartX = 0;
    private _dragStartY = 0;

    private get _displaySeconds() {
        if (this._mode === 'countdown') {
            return Math.max(0, this._totalSeconds - this._elapsedSeconds);
        }
        return this._elapsedSeconds;
    }

    private get _displayClass() {
        if (this._mode === 'countdown') {
            const remaining = this._totalSeconds - this._elapsedSeconds;
            if (remaining <= 10) return 'danger';
            if (remaining <= 30) return 'warning';
        }
        return '';
    }

    private _formatTime(seconds: number): string {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    private _start() {
        if (this._running) return;
        this._running = true;
        this._intervalId = window.setInterval(() => {
            this._elapsedSeconds++;

            // 倒计时结束
            if (this._mode === 'countdown' && this._elapsedSeconds >= this._totalSeconds) {
                this._stop();
                this._playSound();
            }
        }, 1000);
    }

    private _stop() {
        if (!this._running) return;
        this._running = false;
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    private _reset() {
        this._stop();
        this._elapsedSeconds = 0;
    }

    private _setPreset(seconds: number) {
        this._stop();
        this._totalSeconds = seconds;
        this._elapsedSeconds = 0;
    }

    private _setMode(mode: TimerMode) {
        this._stop();
        this._mode = mode;
        this._elapsedSeconds = 0;
    }

    private _playSound() {
        // 播放提示音
        try {
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.warn('无法播放提示音:', e);
        }
    }

    private _handleMouseDown(e: MouseEvent) {
        this._isDragging = true;
        this._dragStartX = e.clientX - this._posX;
        this._dragStartY = e.clientY - this._posY;
    }

    private _handleMouseMove = (e: MouseEvent) => {
        if (!this._isDragging) return;
        this._posX = e.clientX - this._dragStartX;
        this._posY = e.clientY - this._dragStartY;
    };

    private _handleMouseUp = () => {
        this._isDragging = false;
    };

    override connectedCallback() {
        super.connectedCallback();
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
    }

    override disconnectedCallback() {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
        }
    }

    override render() {
        return html`
            <div
                class="timer-container"
                style="left: ${this._posX}px; top: ${this._posY}px;"
                @mousedown=${this._handleMouseDown}
            >
                <div class="timer-header">
                    <span class="timer-title">计时器</span>
                    <button class="close-button" @click=${() => this.onClose?.()}>
                        ${CloseIcon}
                    </button>
                </div>

                <div class="mode-toggle">
                    <button
                        class="mode-button ${this._mode === 'countdown' ? 'active' : ''}"
                        @click=${() => this._setMode('countdown')}
                    >
                        倒计时
                    </button>
                    <button
                        class="mode-button ${this._mode === 'countup' ? 'active' : ''}"
                        @click=${() => this._setMode('countup')}
                    >
                        正计时
                    </button>
                </div>

                <div class="timer-display ${this._displayClass}">
                    ${this._formatTime(this._displaySeconds)}
                </div>

                <div class="timer-controls">
                    <button class="control-button" @click=${this._running ? this._stop : this._start}>
                        ${this._running ? PauseIcon : PlayIcon}
                        ${this._running ? '暂停' : '开始'}
                    </button>
                    <button class="control-button secondary" @click=${this._reset}>
                        ${ResetIcon}
                        重置
                    </button>
                </div>

                ${this._mode === 'countdown' ? html`
                    <div class="timer-presets">
                        <button class="preset-button" @click=${() => this._setPreset(60)}>1分钟</button>
                        <button class="preset-button" @click=${() => this._setPreset(180)}>3分钟</button>
                        <button class="preset-button" @click=${() => this._setPreset(300)}>5分钟</button>
                        <button class="preset-button" @click=${() => this._setPreset(600)}>10分钟</button>
                        <button class="preset-button" @click=${() => this._setPreset(900)}>15分钟</button>
                        <button class="preset-button" @click=${() => this._setPreset(1800)}>30分钟</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
}
