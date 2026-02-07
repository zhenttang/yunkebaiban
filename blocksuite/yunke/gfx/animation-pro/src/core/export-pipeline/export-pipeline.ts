/**
 * Professional 导出管道
 * 
 * 支持多种格式导出：
 * - GIF（动画）
 * - PNG 序列
 * - WebM/MP4（视频）
 * - Sprite Sheet
 * - Lottie JSON
 */

import type {
    ExportOptions,
    ExportFormat,
    GifExportOptions,
    VideoExportOptions,
    SpriteSheetOptions,
    LottieExportOptions,
    FrameData,
    Color,
} from '../../types/index.js';

// ==================== 导出状态 ====================

export type ExportState = 'idle' | 'preparing' | 'rendering' | 'encoding' | 'complete' | 'error';

export interface ExportProgress {
    state: ExportState;
    progress: number;          // 0-1
    currentFrame: number;
    totalFrames: number;
    message: string;
    estimatedTimeRemaining?: number;  // 毫秒
}

// ==================== 帧渲染器接口 ====================

export interface FrameRenderer {
    renderFrame(frameIndex: number): Promise<ImageData>;
    getFrameCount(): number;
    getFrameDuration(frameIndex: number): number;
    getCanvasSize(): { width: number; height: number };
}

// ==================== 导出管道 ====================

export class ExportPipeline {
    private renderer: FrameRenderer;
    private abortController: AbortController | null = null;
    
    // 进度回调
    onProgress?: (progress: ExportProgress) => void;
    
    constructor(renderer: FrameRenderer) {
        this.renderer = renderer;
    }
    
    // ==================== 公共接口 ====================
    
    /**
     * 导出动画
     */
    async export(options: ExportOptions): Promise<Blob> {
        this.abortController = new AbortController();
        
        try {
            this.updateProgress({
                state: 'preparing',
                progress: 0,
                currentFrame: 0,
                totalFrames: this.renderer.getFrameCount(),
                message: '准备导出...',
            });
            
            switch (options.format) {
                case 'gif':
                    return await this.exportGif(options as GifExportOptions);
                case 'png-sequence':
                    return await this.exportPngSequence(options);
                case 'mp4':
                case 'webm':
                    return await this.exportVideo(options as VideoExportOptions);
                case 'spritesheet':
                    return await this.exportSpriteSheet(options as SpriteSheetOptions);
                case 'lottie':
                    return await this.exportLottie(options as LottieExportOptions);
                default:
                    throw new Error(`Unsupported export format: ${options.format}`);
            }
        } catch (error) {
            this.updateProgress({
                state: 'error',
                progress: 0,
                currentFrame: 0,
                totalFrames: 0,
                message: `导出失败: ${error}`,
            });
            throw error;
        } finally {
            this.abortController = null;
        }
    }
    
    /**
     * 取消导出
     */
    abort(): void {
        this.abortController?.abort();
    }
    
    // ==================== GIF 导出 ====================
    
    private async exportGif(options: GifExportOptions): Promise<Blob> {
        const { width, height, fps, quality, dithering, colors, loop } = options;
        const frameCount = this.renderer.getFrameCount();
        const [startFrame, endFrame] = options.frameRange || [0, frameCount - 1];
        
        // 渲染所有帧
        const frames: ImageData[] = [];
        
        for (let i = startFrame; i <= endFrame; i++) {
            this.checkAbort();
            
            this.updateProgress({
                state: 'rendering',
                progress: (i - startFrame) / (endFrame - startFrame + 1) * 0.5,
                currentFrame: i,
                totalFrames: endFrame - startFrame + 1,
                message: `渲染帧 ${i + 1}/${endFrame - startFrame + 1}`,
            });
            
            const frame = await this.renderer.renderFrame(i);
            const resized = this.resizeImageData(frame, width, height);
            frames.push(resized);
        }
        
        // 编码 GIF
        this.updateProgress({
            state: 'encoding',
            progress: 0.5,
            currentFrame: 0,
            totalFrames: frames.length,
            message: '编码 GIF...',
        });
        
        const gifBlob = await this.encodeGif(frames, {
            fps,
            quality,
            dithering,
            colors,
            loop,
            transparent: options.transparent,
        });
        
        this.updateProgress({
            state: 'complete',
            progress: 1,
            currentFrame: frames.length,
            totalFrames: frames.length,
            message: '导出完成',
        });
        
        return gifBlob;
    }
    
