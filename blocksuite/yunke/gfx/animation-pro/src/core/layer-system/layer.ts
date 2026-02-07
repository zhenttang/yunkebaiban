/**
 * Professional 图层系统
 * 
 * 特性：
 * - 光栅图层（分块存储）
 * - 矢量图层
 * - 图层组
 * - 混合模式
 * - 蒙版
 * - 独立历史栈
 */

import type {
    BlendMode,
    Color,
    LayerData,
    LayerType,
    Point,
    Rect,
    TileData,
    Transform,
} from '../../types/index.js';
import { DEFAULT_TRANSFORM } from '../../types/index.js';

// ==================== 常量 ====================

export const TILE_SIZE = 256;
export const MAX_HISTORY_STEPS = 250;

// ==================== 历史记录 ====================

interface HistoryRecord {
    type: 'stroke' | 'fill' | 'transform' | 'clear' | 'paste';
    timestamp: number;
    bounds: Rect;
    tiles: Map<string, Uint8ClampedArray>;
    metadata?: Record<string, unknown>;
}

class HistoryStack {
    private records: HistoryRecord[] = [];
    private currentIndex: number = -1;
    private maxSize: number;
    
    constructor(maxSize: number = MAX_HISTORY_STEPS) {
        this.maxSize = maxSize;
    }
    
    push(record: HistoryRecord): void {
        // 删除当前位置之后的所有记录（redo 分支）
        if (this.currentIndex < this.records.length - 1) {
            this.records = this.records.slice(0, this.currentIndex + 1);
        }
        
        // 添加新记录
        this.records.push(record);
        this.currentIndex = this.records.length - 1;
        
        // 限制大小
        while (this.records.length > this.maxSize) {
            this.records.shift();
            this.currentIndex--;
        }
    }
    
    undo(): HistoryRecord | null {
        if (this.currentIndex < 0) return null;
        
        const record = this.records[this.currentIndex];
        this.currentIndex--;
        return record;
    }
    
    redo(): HistoryRecord | null {
        if (this.currentIndex >= this.records.length - 1) return null;
        
        this.currentIndex++;
        return this.records[this.currentIndex];
    }
    
    canUndo(): boolean {
        return this.currentIndex >= 0;
    }
    
    canRedo(): boolean {
        return this.currentIndex < this.records.length - 1;
    }
    
    clear(): void {
        this.records = [];
        this.currentIndex = -1;
    }
    
    getSize(): number {
        return this.records.length;
    }
}

// ==================== 图层基类 ====================

export abstract class Layer {
    readonly id: string;
    name: string;
    visible: boolean = true;
    locked: boolean = false;
    opacity: number = 1.0;
    blendMode: BlendMode = 'normal';
    transform: Transform = { ...DEFAULT_TRANSFORM };
    
    // 父级引用
    parent?: LayerGroup;
    
    // 蒙版
    mask?: Layer;
    clippingMask: boolean = false;
    
    // 脏区域
    protected dirtyRegion: Rect | null = null;
    
    // 元数据
    metadata: Record<string, unknown> = {};
    
    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
    
    // 抽象方法
    abstract get type(): LayerType;
    abstract clone(): Layer;
    abstract getBounds(): Rect;
    abstract isEmpty(): boolean;
    abstract clear(): void;
    abstract serialize(): LayerData;
    
    // 脏区域管理
    markDirty(region?: Rect): void {
        if (!region) {
            this.dirtyRegion = this.getBounds();
            return;
        }
        
        if (!this.dirtyRegion) {
            this.dirtyRegion = { ...region };
        } else {
            this.dirtyRegion = this.unionRect(this.dirtyRegion, region);
        }
    }
    
    clearDirty(): void {
        this.dirtyRegion = null;
    }
    
    getDirtyRegion(): Rect | null {
        return this.dirtyRegion;
    }
    
    // 矩形合并
    protected unionRect(a: Rect, b: Rect): Rect {
        const minX = Math.min(a.x, b.x);
        const minY = Math.min(a.y, b.y);
        const maxX = Math.max(a.x + a.width, b.x + b.width);
        const maxY = Math.max(a.y + a.height, b.y + b.height);
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    }
    
    // 矩形相交检测
    protected intersectsRect(a: Rect, b: Rect): boolean {
        return !(
            a.x + a.width < b.x ||
            b.x + b.width < a.x ||
            a.y + a.height < b.y ||
            b.y + b.height < a.y
        );
    }
}

// ==================== 光栅图层 ====================

