/**
 * 🎨 开发者B2和B3快速参考
 * 
 * UI交互和样式开发指南
 * 开发者A1提供支持
 */

import type { Block } from '@blocksuite/yunke-layout-core/types';
import { createMockServices } from '@blocksuite/yunke-layout-testing/mocks';

/**
 * 🎯 开发者B2 - AddContentButton和交互功能
 */
export class AddContentButtonExample {
  private services = createMockServices();

  /**
   * 添加新内容的核心逻辑
   */
  async addContentToColumn(columnIndex: number, blockType: string) {
    console.log(`➕ 在第${columnIndex}列添加${blockType}`);
    
    // 创建新Block
    const newBlock: Block = {
      id: `block_${Date.now()}`,
      type: blockType,
      content: this.getDefaultContent(blockType),
      index: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 使用Mock分配器测试
    const mockBlocks = [newBlock];
    const distributed = this.services.columnDistributor.distributeBlocks(mockBlocks, 3);
    
    console.log('✅ 新Block已分配:', distributed);
    
    return newBlock;
  }

  /**
   * 拖拽功能示例
   */
  handleBlockDrag(blockId: string, targetColumn: number, targetIndex: number) {
    console.log(`🖱️ 拖拽Block ${blockId} 到列${targetColumn}位置${targetIndex}`);
    
    // 模拟当前列布局
    const currentColumns: Block[][] = [[], [], []];
    
    // 使用Mock分配器的移动功能
    const newColumns = this.services.columnDistributor.moveBlock(
      blockId, 
      targetColumn, 
      targetIndex, 
      currentColumns
    );
    
    console.log('✅ 拖拽完成，新布局:', newColumns);
    
    return newColumns;
  }

  private getDefaultContent(blockType: string): any {
    const defaults = {
      'paragraph': '请输入文本...',
      'heading': '新标题',
      'image': { url: '', alt: '图片' },
      'code': '// 代码块',
      'list': ['列表项1']
    };
    
    return defaults[blockType as keyof typeof defaults] || '新内容';
  }
}

/**
 * 🎯 开发者B3 - 样式系统和设计令牌
 */
export class LayoutStyleSystem {
  /**
   * 设计令牌 - B3可以直接使用
   */
  static readonly DESIGN_TOKENS = {
    // 间距
    spacing: {
      xs: '4px',
      sm: '8px', 
      md: '16px',
      lg: '24px',
      xl: '32px',
      xxl: '48px'
    },
    
    // 颜色
    colors: {
      primary: '#1f2937',
      secondary: '#6b7280',
      accent: '#3b82f6',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      background: '#ffffff',
      surface: '#f9fafb',
      border: '#e5e7eb'
    },
    
    // 圆角
    borderRadius: {
      sm: '4px',
      md: '8px',
      lg: '12px',
      xl: '16px'
    },
    
    // 阴影
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    
    // 动画
    transitions: {
      fast: '150ms ease-in-out',
      normal: '300ms ease-in-out', 
      slow: '500ms ease-in-out'
    },
    
    // 断点 (与C2响应式系统对接)
    breakpoints: {
      mobile: '480px',
      tablet: '768px', 
      desktop: '1024px',
      wide: '1440px'
    }
  };

  /**
   * 布局相关的CSS变量
   */
  static readonly LAYOUT_VARS = {
    '--layout-column-gap': '16px',
    '--layout-column-min-width': '200px',
    '--layout-switcher-height': '40px',
    '--layout-transition': 'all 300ms ease-in-out'
  };

