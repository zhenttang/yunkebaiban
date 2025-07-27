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
import { ref, createRef, type Ref } from 'lit/directives/ref.js';

import type { DrawioBlockModel } from './drawio-model.js';
import { DrawioBlockService } from './drawio-service.js';
import { drawioBlockStyles } from './styles.js';

export class DrawioBlockComponent extends CaptionedBlockComponent<DrawioBlockModel> {
  static override styles = drawioBlockStyles;

  private _modalRef: Ref<HTMLDivElement> = createRef();
  private _frameRef: Ref<HTMLIFrameElement> = createRef();

  @state()
  private accessor _modalOpen = false;

  @state()
  private accessor _loading = false;

  get notificationService() {
    return this.std.getOptional(NotificationProvider);
  }

  get readonly() {
    return this.store.readonly;
  }

  get service() {
    return this.std.get(DrawioBlockService);
  }

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(
        EDGELESS_TOP_CONTENTEDITABLE_SELECTOR
      );
    }
    return this.rootComponent;
  }

  private _openEditor() {
    if (this.readonly) return;
    this._modalOpen = true;
    this._setupEditor();
  }

  private _closeEditor() {
    this._modalOpen = false;
  }

  private _setupEditor() {
    setTimeout(() => {
      const frame = this._frameRef.value;
      if (!frame) return;

      // 创建一个简单的本地SVG编辑器
      const editorHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
              background: #f5f5f5;
            }
            .editor-container {
              background: white;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .toolbar {
              display: flex;
              gap: 10px;
              margin-bottom: 20px;
              flex-wrap: wrap;
            }
            .tool-group {
              display: flex;
              gap: 5px;
              padding: 5px;
              border: 1px solid #ddd;
              border-radius: 4px;
              background: #f9f9f9;
            }
            button {
              padding: 8px 12px;
              border: 1px solid #ccc;
              background: white;
              cursor: pointer;
              border-radius: 4px;
              font-size: 12px;
            }
            button:hover {
              background: #e9e9e9;
            }
            button.active {
              background: #007bff;
              color: white;
            }
            #canvas {
              border: 2px solid #ddd;
              background: white;
              cursor: crosshair;
            }
            .save-btn {
              background: #28a745;
              color: white;
              padding: 10px 20px;
              margin-top: 20px;
            }
            .save-btn:hover {
              background: #218838;
            }
          </style>
        </head>
        <body>
          <div class="editor-container">
            <h3>简易图表编辑器</h3>
            <div class="toolbar">
              <div class="tool-group">
                <button onclick="setTool('rectangle')" id="rect-btn">矩形</button>
                <button onclick="setTool('circle')" id="circle-btn">圆形</button>
                <button onclick="setTool('line')" id="line-btn">直线</button>
                <button onclick="setTool('text')" id="text-btn">文字</button>
              </div>
              <div class="tool-group">
                <button onclick="clearCanvas()">清空</button>
                <button onclick="undo()">撤销</button>
              </div>
            </div>
            <svg id="canvas" width="600" height="400" xmlns="http://www.w3.org/2000/svg">
            </svg>
            <br>
            <button class="save-btn" onclick="saveDiagram()">保存图表</button>
          </div>
          
          <script>
            let currentTool = 'rectangle';
            let isDrawing = false;
            let startX, startY;
            let currentElement = null;
            let elements = [];
            
            function setTool(tool) {
              currentTool = tool;
              document.querySelectorAll('.tool-group button').forEach(b => b.classList.remove('active'));
              document.getElementById(tool + '-btn').classList.add('active');
            }
            
            document.getElementById('canvas').addEventListener('mousedown', startDrawing);
            document.getElementById('canvas').addEventListener('mousemove', draw);
            document.getElementById('canvas').addEventListener('mouseup', stopDrawing);
            
            function startDrawing(e) {
              isDrawing = true;
              const rect = e.target.getBoundingClientRect();
              startX = e.clientX - rect.left;
              startY = e.clientY - rect.top;
              
              if (currentTool === 'text') {
                const text = prompt('输入文字:');
                if (text) {
                  addText(startX, startY, text);
                }
                isDrawing = false;
                return;
              }
              
              createElement();
            }
            
            function createElement() {
              const canvas = document.getElementById('canvas');
              
              switch(currentTool) {
                case 'rectangle':
                  currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                  currentElement.setAttribute('stroke', '#333');
                  currentElement.setAttribute('fill', 'transparent');
                  currentElement.setAttribute('stroke-width', '2');
                  break;
                case 'circle':
                  currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                  currentElement.setAttribute('stroke', '#333');
                  currentElement.setAttribute('fill', 'transparent');
                  currentElement.setAttribute('stroke-width', '2');
                  break;
                case 'line':
                  currentElement = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                  currentElement.setAttribute('stroke', '#333');
                  currentElement.setAttribute('stroke-width', '2');
                  break;
              }
              
              if (currentElement) {
                canvas.appendChild(currentElement);
              }
            }
            
            function draw(e) {
              if (!isDrawing || !currentElement) return;
              
              const rect = e.target.getBoundingClientRect();
              const currentX = e.clientX - rect.left;
              const currentY = e.clientY - rect.top;
              
              switch(currentTool) {
                case 'rectangle':
                  const width = Math.abs(currentX - startX);
                  const height = Math.abs(currentY - startY);
                  const x = Math.min(startX, currentX);
                  const y = Math.min(startY, currentY);
                  currentElement.setAttribute('x', x);
                  currentElement.setAttribute('y', y);
                  currentElement.setAttribute('width', width);
                  currentElement.setAttribute('height', height);
                  break;
                case 'circle':
                  const radius = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
                  currentElement.setAttribute('cx', startX);
                  currentElement.setAttribute('cy', startY);
                  currentElement.setAttribute('r', radius);
                  break;
                case 'line':
                  currentElement.setAttribute('x1', startX);
                  currentElement.setAttribute('y1', startY);
                  currentElement.setAttribute('x2', currentX);
                  currentElement.setAttribute('y2', currentY);
                  break;
              }
            }
            
            function stopDrawing() {
              if (isDrawing && currentElement) {
                elements.push(currentElement.cloneNode(true));
              }
              isDrawing = false;
              currentElement = null;
            }
            
            function addText(x, y, text) {
              const canvas = document.getElementById('canvas');
              const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
              textElement.setAttribute('x', x);
              textElement.setAttribute('y', y);
              textElement.setAttribute('font-family', 'Arial');
              textElement.setAttribute('font-size', '14');
              textElement.setAttribute('fill', '#333');
              textElement.textContent = text;
              canvas.appendChild(textElement);
              elements.push(textElement.cloneNode(true));
            }
            
            function clearCanvas() {
              const canvas = document.getElementById('canvas');
              while (canvas.firstChild) {
                canvas.removeChild(canvas.firstChild);
              }
              elements = [];
            }
            
            function undo() {
              const canvas = document.getElementById('canvas');
              if (canvas.lastChild) {
                canvas.removeChild(canvas.lastChild);
                elements.pop();
              }
            }
            
            function saveDiagram() {
              const canvas = document.getElementById('canvas');
              const svgData = new XMLSerializer().serializeToString(canvas);
              window.parent.postMessage({
                event: 'save',
                xml: svgData
              }, '*');
            }
            
            // 设置默认工具
            setTool('rectangle');
          </script>
        </body>
        </html>
      `;

      // 将编辑器HTML写入iframe
      frame.srcdoc = editorHtml;
      
      // 监听iframe消息
      const handleMessage = (event: MessageEvent) => {
        if (event.source !== frame.contentWindow) return;
        
        try {
          const data = event.data;
          if (data.event === 'save') {
            // 保存SVG数据
            this.std.store.updateBlock(this.model, {
              src: 'data:image/svg+xml;base64,' + btoa(data.xml),
              title: '图表',
            });
            this._closeEditor();
          }
        } catch (e) {
          console.error('解析编辑器消息失败:', e);
        }
      };

      window.addEventListener('message', handleMessage);
      this._disposables.add(() => {
        window.removeEventListener('message', handleMessage);
      });
    }, 100);
  }
  private _handleDoubleClick() {
    this._openEditor();
  }

  private _renderPlaceholder(): TemplateResult {
    return html`
      <div class="affine-drawio-placeholder" @click=${this._openEditor}>
        <div class="affine-drawio-placeholder-icon">🎨</div>
        <div>点击创建 Draw.io 图表</div>
      </div>
    `;
  }

  private _renderImage(): TemplateResult {
    return html`
      <img
        class="affine-drawio-image"
        src=${this.model.props.src}
        alt=${this.model.props.title || 'Draw.io图表'}
        @dblclick=${this._handleDoubleClick}
      />
    `;
  }

  private _renderToolbar(): TemplateResult {
    if (this.readonly || !this.model.props.src) return nothing;

    return html`
      <div class="affine-drawio-toolbar">
        <button
          class="affine-drawio-button"
          @click=${this._openEditor}
          title="编辑图表"
        >
          ✏️
        </button>
      </div>
    `;
  }

  private _renderModal(): TemplateResult {
    if (!this._modalOpen) return nothing;

    return html`
      <div class="affine-drawio-modal" ${ref(this._modalRef)}>
        <div class="affine-drawio-modal-content">
          <div class="affine-drawio-modal-header">
            <div class="affine-drawio-modal-title">编辑 Draw.io 图表</div>
            <button
              class="affine-drawio-modal-close"
              @click=${this._closeEditor}
              title="关闭"
            >
              ✕
            </button>
          </div>
          <iframe
            ${ref(this._frameRef)}
            class="affine-drawio-editor-frame"
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
          ></iframe>
        </div>
      </div>
    `;
  }

  override renderBlock(): TemplateResult {
    const classes = classMap({
      'affine-drawio-container': true,
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
        this._handleDoubleClick();
        break;
      }
    }
  }
}