export class RasterLayer extends Layer {
    readonly type = 'raster' as LayerType;
    
    // 分块存储
    private tiles: Map<string, TileData> = new Map();
    
    // 历史记录
    private history: HistoryStack = new HistoryStack();
    
    // 边界缓存
    private cachedBounds: Rect | null = null;
    
    constructor(id: string, name: string) {
        super(id, name);
    }
    
    // ==================== 分块操作 ====================
    
    private getTileKey(tileX: number, tileY: number): string {
        return `${tileX},${tileY}`;
    }
    
    private getTileCoords(x: number, y: number): { tileX: number; tileY: number; localX: number; localY: number } {
        const tileX = Math.floor(x / TILE_SIZE);
        const tileY = Math.floor(y / TILE_SIZE);
        const localX = x - tileX * TILE_SIZE;
        const localY = y - tileY * TILE_SIZE;
        
        return { tileX, tileY, localX, localY };
    }
    
    private getOrCreateTile(tileX: number, tileY: number): TileData {
        const key = this.getTileKey(tileX, tileY);
        let tile = this.tiles.get(key);
        
        if (!tile) {
            tile = {
                x: tileX * TILE_SIZE,
                y: tileY * TILE_SIZE,
                width: TILE_SIZE,
                height: TILE_SIZE,
                data: new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4),
                dirty: true,
            };
            this.tiles.set(key, tile);
            this.invalidateBoundsCache();
        }
        
