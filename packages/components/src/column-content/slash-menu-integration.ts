// 文件: packages/components/src/column-content/slash-menu-integration.ts
import type { BlockComponent } from '@blocksuite/block-std';
import type { SlashMenuActionItem } from '@blocksuite/yunke-shared/config';

/**
 * SlashMenu集成管理器
 * 
 * 负责在列布局中集成BlockSuite的SlashMenu系统
 * 支持在指定列和位置显示SlashMenu，并处理Block创建
 */
export class SlashMenuIntegration {
  private isMenuOpen = false;
  private currentColumnIndex = -1;
  private currentInsertIndex = -1;
  private menuElement: HTMLElement | null = null;
  
  constructor(
    private container: HTMLElement,
    private onBlockCreated?: (blockId: string, columnIndex: number) => void
  ) {
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    // 监听来自AddContentButton的事件
    this.container.addEventListener('show-slash-menu', this.handleShowSlashMenu);
    
    // 监听键盘事件
    document.addEventListener('keydown', this.handleGlobalKeydown);
    
    // 监听点击外部区域关闭菜单
    document.addEventListener('click', this.handleOutsideClick);
  }
  
  private handleShowSlashMenu = (event: CustomEvent) => {
    const { columnIndex, insertIndex, position, trigger } = event.detail;
    
    this.currentColumnIndex = columnIndex;
    this.currentInsertIndex = insertIndex;
    
    this.showSlashMenu(position, trigger);
  };
  
  private async showSlashMenu(position: MenuPosition, trigger: string) {
    if (this.isMenuOpen) {
      this.hideSlashMenu();
    }
    
    this.isMenuOpen = true;
    
    try {
      // 创建SlashMenu实例
      await this.createSlashMenuInstance(position, trigger);
      
      // 设置焦点
      this.focusSlashMenu();
      
    } catch (error) {
      console.error('Failed to show SlashMenu:', error);
      this.hideSlashMenu();
    }
  }
  
  private async createSlashMenuInstance(position: MenuPosition, trigger: string) {
    // 注意: 这里需要等待开发者A1提供Mock服务后再完善
    // 目前先创建基础结构
    
    const menuContainer = document.createElement('div');
    menuContainer.className = 'column-slash-menu-container';
    menuContainer.style.cssText = `
      position: fixed;
      left: ${position.x}px;
      top: ${position.y}px;
      z-index: 1000;
      min-width: ${Math.max(position.width || 200, 200)}px;
      background: var(--yunke-background-overlay-panel-color);
      border: 1px solid var(--yunke-border-color);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      padding: 8px 0;
      opacity: 0;
      transform: translateY(-8px);
      transition: all 0.2s ease;
    `;
    
    // 创建菜单项目
    const menuItems = this.createSlashMenuItems();
    menuItems.forEach(item => {
      const menuItem = this.createMenuItem(item);
      menuContainer.appendChild(menuItem);
    });
    
    // 添加到DOM
    document.body.appendChild(menuContainer);
    this.menuElement = menuContainer;
    
    // 动画显示
    requestAnimationFrame(() => {
      menuContainer.style.opacity = '1';
      menuContainer.style.transform = 'translateY(0)';
    });
    
    // 调整位置以确保在视窗内
    this.adjustMenuPosition(menuContainer, position);
  }
  
