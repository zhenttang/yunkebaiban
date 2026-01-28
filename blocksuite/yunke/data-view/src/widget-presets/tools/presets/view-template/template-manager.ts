import type { DataViewUILogicBase } from '../../../../core/index.js';
import {
  PRESET_VIEW_TEMPLATES,
  type ViewTemplateConfig,
  type ViewTemplateData,
} from './template-types.js';

const STORAGE_KEY = 'yunke-view-templates';

/**
 * 视图模板管理器
 */
export class ViewTemplateManager {
  private static instance: ViewTemplateManager;
  private customTemplates: ViewTemplateConfig[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ViewTemplateManager {
    if (!ViewTemplateManager.instance) {
      ViewTemplateManager.instance = new ViewTemplateManager();
    }
    return ViewTemplateManager.instance;
  }

  /**
   * 从本地存储加载模板
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.customTemplates = JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load view templates from storage:', e);
      this.customTemplates = [];
    }
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customTemplates));
    } catch (e) {
      console.warn('Failed to save view templates to storage:', e);
    }
  }

  /**
   * 获取所有模板（预设 + 自定义）
   */
  getAllTemplates(): ViewTemplateConfig[] {
    return [...PRESET_VIEW_TEMPLATES, ...this.customTemplates];
  }

  /**
   * 获取预设模板
   */
  getPresetTemplates(): ViewTemplateConfig[] {
    return PRESET_VIEW_TEMPLATES;
  }

  /**
   * 获取自定义模板
   */
  getCustomTemplates(): ViewTemplateConfig[] {
    return this.customTemplates;
  }

  /**
   * 按视图类型筛选模板
   */
  getTemplatesByViewType(viewType: string): ViewTemplateConfig[] {
    return this.getAllTemplates().filter(t => t.viewType === viewType);
  }

  /**
   * 获取单个模板
   */
  getTemplate(templateId: string): ViewTemplateConfig | undefined {
    return this.getAllTemplates().find(t => t.id === templateId);
  }

  /**
   * 从当前视图创建模板
   */
  createTemplateFromView(
    dataViewLogic: DataViewUILogicBase,
    templateName: string,
    description?: string
  ): ViewTemplateConfig {
    const view = dataViewLogic.view;
    const properties = view.properties$.value;

    // 提取列配置
    const columns = properties.map(prop => ({
      type: prop.type$.value,
      name: prop.name$.value,
      width: (prop as any).width$?.value,
      hide: (prop as any).hide$?.value,
      propertyData: (prop as any).data$?.value,
    }));

    // 创建模板配置
    const template: ViewTemplateConfig = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: templateName,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      viewType: view.type,
      isPreset: false,
      viewData: {
        name: view.name$.value,
        columns,
        // TODO: 提取筛选、排序、分组配置
      },
    };

    // 保存模板
    this.customTemplates.push(template);
    this.saveToStorage();

    return template;
  }

  /**
   * 更新模板
   */
  updateTemplate(templateId: string, updates: Partial<ViewTemplateConfig>): boolean {
    const index = this.customTemplates.findIndex(t => t.id === templateId);
    if (index === -1) return false;

    this.customTemplates[index] = {
      ...this.customTemplates[index],
      ...updates,
      updatedAt: Date.now(),
    };
    this.saveToStorage();
    return true;
  }

  /**
   * 删除模板
   */
  deleteTemplate(templateId: string): boolean {
    const index = this.customTemplates.findIndex(t => t.id === templateId);
    if (index === -1) return false;

    this.customTemplates.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  /**
   * 应用模板到数据视图
   * 注意：这个方法创建新视图而不是修改现有视图
   */
  applyTemplate(
    dataViewLogic: DataViewUILogicBase,
    templateId: string
  ): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    try {
      const viewManager = dataViewLogic.view.manager;
      
      // 创建新视图
      const newViewId = viewManager.viewAdd(template.viewType);
      if (!newViewId) return false;

      const newView = viewManager.viewGet(newViewId);
      if (!newView) return false;

      // 设置视图名称
      if (template.viewData.name) {
        newView.nameSet(template.viewData.name);
      }

      // 添加列
      if (template.viewData.columns) {
        for (const colConfig of template.viewData.columns) {
          newView.propertyAdd('end', {
            type: colConfig.type,
            name: colConfig.name,
          });
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to apply template:', e);
      return false;
    }
  }
}

/**
 * 获取模板管理器实例
 */
export function getTemplateManager(): ViewTemplateManager {
  return ViewTemplateManager.getInstance();
}