        return tile;
    }
    
    getTile(tileX: number, tileY: number): TileData | undefined {
        return this.tiles.get(this.getTileKey(tileX, tileY));
    }
    
    getAllTiles(): Map<string, TileData> {
        return new Map(this.tiles);
    }
    
    // ==================== 像素操作 ====================
    
    getPixel(x: number, y: number): Color {
        const { tileX, tileY, localX, localY } = this.getTileCoords(x, y);
        const tile = this.tiles.get(this.getTileKey(tileX, tileY));
        
        if (!tile || !(tile.data instanceof Uint8ClampedArray)) {
            return { r: 0, g: 0, b: 0, a: 0 };
        }
        
        const idx = (localY * TILE_SIZE + localX) * 4;
        
        return {
            r: tile.data[idx],
            g: tile.data[idx + 1],
            b: tile.data[idx + 2],
            a: tile.data[idx + 3] / 255,
        };
    }
    
    setPixel(x: number, y: number, color: Color): void {
        const { tileX, tileY, localX, localY } = this.getTileCoords(x, y);
        const tile = this.getOrCreateTile(tileX, tileY);
        
        if (!(tile.data instanceof Uint8ClampedArray)) {
            tile.data = new Uint8ClampedArray(TILE_SIZE * TILE_SIZE * 4);
        }
        
        const idx = (localY * TILE_SIZE + localX) * 4;
        
        tile.data[idx] = color.r;
        tile.data[idx + 1] = color.g;
        tile.data[idx + 2] = color.b;
        tile.data[idx + 3] = Math.round(color.a * 255);
        
        tile.dirty = true;
        this.markDirty({ x, y, width: 1, height: 1 });
    }
    
    // ==================== 区域操作 ====================
    
    /**
     * 绘制到指定区域
     */
    drawImageData(
        imageData: ImageData,
        destX: number,
        destY: number,
        blendMode: 'source' | 'over' = 'over'
    ): void {
        const { width, height, data } = imageData;
        
        // 记录历史
        this.saveHistoryState('paste', { x: destX, y: destY, width, height });
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const srcIdx = (y * width + x) * 4;
                const srcColor: Color = {
                    r: data[srcIdx],
                    g: data[srcIdx + 1],
                    b: data[srcIdx + 2],
                    a: data[srcIdx + 3] / 255,
                };
                
                if (blendMode === 'source') {
                    this.setPixel(destX + x, destY + y, srcColor);
                } else {
                    // Alpha 合成
                    const dstColor = this.getPixel(destX + x, destY + y);
                    const blended = this.blendColors(srcColor, dstColor);
                    this.setPixel(destX + x, destY + y, blended);
                }
            }
        }
    }
    
    /**
     * 获取区域数据
     */
    getImageData(x: number, y: number, width: number, height: number): ImageData {
        const data = new Uint8ClampedArray(width * height * 4);
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const color = this.getPixel(x + px, y + py);
                const idx = (py * width + px) * 4;
                
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = Math.round(color.a * 255);
            }
        }
        
        return new ImageData(data, width, height);
    }
    
    // ==================== 历史记录 ====================
    
    private saveHistoryState(type: HistoryRecord['type'], bounds: Rect): void {
        // 获取受影响的分块数据
        const tiles = new Map<string, Uint8ClampedArray>();
        
        const startTileX = Math.floor(bounds.x / TILE_SIZE);
        const startTileY = Math.floor(bounds.y / TILE_SIZE);
        const endTileX = Math.ceil((bounds.x + bounds.width) / TILE_SIZE);
        const endTileY = Math.ceil((bounds.y + bounds.height) / TILE_SIZE);
        
        for (let ty = startTileY; ty < endTileX; ty++) {
            for (let tx = startTileX; tx < endTileY; tx++) {
                const tile = this.tiles.get(this.getTileKey(tx, ty));
                if (tile && tile.data instanceof Uint8ClampedArray) {
                    tiles.set(this.getTileKey(tx, ty), new Uint8ClampedArray(tile.data));
                }
            }
        }
        
        this.history.push({
            type,
            timestamp: Date.now(),
            bounds,
            tiles,
        });
    }
    
    private restoreHistoryState(record: HistoryRecord): void {
        for (const [key, data] of record.tiles) {
            const tile = this.tiles.get(key);
            if (tile) {
                tile.data = new Uint8ClampedArray(data);
                tile.dirty = true;
            }
        }
        
        this.markDirty(record.bounds);
    }
    
    undo(): boolean {
        const record = this.history.undo();
        if (!record) return false;
        
        this.restoreHistoryState(record);
        return true;
    }
    
    redo(): boolean {
        const record = this.history.redo();
        if (!record) return false;
        
        this.restoreHistoryState(record);
        return true;
    }
    
    canUndo(): boolean {
        return this.history.canUndo();
    }
    
    canRedo(): boolean {
        return this.history.canRedo();
    }
    
    // ==================== 图层操作 ====================
    
    getBounds(): Rect {
        if (this.cachedBounds) {
            return this.cachedBounds;
        }
        
        if (this.tiles.size === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        for (const tile of this.tiles.values()) {
            minX = Math.min(minX, tile.x);
            minY = Math.min(minY, tile.y);
            maxX = Math.max(maxX, tile.x + tile.width);
            maxY = Math.max(maxY, tile.y + tile.height);
        }
        
        this.cachedBounds = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
        
        return this.cachedBounds;
    }
    
    private invalidateBoundsCache(): void {
        this.cachedBounds = null;
    }
    
    isEmpty(): boolean {
        if (this.tiles.size === 0) return true;
        
        // 检查是否所有分块都是透明的
        for (const tile of this.tiles.values()) {
            if (tile.data instanceof Uint8ClampedArray) {
                for (let i = 3; i < tile.data.length; i += 4) {
                    if (tile.data[i] > 0) return false;
                }
            }
        }
        
        return true;
    }
    
    clear(): void {
        this.saveHistoryState('clear', this.getBounds());
        this.tiles.clear();
        this.invalidateBoundsCache();
        this.markDirty();
    }
    
    clone(): RasterLayer {
        const cloned = new RasterLayer(
            `${this.id}_copy`,
            `${this.name} 副本`
        );
        
        // 复制属性
        cloned.visible = this.visible;
        cloned.locked = this.locked;
        cloned.opacity = this.opacity;
        cloned.blendMode = this.blendMode;
        cloned.transform = { ...this.transform };
        cloned.metadata = { ...this.metadata };
        
        // 深拷贝分块
        for (const [key, tile] of this.tiles) {
            cloned.tiles.set(key, {
                ...tile,
                data: tile.data instanceof Uint8ClampedArray
                    ? new Uint8ClampedArray(tile.data)
                    : tile.data,
            });
        }
        
        return cloned;
    }
    
    serialize(): LayerData {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            transform: { ...this.transform },
            metadata: { ...this.metadata },
        };
    }
    
    // ==================== 辅助方法 ====================
    
    private blendColors(src: Color, dst: Color): Color {
        const srcA = src.a;
        const dstA = dst.a;
        const outA = srcA + dstA * (1 - srcA);
        
        if (outA === 0) {
            return { r: 0, g: 0, b: 0, a: 0 };
        }
        
        return {
            r: Math.round((src.r * srcA + dst.r * dstA * (1 - srcA)) / outA),
            g: Math.round((src.g * srcA + dst.g * dstA * (1 - srcA)) / outA),
            b: Math.round((src.b * srcA + dst.b * dstA * (1 - srcA)) / outA),
            a: outA,
        };
    }
}