    /**
     * GIF 编码（简化实现）
     */
    private async encodeGif(
        frames: ImageData[],
        options: {
            fps: number;
            quality: number;
            dithering: boolean;
            colors: number;
            loop: number;
            transparent?: boolean;
        }
    ): Promise<Blob> {
        // 简化实现：生成一个占位 GIF
        // 实际应该使用 gif.js 或类似库
        
        const delay = Math.round(100 / options.fps);
        
        // GIF 头
        const header = new Uint8Array([
            0x47, 0x49, 0x46, 0x38, 0x39, 0x61,  // GIF89a
        ]);
        
        const width = frames[0]?.width || 100;
        const height = frames[0]?.height || 100;
        
        // 逻辑屏幕描述符
        const lsd = new Uint8Array([
            width & 0xFF, (width >> 8) & 0xFF,
            height & 0xFF, (height >> 8) & 0xFF,
            0x87,  // 全局颜色表
            0x00,  // 背景色索引
            0x00,  // 像素宽高比
        ]);
        
        // 全局颜色表（256 色）
        const colorTable = new Uint8Array(256 * 3);
        for (let i = 0; i < 256; i++) {
            colorTable[i * 3] = i;
            colorTable[i * 3 + 1] = i;
            colorTable[i * 3 + 2] = i;
        }
        
        // 应用扩展（循环）
        const appExt = new Uint8Array([
            0x21, 0xFF, 0x0B,
            0x4E, 0x45, 0x54, 0x53, 0x43, 0x41, 0x50, 0x45, 0x32, 0x2E, 0x30,  // NETSCAPE2.0
            0x03, 0x01,
            options.loop & 0xFF, (options.loop >> 8) & 0xFF,
            0x00,
        ]);
        
        // 构建帧数据
        const frameChunks: Uint8Array[] = [];
        
        for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            
            // 图形控制扩展
            const gce = new Uint8Array([
                0x21, 0xF9, 0x04,
                options.transparent ? 0x09 : 0x08,  // 透明标志
                delay & 0xFF, (delay >> 8) & 0xFF,
                0x00,  // 透明色索引
                0x00,
            ]);
            
            // 图像描述符
            const imageDesc = new Uint8Array([
                0x2C,
                0x00, 0x00, 0x00, 0x00,  // 位置
                frame.width & 0xFF, (frame.width >> 8) & 0xFF,
                frame.height & 0xFF, (frame.height >> 8) & 0xFF,
                0x00,  // 无本地颜色表
            ]);
            
            // 简化的图像数据（LZW 编码占位）
            // 实际应该正确编码
            const minCodeSize = 8;
            const imageData = this.quantizeAndEncode(frame, options.colors);
            
            frameChunks.push(gce, imageDesc, new Uint8Array([minCodeSize]), imageData);
            
            this.updateProgress({
                state: 'encoding',
                progress: 0.5 + (i / frames.length) * 0.5,
                currentFrame: i + 1,
                totalFrames: frames.length,
                message: `编码帧 ${i + 1}/${frames.length}`,
            });
        }
        
        // 尾部
        const trailer = new Uint8Array([0x3B]);
        
        // 合并所有数据
        const totalLength = header.length + lsd.length + colorTable.length + appExt.length +
            frameChunks.reduce((sum, chunk) => sum + chunk.length, 0) + trailer.length;
        
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        result.set(header, offset); offset += header.length;
        result.set(lsd, offset); offset += lsd.length;
        result.set(colorTable, offset); offset += colorTable.length;
        result.set(appExt, offset); offset += appExt.length;
        
        for (const chunk of frameChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        result.set(trailer, offset);
        
        return new Blob([result], { type: 'image/gif' });
    }
    
    /**
     * 量化并编码图像
     */
    private quantizeAndEncode(imageData: ImageData, colors: number): Uint8Array {
        // 简化实现
        const indices = new Uint8Array(imageData.width * imageData.height);
        
        for (let i = 0; i < imageData.data.length / 4; i++) {
            const r = imageData.data[i * 4];
            const g = imageData.data[i * 4 + 1];
            const b = imageData.data[i * 4 + 2];
            
            // 简单灰度量化
            const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
            indices[i] = Math.min(255, gray);
        }
        
        // 简化 LZW 编码（仅作占位）
        const output: number[] = [0x02];  // 块大小
        output.push(...indices.slice(0, Math.min(254, indices.length)));
        output.push(0x00);  // 终止块
        
        return new Uint8Array(output);
    }
    