  /**
   * LayoutSwitcher样式 - 供B3参考
   */
  static getLayoutSwitcherStyles() {
    return {
      container: {
        display: 'flex',
        gap: this.DESIGN_TOKENS.spacing.sm,
        padding: this.DESIGN_TOKENS.spacing.md,
        backgroundColor: this.DESIGN_TOKENS.colors.surface,
        borderRadius: this.DESIGN_TOKENS.borderRadius.md,
        boxShadow: this.DESIGN_TOKENS.shadows.sm
      },
      
      button: {
        padding: `${this.DESIGN_TOKENS.spacing.sm} ${this.DESIGN_TOKENS.spacing.md}`,
        border: `1px solid ${this.DESIGN_TOKENS.colors.border}`,
        borderRadius: this.DESIGN_TOKENS.borderRadius.sm,
        backgroundColor: this.DESIGN_TOKENS.colors.background,
        color: this.DESIGN_TOKENS.colors.primary,
        cursor: 'pointer',
        transition: this.DESIGN_TOKENS.transitions.fast,
        
        '&:hover': {
          borderColor: this.DESIGN_TOKENS.colors.accent,
          backgroundColor: this.DESIGN_TOKENS.colors.surface
        },
        
        '&.active': {
          backgroundColor: this.DESIGN_TOKENS.colors.accent,
          color: this.DESIGN_TOKENS.colors.background,
          borderColor: this.DESIGN_TOKENS.colors.accent
        }
      },
      
      icon: {
        width: '16px',
        height: '16px',
        marginRight: this.DESIGN_TOKENS.spacing.xs
      }
    };
  }

  /**
   * 列布局样式
   */
  static getColumnLayoutStyles() {
    return {
      container: {
        display: 'grid',
        gap: 'var(--layout-column-gap)',
        transition: 'var(--layout-transition)',
        minHeight: '200px'
      },
      
      // 动态网格模板
      gridTemplates: {
        normal: 'grid-template-columns: 1fr',
        twoColumn: 'grid-template-columns: 3fr 2fr', 
        threeColumn: 'grid-template-columns: 2fr 1fr 1fr',
        fourColumn: 'grid-template-columns: repeat(4, 1fr)',
        fiveColumn: 'grid-template-columns: repeat(5, 1fr)'
      },
      
      column: {
        minWidth: 'var(--layout-column-min-width)',
        border: `1px dashed ${this.DESIGN_TOKENS.colors.border}`,
        borderRadius: this.DESIGN_TOKENS.borderRadius.md,
        padding: this.DESIGN_TOKENS.spacing.md,
        backgroundColor: this.DESIGN_TOKENS.colors.background,
        
        '&:empty': {
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: this.DESIGN_TOKENS.colors.secondary,
          fontSize: '14px'
        }
      }
    };
  }
}

/**
 * 🎯 响应式工具函数 - 与C2系统集成
 */
export class ResponsiveHelpers {
  /**
   * 媒体查询生成器
   */
  static mediaQuery(breakpoint: keyof typeof LayoutStyleSystem.DESIGN_TOKENS.breakpoints) {
    const bp = LayoutStyleSystem.DESIGN_TOKENS.breakpoints[breakpoint];
    return `@media (min-width: ${bp})`;
  }

  /**
   * 响应式列数计算
   */
  static getResponsiveColumns(screenWidth: number) {
    const { breakpoints } = LayoutStyleSystem.DESIGN_TOKENS;
    
    if (screenWidth < parseInt(breakpoints.mobile)) return 1;
    if (screenWidth < parseInt(breakpoints.tablet)) return 2;
    if (screenWidth < parseInt(breakpoints.desktop)) return 3;
    if (screenWidth < parseInt(breakpoints.wide)) return 4;
    return 5;
  }
}

/**
 * 🚀 B2和B3立即可用的工具
 */
export const B2_B3_TOOLS = {
  // B2交互工具
  addContent: new AddContentButtonExample(),
  
  // B3样式工具  
  designTokens: LayoutStyleSystem.DESIGN_TOKENS,
  layoutVars: LayoutStyleSystem.LAYOUT_VARS,
  switcherStyles: LayoutStyleSystem.getLayoutSwitcherStyles(),
  columnStyles: LayoutStyleSystem.getColumnLayoutStyles(),
  
  // 响应式工具
  responsive: ResponsiveHelpers,
  
  // Mock服务
  mockServices: createMockServices()
};

console.log('🎯 开发者B2、B3工具箱已就绪:', Object.keys(B2_B3_TOOLS));