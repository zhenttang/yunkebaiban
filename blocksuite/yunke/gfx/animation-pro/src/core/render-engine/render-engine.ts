/**
 * Professional WebGL 2.0 渲染引擎
 * 
 * 特性：
 * - 4K 画布支持
 * - 分块渲染（Tile-based rendering）
 * - 脏区域更新
 * - 双缓冲
 * - 纹理池化
 * - 帧缓冲池化
 */

import type {
    Color,
    Rect,
    RenderContext,
    RenderOptions,
    Viewport,
    PerformanceStats,
    BlendMode,
} from '../../types/index.js';

import {
    BASIC_VERTEX_SHADER,
    BASIC_FRAGMENT_SHADER,
    BRUSH_VERTEX_SHADER,
    BRUSH_FRAGMENT_SHADER,
    BLEND_FRAGMENT_SHADER,
    ONION_SKIN_FRAGMENT_SHADER,
    COMPOSITE_FRAGMENT_SHADER,
    GRID_FRAGMENT_SHADER,
} from './shaders.js';

// ==================== 配置 ====================

export interface RenderEngineConfig {
    maxTextureSize: number;
    tileSize: number;
    maxCachedTiles: number;
    maxFrameBuffers: number;
    antialiasing: boolean;
    preserveDrawingBuffer: boolean;
    powerPreference: 'default' | 'high-performance' | 'low-power';
}

const DEFAULT_CONFIG: RenderEngineConfig = {
    maxTextureSize: 4096,
    tileSize: 512,
    maxCachedTiles: 256,
    maxFrameBuffers: 16,
    antialiasing: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
};

// ==================== 着色器程序管理 ====================

interface ShaderProgram {
    program: WebGLProgram;
    attributes: Map<string, number>;
    uniforms: Map<string, WebGLUniformLocation>;
}

// ==================== 纹理管理 ====================

interface TextureInfo {
    texture: WebGLTexture;
    width: number;
    height: number;
    format: number;
    lastUsed: number;
}

// ==================== 帧缓冲管理 ====================

interface FrameBufferInfo {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    width: number;
    height: number;
    inUse: boolean;
}

// ==================== 分块管理 ====================

interface TileInfo {
    key: string;
    x: number;
    y: number;
    texture: WebGLTexture | null;
    dirty: boolean;
    lastAccess: number;
}

// ==================== 渲染引擎主类 ====================

export class RenderEngine {
    private gl: WebGL2RenderingContext;
    private canvas: HTMLCanvasElement;
    private config: RenderEngineConfig;
    
    // 着色器程序
    private programs: Map<string, ShaderProgram> = new Map();
    
    // 纹理池
    private texturePool: Map<string, TextureInfo> = new Map();
    
    // 帧缓冲池
    private frameBufferPool: FrameBufferInfo[] = [];
    
    // 分块缓存
    private tileCache: Map<string, TileInfo> = new Map();
    
    // 几何缓冲
    private quadVAO: WebGLVertexArrayObject | null = null;
    private quadVBO: WebGLBuffer | null = null;
    