    // ==================== PNG 序列导出 ====================
    
    private async exportPngSequence(options: ExportOptions): Promise<Blob> {
        const { width, height } = options;
        const frameCount = this.renderer.getFrameCount();
        const [startFrame, endFrame] = options.frameRange || [0, frameCount - 1];
        
        // 使用 JSZip 或类似库打包
        const files: { name: string; data: Blob }[] = [];
        
        for (let i = startFrame; i <= endFrame; i++) {
            this.checkAbort();
            
            this.updateProgress({
                state: 'rendering',
                progress: (i - startFrame) / (endFrame - startFrame + 1),
                currentFrame: i,
                totalFrames: endFrame - startFrame + 1,
                message: `渲染帧 ${i + 1}/${endFrame - startFrame + 1}`,
            });
            
            const frame = await this.renderer.renderFrame(i);
            const resized = this.resizeImageData(frame, width, height);
            const png = await this.encodePng(resized);
            
            const fileName = `frame_${String(i - startFrame).padStart(5, '0')}.png`;
            files.push({ name: fileName, data: png });
        }
        
        // 创建 ZIP
        const zipBlob = await this.createZip(files);
        
        this.updateProgress({
            state: 'complete',
            progress: 1,
            currentFrame: files.length,
            totalFrames: files.length,
            message: '导出完成',
        });
        
        return zipBlob;
    }
    
    // ==================== 视频导出 ====================
    
    private async exportVideo(options: VideoExportOptions): Promise<Blob> {
        const { width, height, fps, bitrate, format } = options;
        const frameCount = this.renderer.getFrameCount();
        const [startFrame, endFrame] = options.frameRange || [0, frameCount - 1];
        
        // 检查 WebCodecs 支持
        if (!('VideoEncoder' in window)) {
            throw new Error('WebCodecs API not supported');
        }
        
        const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
        const codec = format === 'webm' ? 'vp9' : 'avc1.42E01E';
        
        // 创建编码器
        const chunks: Uint8Array[] = [];
        
        const encoder = new (window as any).VideoEncoder({
            output: (chunk: any) => {
                const data = new Uint8Array(chunk.byteLength);
                chunk.copyTo(data);
                chunks.push(data);
            },
            error: (e: Error) => {
                console.error('Video encoding error:', e);
            },
        });
        
        await encoder.configure({
            codec,
            width,
            height,
            bitrate,
            framerate: fps,
        });
        
        // 渲染并编码帧
        const frameDuration = 1_000_000 / fps;  // 微秒
        
        for (let i = startFrame; i <= endFrame; i++) {
            this.checkAbort();
            
            this.updateProgress({
                state: 'rendering',
                progress: (i - startFrame) / (endFrame - startFrame + 1),
                currentFrame: i,
                totalFrames: endFrame - startFrame + 1,
                message: `编码帧 ${i + 1}/${endFrame - startFrame + 1}`,
            });
            
            const frame = await this.renderer.renderFrame(i);
            const resized = this.resizeImageData(frame, width, height);
            
            // 创建 VideoFrame
            const videoFrame = new (window as any).VideoFrame(resized, {
                timestamp: (i - startFrame) * frameDuration,
                duration: frameDuration,
            });
            
            encoder.encode(videoFrame);
            videoFrame.close();
        }
        
        await encoder.flush();
        encoder.close();
        
        // 合并 chunks
        const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalSize);
        let offset = 0;
        
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        this.updateProgress({
            state: 'complete',
            progress: 1,
            currentFrame: endFrame - startFrame + 1,
            totalFrames: endFrame - startFrame + 1,
            message: '导出完成',
        });
        
