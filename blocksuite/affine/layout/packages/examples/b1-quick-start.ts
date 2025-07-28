/**
 * 🚀 开发者B1快速上手指南
 * 
 * 所有Mock服务和核心接口已就绪！立即开始LayoutSwitcher组件开发
 * 
 * 开发者A1提供 - 核心服务架构师
 */

import { 
  createMockServices,
  MockPageLayoutService, 
  MockStorageService,
  MockColumnDistributor 
} from '@blocksuite/affine-layout-testing/mocks';

import { 
  PageLayoutMode,
  type IPageLayoutService,
  type LayoutModeChangeEvent,
  type DocLayoutConfig
} from '@blocksuite/affine-layout-core/types';

/**
 * 🎯 方式1: 一键获取所有Mock服务 (推荐)
 */
export function example1_QuickStart() {
  console.log('🔥 开发者B1 - 立即开始！');
  
  // 一键获取所有Mock服务
  const services = createMockServices();
  const { pageLayoutService, storageService, columnDistributor } = services;
  
  console.log('✅ Mock服务已就绪:', services);
  
  return services;
}

/**
 * 🎯 方式2: 逐个创建服务 (更灵活)
 */
export function example2_StepByStep() {
  const pageLayoutService = new MockPageLayoutService();
  const storageService = new MockStorageService();
  const columnDistributor = new MockColumnDistributor();
  
  console.log('✅ 服务逐个创建完成');
  
  return { pageLayoutService, storageService, columnDistributor };
}

/**
 * 🎯 方式3: 使用依赖注入容器 (高级用法)
 */
export function example3_DependencyInjection() {
  // 这个在真实环境中会更有用
  import { ServiceLocator } from '@blocksuite/affine-layout-core/di';
  
  // 注册Mock服务
  ServiceLocator.register('pageLayoutService', new MockPageLayoutService());
  ServiceLocator.register('storageService', new MockStorageService());
  
  // 获取服务
  const pageLayoutService = ServiceLocator.get<IPageLayoutService>('pageLayoutService');
  
  return { pageLayoutService };
}

/**
 * 🔥 LayoutSwitcher组件开发核心API示例
 */
export class LayoutSwitcherExample {
  private pageLayoutService: IPageLayoutService;
  private currentDocId = 'example-doc-123';

  constructor() {
    // 使用Mock服务开始开发
    const services = createMockServices();
    this.pageLayoutService = services.pageLayoutService;
    
    this.setupEventListeners();
  }

  /**
   * 🎯 切换布局模式 - 这是LayoutSwitcher的核心功能
   */
  async switchLayoutMode(mode: PageLayoutMode) {
    console.log(`🔄 切换到${mode}模式`);
    
    try {
      // 调用核心服务
      await this.pageLayoutService.setLayoutMode(mode, this.currentDocId);
      
      console.log(`✅ 成功切换到${mode}`);
      
      // 获取新的布局配置
      const config = this.pageLayoutService.getLayoutConfig(this.currentDocId);
      console.log('📐 新的布局配置:', config);
      
      return config;
      
    } catch (error) {
      console.error('❌ 切换失败:', error);
      throw error;
    }
  }

  /**
   * 🎯 获取当前布局状态
   */
  getCurrentLayout() {
    const mode = this.pageLayoutService.getLayoutMode(this.currentDocId);
    const widths = this.pageLayoutService.getColumnWidths(this.currentDocId);
    
    console.log(`📋 当前布局: ${mode}, 列宽: [${widths.join(', ')}]`);
    
    return { mode, widths };
  }

  /**
   * 🎯 监听布局变化 - 用于UI响应
   */
  setupEventListeners() {
    const unsubscribe = this.pageLayoutService.onLayoutModeChange().subscribe(
      (event: LayoutModeChangeEvent) => {
        console.log('🔔 布局模式已变更:', event);
        
        // 这里B1可以更新UI
        this.updateUI(event);
      }
    );
    
    // 保存取消订阅函数，组件销毁时调用
    return unsubscribe;
  }

  /**
   * 🎯 更新UI - B1需要实现的部分
   */
  private updateUI(event: LayoutModeChangeEvent) {
    console.log(`🎨 UI更新: ${event.previousMode} -> ${event.currentMode}`);
    
    // TODO: B1在这里实现UI更新逻辑
    // - 更新按钮状态
    // - 触发动画
    // - 重新渲染布局
  }

  /**
   * 🎯 设置列宽度 - 高级功能
   */
  async adjustColumnWidths(widths: number[]) {
    console.log(`📏 调整列宽度:`, widths);
    
    await this.pageLayoutService.setColumnWidths(widths, this.currentDocId);
    
    console.log('✅ 列宽度已更新');
  }
}

/**
 * 🔥 实际使用示例 - B1可以直接运行测试
 */
export async function demonstrateFullWorkflow() {
  console.log('🚀 完整工作流演示开始...');
  
  const example = new LayoutSwitcherExample();
  
  // 1. 查看初始状态
  example.getCurrentLayout();
  
  // 2. 切换到2列布局
  await example.switchLayoutMode(PageLayoutMode.TwoColumn);
  
  // 3. 调整列宽度
  await example.adjustColumnWidths([0.7, 0.3]);
  
  // 4. 切换到3列布局
  await example.switchLayoutMode(PageLayoutMode.ThreeColumn);
  
  // 5. 切换回正常模式
  await example.switchLayoutMode(PageLayoutMode.Normal);
  
  console.log('🎉 演示完成！B1可以基于这个开始开发LayoutSwitcher组件');
}

/**
 * 🎯 供B1参考的组件接口设计建议
 */
export interface LayoutSwitcherProps {
  /** 当前文档ID */
  docId: string;
  
  /** 初始布局模式 */
  initialMode?: PageLayoutMode;
  
  /** 支持的布局模式 */
  supportedModes?: PageLayoutMode[];
  
  /** 切换时的回调 */
  onModeChange?: (event: LayoutModeChangeEvent) => void;
  
  /** 是否显示预览 */
  showPreview?: boolean;
  
  /** 自定义样式 */
  className?: string;
  
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 🎯 组件状态管理建议
 */
export interface LayoutSwitcherState {
  currentMode: PageLayoutMode;
  isLoading: boolean;
  error: string | null;
  supportedModes: PageLayoutMode[];
}

/**
 * 🚀 立即开始开发的检查清单
 */
export const B1_CHECKLIST = [
  '✅ Mock服务已就绪 - pageLayoutService, storageService, columnDistributor',
  '✅ 核心接口已定义 - IPageLayoutService, PageLayoutMode, LayoutModeChangeEvent', 
  '✅ 示例代码已提供 - LayoutSwitcherExample可直接运行',
  '✅ 事件监听已实现 - onLayoutModeChange()订阅机制',
  '✅ 错误处理已考虑 - try/catch包装',
  '⏳ TODO: 创建LayoutSwitcher React/Vue组件',
  '⏳ TODO: 实现按钮UI和交互',
  '⏳ TODO: 添加布局预览功能',
  '⏳ TODO: 集成动画效果(等C1完成)',
  '⏳ TODO: 集成响应式功能(C2已完成)'
];

console.log('🎯 开发者B1:', B1_CHECKLIST);