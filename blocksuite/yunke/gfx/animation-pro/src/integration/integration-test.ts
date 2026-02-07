/**
 * 集成测试
 * 
 * 验证所有模块正常加载和工作
 */

import type { BenchmarkSuite } from '../core/benchmark/benchmark.js';
import type { BrushPreset } from '../core/brush-engine/brush-presets.js';

// ==================== 测试结果接口 ====================

export interface IntegrationTestResult {
    name: string;
    passed: boolean;
    message: string;
    duration: number;
    error?: Error;
}

export interface IntegrationTestReport {
    timestamp: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
    results: IntegrationTestResult[];
    benchmarkSuite?: BenchmarkSuite;
}

// ==================== 测试运行器 ====================

export class IntegrationTestRunner {
    private results: IntegrationTestResult[] = [];
    private startTime: number = 0;
    
    // 进度回调
    onProgress?: (test: string, index: number, total: number) => void;
    
    /**
     * 运行所有集成测试
     */
    async runAll(): Promise<IntegrationTestReport> {
        this.results = [];
        this.startTime = Date.now();
        
        const tests = [
            this.testTypeImports,
            this.testRenderEngineCreation,
            this.testBrushEngineCreation,
            this.testBrushPresets,
            this.testLayerSystemCreation,
            this.testFrameManagerCreation,
            this.testMemoryManagerCreation,
            this.testExportPipelineCreation,
            this.testUIComponents,
            this.testBenchmarkExecution,
        ];
        
        for (let i = 0; i < tests.length; i++) {
            const test = tests[i];
            this.onProgress?.(test.name, i + 1, tests.length);
            
            try {
                await test.call(this);
            } catch (error) {
                // 继续执行其他测试
                console.error(`Test failed: ${test.name}`, error);
            }
        }
        
        const endTime = Date.now();
        
        return {
            timestamp: this.startTime,
            totalTests: this.results.length,
            passedTests: this.results.filter(r => r.passed).length,
            failedTests: this.results.filter(r => !r.passed).length,
            duration: endTime - this.startTime,
            results: this.results,
        };
    }
    
    // ==================== 单元测试 ====================
    