// ==================== 图层组 ====================

export class LayerGroup extends Layer {
    readonly type = 'group' as LayerType;
    
    children: Layer[] = [];
    collapsed: boolean = false;
    
    // 是否作为动画帧
    isAnimationFrame: boolean = false;
    
    constructor(id: string, name: string) {
        super(id, name);
    }
    
    addLayer(layer: Layer, index?: number): void {
        layer.parent = this;
        
        if (index !== undefined && index >= 0 && index <= this.children.length) {
            this.children.splice(index, 0, layer);
        } else {
            this.children.push(layer);
        }
        
        this.markDirty();
    }
    
    removeLayer(layer: Layer): boolean {
        const index = this.children.indexOf(layer);
        if (index === -1) return false;
        
        this.children.splice(index, 1);
        layer.parent = undefined;
        this.markDirty();
        
        return true;
    }
    
    removeLayerAt(index: number): Layer | null {
        if (index < 0 || index >= this.children.length) return null;
        
        const [layer] = this.children.splice(index, 1);
        layer.parent = undefined;
        this.markDirty();
        
        return layer;
    }
    
    moveLayer(fromIndex: number, toIndex: number): boolean {
        if (
            fromIndex < 0 || fromIndex >= this.children.length ||
            toIndex < 0 || toIndex >= this.children.length
        ) {
            return false;
        }
        
        const [layer] = this.children.splice(fromIndex, 1);
        this.children.splice(toIndex, 0, layer);
        this.markDirty();
        
        return true;
    }
    
    getLayerById(id: string): Layer | undefined {
        for (const child of this.children) {
            if (child.id === id) return child;
            
            if (child instanceof LayerGroup) {
                const found = child.getLayerById(id);
                if (found) return found;
            }
        }
        
        return undefined;
    }
    
    getLayerIndex(layer: Layer): number {
        return this.children.indexOf(layer);
    }
    
    getBounds(): Rect {
        if (this.children.length === 0) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }
        
        let bounds: Rect | null = null;
        
        for (const child of this.children) {
            if (!child.visible) continue;
            
            const childBounds = child.getBounds();
            if (childBounds.width === 0 && childBounds.height === 0) continue;
            
            if (!bounds) {
                bounds = { ...childBounds };
            } else {
                bounds = this.unionRect(bounds, childBounds);
            }
        }
        
        return bounds || { x: 0, y: 0, width: 0, height: 0 };
    }
    
    isEmpty(): boolean {
        return this.children.length === 0 || this.children.every(c => c.isEmpty());
    }
    
    clear(): void {
        for (const child of this.children) {
            child.clear();
        }
        this.markDirty();
    }
    
    clone(): LayerGroup {
        const cloned = new LayerGroup(
            `${this.id}_copy`,
            `${this.name} 副本`
        );
        
        // 复制属性
        cloned.visible = this.visible;
        cloned.locked = this.locked;
        cloned.opacity = this.opacity;
        cloned.blendMode = this.blendMode;
        cloned.transform = { ...this.transform };
        cloned.collapsed = this.collapsed;
        cloned.isAnimationFrame = this.isAnimationFrame;
        cloned.metadata = { ...this.metadata };
        
        // 递归克隆子图层
        for (const child of this.children) {
            const clonedChild = child.clone();
            cloned.addLayer(clonedChild);
        }
        
        return cloned;
    }
    
    serialize(): LayerData {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            visible: this.visible,
            locked: this.locked,
            opacity: this.opacity,
            blendMode: this.blendMode,
            transform: { ...this.transform },
            children: this.children.map(c => c.id),
            metadata: {
                ...this.metadata,
                collapsed: this.collapsed,
                isAnimationFrame: this.isAnimationFrame,
            },
        };
    }
    
    /**
     * 扁平化所有子图层
     */
    flatten(): Layer[] {
        const result: Layer[] = [];
        
        const traverse = (layer: Layer) => {
            if (layer instanceof LayerGroup) {
                for (const child of layer.children) {
                    traverse(child);
                }
            } else {
                result.push(layer);
            }
        };
        
        traverse(this);
        return result;
    }
}

// ==================== 图层管理器 ====================

export class LayerManager {
    private root: LayerGroup;
    private selectedLayers: Set<string> = new Set();
    private activeLayerId: string | null = null;
    
