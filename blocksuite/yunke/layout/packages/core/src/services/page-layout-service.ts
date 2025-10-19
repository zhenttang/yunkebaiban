import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { signal } from '@preact/signals-core';
import type {
  IPageLayoutService,
  IStorageService,
  IColumnDistributor,
  PageLayoutMode,
  LayoutModeChangeEvent,
  DocLayoutConfig,
  LayoutModeConfigMap
} from '../types/contracts.js';
import { ServiceLocator } from '../di/service-container.js';

/**
 * 页面布局服务核心实现
 */
export class PageLayoutService implements IPageLayoutService {
  private layoutModes = new Map<string, PageLayoutMode>();
  private columnWidths = new Map<string, number[]>();
  private layoutChangeSubject = new Subject<LayoutModeChangeEvent>();
  
  // 当前状态信号
  private currentMode$ = signal<PageLayoutMode>(PageLayoutMode.Normal);
  private currentWidths$ = signal<number[]>([1]);
  
  // 服务依赖
  private storageService?: IStorageService;
  private columnDistributor?: IColumnDistributor;

  async initialize(): Promise<void> {
    try {
      // 获取依赖服务
      this.storageService = ServiceLocator.get('storageService');
      this.columnDistributor = ServiceLocator.get('columnDistributor');
      
      console.log('PageLayoutService initialized');
    } catch (error) {
      console.warn('Some services not available, using fallback:', error);
    }
  }

  async dispose(): Promise<void> {
    this.layoutChangeSubject.complete();
    this.layoutModes.clear();
    this.columnWidths.clear();
    console.log('PageLayoutService disposed');
  }

  async setLayoutMode(mode: PageLayoutMode, docId: string): Promise<void> {
    const previousMode = this.layoutModes.get(docId) || PageLayoutMode.Normal;
    
    // 更新状态
    this.layoutModes.set(docId, mode);
    this.currentMode$.value = mode;
    
    // 获取默认列宽
    const defaultWidths = LayoutModeConfigMap[mode].defaultWidths;
    this.columnWidths.set(docId, [...defaultWidths]);
    this.currentWidths$.value = [...defaultWidths];
    
    // 保存到存储
    if (this.storageService) {
      const config: DocLayoutConfig = {
        docId,
        layoutMode: mode,
        columnWidths: defaultWidths,
        responsive: true,
        lastModified: Date.now(),
        version: '1.0.0'
      };
      
      try {
        await this.storageService.saveLayoutConfig(docId, config);
      } catch (error) {
        console.warn('Failed to save layout config:', error);
      }
    }
    
    // 触发事件
    const event: LayoutModeChangeEvent = {
      docId,
      previousMode,
      currentMode: mode,
      columnWidths: defaultWidths,
      timestamp: Date.now(),
      source: 'user'
    };
    
    this.layoutChangeSubject.next(event);
  }

  getLayoutMode(docId: string): PageLayoutMode {
    return this.layoutModes.get(docId) || PageLayoutMode.Normal;
  }

  async setColumnWidths(widths: number[], docId: string): Promise<void> {
    // 验证和归一化宽度
    const normalizedWidths = this.normalizeWidths(widths);
    
    this.columnWidths.set(docId, normalizedWidths);
    this.currentWidths$.value = normalizedWidths;
    
    // 保存到存储
    if (this.storageService) {
      const currentConfig = await this.storageService.loadLayoutConfig(docId);
      if (currentConfig) {
        const updatedConfig = {
          ...currentConfig,
          columnWidths: normalizedWidths,
          lastModified: Date.now()
        };
        
        try {
          await this.storageService.saveLayoutConfig(docId, updatedConfig);
        } catch (error) {
          console.warn('Failed to save column widths:', error);
        }
      }
    }
  }

  getColumnWidths(docId: string): number[] {
    const stored = this.columnWidths.get(docId);
    if (stored) return stored;
    
    const mode = this.getLayoutMode(docId);
    return LayoutModeConfigMap[mode].defaultWidths;
  }

  onLayoutModeChange(): Observable<LayoutModeChangeEvent> {
    return this.layoutChangeSubject.asObservable();
  }

  getLayoutConfig(docId: string): DocLayoutConfig | null {
    const mode = this.getLayoutMode(docId);
    const widths = this.getColumnWidths(docId);
    
    return {
      docId,
      layoutMode: mode,
      columnWidths: widths,
      responsive: true,
      lastModified: Date.now(),
      version: '1.0.0',
      metadata: {
        service: 'PageLayoutService',
        cached: this.layoutModes.has(docId)
      }
    };
  }

  async updateLayoutConfig(docId: string, config: Partial<DocLayoutConfig>): Promise<void> {
    const updates: Promise<void>[] = [];
    
    if (config.layoutMode) {
      updates.push(this.setLayoutMode(config.layoutMode, docId));
    }
    
    if (config.columnWidths) {
      updates.push(this.setColumnWidths(config.columnWidths, docId));
    }
    
    await Promise.all(updates);
  }

  /**
   * 归一化列宽度
   */
  private normalizeWidths(widths: number[]): number[] {
    const sum = widths.reduce((total, width) => total + Math.max(0, width), 0);
    if (sum === 0) {
      return Array(widths.length).fill(1 / widths.length);
    }
    return widths.map(width => Math.max(0, width) / sum);
  }

  /**
   * 获取当前模式信号（用于响应式UI）
   */
  getCurrentModeSignal() {
    return this.currentMode$;
  }

  /**
   * 获取当前宽度信号（用于响应式UI）
   */
  getCurrentWidthsSignal() {
    return this.currentWidths$;
  }

  /**
   * 批量加载配置
   */
  async loadConfigs(docIds: string[]): Promise<Map<string, DocLayoutConfig>> {
    const configs = new Map<string, DocLayoutConfig>();
    
    if (!this.storageService) {
      return configs;
    }
    
    try {
      const allConfigs = await this.storageService.getAllLayoutConfigs();
      for (const config of allConfigs) {
        if (docIds.includes(config.docId)) {
          configs.set(config.docId, config);
          
          // 更新内存缓存
          this.layoutModes.set(config.docId, config.layoutMode);
          this.columnWidths.set(config.docId, config.columnWidths);
        }
      }
    } catch (error) {
      console.warn('Failed to load configs:', error);
    }
    
    return configs;
  }

  /**
   * 获取服务统计信息
   */
  getServiceStats() {
    return {
      cachedLayouts: this.layoutModes.size,
      cachedWidths: this.columnWidths.size,
      hasStorageService: !!this.storageService,
      hasDistributor: !!this.columnDistributor
    };
  }
}