  private createSlashMenuItems(): SlashMenuItemConfig[] {
    // 创建适合列布局的SlashMenu项目
    return [
      {
        id: 'paragraph',
        name: '段落',
        description: '添加普通文本段落',
        icon: '📝',
        action: () => this.insertBlock('yunke:paragraph', {})
      },
      {
        id: 'heading1',
        name: '标题 1',
        description: '大标题',
        icon: 'H1',
        action: () => this.insertBlock('yunke:paragraph', { type: 'h1' })
      },
      {
        id: 'heading2', 
        name: '标题 2',
        description: '中标题',
        icon: 'H2',
        action: () => this.insertBlock('yunke:paragraph', { type: 'h2' })
      },
      {
        id: 'heading3',
        name: '标题 3', 
        description: '小标题',
        icon: 'H3',
        action: () => this.insertBlock('yunke:paragraph', { type: 'h3' })
      },
      {
        id: 'list',
        name: '无序列表',
        description: '创建项目列表',
        icon: '•',
        action: () => this.insertBlock('yunke:list', { type: 'bulleted' })
      },
      {
        id: 'numbered-list',
        name: '有序列表',
        description: '创建编号列表',
        icon: '1.',
        action: () => this.insertBlock('yunke:list', { type: 'numbered' })
      },
      {
        id: 'todo',
        name: '待办事项',
        description: '创建任务清单',
        icon: '☐',
        action: () => this.insertBlock('yunke:list', { type: 'todo' })
      },
      {
        id: 'divider',
        name: '分割线',
        description: '添加分割线',
        icon: '―',
        action: () => this.insertBlock('yunke:divider', {})
      },
      {
        id: 'code',
        name: '代码块',
        description: '插入代码片段',
        icon: '</>', 
        action: () => this.insertBlock('yunke:code', {})
      },
      {
        id: 'image',
        name: '图片',
        description: '上传或插入图片',
        icon: '🖼️',
        action: () => this.insertBlock('yunke:image', {})
      },
      {
        id: 'callout',
        name: '标注',
        description: '突出显示的信息框',
        icon: '💡',
        action: () => this.insertBlock('yunke:callout', {})
      }
    ];
  }
  
