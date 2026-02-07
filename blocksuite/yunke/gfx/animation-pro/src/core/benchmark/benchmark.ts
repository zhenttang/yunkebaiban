/**
 * Professional 性能基准测试
 * 
 * 测试项目：
 * - 渲染帧率
 * - 笔刷绘制性能
 * - 图层合成性能
 * - 内存使用
 * - 导出性能
 */

import type { PerformanceStats, Point, Color } from '../../types/index.js';

// ==================== 测试配置 ====================

export interface BenchmarkConfig {
    // 测试迭代次数
    iterations: number;
    // 预热迭代次数
    warmupIterations: number;
    // 超时时间（毫秒）
    timeout: number;
    // 是否收集 GC 信息
    collectGC: boolean;
}

const DEFAULT_CONFIG: BenchmarkConfig = {
    iterations: 100,
    warmupIterations: 10,
    timeout: 30000,
    collectGC: true,
};

// ==================== 测试结果 ====================

export interface BenchmarkResult {
    name: string;
    description: string;
    iterations: number;
    totalTime: number;      // 毫秒
    averageTime: number;    // 毫秒
    minTime: number;        // 毫秒
    maxTime: number;        // 毫秒
    standardDeviation: number;
    percentile95: number;   // 95th percentile
    percentile99: number;   // 99th percentile
    opsPerSecond: number;   // 每秒操作数
    memoryUsed?: number;    // 字节
    memoryPeak?: number;    // 字节
    passed: boolean;
    threshold?: number;     // 预期阈值
    score?: number;         // 0-100 评分
}

export interface BenchmarkSuite {
    name: string;
    description: string;
    results: BenchmarkResult[];
    totalTime: number;
    startTime: number;
    endTime: number;
    environment: EnvironmentInfo;
    overallScore: number;
}

export interface EnvironmentInfo {
    userAgent: string;
    platform: string;
    devicePixelRatio: number;
    hardwareConcurrency: number;
    deviceMemory?: number;
    webglVersion: string;
    webglRenderer: string;
    webglVendor: string;
}

// ==================== 基准测试类 ====================

export class Benchmark {
    private config: BenchmarkConfig;
    private results: BenchmarkResult[] = [];
    private currentSuite: string = '';
    
    // 进度回调
    onProgress?: (progress: { current: number; total: number; name: string }) => void;
    
    constructor(config: Partial<BenchmarkConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    
    // ==================== 运行测试 ====================
    
    /**
     * 运行单个测试
     */
    async run(
        name: string,
        fn: () => void | Promise<void>,
        options: {
            description?: string;
            iterations?: number;
            threshold?: number;
        } = {}
    ): Promise<BenchmarkResult> {
        const {
            description = '',
            iterations = this.config.iterations,
            threshold,
        } = options;
        
        const times: number[] = [];
        
        // 预热
        for (let i = 0; i < this.config.warmupIterations; i++) {
            await fn();
        }
        
        // 强制 GC（如果可用）
        if (this.config.collectGC && typeof (globalThis as any).gc === 'function') {
            (globalThis as any).gc();
        }
        
        const memoryBefore = this.getMemoryUsage();
        let memoryPeak = memoryBefore;
        
        // 正式测试
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            const end = performance.now();
            
            times.push(end - start);
            
            // 更新内存峰值
            const currentMemory = this.getMemoryUsage();
            if (currentMemory > memoryPeak) {
                memoryPeak = currentMemory;
            }
            
            // 报告进度
            this.onProgress?.({
                current: i + 1,
                total: iterations,
                name,
            });
        }
        
        const memoryAfter = this.getMemoryUsage();
        
        // 计算统计数据
        const result = this.calculateStats(name, description, times, threshold);
        result.memoryUsed = memoryAfter - memoryBefore;
        result.memoryPeak = memoryPeak - memoryBefore;
        
        this.results.push(result);
        
        return result;
    }
    
    /**
     * 运行完整测试套件
     */
    async runSuite(): Promise<BenchmarkSuite> {
        const startTime = Date.now();
        
        // 清空之前的结果
        this.results = [];
        
        // 运行所有内置测试
        await this.runRenderingTests();
        await this.runBrushTests();
        await this.runLayerTests();
        await this.runFrameTests();
        await this.runMemoryTests();
        
        const endTime = Date.now();
        
        return {
            name: 'Animation Pro Benchmark Suite',
            description: '专业动画系统性能基准测试',
            results: this.results,
            totalTime: endTime - startTime,
            startTime,
            endTime,
            environment: this.getEnvironmentInfo(),
            overallScore: this.calculateOverallScore(),
        };
    }
    