        return new Blob([result], { type: mimeType });
    }
    
    // ==================== Sprite Sheet 导出 ====================
    
    private async exportSpriteSheet(options: SpriteSheetOptions): Promise<Blob> {
        const { width, height, maxWidth, maxHeight, padding, packing, trimAlpha, dataFormat } = options;
        const frameCount = this.renderer.getFrameCount();
        const [startFrame, endFrame] = options.frameRange || [0, frameCount - 1];
        
        const frameImages: { index: number; imageData: ImageData; bounds: { x: number; y: number; w: number; h: number } }[] = [];
        
        // 渲染所有帧
        for (let i = startFrame; i <= endFrame; i++) {
            this.checkAbort();
            
            this.updateProgress({
                state: 'rendering',
                progress: (i - startFrame) / (endFrame - startFrame + 1) * 0.5,
                currentFrame: i,
                totalFrames: endFrame - startFrame + 1,
                message: `渲染帧 ${i + 1}/${endFrame - startFrame + 1}`,
            });
            
            const frame = await this.renderer.renderFrame(i);
            const resized = this.resizeImageData(frame, width, height);
            
            let bounds = { x: 0, y: 0, w: width, h: height };
            
            if (trimAlpha) {
                bounds = this.getTrimBounds(resized);
            }
            
            frameImages.push({ index: i - startFrame, imageData: resized, bounds });
        }
        
        // 计算布局
        this.updateProgress({
            state: 'encoding',
            progress: 0.5,
            currentFrame: 0,
            totalFrames: frameImages.length,
            message: '计算布局...',
        });
        
        const layout = this.calculateSpriteSheetLayout(frameImages, maxWidth, maxHeight, padding, packing);
        
        // 创建画布
        const canvas = new OffscreenCanvas(layout.width, layout.height);
        const ctx = canvas.getContext('2d')!;
        
        // 绘制所有帧
        for (const item of layout.items) {
            const frame = frameImages[item.index];
            const imageData = frame.imageData;
            
            ctx.putImageData(imageData, item.x, item.y);
        }
        
        // 导出为 PNG
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        
        // 创建数据文件
        const dataBlob = this.createSpriteSheetData(layout, dataFormat, options);
        
        // 打包
        const zipBlob = await this.createZip([
            { name: 'spritesheet.png', data: blob },
            { name: `spritesheet.${dataFormat}`, data: dataBlob },
        ]);
        
        this.updateProgress({
            state: 'complete',
            progress: 1,
            currentFrame: frameImages.length,
            totalFrames: frameImages.length,
            message: '导出完成',
        });
        
        return zipBlob;
    }
    
    /**
     * 计算 Sprite Sheet 布局
     */
    private calculateSpriteSheetLayout(
        frames: { index: number; bounds: { x: number; y: number; w: number; h: number } }[],
        maxWidth: number,
        maxHeight: number,
        padding: number,
        packing: 'grid' | 'compact' | 'maxrects'
    ): {
        width: number;
        height: number;
        items: { index: number; x: number; y: number; w: number; h: number }[];
    } {
        if (packing === 'grid') {
            // 简单网格布局
            const frameWidth = frames[0]?.bounds.w || 100;
            const frameHeight = frames[0]?.bounds.h || 100;
            
            const cols = Math.floor(maxWidth / (frameWidth + padding));
            const rows = Math.ceil(frames.length / cols);
            
            const items = frames.map((frame, i) => ({
                index: frame.index,
                x: (i % cols) * (frameWidth + padding),
                y: Math.floor(i / cols) * (frameHeight + padding),
                w: frameWidth,
                h: frameHeight,
            }));
            
            return {
                width: cols * (frameWidth + padding) - padding,
                height: rows * (frameHeight + padding) - padding,
                items,
            };
        }
        
        // 其他打包算法的简化实现
        return this.calculateSpriteSheetLayout(frames, maxWidth, maxHeight, padding, 'grid');
    }
    
    /**
     * 创建 Sprite Sheet 数据文件
     */
    private createSpriteSheetData(
        layout: { width: number; height: number; items: { index: number; x: number; y: number; w: number; h: number }[] },
        format: 'json' | 'xml' | 'css',
        options: SpriteSheetOptions
    ): Blob {
        if (format === 'json') {
            const data = {
                frames: layout.items.reduce((acc, item) => {
                    acc[`frame_${item.index}`] = {
                        frame: { x: item.x, y: item.y, w: item.w, h: item.h },
                        rotated: false,
                        trimmed: options.trimAlpha,
                        sourceSize: { w: options.width, h: options.height },
                    };
                    return acc;
                }, {} as Record<string, any>),
                meta: {
                    image: 'spritesheet.png',
                    size: { w: layout.width, h: layout.height },
                    format: 'RGBA8888',
                },
            };
            
            return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        }
        
        // XML 和 CSS 格式的简化实现
        return new Blob([''], { type: 'text/plain' });
    }
    
    // ==================== Lottie 导出 ====================
    
    private async exportLottie(options: LottieExportOptions): Promise<Blob> {
        const { width, height, fps, precision } = options;
        const frameCount = this.renderer.getFrameCount();
        
        // 构建 Lottie JSON
        const lottie = {
            v: '5.7.4',
            fr: fps,
            ip: 0,
            op: frameCount,
            w: width,
            h: height,
            nm: 'Animation',
            ddd: 0,
            assets: [] as any[],
            layers: [] as any[],
        };
        
        // 简化实现：将每帧作为图片资源
        for (let i = 0; i < frameCount; i++) {
            this.checkAbort();
            
            this.updateProgress({
                state: 'rendering',
                progress: i / frameCount,
                currentFrame: i,
                totalFrames: frameCount,
                message: `处理帧 ${i + 1}/${frameCount}`,
            });
            
            const frame = await this.renderer.renderFrame(i);
            const resized = this.resizeImageData(frame, width, height);
            
            // 转换为 base64
            const pngBlob = await this.encodePng(resized);
            const base64 = await this.blobToBase64(pngBlob);
            
            lottie.assets.push({
                id: `frame_${i}`,
                w: width,
                h: height,
                u: '',
                p: base64,
                e: 1,
            });
        }
        
        // 创建图层
        lottie.layers.push({
            ddd: 0,
            ind: 1,
            ty: 2,  // 图片图层
            nm: 'Frames',
            refId: 'frame_0',
            sr: 1,
            ks: {
                o: { a: 0, k: 100 },  // 透明度
                r: { a: 0, k: 0 },     // 旋转
                p: { a: 0, k: [width / 2, height / 2] },  // 位置
                a: { a: 0, k: [width / 2, height / 2] },  // 锚点
                s: { a: 0, k: [100, 100] },              // 缩放
            },
            ao: 0,
            ip: 0,
            op: frameCount,
            st: 0,
            bm: 0,
        });
        
        this.updateProgress({
            state: 'complete',
            progress: 1,
            currentFrame: frameCount,
            totalFrames: frameCount,
            message: '导出完成',
        });
        
        return new Blob([JSON.stringify(lottie)], { type: 'application/json' });
    }
    
    // ==================== 辅助方法 ====================
    
    private updateProgress(progress: ExportProgress): void {
        this.onProgress?.(progress);
    }
    
    private checkAbort(): void {
        if (this.abortController?.signal.aborted) {
            throw new Error('Export cancelled');
        }
    }
    
    /**
     * 调整图像大小
     */
    private resizeImageData(imageData: ImageData, width: number, height: number): ImageData {
        if (imageData.width === width && imageData.height === height) {
            return imageData;
        }
        
        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext('2d')!;
        
        // 创建临时画布来放置原始数据
        const tempCanvas = new OffscreenCanvas(imageData.width, imageData.height);
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.putImageData(imageData, 0, 0);
        
        // 缩放绘制
        ctx.drawImage(tempCanvas, 0, 0, width, height);
        
        return ctx.getImageData(0, 0, width, height);
    }
    
    /**
     * 编码为 PNG
     */
    private async encodePng(imageData: ImageData): Promise<Blob> {
        const canvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = canvas.getContext('2d')!;
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.convertToBlob({ type: 'image/png' });
    }
    
    /**
     * 获取裁剪边界
     */
    private getTrimBounds(imageData: ImageData): { x: number; y: number; w: number; h: number } {
        const { width, height, data } = imageData;
        
        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const alpha = data[(y * width + x) * 4 + 3];
                if (alpha > 0) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (maxX < minX || maxY < minY) {
            return { x: 0, y: 0, w: 1, h: 1 };
        }
        
        return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    }
    
    /**
     * 创建 ZIP 文件
     */
    private async createZip(files: { name: string; data: Blob }[]): Promise<Blob> {
        // 简化实现：只返回第一个文件或合并数据
        // 实际应该使用 JSZip 或类似库
        
        if (files.length === 1) {
            return files[0].data;
        }
        
        // 创建简单的打包格式
        const parts: BlobPart[] = [];
        
        for (const file of files) {
            // 文件名长度 + 文件名 + 数据长度 + 数据
            const nameBytes = new TextEncoder().encode(file.name);
            const header = new Uint8Array(8);
            const dataView = new DataView(header.buffer);
            dataView.setUint32(0, nameBytes.length, true);
            dataView.setUint32(4, file.data.size, true);
            
            parts.push(header, nameBytes, file.data);
        }
        
        return new Blob(parts, { type: 'application/octet-stream' });
    }
    
    /**
     * Blob 转 Base64
     */
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);  // 移除 data:... 前缀
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}