  private createMenuItem(item: SlashMenuItemConfig): HTMLElement {
    const menuItem = document.createElement('div');
    menuItem.className = 'slash-menu-item';
    menuItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 16px;
      cursor: pointer;
      transition: background 0.2s ease;
      font-size: 14px;
    `;
    
    menuItem.innerHTML = `
      <span class="menu-icon" style="
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      ">${item.icon}</span>
      <div class="menu-content" style="flex: 1;">
        <div class="menu-name" style="
          font-weight: 500;
          color: var(--yunke-text-primary-color);
        ">${item.name}</div>
        <div class="menu-description" style="
          font-size: 12px;
          color: var(--yunke-text-secondary-color);
          margin-top: 2px;
        ">${item.description}</div>
      </div>
    `;
    
    // 添加交互效果
    menuItem.addEventListener('mouseenter', () => {
      menuItem.style.background = 'var(--yunke-hover-color)';
    });
    
    menuItem.addEventListener('mouseleave', () => {
      menuItem.style.background = 'transparent';
    });
    
    // 添加点击事件
    menuItem.addEventListener('click', () => {
      item.action();
      this.hideSlashMenu();
    });
    
    return menuItem;
  }
  
  private async insertBlock(flavour: string, props: Record<string, any>) {
    // 注意: 这里需要等待开发者A1的Mock服务
    // 目前先创建模拟实现
    
    try {
      // 模拟Block创建过程
      const mockBlockId = `mock-block-${Date.now()}`;
      
      console.log(`插入Block到第 ${this.currentColumnIndex + 1} 列:`, {
        flavour,
        props,
        columnIndex: this.currentColumnIndex,
        insertIndex: this.currentInsertIndex,
        blockId: mockBlockId
      });
      
      // 触发Block创建事件
      this.container.dispatchEvent(new CustomEvent('block-created', {
        detail: {
          blockId: mockBlockId,
          flavour,
          props,
          columnIndex: this.currentColumnIndex,
          insertIndex: this.currentInsertIndex
        },
        bubbles: true
      }));
      
      // 回调通知
      this.onBlockCreated?.(mockBlockId, this.currentColumnIndex);
      
      // 显示创建成功提示
      this.showCreationFeedback(flavour);
      
    } catch (error) {
      console.error('Failed to insert block:', error);
      
      // 显示错误提示
      this.showErrorFeedback('创建内容失败，请重试');
    }
  }
  
  private adjustMenuPosition(menu: HTMLElement, originalPosition: MenuPosition) {
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let newX = originalPosition.x;
    let newY = originalPosition.y;
    
    // 检查右边界
    if (rect.right > viewport.width - 20) {
      newX = viewport.width - rect.width - 20;
    }
    
    // 检查左边界
    if (newX < 20) {
      newX = 20;
    }
    
    // 检查下边界
    if (rect.bottom > viewport.height - 20) {
      newY = originalPosition.y - rect.height - 20;
    }
    
    // 检查上边界
    if (newY < 20) {
      newY = 20;
    }
    
    // 应用新位置
    menu.style.left = newX + 'px';
    menu.style.top = newY + 'px';
  }
  
  private focusSlashMenu() {
    if (this.menuElement) {
      const firstItem = this.menuElement.querySelector('.slash-menu-item') as HTMLElement;
      firstItem?.focus();
    }
  }
  
  private hideSlashMenu() {
    if (this.menuElement) {
      this.menuElement.style.opacity = '0';
      this.menuElement.style.transform = 'translateY(-8px)';
      
      setTimeout(() => {
        this.menuElement?.remove();
        this.menuElement = null;
      }, 200);
    }
    
    this.isMenuOpen = false;
    this.currentColumnIndex = -1;
    this.currentInsertIndex = -1;
  }
  
  private handleGlobalKeydown = (event: KeyboardEvent) => {
    if (!this.isMenuOpen) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.hideSlashMenu();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.navigateMenu(-1);
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        this.navigateMenu(1);
        break;
        
      case 'Enter':
        event.preventDefault();
        this.activateCurrentMenuItem();
        break;
    }
  };
  
  private navigateMenu(direction: number) {
    if (!this.menuElement) return;
    
    const items = Array.from(this.menuElement.querySelectorAll('.slash-menu-item'));
    const currentIndex = items.findIndex(item => item === document.activeElement);
    
    let nextIndex;
    if (currentIndex === -1) {
      nextIndex = direction > 0 ? 0 : items.length - 1;
    } else {
      nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = items.length - 1;
      if (nextIndex >= items.length) nextIndex = 0;
    }
    
    (items[nextIndex] as HTMLElement).focus();
  }
  
  private activateCurrentMenuItem() {
    const activeItem = document.activeElement;
    if (activeItem && activeItem.classList.contains('slash-menu-item')) {
      (activeItem as HTMLElement).click();
    }
  }
  
  private handleOutsideClick = (event: MouseEvent) => {
    if (!this.isMenuOpen || !this.menuElement) return;
    
    const target = event.target as Node;
    if (!this.menuElement.contains(target)) {
      this.hideSlashMenu();
    }
  };
  
  private showCreationFeedback(flavour: string) {
    const typeMap: Record<string, string> = {
      'yunke:paragraph': '段落',
      'yunke:list': '列表',
      'yunke:code': '代码块',
      'yunke:image': '图片',
      'yunke:callout': '标注',
      'yunke:divider': '分割线'
    };
    
    const typeName = typeMap[flavour] || '内容';
    this.showToast(`${typeName}已添加到第 ${this.currentColumnIndex + 1} 列`, 'success');
  }
  
  private showErrorFeedback(message: string) {
    this.showToast(message, 'error');
  }
  
  private showToast(message: string, type: 'success' | 'error') {
    const toast = document.createElement('div');
    toast.className = `slash-menu-toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#22c55e' : '#ef4444'};
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // 显示动画
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    // 自动消失
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
  
  // 公共方法
  dispose() {
    this.container.removeEventListener('show-slash-menu', this.handleShowSlashMenu);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    document.removeEventListener('click', this.handleOutsideClick);
    
    if (this.isMenuOpen) {
      this.hideSlashMenu();
    }
  }
  
  isOpen(): boolean {
    return this.isMenuOpen;
  }
}

// 类型定义
interface MenuPosition {
  x: number;
  y: number;
  width?: number;
}

interface SlashMenuItemConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => void;
}

// 导出工厂函数
export function createSlashMenuIntegration(
  container: HTMLElement,
  onBlockCreated?: (blockId: string, columnIndex: number) => void
): SlashMenuIntegration {
  return new SlashMenuIntegration(container, onBlockCreated);
}