    // ==================== 渲染测试 ====================
    
    private async runRenderingTests(): Promise<void> {
        this.currentSuite = 'Rendering';
        
        // 创建测试画布
        const canvas = new OffscreenCanvas(1920, 1080);
        const ctx = canvas.getContext('2d')!;
        
        // 测试1：纯色填充
        await this.run('render-fill', () => {
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 1920, 1080);
        }, {
            description: '1920x1080 纯色填充',
            threshold: 0.5,
        });
        
        // 测试2：渐变填充
        await this.run('render-gradient', () => {
            const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
            gradient.addColorStop(0, '#ff0000');
            gradient.addColorStop(0.5, '#00ff00');
            gradient.addColorStop(1, '#0000ff');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1920, 1080);
        }, {
            description: '1920x1080 渐变填充',
            threshold: 1,
        });
        
        // 测试3：路径绘制
        await this.run('render-path', () => {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let i = 0; i < 1000; i++) {
                ctx.lineTo(
                    Math.random() * 1920,
                    Math.random() * 1080
                );
            }
            ctx.stroke();
        }, {
            description: '1000 点路径绘制',
            threshold: 5,
        });
        
        // 测试4：圆形绘制
        await this.run('render-circles', () => {
            for (let i = 0; i < 500; i++) {
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    10 + Math.random() * 50,
                    0,
                    Math.PI * 2
                );
                ctx.fill();
            }
        }, {
            description: '500 个圆形绘制',
            threshold: 10,
        });
        
        // 测试5：图像合成
        const imageData = ctx.createImageData(1920, 1080);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = Math.random() * 255;
            imageData.data[i + 1] = Math.random() * 255;
            imageData.data[i + 2] = Math.random() * 255;
            imageData.data[i + 3] = 255;
        }
        
        await this.run('render-putImageData', () => {
            ctx.putImageData(imageData, 0, 0);
        }, {
            description: '1920x1080 putImageData',
            threshold: 5,
        });
        
        await this.run('render-getImageData', () => {
            ctx.getImageData(0, 0, 1920, 1080);
        }, {
            description: '1920x1080 getImageData',
            threshold: 5,
        });
    }
    
    // ==================== 笔刷测试 ====================
    
    private async runBrushTests(): Promise<void> {
        this.currentSuite = 'Brush';
        
        const canvas = new OffscreenCanvas(1920, 1080);
        const ctx = canvas.getContext('2d')!;
        
        // 生成测试笔画点
        const generateStrokePoints = (count: number): Point[] => {
            const points: Point[] = [];
            let x = 100;
            let y = 540;
            
            for (let i = 0; i < count; i++) {
                x += Math.random() * 10 - 2;
                y += Math.sin(i * 0.1) * 5;
                points.push({ x, y });
            }
            
            return points;
        };
        
        // 测试1：简单笔画（100 点）
        const shortStroke = generateStrokePoints(100);
        
        await this.run('brush-stroke-100', () => {
            ctx.beginPath();
            ctx.moveTo(shortStroke[0].x, shortStroke[0].y);
            for (let i = 1; i < shortStroke.length; i++) {
                ctx.lineTo(shortStroke[i].x, shortStroke[i].y);
            }
            ctx.stroke();
        }, {
            description: '100 点笔画',
            threshold: 0.5,
        });
        
        // 测试2：长笔画（1000 点）
        const longStroke = generateStrokePoints(1000);
        
        await this.run('brush-stroke-1000', () => {
            ctx.beginPath();
            ctx.moveTo(longStroke[0].x, longStroke[0].y);
            for (let i = 1; i < longStroke.length; i++) {
                ctx.lineTo(longStroke[i].x, longStroke[i].y);
            }
            ctx.stroke();
        }, {
            description: '1000 点笔画',
            threshold: 2,
        });
        
        // 测试3：Dab 绘制（模拟笔刷）
        await this.run('brush-dab-500', () => {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
            gradient.addColorStop(0, 'rgba(0,0,0,1)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            for (let i = 0; i < 500; i++) {
                ctx.save();
                ctx.translate(
                    Math.random() * 1920,
                    Math.random() * 1080
                );
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }, {
            description: '500 个 Dab 绘制',
            threshold: 15,
        });
        
        // 测试4：压感笔画模拟
        await this.run('brush-pressure-500', () => {
            for (let i = 0; i < 500; i++) {
                const pressure = 0.3 + Math.random() * 0.7;
                const size = 5 + pressure * 15;
                
                ctx.beginPath();
                ctx.arc(
                    Math.random() * 1920,
                    Math.random() * 1080,
                    size,
                    0,
                    Math.PI * 2
                );
                ctx.globalAlpha = pressure;
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        }, {
            description: '500 个压感点',
            threshold: 10,
        });
    }
    
    // ==================== 图层测试 ====================
    
    private async runLayerTests(): Promise<void> {
        this.currentSuite = 'Layer';
        
        const canvas = new OffscreenCanvas(1920, 1080);
        const ctx = canvas.getContext('2d')!;
        
        // 创建测试图层
        const createLayer = (): ImageData => {
            const imageData = ctx.createImageData(1920, 1080);
            for (let i = 0; i < imageData.data.length; i += 4) {
                imageData.data[i] = Math.random() * 255;
                imageData.data[i + 1] = Math.random() * 255;
                imageData.data[i + 2] = Math.random() * 255;
                imageData.data[i + 3] = Math.random() * 255;
            }
            return imageData;
        };
        
        const layers: ImageData[] = [];
        for (let i = 0; i < 10; i++) {
            layers.push(createLayer());
        }
        
        // 测试1：单图层渲染
        await this.run('layer-render-1', () => {
            ctx.putImageData(layers[0], 0, 0);
        }, {
            description: '单图层渲染',
            threshold: 5,
        });
        
        // 测试2：5 图层合成
        await this.run('layer-composite-5', () => {
            ctx.clearRect(0, 0, 1920, 1080);
            for (let i = 0; i < 5; i++) {
                ctx.globalAlpha = 0.8;
                ctx.putImageData(layers[i], 0, 0);
            }
            ctx.globalAlpha = 1;
        }, {
            description: '5 图层合成',
            threshold: 25,
        });
        
        // 测试3：10 图层合成
        await this.run('layer-composite-10', () => {
            ctx.clearRect(0, 0, 1920, 1080);
            for (let i = 0; i < 10; i++) {
                ctx.globalAlpha = 0.8;
                ctx.putImageData(layers[i], 0, 0);
            }
            ctx.globalAlpha = 1;
        }, {
            description: '10 图层合成',
            threshold: 50,
        });
        
        // 测试4：混合模式
        await this.run('layer-blend-modes', () => {
            const modes: GlobalCompositeOperation[] = [
                'multiply', 'screen', 'overlay', 'darken', 'lighten'
            ];
            
            ctx.clearRect(0, 0, 1920, 1080);
            ctx.putImageData(layers[0], 0, 0);
            
            for (let i = 1; i < 5; i++) {
                ctx.globalCompositeOperation = modes[i - 1];
                ctx.globalAlpha = 0.5;
                ctx.putImageData(layers[i], 0, 0);
            }
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
        }, {
            description: '5 种混合模式',
            threshold: 30,
        });
    }
    
    // ==================== 帧测试 ====================
    
    private async runFrameTests(): Promise<void> {
        this.currentSuite = 'Frame';
        
        const canvas = new OffscreenCanvas(1920, 1080);
        const ctx = canvas.getContext('2d')!;
        
        // 创建测试帧
        const frames: ImageData[] = [];
        for (let i = 0; i < 24; i++) {
            const imageData = ctx.createImageData(1920, 1080);
            for (let j = 0; j < imageData.data.length; j += 4) {
                imageData.data[j] = (i * 10 + j) % 255;
                imageData.data[j + 1] = (i * 20 + j) % 255;
                imageData.data[j + 2] = (i * 30 + j) % 255;
                imageData.data[j + 3] = 255;
            }
            frames.push(imageData);
        }
        
        // 测试1：帧切换
        let frameIndex = 0;
        await this.run('frame-switch', () => {
            ctx.putImageData(frames[frameIndex], 0, 0);
            frameIndex = (frameIndex + 1) % frames.length;
        }, {
            description: '帧切换 (24 帧)',
            iterations: 240,
            threshold: 5,
        });
        
        // 测试2：缩略图生成
        await this.run('frame-thumbnail', async () => {
            const thumbCanvas = new OffscreenCanvas(160, 90);
            const thumbCtx = thumbCanvas.getContext('2d')!;
            
            const tempCanvas = new OffscreenCanvas(1920, 1080);
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.putImageData(frames[0], 0, 0);
            
            thumbCtx.drawImage(tempCanvas, 0, 0, 160, 90);
        }, {
            description: '缩略图生成 (160x90)',
            threshold: 5,
        });
        
        // 测试3：帧复制
        await this.run('frame-copy', () => {
            const copy = new ImageData(
                new Uint8ClampedArray(frames[0].data),
                frames[0].width,
                frames[0].height
            );
            return copy;
        }, {
            description: '帧数据复制 (1920x1080)',
            threshold: 10,
        });
    }
    
    // ==================== 内存测试 ====================
    
    private async runMemoryTests(): Promise<void> {
        this.currentSuite = 'Memory';
        
        // 测试1：大数组分配
        await this.run('memory-alloc-1mb', () => {
            const arr = new Uint8ClampedArray(1024 * 1024);
            return arr;
        }, {
            description: '1MB 数组分配',
            threshold: 1,
        });
        
        // 测试2：10MB 数组分配
        await this.run('memory-alloc-10mb', () => {
            const arr = new Uint8ClampedArray(10 * 1024 * 1024);
            return arr;
        }, {
            description: '10MB 数组分配',
            iterations: 50,
            threshold: 5,
        });
        
        // 测试3：ImageData 创建
        await this.run('memory-imagedata-1080p', () => {
            const canvas = new OffscreenCanvas(1920, 1080);
            const ctx = canvas.getContext('2d')!;
            return ctx.createImageData(1920, 1080);
        }, {
            description: '1080p ImageData 创建',
            threshold: 2,
        });
        
        // 测试4：ImageData 创建 4K
        await this.run('memory-imagedata-4k', () => {
            const canvas = new OffscreenCanvas(3840, 2160);
            const ctx = canvas.getContext('2d')!;
            return ctx.createImageData(3840, 2160);
        }, {
            description: '4K ImageData 创建',
            iterations: 50,
            threshold: 10,
        });
    }
    
    // ==================== 统计计算 ====================
    
    private calculateStats(
        name: string,
        description: string,
        times: number[],
        threshold?: number
    ): BenchmarkResult {
        const sorted = [...times].sort((a, b) => a - b);
        const n = sorted.length;
        
        const totalTime = times.reduce((a, b) => a + b, 0);
        const averageTime = totalTime / n;
        const minTime = sorted[0];
        const maxTime = sorted[n - 1];
        
        // 标准差
        const variance = times.reduce((sum, t) => sum + Math.pow(t - averageTime, 2), 0) / n;
        const standardDeviation = Math.sqrt(variance);
        
        // 百分位数
        const percentile95 = sorted[Math.floor(n * 0.95)];
        const percentile99 = sorted[Math.floor(n * 0.99)];
        
        // 每秒操作数
        const opsPerSecond = 1000 / averageTime;
        
        // 是否通过
        const passed = threshold ? averageTime <= threshold : true;
        
        // 评分（基于阈值）
        let score: number | undefined;
        if (threshold) {
            if (averageTime <= threshold * 0.5) {
                score = 100;
            } else if (averageTime <= threshold) {
                score = 50 + 50 * (1 - (averageTime - threshold * 0.5) / (threshold * 0.5));
            } else if (averageTime <= threshold * 2) {
                score = 50 * (1 - (averageTime - threshold) / threshold);
            } else {
                score = 0;
            }
            score = Math.round(score);
        }
        
        return {
            name,
            description,
            iterations: n,
            totalTime,
            averageTime,
            minTime,
            maxTime,
            standardDeviation,
            percentile95,
            percentile99,
            opsPerSecond,
            passed,
            threshold,
            score,
        };
    }
    
    // ==================== 辅助方法 ====================
    
    private getMemoryUsage(): number {
        if ((performance as any).memory) {
            return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
    }
    
    private getEnvironmentInfo(): EnvironmentInfo {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
        
        let webglVersion = 'Not supported';
        let webglRenderer = 'Unknown';
        let webglVendor = 'Unknown';
        
        if (gl) {
            webglVersion = gl instanceof WebGL2RenderingContext ? 'WebGL 2.0' : 'WebGL 1.0';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Unknown';
                webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Unknown';
            }
        }
        
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            devicePixelRatio: window.devicePixelRatio || 1,
            hardwareConcurrency: navigator.hardwareConcurrency || 1,
            deviceMemory: (navigator as any).deviceMemory,
            webglVersion,
            webglRenderer,
            webglVendor,
        };
    }
    
    private calculateOverallScore(): number {
        const scoredResults = this.results.filter(r => r.score !== undefined);
        if (scoredResults.length === 0) return 0;
        
        const totalScore = scoredResults.reduce((sum, r) => sum + (r.score || 0), 0);
        return Math.round(totalScore / scoredResults.length);
    }
    
    // ==================== 结果格式化 ====================
    
    /**
     * 生成测试报告
     */
    generateReport(suite: BenchmarkSuite): string {
        const lines: string[] = [];
        
        lines.push('═'.repeat(60));
        lines.push(`  ${suite.name}`);
        lines.push(`  ${suite.description}`);
        lines.push('═'.repeat(60));
        lines.push('');
        
        // 环境信息
        lines.push('📊 环境信息');
        lines.push('─'.repeat(40));
        lines.push(`  平台: ${suite.environment.platform}`);
        lines.push(`  CPU 核心: ${suite.environment.hardwareConcurrency}`);
        if (suite.environment.deviceMemory) {
            lines.push(`  设备内存: ${suite.environment.deviceMemory} GB`);
        }
        lines.push(`  WebGL: ${suite.environment.webglVersion}`);
        lines.push(`  GPU: ${suite.environment.webglRenderer}`);
        lines.push('');
        
        // 测试结果
        lines.push('🔬 测试结果');
        lines.push('─'.repeat(40));
        
        for (const result of suite.results) {
            const status = result.passed ? '✅' : '❌';
            const score = result.score !== undefined ? ` [${result.score}/100]` : '';
            
            lines.push(`${status} ${result.name}${score}`);
            lines.push(`   ${result.description}`);
            lines.push(`   平均: ${result.averageTime.toFixed(3)} ms`);
            lines.push(`   范围: ${result.minTime.toFixed(3)} - ${result.maxTime.toFixed(3)} ms`);
            lines.push(`   P95: ${result.percentile95.toFixed(3)} ms`);
            lines.push(`   吞吐: ${result.opsPerSecond.toFixed(1)} ops/s`);
            
            if (result.memoryUsed) {
                lines.push(`   内存: ${(result.memoryUsed / 1024 / 1024).toFixed(2)} MB`);
            }
            
            lines.push('');
        }
        
        // 总结
        lines.push('═'.repeat(60));
        lines.push(`  总耗时: ${(suite.totalTime / 1000).toFixed(2)} 秒`);
        lines.push(`  总评分: ${suite.overallScore}/100`);
        lines.push(`  通过率: ${suite.results.filter(r => r.passed).length}/${suite.results.length}`);
        lines.push('═'.repeat(60));
        
        return lines.join('\n');
    }
    
    /**
     * 导出为 JSON
     */
    exportJSON(suite: BenchmarkSuite): string {
        return JSON.stringify(suite, null, 2);
    }
}

// ==================== 快速测试 ====================

/**
 * 快速性能测试
 */
export async function quickBenchmark(): Promise<BenchmarkSuite> {
    const benchmark = new Benchmark({
        iterations: 50,
        warmupIterations: 5,
    });
    
    benchmark.onProgress = (progress) => {
        console.log(`[Benchmark] ${progress.name}: ${progress.current}/${progress.total}`);
    };
    
    return benchmark.runSuite();
}

/**
 * 单项测试
 */
export async function runSingleTest(
    name: string,
    fn: () => void | Promise<void>,
    iterations: number = 100
): Promise<BenchmarkResult> {
    const benchmark = new Benchmark({ iterations });
    return benchmark.run(name, fn);
}
