/**
 * 汉字笔顺练习组件
 * 
 * 基于 Hanzi Writer 开源库
 * - 支持 9000+ 汉字
 * - 正确的笔顺数据
 * - 书写动画演示
 * - 交互式练习模式
 * - 行书连笔录制与播放
 */

import { SignalWatcher } from '@blocksuite/global/lit';
import { css, html, LitElement, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';

// Hanzi Writer 类型声明
declare const HanziWriter: any;

// 图标
const CloseIcon = html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`;

// 预设汉字列表
const PRESET_CHARS = ['永', '人', '大', '天', '国', '学', '书', '法', '龙', '爱'];

// 连笔数据类型
interface StrokePoint {
    x: number;  // 0-1 normalized
    y: number;
    t: number;  // timestamp in ms
    p: number;  // pressure 0-1
}

interface CursiveRecording {
    char: string;
    strokes: StrokePoint[][];
}

// 连笔数据存储 key
const CURSIVE_STORAGE_KEY = 'yunke_cursive_recordings';

export class CalligraphyWidget extends SignalWatcher(LitElement) {
    static override styles = css`
        :host { display: block; }

        .container {
            position: fixed;
            z-index: 100;
            background: var(--yunke-background-overlay-panel-color, #fff);
            border: 1px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            padding: 20px;
            min-width: 380px;
            user-select: none;
            font-family: var(--yunke-font-family, sans-serif);
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            cursor: move;
        }

        .title {
            font-size: 16px;
            font-weight: 600;
            color: var(--yunke-text-primary-color, #333);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .close-btn {
            background: none;
            border: none;
            cursor: pointer;
            padding: 6px;
            border-radius: 6px;
            color: var(--yunke-icon-color, #666);
            display: flex;
        }

        .close-btn:hover {
            background: var(--yunke-hover-color, #f0f0f0);
        }

        .input-row {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
        }

        .char-input {
            flex: 1;
            padding: 10px 14px;
            border: 2px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 10px;
            font-size: 18px;
            text-align: center;
            font-family: 'KaiTi', 'STKaiti', serif;
        }

        .char-input:focus {
            outline: none;
            border-color: var(--yunke-primary-color, #1e96eb);
        }

        .load-btn {
            padding: 10px 18px;
            background: var(--yunke-primary-color, #1e96eb);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
        }

        .load-btn:hover {
            background: var(--yunke-primary-hover-color, #1a85d4);
        }

        .quick-chars {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 16px;
            justify-content: center;
        }

        .quick-btn {
            width: 38px;
            height: 38px;
            border: 2px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 8px;
            background: var(--yunke-background-secondary-color, #f8f8f8);
            font-size: 18px;
            font-family: 'KaiTi', 'STKaiti', serif;
            cursor: pointer;
            transition: all 0.2s;
        }

        .quick-btn:hover {
            border-color: var(--yunke-primary-color, #1e96eb);
        }

        .quick-btn.active {
            border-color: var(--yunke-primary-color, #1e96eb);
            background: var(--yunke-primary-color, #1e96eb);
            color: white;
        }

        .mode-tabs {
            display: flex;
            background: var(--yunke-background-secondary-color, #f0f0f0);
            border-radius: 10px;
            padding: 4px;
            margin-bottom: 16px;
        }

        .mode-tab {
            flex: 1;
            padding: 8px;
            border: none;
            background: transparent;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            color: var(--yunke-text-secondary-color, #666);
        }

        .mode-tab.active {
            background: white;
            color: var(--yunke-text-primary-color, #333);
            box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }

        .writer-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 16px;
        }

        #writer-target {
            border: 2px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            background: #fffef8;
        }

        .char-info {
            text-align: center;
            margin-bottom: 12px;
            font-size: 14px;
            color: var(--yunke-text-secondary-color, #666);
        }

        .controls {
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 12px;
        }

        .ctrl-btn {
            padding: 8px 16px;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .ctrl-btn.primary {
            background: var(--yunke-primary-color, #1e96eb);
            color: white;
        }

        .ctrl-btn.primary:hover {
            background: var(--yunke-primary-hover-color, #1a85d4);
        }

        .ctrl-btn.secondary {
            background: var(--yunke-background-secondary-color, #f0f0f0);
            color: var(--yunke-text-secondary-color, #555);
        }

        .ctrl-btn.secondary:hover {
            background: #e5e5e5;
        }

        .ctrl-btn.success {
            background: #10b981;
            color: white;
        }

        .ctrl-btn.danger {
            background: #e74c3c;
            color: white;
        }

        .ctrl-btn.warning {
            background: #f39c12;
            color: white;
        }

        .options {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 12px;
            border-top: 1px solid var(--yunke-border-color, #eee);
        }

        .opt-group {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .opt-label {
            font-size: 12px;
            color: var(--yunke-text-secondary-color, #666);
        }

        select {
            padding: 5px 10px;
            border: 1px solid var(--yunke-border-color, #ddd);
            border-radius: 6px;
            background: var(--yunke-background-secondary-color, #f8f8f8);
            font-size: 12px;
        }

        .toggle-btn {
            padding: 5px 10px;
            border: 1px solid var(--yunke-border-color, #ddd);
            border-radius: 6px;
            background: var(--yunke-background-secondary-color, #f8f8f8);
            font-size: 12px;
            cursor: pointer;
        }

        .toggle-btn.active {
            background: var(--yunke-primary-color, #1e96eb);
            border-color: var(--yunke-primary-color, #1e96eb);
            color: white;
        }

        .tip {
            text-align: center;
            color: var(--yunke-text-tertiary-color, #999);
            font-size: 12px;
            margin-top: 10px;
        }

        .tip.error { color: #e74c3c; }
        .tip.success { color: #10b981; }
        .tip.info { color: var(--yunke-primary-color, #1e96eb); }

        .loading {
            text-align: center;
            padding: 60px 20px;
            color: var(--yunke-text-secondary-color, #888);
        }

        /* 连笔相关样式 */
        .cursive-canvas-wrapper {
            position: relative;
            width: 280px;
            height: 280px;
            margin: 0 auto 16px;
            border: 2px solid var(--yunke-border-color, #e0e0e0);
            border-radius: 12px;
            background: #fffef8;
            overflow: hidden;
        }

        .cursive-canvas-wrapper canvas {
            position: absolute;
            top: 0;
            left: 0;
            touch-action: none;
        }

        .cursive-ref-char {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 200px;
            font-family: 'XingShu', '行书', 'STXingkai', 'KaiTi', serif;
            color: rgba(0,0,0,0.08);
            pointer-events: none;
            z-index: 1;
            line-height: 1;
        }

        .record-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 8px;
            background: #fff5f5;
            border-radius: 8px;
            margin-bottom: 12px;
            color: #e74c3c;
            font-size: 13px;
        }

        .record-dot {
            width: 10px;
            height: 10px;
            background: #e74c3c;
            border-radius: 50%;
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }

        .progress-bar {
            width: 100%;
            height: 4px;
            background: var(--yunke-background-secondary-color, #eee);
            border-radius: 2px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #8b5a2b, #c9a66b);
            width: 0%;
            transition: width 0.05s linear;
        }

        .saved-chars {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--yunke-border-color, #eee);
        }

        .saved-char-btn {
            padding: 4px 10px;
            border: 1px solid var(--yunke-border-color, #ddd);
            border-radius: 6px;
            background: var(--yunke-background-secondary-color, #f8f8f8);
            font-size: 14px;
            font-family: 'XingShu', 'KaiTi', serif;
            cursor: pointer;
            position: relative;
        }

        .saved-char-btn:hover {
            border-color: #8b5a2b;
        }

        .saved-char-btn.has-data::after {
            content: '';
            position: absolute;
            top: -2px;
            right: -2px;
            width: 6px;
            height: 6px;
            background: #8b5a2b;
            border-radius: 50%;
        }
    `;

    @property({ attribute: false })
    accessor onClose: (() => void) | undefined;

    @state() private accessor _currentChar = '永';
    @state() private accessor _mode: 'animate' | 'quiz' | 'cursive' = 'animate';
    @state() private accessor _speed = 1;
    @state() private accessor _showOutline = true;
    @state() private accessor _tip = '点击"播放动画"观看笔顺演示';
    @state() private accessor _tipType: 'normal' | 'error' | 'success' | 'info' = 'normal';
    @state() private accessor _posX = 100;
    @state() private accessor _posY = 80;
    @state() private accessor _isLoaded = false;
    
    // 连笔相关状态
    @state() private accessor _isRecording = false;
    @state() private accessor _isPlayingCursive = false;
    @state() private accessor _cursiveProgress = 0;
    @state() private accessor _savedCursiveChars: string[] = [];

    private _writer: any = null;
    private _isDragging = false;
    private _dragStartX = 0;
    private _dragStartY = 0;
    
    // 连笔录制数据
    private _cursiveRecordings: Record<string, CursiveRecording> = {};
    private _currentCursiveRecording: CursiveRecording = { char: '', strokes: [] };
    private _currentStroke: StrokePoint[] = [];
    private _isDrawing = false;
    private _strokeStartTime = 0;
    private _cursiveAnimationId: number | null = null;

    private async _loadHanziWriter(): Promise<void> {
        if (typeof HanziWriter !== 'undefined') {
            this._isLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
            script.onload = () => {
                this._isLoaded = true;
                resolve();
            };
            script.onerror = () => reject(new Error('Failed to load HanziWriter'));
            document.head.appendChild(script);
        });
    }

    private _initWriter(): void {
        if (!this._isLoaded) return;

        const target = this.shadowRoot?.getElementById('writer-target');
        if (!target) return;

        // 清除旧的
        target.innerHTML = `
            <rect x="0" y="0" width="280" height="280" fill="#fffef8" stroke="#e0e0e0" stroke-width="2" rx="10"/>
            <line x1="0" y1="140" x2="280" y2="140" stroke="#e8e8e8" stroke-dasharray="6,4"/>
            <line x1="140" y1="0" x2="140" y2="280" stroke="#e8e8e8" stroke-dasharray="6,4"/>
            <line x1="0" y1="0" x2="280" y2="280" stroke="#f0e8e8" stroke-dasharray="6,4"/>
            <line x1="280" y1="0" x2="0" y2="280" stroke="#f0e8e8" stroke-dasharray="6,4"/>
        `;

        try {
            this._writer = HanziWriter.create(target, this._currentChar, {
                width: 280,
                height: 280,
                padding: 20,
                showOutline: this._showOutline,
                strokeAnimationSpeed: this._speed,
                delayBetweenStrokes: 250,
                strokeColor: '#333',
                outlineColor: '#ddd',
                drawingColor: '#c41e3a',
                drawingWidth: 6,
                showHintAfterMisses: 2,
                highlightOnComplete: true,
                onLoadCharDataError: () => {
                    this._tip = '该汉字暂不支持';
                    this._tipType = 'error';
                }
            });
        } catch (e) {
            console.error('Init writer failed:', e);
        }
    }

    private _loadChar(char: string): void {
        if (!char || char.length !== 1) return;
        this._currentChar = char;
        this._tip = '加载中...';
        this._tipType = 'normal';
        
        setTimeout(() => {
            if (this._mode !== 'cursive') {
                this._initWriter();
            }
            this._tip = this._mode === 'animate' 
                ? '点击"播放动画"观看笔顺演示' 
                : this._mode === 'quiz'
                ? '点击"开始练习"在格子内书写'
                : '点击"开始录制"书写连笔，或点击"播放"查看已录制的连笔';
        }, 100);
    }

    private _playAnimation(): void {
        if (!this._writer) return;
        this._writer.hideCharacter();
        this._writer.animateCharacter({
            onComplete: () => {
                this._tip = '动画完成！点击重播再次观看';
                this._tipType = 'normal';
            }
        });
    }

    private _loopAnimation(): void {
        if (!this._writer) return;
        this._writer.loopCharacterAnimation();
        this._tip = '循环播放中...';
        this._tipType = 'info';
    }

    private _reset(): void {
        if (this._writer) {
            this._writer.pauseAnimation();
            this._writer.cancelQuiz();
            this._writer.showCharacter();
        }
        this._tip = this._mode === 'animate' 
            ? '点击"播放动画"观看笔顺演示' 
            : this._mode === 'quiz'
            ? '点击"开始练习"在格子内书写'
            : '点击"开始录制"书写连笔，或点击"播放"查看已录制的连笔';
        this._tipType = 'normal';
    }

    private _startQuiz(): void {
        if (!this._writer) return;
        this._writer.hideCharacter();
        this._writer.quiz({
            onMistake: (data: any) => {
                this._tip = `第 ${data.strokeNum + 1} 笔错误，已错 ${data.mistakesOnStroke} 次`;
                this._tipType = 'error';
            },
            onCorrectStroke: (data: any) => {
                this._tip = `第 ${data.strokeNum + 1} 笔正确！还剩 ${data.strokesRemaining} 笔`;
                this._tipType = 'success';
            },
            onComplete: (data: any) => {
                this._tip = `恭喜完成！共错 ${data.totalMistakes} 次`;
                this._tipType = 'success';
            }
        });
        this._tip = '请按笔顺在格子内书写...';
        this._tipType = 'info';
    }

    private _handleMouseDown(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (!target.closest('.header')) return;
        this._isDragging = true;
        this._dragStartX = e.clientX - this._posX;
        this._dragStartY = e.clientY - this._posY;
    }

    private _handleMouseMove = (e: MouseEvent): void => {
        if (!this._isDragging) return;
        this._posX = e.clientX - this._dragStartX;
        this._posY = e.clientY - this._dragStartY;
    };

    private _handleMouseUp = (): void => {
        this._isDragging = false;
    };

    // ===== 连笔相关方法 =====
    
    private _loadCursiveRecordings(): void {
        try {
            const data = localStorage.getItem(CURSIVE_STORAGE_KEY);
            if (data) {
                this._cursiveRecordings = JSON.parse(data);
                this._savedCursiveChars = Object.keys(this._cursiveRecordings);
            }
        } catch (e) {
            console.error('加载连笔数据失败:', e);
        }
    }

    private _saveCursiveRecordings(): void {
        try {
            localStorage.setItem(CURSIVE_STORAGE_KEY, JSON.stringify(this._cursiveRecordings));
            this._savedCursiveChars = Object.keys(this._cursiveRecordings);
        } catch (e) {
            console.error('保存连笔数据失败:', e);
        }
    }

    private _startCursiveRecording(): void {
        this._isRecording = true;
        this._currentCursiveRecording = { char: this._currentChar, strokes: [] };
        this._currentStroke = [];
        this._clearCursiveCanvas();
        this._drawCursiveGrid();
        this._tip = '在格子内书写连笔字，完成后点击"停止录制"';
        this._tipType = 'info';
    }

    private _stopCursiveRecording(): void {
        if (this._currentStroke.length > 0) {
            this._currentCursiveRecording.strokes.push([...this._currentStroke]);
            this._currentStroke = [];
        }
        this._isRecording = false;
        
        if (this._currentCursiveRecording.strokes.length > 0) {
            this._tip = `已录制 ${this._currentCursiveRecording.strokes.length} 笔，点击"保存"存储`;
            this._tipType = 'success';
        } else {
            this._tip = '未录制任何笔画';
            this._tipType = 'error';
        }
    }

    private _saveCursiveRecording(): void {
        if (this._currentCursiveRecording.strokes.length === 0) {
            this._tip = '请先录制内容';
            this._tipType = 'error';
            return;
        }

        this._cursiveRecordings[this._currentCursiveRecording.char] = 
            JSON.parse(JSON.stringify(this._currentCursiveRecording));
        this._saveCursiveRecordings();
        
        this._tip = `"${this._currentCursiveRecording.char}" 已保存！`;
        this._tipType = 'success';
    }

    private _clearCursiveRecording(): void {
        this._isRecording = false;
        this._currentCursiveRecording = { char: this._currentChar, strokes: [] };
        this._currentStroke = [];
        this._clearCursiveCanvas();
        this._drawCursiveGrid();
        this._tip = '点击"开始录制"在格子内书写连笔';
        this._tipType = 'normal';
    }

    private _deleteCursiveRecording(): void {
        if (this._cursiveRecordings[this._currentChar]) {
            delete this._cursiveRecordings[this._currentChar];
            this._saveCursiveRecordings();
            this._tip = `"${this._currentChar}" 已删除`;
            this._tipType = 'normal';
        }
    }

    private _playCursiveAnimation(): void {
        const rec = this._cursiveRecordings[this._currentChar];
        if (!rec || rec.strokes.length === 0) {
            this._tip = `"${this._currentChar}" 尚未录制，请先录制`;
            this._tipType = 'error';
            return;
        }

        this._isPlayingCursive = true;
        this._cursiveProgress = 0;
        this._clearCursiveCanvas();
        this._drawCursiveGrid();
        
        // 计算总时长
        let totalDuration = 0;
        rec.strokes.forEach(stroke => {
            if (stroke.length > 0) {
                totalDuration += stroke[stroke.length - 1].t + 200;
            }
        });

        const startTime = performance.now();
        
        const animate = () => {
            if (!this._isPlayingCursive) return;
            
            const elapsed = (performance.now() - startTime) * this._speed;
            const progress = Math.min(1, elapsed / totalDuration);
            this._cursiveProgress = progress * 100;
            
            this._clearCursiveCanvas();
            this._drawCursiveGrid();
            
            let accTime = 0;
            for (const stroke of rec.strokes) {
                this._drawCursiveStrokePartial(stroke, elapsed - accTime);
                if (stroke.length > 0) {
                    accTime += stroke[stroke.length - 1].t + 200;
                }
            }
            
            if (progress < 1) {
                this._cursiveAnimationId = requestAnimationFrame(animate);
            } else {
                this._isPlayingCursive = false;
                this._tip = '动画完成！点击重播再次观看';
                this._tipType = 'normal';
            }
        };
        
        this._tip = '播放中...';
        this._tipType = 'info';
        animate();
    }

    private _stopCursiveAnimation(): void {
        this._isPlayingCursive = false;
        if (this._cursiveAnimationId) {
            cancelAnimationFrame(this._cursiveAnimationId);
            this._cursiveAnimationId = null;
        }
    }

    private _getCursiveCanvas(): HTMLCanvasElement | null {
        return this.shadowRoot?.getElementById('cursive-canvas') as HTMLCanvasElement;
    }

    private _clearCursiveCanvas(): void {
        const canvas = this._getCursiveCanvas();
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    private _drawCursiveGrid(): void {
        const canvas = this._getCursiveCanvas();
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.strokeStyle = '#e8e8e8';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        
        // 十字线
        ctx.beginPath();
        ctx.moveTo(0, h/2);
        ctx.lineTo(w, h/2);
        ctx.moveTo(w/2, 0);
        ctx.lineTo(w/2, h);
        ctx.stroke();
        
        // 对角线
        ctx.strokeStyle = '#f0e8e8';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(w, h);
        ctx.moveTo(w, 0);
        ctx.lineTo(0, h);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    private _drawCursiveStrokePartial(stroke: StrokePoint[], elapsedTime: number): void {
        if (elapsedTime <= 0 || stroke.length < 2) return;
        
        const canvas = this._getCursiveCanvas();
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const w = canvas.width;
        const h = canvas.height;
        
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        for (let i = 1; i < stroke.length; i++) {
            const pt = stroke[i];
            if (pt.t > elapsedTime) break;
            
            const prev = stroke[i - 1];
            const x1 = prev.x * w;
            const y1 = prev.y * h;
            const x2 = pt.x * w;
            const y2 = pt.y * h;
            const p = (prev.p + pt.p) / 2;
            
            ctx.strokeStyle = `rgba(26, 26, 26, ${0.8 + p * 0.2})`;
            ctx.lineWidth = 8 * (0.5 + p);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
    }

    private _onCursivePointerDown(e: PointerEvent): void {
        if (!this._isRecording) return;
        
        const canvas = this._getCursiveCanvas();
        if (!canvas) return;
        
        this._isDrawing = true;
        this._strokeStartTime = performance.now();
        this._currentStroke = [];
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const p = e.pressure || 0.5;
        
        this._currentStroke.push({ x, y, t: 0, p });
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        }
    }

    private _onCursivePointerMove(e: PointerEvent): void {
        if (!this._isDrawing) return;
        
        const canvas = this._getCursiveCanvas();
        if (!canvas) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const t = performance.now() - this._strokeStartTime;
        const p = e.pressure || 0.5;
        
        this._currentStroke.push({ x, y, t, p });
        
        // 实时绘制
        const ctx = canvas.getContext('2d');
        if (ctx) {
            const px = e.clientX - rect.left;
            const py = e.clientY - rect.top;
            
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 8 * (0.5 + p);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(px, py);
        }
    }

    private _onCursivePointerUp(): void {
        if (!this._isDrawing) return;
        this._isDrawing = false;
        
        if (this._currentStroke.length > 2) {
            this._currentCursiveRecording.strokes.push([...this._currentStroke]);
        }
        this._currentStroke = [];
    }

    override async connectedCallback(): Promise<void> {
        super.connectedCallback();
        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);

        // 加载连笔数据
        this._loadCursiveRecordings();

        try {
            await this._loadHanziWriter();
        } catch (e) {
            console.error('Failed to load HanziWriter:', e);
        }
    }

    override disconnectedCallback(): void {
        super.disconnectedCallback();
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        this._stopCursiveAnimation();
    }

    override firstUpdated(): void {
        if (this._isLoaded) {
            this._initWriter();
        }
        if (this._mode === 'cursive') {
            setTimeout(() => this._drawCursiveGrid(), 10);
        }
    }

    override updated(changed: Map<string, unknown>): void {
        if (changed.has('_isLoaded') && this._isLoaded) {
            this._initWriter();
        }
        if (changed.has('_mode') && this._mode === 'cursive') {
            setTimeout(() => this._drawCursiveGrid(), 10);
        }
    }

    override render() {
        const tipClass = this._tipType === 'normal' ? '' : this._tipType;

        return html`
            <div class="container" style="left: ${this._posX}px; top: ${this._posY}px;"
                @mousedown=${this._handleMouseDown}>
                
                <div class="header">
                    <span class="title">✍️ 汉字笔顺练习</span>
                    <button class="close-btn" @click=${() => this.onClose?.()}>
                        ${CloseIcon}
                    </button>
                </div>

                ${!this._isLoaded ? html`
                    <div class="loading">正在加载 Hanzi Writer...</div>
                ` : html`
                    <div class="input-row">
                        <input type="text" class="char-input" 
                            .value=${this._currentChar}
                            maxlength="1"
                            placeholder="输入汉字"
                            @keypress=${(e: KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                    const input = e.target as HTMLInputElement;
                                    this._loadChar(input.value.trim());
                                }
                            }}>
                        <button class="load-btn" @click=${() => {
                            const input = this.shadowRoot?.querySelector('.char-input') as HTMLInputElement;
                            this._loadChar(input?.value.trim() || '');
                        }}>加载</button>
                    </div>

                    <div class="quick-chars">
                        ${PRESET_CHARS.map(c => html`
                            <button class="quick-btn ${c === this._currentChar ? 'active' : ''}"
                                @click=${() => this._loadChar(c)}>${c}</button>
                        `)}
                    </div>

                    <div class="mode-tabs">
                        <button class="mode-tab ${this._mode === 'animate' ? 'active' : ''}"
                            @click=${() => { this._mode = 'animate'; this._reset(); this._stopCursiveAnimation(); }}>动画演示</button>
                        <button class="mode-tab ${this._mode === 'quiz' ? 'active' : ''}"
                            @click=${() => { this._mode = 'quiz'; this._reset(); this._stopCursiveAnimation(); }}>书写练习</button>
                        <button class="mode-tab ${this._mode === 'cursive' ? 'active' : ''}"
                            @click=${() => { this._mode = 'cursive'; this._reset(); this._stopCursiveAnimation(); this._tip = '点击"开始录制"书写连笔，或点击"播放"查看已录制的连笔'; this._tipType = 'normal'; }}>连笔练习</button>
                    </div>

                    ${this._mode === 'cursive' ? html`
                        <!-- 连笔模式 -->
                        ${this._isRecording ? html`
                            <div class="record-indicator">
                                <div class="record-dot"></div>
                                <span>正在录制... 在格子内书写</span>
                            </div>
                        ` : nothing}

                        <div class="cursive-canvas-wrapper">
                            <div class="cursive-ref-char">${this._currentChar}</div>
                            <canvas id="cursive-canvas" width="280" height="280" style="z-index: 2;"
                                @pointerdown=${this._onCursivePointerDown}
                                @pointermove=${this._onCursivePointerMove}
                                @pointerup=${this._onCursivePointerUp}
                                @pointerleave=${this._onCursivePointerUp}></canvas>
                        </div>

                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${this._cursiveProgress}%"></div>
                        </div>

                        <div class="char-info">
                            当前汉字: <strong>${this._currentChar}</strong>
                            ${this._cursiveRecordings[this._currentChar] ? html`<span style="color:#8b5a2b;">（已录制）</span>` : nothing}
                        </div>

                        <div class="controls">
                            ${!this._isRecording ? html`
                                <button class="ctrl-btn danger" @click=${this._startCursiveRecording}>⏺ 开始录制</button>
                                <button class="ctrl-btn primary" @click=${this._playCursiveAnimation}
                                    ?disabled=${!this._cursiveRecordings[this._currentChar]}>▶ 播放</button>
                            ` : html`
                                <button class="ctrl-btn warning" @click=${this._stopCursiveRecording}>⏹ 停止录制</button>
                            `}
                            <button class="ctrl-btn secondary" @click=${this._clearCursiveRecording}>🗑 清除</button>
                            <button class="ctrl-btn success" @click=${this._saveCursiveRecording}
                                ?disabled=${this._currentCursiveRecording.strokes.length === 0}>💾 保存</button>
                        </div>

                        ${this._savedCursiveChars.length > 0 ? html`
                            <div class="saved-chars">
                                <span class="opt-label" style="width:100%;margin-bottom:4px;">已录制:</span>
                                ${this._savedCursiveChars.map(c => html`
                                    <button class="saved-char-btn has-data" @click=${() => this._loadChar(c)}>${c}</button>
                                `)}
                            </div>
                        ` : nothing}
                    ` : html`
                        <!-- 标准模式 -->
                        <div class="writer-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" width="280" height="280" id="writer-target"></svg>
                        </div>

                        <div class="char-info">当前汉字: <strong>${this._currentChar}</strong></div>

                        ${this._mode === 'animate' ? html`
                            <div class="controls">
                                <button class="ctrl-btn primary" @click=${this._playAnimation}>▶ 播放动画</button>
                                <button class="ctrl-btn secondary" @click=${this._loopAnimation}>🔁 循环</button>
                                <button class="ctrl-btn secondary" @click=${this._reset}>↺ 重置</button>
                            </div>
                        ` : html`
                            <div class="controls">
                                <button class="ctrl-btn success" @click=${this._startQuiz}>✏️ 开始练习</button>
                                <button class="ctrl-btn secondary" @click=${() => this._writer?.showOutline()}>💡 提示</button>
                                <button class="ctrl-btn secondary" @click=${this._reset}>↺ 重新开始</button>
                            </div>
                        `}
                    `}

                    <div class="options">
                        <div class="opt-group">
                            <span class="opt-label">速度:</span>
                            <select @change=${(e: Event) => {
                                this._speed = parseFloat((e.target as HTMLSelectElement).value);
                                if (this._mode !== 'cursive') this._initWriter();
                            }}>
                                <option value="0.5" ?selected=${this._speed === 0.5}>0.5x</option>
                                <option value="1" ?selected=${this._speed === 1}>1x</option>
                                <option value="2" ?selected=${this._speed === 2}>2x</option>
                                <option value="3" ?selected=${this._speed === 3}>3x</option>
                            </select>
                        </div>
                        ${this._mode !== 'cursive' ? html`
                            <button class="toggle-btn ${this._showOutline ? 'active' : ''}"
                                @click=${() => {
                                    this._showOutline = !this._showOutline;
                                    if (this._writer) {
                                        this._showOutline ? this._writer.showOutline() : this._writer.hideOutline();
                                    }
                                }}>轮廓</button>
                        ` : html`
                            <button class="toggle-btn" style="color:#e74c3c;"
                                @click=${this._deleteCursiveRecording}
                                ?disabled=${!this._cursiveRecordings[this._currentChar]}>删除录制</button>
                        `}
                    </div>

                    <p class="tip ${tipClass}">${this._tip}</p>
                `}
            </div>
        `;
    }
}