    // 视口状态
    private viewport: Viewport = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        zoom: 1,
        rotation: 0,
    };
    
    // 性能统计
    private stats: PerformanceStats = {
        fps: 0,
        frameTime: 0,
        drawCalls: 0,
        triangles: 0,
        textureMemory: 0,
        bufferMemory: 0,
        heapUsed: 0,
        heapTotal: 0,
    };
    
    private lastFrameTime: number = 0;
    private frameCount: number = 0;
    private drawCallsThisFrame: number = 0;
    
    constructor(canvas: HTMLCanvasElement, config: Partial<RenderEngineConfig> = {}) {
        this.canvas = canvas;
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        // 初始化 WebGL 2.0
        const gl = canvas.getContext('webgl2', {
            alpha: true,
            antialias: this.config.antialiasing,
            depth: false,
            stencil: true,
            preserveDrawingBuffer: this.config.preserveDrawingBuffer,
            powerPreference: this.config.powerPreference,
            premultipliedAlpha: true,
        });
        
        if (!gl) {
            throw new Error('WebGL 2.0 not supported');
        }
        
        this.gl = gl;
        
        // 初始化
        this.initShaders();
        this.initGeometry();
        this.initFrameBuffers();
        this.setupGL();
    }

    // ==================== 初始化 ====================
    
    private initShaders(): void {
        // 基础着色器
        this.createProgram('basic', BASIC_VERTEX_SHADER, BASIC_FRAGMENT_SHADER);
        
        // 笔刷着色器
        this.createProgram('brush', BRUSH_VERTEX_SHADER, BRUSH_FRAGMENT_SHADER);
        
        // 混合模式着色器
        this.createProgram('blend', BASIC_VERTEX_SHADER, BLEND_FRAGMENT_SHADER);
        
        // 洋葱皮着色器
        this.createProgram('onionSkin', BASIC_VERTEX_SHADER, ONION_SKIN_FRAGMENT_SHADER);
        
        // 合成着色器
        this.createProgram('composite', BASIC_VERTEX_SHADER, COMPOSITE_FRAGMENT_SHADER);
        
        // 网格着色器
        this.createProgram('grid', BASIC_VERTEX_SHADER, GRID_FRAGMENT_SHADER);
    }
    
    private createProgram(name: string, vertSrc: string, fragSrc: string): void {
        const gl = this.gl;
        
        // 编译顶点着色器
        const vertShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertShader, vertSrc);
        gl.compileShader(vertShader);
        
        if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
            console.error(`Vertex shader compile error (${name}):`, gl.getShaderInfoLog(vertShader));
            throw new Error(`Failed to compile vertex shader: ${name}`);
        }
        
        // 编译片段着色器
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragShader, fragSrc);
        gl.compileShader(fragShader);
        
        if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
            console.error(`Fragment shader compile error (${name}):`, gl.getShaderInfoLog(fragShader));
            throw new Error(`Failed to compile fragment shader: ${name}`);
        }
        
        // 链接程序
        const program = gl.createProgram()!;
        gl.attachShader(program, vertShader);
        gl.attachShader(program, fragShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error(`Program link error (${name}):`, gl.getProgramInfoLog(program));
            throw new Error(`Failed to link program: ${name}`);
        }
        
        // 清理着色器
        gl.deleteShader(vertShader);
        gl.deleteShader(fragShader);
        
        // 获取属性和 uniform 位置
        const attributes = new Map<string, number>();
        const uniforms = new Map<string, WebGLUniformLocation>();
        
        const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < numAttribs; i++) {
            const info = gl.getActiveAttrib(program, i);
            if (info) {
                attributes.set(info.name, gl.getAttribLocation(program, info.name));
            }
        }
        
        const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < numUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            if (info) {
                const location = gl.getUniformLocation(program, info.name);
                if (location) {
                    uniforms.set(info.name, location);
                }
            }
        }
        
        this.programs.set(name, { program, attributes, uniforms });
    }
    
    private initGeometry(): void {
        const gl = this.gl;
        
        // 全屏四边形
        const quadVertices = new Float32Array([
            // position   // texCoord
            -1, -1,       0, 1,
             1, -1,       1, 1,
            -1,  1,       0, 0,
             1,  1,       1, 0,
        ]);
        
        this.quadVAO = gl.createVertexArray();
        gl.bindVertexArray(this.quadVAO);
        
        this.quadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        
        // position
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        
        // texCoord
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);
        
        gl.bindVertexArray(null);
    }
    
    private initFrameBuffers(): void {
        for (let i = 0; i < this.config.maxFrameBuffers; i++) {
            this.frameBufferPool.push(this.createFrameBuffer());
        }
    }
    
    private createFrameBuffer(): FrameBufferInfo {
        const gl = this.gl;
        const { tileSize } = this.config;
        
        const framebuffer = gl.createFramebuffer()!;
        const texture = gl.createTexture()!;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA8,
            tileSize,
            tileSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return {
            framebuffer,
            texture,
            width: tileSize,
            height: tileSize,
            inUse: false,
        };
    }
    
    private setupGL(): void {
        const gl = this.gl;
        
        // 启用混合
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        // 禁用深度测试
        gl.disable(gl.DEPTH_TEST);
        
        // 设置清除颜色
        gl.clearColor(0, 0, 0, 0);
    }

    // ==================== 视口管理 ====================
    
    setViewport(viewport: Partial<Viewport>): void {
        Object.assign(this.viewport, viewport);
    }
    
    getViewport(): Viewport {
        return { ...this.viewport };
    }
    
    resize(width: number, height: number): void {
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = width * dpr;
        this.canvas.height = height * dpr;
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        
        this.viewport.width = width;
        this.viewport.height = height;
        
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    // ==================== 纹理管理 ====================
    
    createTexture(
        width: number,
        height: number,
        data?: Uint8Array | ImageBitmap | HTMLImageElement | null
    ): WebGLTexture {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        if (data instanceof ImageBitmap || data instanceof HTMLImageElement) {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA8,
                width,
                height,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data || null
            );
        }
        
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.bindTexture(gl.TEXTURE_2D, null);
        
        return texture;
    }
    
    updateTexture(
        texture: WebGLTexture,
        x: number,
        y: number,
        width: number,
        height: number,
        data: Uint8Array | ImageBitmap
    ): void {
        const gl = this.gl;
        
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        if (data instanceof ImageBitmap) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, data);
        } else {
            gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                x,
                y,
                width,
                height,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                data
            );
        }
        
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    
    deleteTexture(texture: WebGLTexture): void {
        this.gl.deleteTexture(texture);
    }

    // ==================== 帧缓冲管理 ====================
    
    acquireFrameBuffer(): FrameBufferInfo | null {
        for (const fb of this.frameBufferPool) {
            if (!fb.inUse) {
                fb.inUse = true;
                return fb;
            }
        }
        
        // 如果没有可用的，创建新的
        if (this.frameBufferPool.length < this.config.maxFrameBuffers * 2) {
            const fb = this.createFrameBuffer();
            fb.inUse = true;
            this.frameBufferPool.push(fb);
            return fb;
        }
        
        return null;
    }
    
    releaseFrameBuffer(fb: FrameBufferInfo): void {
        fb.inUse = false;
    }
    
    bindFrameBuffer(fb: FrameBufferInfo | null): void {
        const gl = this.gl;
        
        if (fb) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb.framebuffer);
            gl.viewport(0, 0, fb.width, fb.height);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // ==================== 渲染方法 ====================
    
    clear(color?: Color): void {
        const gl = this.gl;
        
        if (color) {
            gl.clearColor(color.r / 255, color.g / 255, color.b / 255, color.a);
        }
        
        gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawCallsThisFrame++;
    }
    
    drawTexture(
        texture: WebGLTexture,
        x: number,
        y: number,
        width: number,
        height: number,
        opacity: number = 1
    ): void {
        const gl = this.gl;
        const program = this.programs.get('basic')!;
        
        gl.useProgram(program.program);
        
        // 设置矩阵
        const matrix = this.createTransformMatrix(x, y, width, height);
        gl.uniformMatrix3fv(program.uniforms.get('u_matrix')!, false, matrix);
        gl.uniform2f(
            program.uniforms.get('u_resolution')!,
            this.canvas.width,
            this.canvas.height
        );
        gl.uniform1f(program.uniforms.get('u_opacity')!, opacity);
        
        // 绑定纹理
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uniforms.get('u_texture')!, 0);
        
        // 绘制
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
        
        this.drawCallsThisFrame++;
    }
    
    drawTextureWithBlend(
        srcTexture: WebGLTexture,
        dstTexture: WebGLTexture,
        blendMode: BlendMode,
        opacity: number = 1
    ): void {
        const gl = this.gl;
        const program = this.programs.get('blend')!;
        
        gl.useProgram(program.program);
        
        // 绑定纹理
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, srcTexture);
        gl.uniform1i(program.uniforms.get('u_srcTexture')!, 0);
        
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, dstTexture);
        gl.uniform1i(program.uniforms.get('u_dstTexture')!, 1);
        
        // 设置混合模式
        gl.uniform1i(program.uniforms.get('u_blendMode')!, this.blendModeToInt(blendMode));
        gl.uniform1f(program.uniforms.get('u_opacity')!, opacity);
        
        // 绘制
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
        
        this.drawCallsThisFrame++;
    }
    
    drawOnionSkin(
        texture: WebGLTexture,
        tintColor: Color,
        opacity: number,
        mode: 'tint' | 'outline' | 'silhouette' = 'tint'
    ): void {
        const gl = this.gl;
        const program = this.programs.get('onionSkin')!;
        
        gl.useProgram(program.program);
        
        // 绑定纹理
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(program.uniforms.get('u_texture')!, 0);
        
        // 设置参数
        gl.uniform4f(
            program.uniforms.get('u_tintColor')!,
            tintColor.r / 255,
            tintColor.g / 255,
            tintColor.b / 255,
            tintColor.a
        );
        gl.uniform1f(program.uniforms.get('u_opacity')!, opacity);
        gl.uniform1i(
            program.uniforms.get('u_mode')!,
            mode === 'tint' ? 0 : mode === 'outline' ? 1 : 2
        );
        
        // 绘制
        gl.bindVertexArray(this.quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
        
        this.drawCallsThisFrame++;
    }

    // ==================== 笔刷渲染 ====================
    
    drawBrushStroke(
        points: Float32Array,
        color: Color,
        brushTexture: WebGLTexture | null,
        settings: {
            size: number;
            opacity: number;
            flow: number;
            hardness: number;
            rotation: number;
            roundness: number;
        }
    ): void {
        const gl = this.gl;
        const program = this.programs.get('brush')!;
        
        gl.useProgram(program.program);
        
        // 创建点缓冲
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STREAM_DRAW);
        
        // 设置属性
        const posLoc = program.attributes.get('a_position')!;
        const pressureLoc = program.attributes.get('a_pressure')!;
        const sizeLoc = program.attributes.get('a_size')!;
        
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 24, 0);
        
        gl.enableVertexAttribArray(pressureLoc);
        gl.vertexAttribPointer(pressureLoc, 1, gl.FLOAT, false, 24, 8);
        
        gl.enableVertexAttribArray(sizeLoc);
        gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 24, 20);
        
        // 设置 uniforms
        const matrix = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
        gl.uniformMatrix3fv(program.uniforms.get('u_matrix')!, false, matrix);
        gl.uniform2f(
            program.uniforms.get('u_resolution')!,
            this.canvas.width,
            this.canvas.height
        );
        gl.uniform1f(program.uniforms.get('u_baseSize')!, settings.size);
        
        gl.uniform4f(
            program.uniforms.get('u_color')!,
            color.r / 255,
            color.g / 255,
            color.b / 255,
            color.a
        );
        gl.uniform1f(program.uniforms.get('u_opacity')!, settings.opacity);
        gl.uniform1f(program.uniforms.get('u_flow')!, settings.flow);
        gl.uniform1f(program.uniforms.get('u_hardness')!, settings.hardness);
        gl.uniform1f(program.uniforms.get('u_rotation')!, (settings.rotation * Math.PI) / 180);
        gl.uniform2f(program.uniforms.get('u_roundness')!, 1, settings.roundness);
        
        // 笔刷纹理
        if (brushTexture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, brushTexture);
            gl.uniform1i(program.uniforms.get('u_brushTexture')!, 0);
            gl.uniform1i(program.uniforms.get('u_useBrushTexture')!, 1);
        } else {
            gl.uniform1i(program.uniforms.get('u_useBrushTexture')!, 0);
        }
        
        // 启用点精灵
        gl.enable(gl.PROGRAM_POINT_SIZE_EXT || 0x8642);
        
        // 绘制点
        const pointCount = points.length / 6;  // 6 floats per point
        gl.drawArrays(gl.POINTS, 0, pointCount);
        
        // 清理
        gl.deleteBuffer(buffer);
        
        this.drawCallsThisFrame++;
    }

    // ==================== 分块渲染 ====================
    
    getTileKey(x: number, y: number): string {
        return `${x},${y}`;
    }
    
    getVisibleTiles(): TileInfo[] {
        const { tileSize } = this.config;
        const { x, y, width, height, zoom } = this.viewport;
        
        const startX = Math.floor(x / tileSize);
        const startY = Math.floor(y / tileSize);
        const endX = Math.ceil((x + width / zoom) / tileSize);
        const endY = Math.ceil((y + height / zoom) / tileSize);
        
        const tiles: TileInfo[] = [];
        
        for (let ty = startY; ty <= endY; ty++) {
            for (let tx = startX; tx <= endX; tx++) {
                const key = this.getTileKey(tx, ty);
                let tile = this.tileCache.get(key);
                
                if (!tile) {
                    tile = {
                        key,
                        x: tx,
                        y: ty,
                        texture: null,
                        dirty: true,
                        lastAccess: Date.now(),
                    };
                    this.tileCache.set(key, tile);
                }
                
                tile.lastAccess = Date.now();
                tiles.push(tile);
            }
        }
        
        // LRU 清理
        this.cleanupTileCache();
        
        return tiles;
    }
    
    markTileDirty(x: number, y: number): void {
        const key = this.getTileKey(x, y);
        const tile = this.tileCache.get(key);
        if (tile) {
            tile.dirty = true;
        }
    }
    
    markRegionDirty(rect: Rect): void {
        const { tileSize } = this.config;
        
        const startX = Math.floor(rect.x / tileSize);
        const startY = Math.floor(rect.y / tileSize);
        const endX = Math.ceil((rect.x + rect.width) / tileSize);
        const endY = Math.ceil((rect.y + rect.height) / tileSize);
        
        for (let ty = startY; ty <= endY; ty++) {
            for (let tx = startX; tx <= endX; tx++) {
                this.markTileDirty(tx, ty);
            }
        }
    }
    
    private cleanupTileCache(): void {
        const { maxCachedTiles } = this.config;
        
        if (this.tileCache.size <= maxCachedTiles) return;
        
        // 按最后访问时间排序
        const tiles = Array.from(this.tileCache.entries())
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess);
        
        // 删除最旧的
        const toRemove = tiles.slice(0, tiles.length - maxCachedTiles);
        for (const [key, tile] of toRemove) {
            if (tile.texture) {
                this.gl.deleteTexture(tile.texture);
            }
            this.tileCache.delete(key);
        }
    }

    // ==================== 辅助方法 ====================
    
    private createTransformMatrix(
        x: number,
        y: number,
        width: number,
        height: number
    ): Float32Array {
        // 简化的 2D 变换矩阵
        return new Float32Array([
            width, 0, 0,
            0, height, 0,
            x, y, 1,
        ]);
    }
    
    private blendModeToInt(mode: BlendMode): number {
        const modes: BlendMode[] = [
            'normal', 'multiply', 'screen', 'overlay',
            'darken', 'lighten', 'color-dodge', 'color-burn',
            'hard-light', 'soft-light', 'difference', 'exclusion',
            'hue', 'saturation', 'color', 'luminosity',
            'add', 'subtract',
        ];
        return modes.indexOf(mode);
    }

    // ==================== 性能统计 ====================
    
    beginFrame(): void {
        const now = performance.now();
        
        // 计算 FPS
        this.frameCount++;
        const elapsed = now - this.lastFrameTime;
        
        if (elapsed >= 1000) {
            this.stats.fps = Math.round((this.frameCount * 1000) / elapsed);
            this.stats.frameTime = elapsed / this.frameCount;
            this.frameCount = 0;
            this.lastFrameTime = now;
        }
        
        this.drawCallsThisFrame = 0;
    }
    
    endFrame(): void {
        this.stats.drawCalls = this.drawCallsThisFrame;
        
        // 内存统计
        if ((performance as any).memory) {
            this.stats.heapUsed = (performance as any).memory.usedJSHeapSize;
            this.stats.heapTotal = (performance as any).memory.totalJSHeapSize;
        }
    }
    
    getStats(): PerformanceStats {
        return { ...this.stats };
    }

    // ==================== 资源清理 ====================
    
    dispose(): void {
        const gl = this.gl;
        
        // 删除着色器程序
        for (const { program } of this.programs.values()) {
            gl.deleteProgram(program);
        }
        this.programs.clear();
        
        // 删除纹理
        for (const { texture } of this.texturePool.values()) {
            gl.deleteTexture(texture);
        }
        this.texturePool.clear();
        
        // 删除帧缓冲
        for (const fb of this.frameBufferPool) {
            gl.deleteFramebuffer(fb.framebuffer);
            gl.deleteTexture(fb.texture);
        }
        this.frameBufferPool = [];
        
        // 删除分块缓存
        for (const tile of this.tileCache.values()) {
            if (tile.texture) {
                gl.deleteTexture(tile.texture);
            }
        }
        this.tileCache.clear();
        
        // 删除几何缓冲
        if (this.quadVAO) gl.deleteVertexArray(this.quadVAO);
        if (this.quadVBO) gl.deleteBuffer(this.quadVBO);
    }
}