    // 事件回调
    onLayerAdded?: (layer: Layer) => void;
    onLayerRemoved?: (layer: Layer) => void;
    onLayerChanged?: (layer: Layer) => void;
    onSelectionChanged?: (layerIds: string[]) => void;
    
    constructor() {
        this.root = new LayerGroup('root', 'Root');
    }
    
    getRoot(): LayerGroup {
        return this.root;
    }
    
    // ==================== 图层操作 ====================
    
    createRasterLayer(name: string, parent?: LayerGroup): RasterLayer {
        const id = this.generateId('layer');
        const layer = new RasterLayer(id, name);
        
        (parent || this.root).addLayer(layer);
        this.onLayerAdded?.(layer);
        
        return layer;
    }
    
    createLayerGroup(name: string, parent?: LayerGroup): LayerGroup {
        const id = this.generateId('group');
        const group = new LayerGroup(id, name);
        
        (parent || this.root).addLayer(group);
        this.onLayerAdded?.(group);
        
        return group;
    }
    
    deleteLayer(layerId: string): boolean {
        const layer = this.getLayerById(layerId);
        if (!layer || !layer.parent) return false;
        
        const removed = layer.parent.removeLayer(layer);
        if (removed) {
            this.selectedLayers.delete(layerId);
            if (this.activeLayerId === layerId) {
                this.activeLayerId = null;
            }
            this.onLayerRemoved?.(layer);
        }
        
        return removed;
    }
    
    duplicateLayer(layerId: string): Layer | null {
        const layer = this.getLayerById(layerId);
        if (!layer || !layer.parent) return null;
        
        const cloned = layer.clone();
        const index = layer.parent.getLayerIndex(layer);
        layer.parent.addLayer(cloned, index + 1);
        
        this.onLayerAdded?.(cloned);
        
        return cloned;
    }
    
    moveLayer(layerId: string, targetGroupId: string, index: number): boolean {
        const layer = this.getLayerById(layerId);
        const targetGroup = this.getLayerById(targetGroupId);
        
        if (!layer || !layer.parent || !(targetGroup instanceof LayerGroup)) {
            return false;
        }
        
        // 从原位置移除
        layer.parent.removeLayer(layer);
        
        // 添加到新位置
        targetGroup.addLayer(layer, index);
        
        this.onLayerChanged?.(layer);
        
        return true;
    }
    
    // ==================== 查询 ====================
    
    getLayerById(id: string): Layer | undefined {
        if (id === 'root') return this.root;
        return this.root.getLayerById(id);
    }
    
    getAllLayers(): Layer[] {
        return this.root.flatten();
    }
    
    getVisibleLayers(): Layer[] {
        return this.getAllLayers().filter(l => l.visible);
    }
    
    // ==================== 选择 ====================
    
    selectLayer(layerId: string, addToSelection: boolean = false): void {
        if (!addToSelection) {
            this.selectedLayers.clear();
        }
        
        this.selectedLayers.add(layerId);
        this.activeLayerId = layerId;
        
        this.onSelectionChanged?.(Array.from(this.selectedLayers));
    }
    
    deselectLayer(layerId: string): void {
        this.selectedLayers.delete(layerId);
        
        if (this.activeLayerId === layerId) {
            this.activeLayerId = this.selectedLayers.size > 0
                ? Array.from(this.selectedLayers)[0]
                : null;
        }
        
        this.onSelectionChanged?.(Array.from(this.selectedLayers));
    }
    
    clearSelection(): void {
        this.selectedLayers.clear();
        this.activeLayerId = null;
        this.onSelectionChanged?.([]);
    }
    
    getSelectedLayers(): Layer[] {
        return Array.from(this.selectedLayers)
            .map(id => this.getLayerById(id))
            .filter((l): l is Layer => l !== undefined);
    }
    
    getActiveLayer(): Layer | null {
        return this.activeLayerId ? this.getLayerById(this.activeLayerId) || null : null;
    }
    
    // ==================== 辅助方法 ====================
    
    private generateId(prefix: string): string {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    
    // ==================== 序列化 ====================
    
    serialize(): { root: LayerData; layers: Map<string, LayerData> } {
        const layers = new Map<string, LayerData>();
        
        const traverse = (layer: Layer) => {
            layers.set(layer.id, layer.serialize());
            
            if (layer instanceof LayerGroup) {
                for (const child of layer.children) {
                    traverse(child);
                }
            }
        };
        
        traverse(this.root);
        
        return {
            root: this.root.serialize(),
            layers,
        };
    }
}
