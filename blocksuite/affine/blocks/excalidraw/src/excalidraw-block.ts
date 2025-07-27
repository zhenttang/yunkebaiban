import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import {
  EDGELESS_TOP_CONTENTEDITABLE_SELECTOR,
} from '@blocksuite/affine-shared/consts';
import {
  DocModeProvider,
  NotificationProvider,
} from '@blocksuite/affine-shared/services';
import type { BlockComponent } from '@blocksuite/std';
import { html, nothing, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import type { ExcalidrawBlockModel } from './excalidraw-model.js';
import { ExcalidrawBlockService } from './excalidraw-service.js';
import { excalidrawBlockStyles } from './styles.js';

export class ExcalidrawBlockComponent extends CaptionedBlockComponent<ExcalidrawBlockModel> {
  static override styles = excalidrawBlockStyles;

  private _excalidrawAPI: any = null;
  private _retryCount = 0;

  @state()
  private accessor _modalOpen = false;

  @state()
  private accessor _loading = false;

  @state()
  private accessor _hasChanges = false;

  get notificationService() {
    return this.std.getOptional(NotificationProvider);
  }

  get readonly() {
    return this.store.readonly;
  }

  get service() {
    return this.std.get(ExcalidrawBlockService);
  }

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(
        EDGELESS_TOP_CONTENTEDITABLE_SELECTOR
      );
    }
    return this.rootComponent;
  }

  private async _openEditor() {
    if (this.readonly) return;
    this._modalOpen = true;
    this._loading = false; // 先设置为false，直接显示容器
    this._hasChanges = false;
    
    // 添加键盘事件监听
    this._addKeyboardListeners();
    
    // 等待模态框渲染完成，然后初始化编辑器
    await this.updateComplete;
    setTimeout(() => this._setupEditor(), 300);
  }

  private _closeEditor() {
    if (this._excalidrawAPI?.root) {
      this._excalidrawAPI.root.unmount();
    }
    this._modalOpen = false;
    this._loading = false;
    this._excalidrawAPI = null;
    this._hasChanges = false;
    
    // 移除键盘事件监听
    this._removeKeyboardListeners();
  }

  private _addKeyboardListeners() {
    document.addEventListener('keydown', this._handleKeydown);
  }

  private _removeKeyboardListeners() {
    document.removeEventListener('keydown', this._handleKeydown);
  }

  private _handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this._modalOpen) {
      e.preventDefault();
      this._closeEditor();
    }
  };

  private async _setupEditor() {
    try {
      console.log('Setting up editor...');
      console.log('this.shadowRoot:', this.shadowRoot);
      console.log('Modal open state:', this._modalOpen);
      console.log('Loading state:', this._loading);
      
      // 尝试多种方法查找元素
      let editorElement: HTMLDivElement | null = null;
      
      // 方法1: 通过shadowRoot查找
      if (this.shadowRoot) {
        editorElement = this.shadowRoot.querySelector('.excalidraw-container') as HTMLDivElement;
        console.log('Method 1 - shadowRoot querySelector:', editorElement);
      }
      
      // 方法2: 如果shadowRoot找不到，尝试直接查找
      if (!editorElement) {
        editorElement = this.querySelector('.excalidraw-container') as HTMLDivElement;
        console.log('Method 2 - direct querySelector:', editorElement);
      }
      
      // 方法3: 通过模态框body查找
      if (!editorElement && this.shadowRoot) {
        const modalBody = this.shadowRoot.querySelector('.affine-excalidraw-modal-body') as HTMLDivElement;
        console.log('Method 3 - modal body:', modalBody);
        
        if (modalBody) {
          editorElement = modalBody.querySelector('.excalidraw-container') as HTMLDivElement;
          console.log('Method 3 - container from modal body:', editorElement);
        }
      }
      
      // 方法4: 查找所有相关元素进行调试
      if (!editorElement && this.shadowRoot) {
        const allContainers = this.shadowRoot.querySelectorAll('*');
        console.log('All elements in shadowRoot:', allContainers);
        const modalOverlay = this.shadowRoot.querySelector('.affine-excalidraw-modal-overlay');
        const modal = this.shadowRoot.querySelector('.affine-excalidraw-modal');
        const modalHeader = this.shadowRoot.querySelector('.affine-excalidraw-modal-header');
        const modalBodys = this.shadowRoot.querySelectorAll('.affine-excalidraw-modal-body');
        const containers = this.shadowRoot.querySelectorAll('.excalidraw-container');
        
        console.log('Debug elements:', {
          modalOverlay,
          modal,
          modalHeader,
          modalBodys,
          containers
        });
      }
      
      if (!editorElement) {
        console.log('No editor element found, retrying...');
        this._retryCount = (this._retryCount || 0) + 1;
        if (this._retryCount < 15) {
          setTimeout(() => this._setupEditor(), 300);
        } else {
          // 如果找不到元素，直接创建一个简单的界面
          console.log('Creating fallback interface...');
          this._createFallbackInterface();
        }
        return;
      }

      // 重置重试计数
      this._retryCount = 0;
      console.log('Found editor element:', editorElement);

      this._initializeCanvas(editorElement);
      
    } catch (error) {
      console.error('Failed to setup editor:', error);
      this._loading = false;
      this._createFallbackInterface();
    }
  }

  private _createFallbackInterface() {
    // 创建一个简单的提示界面
    const modalBody = this.shadowRoot?.querySelector('.affine-excalidraw-modal-body') as HTMLDivElement;
    if (modalBody) {
      modalBody.innerHTML = `
        <div style="
          padding: 40px;
          text-align: center;
          background: #f8f9fa;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        ">
          <h3 style="margin: 0 0 20px 0; color: #007bff;">Excalidraw 编辑器</h3>
          <p style="margin: 0 0 20px 0; color: #666;">正在准备绘图界面...</p>
          <button onclick="this.closest('.affine-excalidraw-modal-overlay').style.display='none'" style="
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">关闭</button>
        </div>
      `;
    }
  }

  private _initializeCanvas(editorElement: HTMLDivElement) {
    // 确保元素可见
    editorElement.style.cssText = `
      width: 100%;
      height: 100%;
      background: #f8f9fa;
      display: flex !important;
      flex-direction: column !important;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative;
    `;

    // 清空容器
    editorElement.innerHTML = '';
    
    // 创建测试内容
    const testHTML = `
      <div style="
        width: 100%;
        height: 100%;
        padding: 20px;
        box-sizing: border-box;
        background: #f8f9fa;
        color: #333;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
      ">
        <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: bold;">Canvas 绘图编辑器</h3>
        
        <div style="display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap;">
          <button id="pen-btn" style="
            padding: 10px 15px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">✏️ 画笔</button>
          
          <button id="eraser-btn" style="
            padding: 10px 15px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">🧽 橡皮</button>
          
          <button id="clear-btn" style="
            padding: 10px 15px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">🗑️ 清空</button>
          
          <input type="color" id="color-picker" value="#000000" style="
            width: 50px;
            height: 42px;
            border: 2px solid #ddd;
            border-radius: 6px;
            cursor: pointer;
          ">
          
          <span style="
            padding: 12px 15px;
            background: #e9ecef;
            border-radius: 6px;
            font-size: 14px;
            color: #495057;
          ">线条粗细:</span>
          
          <input type="range" id="line-width" min="1" max="20" value="3" style="
            width: 100px;
            margin: auto 0;
          ">
        </div>
        
        <canvas id="drawing-canvas" style="
          background: white;
          border: 3px solid #dee2e6;
          border-radius: 8px;
          cursor: crosshair;
          flex: 1;
          min-height: 350px;
          max-height: 400px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        "></canvas>
        
        <div style="
          margin-top: 15px;
          padding: 10px;
          background: #e3f2fd;
          border-radius: 6px;
          font-size: 13px;
          color: #1976d2;
        ">
          💡 提示：点击画笔开始绘图，拖拽鼠标进行绘制
        </div>
      </div>
    `;
    
    editorElement.innerHTML = testHTML;
    
    // 等待DOM更新后初始化Canvas
    setTimeout(() => {
      this._setupCanvasControls(editorElement);
    }, 100);
  }

  private _setupCanvasControls(editorElement: HTMLDivElement) {
    try {
      // 获取Canvas和上下文
      const canvas = editorElement.querySelector('#drawing-canvas') as HTMLCanvasElement;
      console.log('Canvas element:', canvas);
      
      if (!canvas) {
        throw new Error('Canvas元素未找到');
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法获取Canvas上下文');
      }
      
      console.log('Canvas context:', ctx);
      
      // 设置Canvas尺寸
      const containerRect = editorElement.getBoundingClientRect();
      canvas.width = Math.max(600, containerRect.width - 60); 
      canvas.height = 350;
      
      console.log('Canvas size:', canvas.width, 'x', canvas.height);
      
      // 绘图状态
      let isDrawing = false;
      let currentTool = 'pen';
      let currentColor = '#000000';
      let lineWidth = 3;
      
      // 获取控制元素
      const penBtn = editorElement.querySelector('#pen-btn') as HTMLButtonElement;
      const eraserBtn = editorElement.querySelector('#eraser-btn') as HTMLButtonElement;
      const clearBtn = editorElement.querySelector('#clear-btn') as HTMLButtonElement;
      const colorPicker = editorElement.querySelector('#color-picker') as HTMLInputElement;
      const lineWidthSlider = editorElement.querySelector('#line-width') as HTMLInputElement;
      
      console.log('Control elements:', { penBtn, eraserBtn, clearBtn, colorPicker, lineWidthSlider });
      
      // 绑定工具按钮事件
      if (penBtn) {
        penBtn.onclick = () => {
          currentTool = 'pen';
          penBtn.style.background = '#007bff';
          eraserBtn.style.background = '#6c757d';
          console.log('Pen tool selected');
        };
      }
      
      if (eraserBtn) {
        eraserBtn.onclick = () => {
          currentTool = 'eraser';
          eraserBtn.style.background = '#007bff';
          penBtn.style.background = '#6c757d';
          console.log('Eraser tool selected');
        };
      }
      
      if (clearBtn) {
        clearBtn.onclick = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          this._hasChanges = true;
          console.log('Canvas cleared');
        };
      }
      
      if (colorPicker) {
        colorPicker.onchange = (e) => {
          currentColor = (e.target as HTMLInputElement).value;
          console.log('Color changed to:', currentColor);
        };
      }
      
      if (lineWidthSlider) {
        lineWidthSlider.onchange = (e) => {
          lineWidth = parseInt((e.target as HTMLInputElement).value);
          console.log('Line width changed to:', lineWidth);
        };
      }
      
      // 绘图函数
      const startDrawing = (e: MouseEvent) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        console.log('Start drawing at:', x, y);
      };
      
      const draw = (e: MouseEvent) => {
        if (!isDrawing) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (currentTool === 'pen') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.strokeStyle = currentColor;
        } else {
          ctx.globalCompositeOperation = 'destination-out';
        }
        
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        this._hasChanges = true;
      };
      
      const stopDrawing = () => {
        if (isDrawing) {
          isDrawing = false;
          ctx.beginPath();
          console.log('Stop drawing');
        }
      };
      
      // 添加Canvas事件监听
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', stopDrawing);
      canvas.addEventListener('mouseout', stopDrawing);
      
      // 存储引用
      this._excalidrawAPI = { canvas, ctx };
      this._loading = false;
      
      console.log('Canvas setup completed successfully');
      
    } catch (error) {
      console.error('Failed to setup canvas:', error);
      this._createFallbackInterface();
    }
  }

  private _handleChange() {
    // 标记有变化 - Canvas版本中由绘图事件触发
    this._hasChanges = true;
  }

  private async _handleSave() {
    if (!this._excalidrawAPI || !this._hasChanges) return;
    
    try {
      const { canvas } = this._excalidrawAPI;
      
      // 将Canvas转换为图片
      const dataURL = canvas.toDataURL('image/png');
      
      // 保存到模型
      this.store.updateBlock(this.model, {
        src: dataURL,
        title: '手绘图表',
        data: dataURL, // 简单存储，实际项目中可以存储矢量数据
      });
      
      this._hasChanges = false;
      this.notificationService?.toast('保存成功');
    } catch (error) {
      console.error('Failed to save drawing:', error);
      this.notificationService?.toast('保存失败');
    }
  }

  private _renderPlaceholder(): TemplateResult {
    return html`
      <div class="affine-excalidraw-placeholder">
        <div class="placeholder-content">
          <div class="placeholder-icon">✏️</div>
          <div class="placeholder-text">点击创建 Excalidraw 图表</div>
          <div class="placeholder-desc">手绘风格的图表和示意图</div>
        </div>
      </div>
    `;
  }

  private _renderImage(): TemplateResult {
    const { src, title } = this.model.props;
    return html`
      <div class="affine-excalidraw-image">
        <img src=${src} alt=${title || 'Excalidraw图表'} />
      </div>
    `;
  }

  private _renderToolbar(): TemplateResult {
    if (this.readonly) return nothing;

    return html`
      <div class="affine-excalidraw-toolbar">
        <button
          class="affine-excalidraw-edit-button"
          @click=${this._openEditor}
          title="编辑图表"
        >
          ✏️ 编辑
        </button>
      </div>
    `;
  }

  private _renderModal(): TemplateResult {
    if (!this._modalOpen) return nothing;

    return html`
      <div 
        class="affine-excalidraw-modal-overlay"
        @click=${(e: Event) => {
          // 只有点击背景遮罩时才关闭
          if ((e.target as HTMLElement).classList.contains('affine-excalidraw-modal-overlay')) {
            this._closeEditor();
          }
        }}
      >
        <div class="affine-excalidraw-modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="affine-excalidraw-modal-header">
            <h3>Excalidraw 编辑器</h3>
            <div class="header-buttons">
              ${this._hasChanges ? html`
                <button 
                  class="save-button" 
                  @click=${(e: Event) => {
                    e.stopPropagation();
                    this._handleSave();
                  }}
                  title="保存图表"
                >
                  💾 保存
                </button>
              ` : nothing}
              <button 
                class="close-button" 
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._closeEditor();
                }}
                title="关闭编辑器"
              >
                ✕
              </button>
            </div>
          </div>
          <div class="affine-excalidraw-modal-body">
            ${this._loading 
              ? html`<div class="loading">正在加载 Excalidraw...</div>`
              : html`<div class="excalidraw-container"></div>`
            }
          </div>
        </div>
      </div>
    `;
  }

  override renderBlock(): TemplateResult {
    const classes = classMap({
      'affine-excalidraw-container': true,
      'selected': this.selected,
    });

    return html`
      <div class=${classes}>
        ${this._renderToolbar()}
        ${this.model.props.src ? this._renderImage() : this._renderPlaceholder()}
      </div>
      ${this._renderModal()}
    `;
  }

  override handleEvent(name: string, context: { preventDefault: () => void }) {
    switch (name) {
      case 'click': {
        if (!this.model.props.src) {
          this._openEditor();
        }
        break;
      }
      case 'double-click': {
        if (!this.readonly) {
          this._openEditor();
        }
        break;
      }
    }
  }
}