    /**
     * 测试类型导入
     */
    private async testTypeImports(): Promise<void> {
        const start = Date.now();
        
        try {
            const types = await import('../types/index.js');
            
            // 验证核心类型存在
            const requiredTypes = [
                'DEFAULT_TRANSFORM',
                'DEFAULT_COLOR',
                'DEFAULT_CANVAS_SETTINGS',
                'DEFAULT_ANIMATION_SETTINGS',
                'DEFAULT_BRUSH_SETTINGS',
            ];
            
            for (const typeName of requiredTypes) {
                if (!(typeName in types)) {
                    throw new Error(`Missing type: ${typeName}`);
                }
            }
            
            this.addResult('类型导入', true, '所有核心类型导入成功', Date.now() - start);
        } catch (error) {
            this.addResult('类型导入', false, `导入失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试渲染引擎创建
     */
    private async testRenderEngineCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { RenderEngine } = await import('../core/render-engine/render-engine.js');
            
            // 创建离屏画布
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 600;
            
            const engine = new RenderEngine(canvas);
            
            // 验证基本方法存在
            if (typeof engine.resize !== 'function') {
                throw new Error('Missing resize method');
            }
            if (typeof engine.clear !== 'function') {
                throw new Error('Missing clear method');
            }
            if (typeof engine.createTexture !== 'function') {
                throw new Error('Missing createTexture method');
            }
            
            // 测试基本操作
            engine.resize(1920, 1080);
            engine.clear({ r: 255, g: 255, b: 255, a: 1 });
            
            const stats = engine.getStats();
            if (typeof stats.fps !== 'number') {
                throw new Error('Invalid stats');
            }
            
            engine.dispose();
            
            this.addResult('渲染引擎', true, 'WebGL 2.0 渲染引擎创建成功', Date.now() - start);
        } catch (error) {
            this.addResult('渲染引擎', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试笔刷引擎创建
     */
    private async testBrushEngineCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { BrushEngine } = await import('../core/brush-engine/brush-engine.js');
            
            const engine = new BrushEngine();
            
            // 验证基本方法
            if (typeof engine.beginStroke !== 'function') {
                throw new Error('Missing beginStroke method');
            }
            if (typeof engine.continueStroke !== 'function') {
                throw new Error('Missing continueStroke method');
            }
            if (typeof engine.endStroke !== 'function') {
                throw new Error('Missing endStroke method');
            }
            
            // 测试笔画
            engine.setColor({ r: 0, g: 0, b: 0, a: 1 });
            engine.beginStroke({
                x: 100,
                y: 100,
                pressure: 0.5,
                tiltX: 0,
                tiltY: 0,
                twist: 0,
                timestamp: Date.now(),
            });
            
            const points = engine.continueStroke({
                x: 150,
                y: 120,
                pressure: 0.7,
                tiltX: 0,
                tiltY: 0,
                twist: 0,
                timestamp: Date.now() + 16,
            });
            
            const stroke = engine.endStroke();
            
            if (!stroke) {
                throw new Error('Failed to create stroke');
            }
            
            if (stroke.points.length === 0) {
                throw new Error('Stroke has no points');
            }
            
            this.addResult('笔刷引擎', true, '笔刷引擎创建并执行笔画成功', Date.now() - start);
        } catch (error) {
            this.addResult('笔刷引擎', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试笔刷预设
     */
    private async testBrushPresets(): Promise<void> {
        const start = Date.now();
        
        try {
            const { ALL_PRESETS, getPresetsByCategory, getPresetById, CATEGORY_INFO } = 
                await import('../core/brush-engine/brush-presets.js');
            
            // 验证预设数量
            if (ALL_PRESETS.length < 20) {
                throw new Error(`Not enough presets: ${ALL_PRESETS.length}`);
            }
            
            // 验证分类
            const categories = Object.keys(CATEGORY_INFO);
            if (categories.length < 5) {
                throw new Error(`Not enough categories: ${categories.length}`);
            }
            
            // 验证每个分类都有预设
            for (const category of categories) {
                const presets = getPresetsByCategory(category as any);
                if (presets.length === 0) {
                    throw new Error(`No presets in category: ${category}`);
                }
            }
            
            // 验证 ID 查找
            const pencil = getPresetById('pencil');
            if (!pencil) {
                throw new Error('Cannot find pencil preset');
            }
            
            // 验证预设结构完整性
            for (const preset of ALL_PRESETS) {
                if (!preset.id || !preset.name || !preset.settings) {
                    throw new Error(`Invalid preset structure: ${preset.id}`);
                }
            }
            
            this.addResult(
                '笔刷预设',
                true,
                `${ALL_PRESETS.length} 个预设，${categories.length} 个分类加载成功`,
                Date.now() - start
            );
        } catch (error) {
            this.addResult('笔刷预设', false, `加载失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试图层系统创建
     */
    private async testLayerSystemCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { RasterLayer, LayerGroup, LayerManager } = 
                await import('../core/layer-system/layer.js');
            
            // 创建图层管理器
            const manager = new LayerManager();
            
            // 创建光栅图层
            const layer = manager.createRasterLayer('测试图层');
            
            if (!layer) {
                throw new Error('Failed to create layer');
            }
            
            // 测试像素操作
            layer.setPixel(100, 100, { r: 255, g: 0, b: 0, a: 1 });
            const pixel = layer.getPixel(100, 100);
            
            if (pixel.r !== 255 || pixel.g !== 0 || pixel.b !== 0) {
                throw new Error('Pixel operation failed');
            }
            
            // 创建图层组
            const group = manager.createLayerGroup('测试组');
            
            if (!group) {
                throw new Error('Failed to create group');
            }
            
            // 验证图层列表
            const allLayers = manager.getAllLayers();
            if (allLayers.length < 2) {
                throw new Error('Layer list incorrect');
            }
            
            this.addResult('图层系统', true, '图层管理器和图层操作正常', Date.now() - start);
        } catch (error) {
            this.addResult('图层系统', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试帧管理器创建
     */
    private async testFrameManagerCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { FrameManager } = await import('../core/frame-manager/frame-manager.js');
            
            const manager = new FrameManager({ fps: 24 });
            
            // 添加帧
            const frame1 = manager.addFrame();
            const frame2 = manager.addFrame();
            const frame3 = manager.addFrame();
            
            if (manager.getFrameCount() !== 3) {
                throw new Error('Frame count incorrect');
            }
            
            // 测试帧导航
            manager.goToFrame(1);
            if (manager.getCurrentFrameIndex() !== 1) {
                throw new Error('Frame navigation failed');
            }
            
            // 测试关键帧
            manager.addKeyframe('element1', 0, { position: { x: 0, y: 0 } });
            manager.addKeyframe('element1', 2, { position: { x: 100, y: 100 } });
            
            const tweened = manager.getTweenedProperties('element1', 1);
            
            if (!tweened.position) {
                throw new Error('Tweening failed');
            }
            
            // 验证插值结果（应该在中间位置附近）
            if (tweened.position.x < 40 || tweened.position.x > 60) {
                throw new Error('Tweening result incorrect');
            }
            
            this.addResult('帧管理器', true, '帧操作和关键帧补间正常', Date.now() - start);
        } catch (error) {
            this.addResult('帧管理器', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试内存管理器创建
     */
    private async testMemoryManagerCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { MemoryManager } = await import('../core/memory-manager/memory-manager.js');
            
            const manager = new MemoryManager({
                maxMemory: 100 * 1024 * 1024,  // 100MB
                maxCacheSize: 50,
                enablePersistence: false,  // 测试时禁用持久化
            });
            
            // 存储数据
            const testData = new Uint8ClampedArray(1024 * 1024);  // 1MB
            for (let i = 0; i < testData.length; i++) {
                testData[i] = i % 256;
            }
            
            manager.store('test-1', testData);
            
            // 验证存储
            if (!manager.has('test-1')) {
                throw new Error('Store failed');
            }
            
            // 获取数据
            const retrieved = await manager.get('test-1');
            if (!retrieved) {
                throw new Error('Retrieve failed');
            }
            
            // 验证数据完整性
            if (retrieved.length !== testData.length) {
                throw new Error('Data integrity check failed');
            }
            
            // 获取统计
            const stats = manager.getStats();
            if (stats.hits < 1) {
                throw new Error('Stats incorrect');
            }
            
            manager.dispose();
            
            this.addResult('内存管理器', true, '缓存存储和检索正常', Date.now() - start);
        } catch (error) {
            this.addResult('内存管理器', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试导出管道创建
     */
    private async testExportPipelineCreation(): Promise<void> {
        const start = Date.now();
        
        try {
            const { ExportPipeline } = await import('../core/export-pipeline/export-pipeline.js');
            
            // 创建模拟帧渲染器
            const mockRenderer = {
                renderFrame: async (index: number) => {
                    const canvas = new OffscreenCanvas(100, 100);
                    const ctx = canvas.getContext('2d')!;
                    ctx.fillStyle = `hsl(${index * 30}, 50%, 50%)`;
                    ctx.fillRect(0, 0, 100, 100);
                    return ctx.getImageData(0, 0, 100, 100);
                },
                getFrameCount: () => 5,
                getFrameDuration: () => 100,
                getCanvasSize: () => ({ width: 100, height: 100 }),
            };
            
            const pipeline = new ExportPipeline(mockRenderer);
            
            // 验证方法存在
            if (typeof pipeline.export !== 'function') {
                throw new Error('Missing export method');
            }
            if (typeof pipeline.abort !== 'function') {
                throw new Error('Missing abort method');
            }
            
            // 注意：实际导出测试需要完整环境支持
            
            this.addResult('导出管道', true, '导出管道创建成功', Date.now() - start);
        } catch (error) {
            this.addResult('导出管道', false, `创建失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试 UI 组件
     */
    private async testUIComponents(): Promise<void> {
        const start = Date.now();
        
        try {
            // 动态导入组件
            await import('../components/timeline-editor.js');
            await import('../components/brush-panel.js');
            await import('../components/layer-panel.js');
            
            // 验证自定义元素已注册
            if (!customElements.get('animation-timeline-editor')) {
                throw new Error('Timeline editor not registered');
            }
            if (!customElements.get('animation-brush-panel')) {
                throw new Error('Brush panel not registered');
            }
            if (!customElements.get('animation-layer-panel')) {
                throw new Error('Layer panel not registered');
            }
            
            // 创建元素
            const timeline = document.createElement('animation-timeline-editor');
            const brushPanel = document.createElement('animation-brush-panel');
            const layerPanel = document.createElement('animation-layer-panel');
            
            // 验证元素可创建
            if (!timeline || !brushPanel || !layerPanel) {
                throw new Error('Failed to create elements');
            }
            
            this.addResult('UI 组件', true, '3 个 UI 组件注册并创建成功', Date.now() - start);
        } catch (error) {
            this.addResult('UI 组件', false, `加载失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    /**
     * 测试基准测试执行
     */
    private async testBenchmarkExecution(): Promise<void> {
        const start = Date.now();
        
        try {
            const { Benchmark, runSingleTest } = await import('../core/benchmark/benchmark.js');
            
            // 运行单个简单测试
            const result = await runSingleTest(
                'simple-test',
                () => {
                    let sum = 0;
                    for (let i = 0; i < 1000; i++) {
                        sum += i;
                    }
                    return sum;
                },
                50  // 50 次迭代
            );
            
            // 验证结果结构
            if (!result.name || typeof result.averageTime !== 'number') {
                throw new Error('Invalid benchmark result');
            }
            
            if (result.iterations !== 50) {
                throw new Error('Iteration count incorrect');
            }
            
            if (result.opsPerSecond <= 0) {
                throw new Error('OPS calculation incorrect');
            }
            
            this.addResult(
                '基准测试',
                true,
                `单次测试执行成功，平均 ${result.averageTime.toFixed(3)}ms`,
                Date.now() - start
            );
        } catch (error) {
            this.addResult('基准测试', false, `执行失败: ${error}`, Date.now() - start, error as Error);
        }
    }
    
    // ==================== 辅助方法 ====================
    
    private addResult(
        name: string,
        passed: boolean,
        message: string,
        duration: number,
        error?: Error
    ): void {
        this.results.push({ name, passed, message, duration, error });
    }
}

// ==================== 快速测试 ====================

/**
 * 运行快速集成测试
 */
export async function runIntegrationTests(): Promise<IntegrationTestReport> {
    const runner = new IntegrationTestRunner();
    
    runner.onProgress = (test, index, total) => {
        console.log(`[${index}/${total}] 测试: ${test}`);
    };
    
    return runner.runAll();
}

/**
 * 格式化测试报告
 */
export function formatTestReport(report: IntegrationTestReport): string {
    const lines: string[] = [];
    
    lines.push('═'.repeat(50));
    lines.push('  Animation Pro 集成测试报告');
    lines.push('═'.repeat(50));
    lines.push('');
    lines.push(`时间: ${new Date(report.timestamp).toLocaleString()}`);
    lines.push(`总耗时: ${report.duration}ms`);
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push(`通过: ${report.passedTests} / ${report.totalTests}`);
    lines.push('─'.repeat(50));
    lines.push('');
    
    for (const result of report.results) {
        const status = result.passed ? '✅' : '❌';
        lines.push(`${status} ${result.name}`);
        lines.push(`   ${result.message}`);
        lines.push(`   耗时: ${result.duration}ms`);
        
        if (result.error) {
            lines.push(`   错误: ${result.error.message}`);
        }
        
        lines.push('');
    }
    
    lines.push('═'.repeat(50));
    
    return lines.join('\n');
}
