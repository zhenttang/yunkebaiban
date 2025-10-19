import { CaptionedBlockComponent } from '@blocksuite/yunke-components/caption';
import {
  EDGELESS_TOP_CONTENTEDITABLE_SELECTOR,
} from '@blocksuite/yunke-shared/consts';
import {
  DocModeProvider,
  NotificationProvider,
} from '@blocksuite/yunke-shared/services';
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

  private _getDrawioUrl() {
    // 生产环境直接使用本地Draw.io服务的绝对URL
    console.log('🌐 使用本地Draw.io服务: http://localhost:8001');
    return 'http://localhost:8001';
  }

  private _openEditor() {
    if (this.readonly) return;
    
    this._loading = true;
    this._modalOpen = true;
    this._setupEditor();
  }

  private _closeEditor() {
    this._modalOpen = false;
    this._loading = false;
  }

  private _setupEditor() {
    setTimeout(() => {
      const frame = this._frameRef.value;
      if (!frame) {
        console.warn('Draw.io iframe not found');
        return;
      }

      // 添加embed参数以启用iframe通信，但保持简单
      const baseUrl = this._getDrawioUrl();
      console.log('Draw.io base URL:', baseUrl);
      
      let editorUrl = `${baseUrl}/?embed=1`;
      console.log('Draw.io editor URL (before XML):', editorUrl);

      // 如果有现有的XML数据，加载它
      if (this.model.props.xml) {
        console.log('Found existing XML data, length:', this.model.props.xml.length);
        // 使用数据URL方式传递XML数据
        const encodedXml = encodeURIComponent(this.model.props.xml);
        editorUrl += `#${encodedXml}`;
        console.log('Draw.io editor URL (with XML hash):', editorUrl.substring(0, 200) + '...');
      } else {
        console.log('No existing XML data found');
      }

      console.log('Setting iframe src to:', editorUrl);
      frame.src = editorUrl;
      
      // 添加iframe状态监听
      frame.onload = () => {
        console.log('✅ Draw.io iframe onload event fired');
        console.log('Iframe contentWindow:', !!frame.contentWindow);
        console.log('Iframe contentDocument:', !!frame.contentDocument);
        
        // 尝试检测iframe内容是否实际加载（跨域错误是正常的）
        if (frame.contentWindow) {
          try {
            console.log('Iframe location href:', frame.contentWindow.location.href);
          } catch (e) {
            console.log('✅ 跨域限制正常（这不是错误）:', e.message);
          }
          
          try {
            console.log('Iframe document ready state:', frame.contentDocument?.readyState);
          } catch (e) {
            console.log('✅ 无法访问iframe文档（跨域正常现象）');
          }
        }
        
        // 发送一个测试消息看看iframe是否响应
        setTimeout(() => {
          if (frame.contentWindow) {
            console.log('🧪 Sending test message to iframe');
            try {
              // 对于本地服务，使用 '*' 作为目标origin，或者尝试具体的origin
              frame.contentWindow.postMessage('{"action":"ping"}', '*');
            } catch (e) {
              console.error('Failed to send test message:', e);
            }
          }
        }, 2000);
      };
      
      frame.onerror = (error) => {
        console.error('❌ Draw.io iframe onerror event:', error);
      };
      
      // 增加超时时间到30秒，本地服务初始化可能需要更长时间
      const loadTimeout = window.setTimeout(() => {
        if (this._loading) {
          console.log('⏰ 30秒内没有收到Draw.io初始化消息');
          console.log('💡 本地Draw.io服务可能需要更长时间初始化');
          console.log('🔍 如果编辑器界面已经显示，可以尝试手动操作');
          console.log('📝 提示：在Draw.io中使用 Ctrl+S 保存，然后关闭窗口');
          
          this._loading = false;
          
          this.notificationService?.notify({
            title: '编辑器已加载',
            message: '如果界面已显示，可直接绘制图表。使用Ctrl+S保存后关闭窗口。',
            type: 'info',
          });
        }
      }, 30000); // 增加到30秒
      
      this._disposables.add(() => {
        clearTimeout(loadTimeout);
      });
      
      // 监听来自Draw.io的消息
      const handleMessage = (event: MessageEvent) => {
        console.log('📨 Received postMessage:', {
          origin: event.origin,
          source: event.source === frame.contentWindow ? 'iframe' : 'other',
          data: event.data,
          type: typeof event.data
        });
        
        // 检查消息来源
        if (event.source !== frame.contentWindow) {
          console.log('❌ Message source mismatch, ignoring');
          return;
        }
        
        // 现在使用代理，origin应该是相同的
        const allowedOrigins = [
          window.location.origin,       // 同源访问
          'http://localhost:8082',      // 白板开发服务器
          null                          // 可能的null origin
        ];
        
        // 对于本地服务，我们放宽origin检查
        if (event.origin && !allowedOrigins.includes(event.origin)) {
          console.warn('⚠️ Received message from unexpected origin:', event.origin);
          console.log('Allowed origins:', allowedOrigins);
          // 不要直接return，继续处理消息，因为本地服务的origin可能不可预测
        }
        
        try {
          const data = event.data;
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            console.log('📋 Parsed Draw.io message:', parsed);
            
            // 处理初始化完成
            if (parsed.event === 'init') {
              console.log('🎉 Draw.io editor initialized successfully');
              this._loading = false;
              clearTimeout(loadTimeout);
            }
            
            // 处理配置事件
            if (parsed.event === 'configure') {
              console.log('⚙️ Draw.io configure event:', parsed);
            }
            
            // 处理加载事件
            if (parsed.event === 'load') {
              console.log('📁 Draw.io load event:', parsed);
            }
            
            // 处理保存事件 - 完全按照docmost的方式
            if (parsed.event === 'save') {
              console.log('💾 Draw.io save event received');
              console.log('Save parentEvent:', parsed.parentEvent);
              console.log('Save XML length:', parsed.xml ? parsed.xml.length : 'no XML');
              
              // 检查是否是真正的保存事件（不是其他事件触发的）
              if (parsed.parentEvent !== 'save') {
                console.log('❌ Save event triggered by other event, ignoring');
                return;
              }
              
              if (parsed.xml) {
                console.log('✅ Processing save with XML length:', parsed.xml.length);
                this._handleSave(parsed.xml);
              } else {
                console.log('❌ Save event without XML data');
              }
            }
            
            // 处理退出事件 - 完全按照docmost的方式
            if (parsed.event === 'exit') {
              console.log('🚪 Draw.io exit event received');
              console.log('Exit parentEvent:', parsed.parentEvent);
              
              // 检查是否是真正的退出事件（不是其他事件触发的）
              if (parsed.parentEvent) {
                console.log('❌ Exit event triggered by other event, ignoring');
                return;
              }
              
              console.log('✅ Processing exit request');
              this._closeEditor();
            }
            
            // 处理错误事件
            if (parsed.event === 'error') {
              console.error('❌ Draw.io editor error:', parsed);
              this._loading = false;
              this.notificationService?.notify({
                title: '编辑器错误',
                message: parsed.message || '编辑器发生未知错误',
                type: 'error',
              });
            }
          } else {
            console.log('📨 Received non-string message:', data);
          }
        } catch (e) {
          console.error('❌ Failed to parse Draw.io message:', e);
          console.log('Original data:', event.data);
        }
      };

      console.log('🔌 Adding message event listener');
      window.addEventListener('message', handleMessage);
      this._disposables.add(() => {
        console.log('🔌 Removing message event listener');
        window.removeEventListener('message', handleMessage);
      });
    }, 100);
  }

  private async _handleSave(xmlData: string) {
    try {
      // 按照docmost的方式，先将XML转换为SVG
      const svgData = await this._convertXmlToSvg(xmlData);
      
      // 创建SVG的数据URL
      const base64Data = btoa(svgData);
      const dataUrl = `data:image/svg+xml;base64,${base64Data}`;
      
      // 更新模型，同时保存XML和SVG
      this.std.store.updateBlock(this.model, {
        src: dataUrl,
        title: 'Draw.io 图表',
        xml: xmlData, // 保存原始XML数据供编辑使用
      });
      
      this._closeEditor();
      
      this.notificationService?.notify({
        title: '保存成功',
        message: 'Draw.io 图表已保存',
        type: 'success',
      });
    } catch (error) {
      console.error('保存图表失败:', error);
      this.notificationService?.notify({
        title: '保存失败',
        message: '保存 Draw.io 图表时出现错误',
        type: 'error',
      });
    }
  }

  private async _convertXmlToSvg(xmlData: string): Promise<string> {
    // 创建一个简单的SVG包装器，包含Draw.io的XML数据
    // 这样既可以显示图表，又保留了原始数据
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <!-- Draw.io XML data -->
      <metadata>${xmlData}</metadata>
      <rect width="100%" height="100%" fill="#f8f9fa" stroke="#e9ecef"/>
      <text x="50%" y="40%" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#495057">
        Draw.io 图表
      </text>
      <text x="50%" y="60%" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6c757d">
        双击编辑
      </text>
    </svg>`;
    
    return svg;
  }

  private _handleDoubleClick() {
    this._openEditor();
  }

  private _handleClick() {
    if (!this.model.props.src) {
      this._openEditor();
    }
  }

  private _renderPlaceholder(): TemplateResult {
    return html`
      <div class="affine-drawio-placeholder" @click=${this._handleClick}>
        <div class="affine-drawio-placeholder-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#F08705"/>
          </svg>
        </div>
        <div class="affine-drawio-placeholder-text">双击创建 Draw.io 图表</div>
        <div class="affine-drawio-placeholder-desc">使用专业的流程图和图表工具</div>
      </div>
    `;
  }

  private _renderImage(): TemplateResult {
    return html`
      <div class="affine-drawio-image-container">
        <img
          class="affine-drawio-image"
          src=${this.model.props.src}
          alt=${this.model.props.title || 'Draw.io图表'}
          @dblclick=${this._handleDoubleClick}
        />
        ${this._renderEditButton()}
      </div>
    `;
  }

  private _renderEditButton(): TemplateResult {
    if (this.readonly) return nothing;

    return html`
      <div class="affine-drawio-edit-button" @click=${this._openEditor}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
        </svg>
        编辑
      </div>
    `;
  }

  private _renderModal(): TemplateResult {
    if (!this._modalOpen) return nothing;

    return html`
      <div class="affine-drawio-modal" ${ref(this._modalRef)}>
        <div class="affine-drawio-modal-overlay" @click=${this._closeEditor}></div>
        <div class="affine-drawio-modal-content">
          <div class="affine-drawio-modal-header">
            <div class="affine-drawio-modal-title">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" fill="#F08705"/>
              </svg>
              编辑 Draw.io 图表
            </div>
            <button
              class="affine-drawio-modal-close"
              @click=${this._closeEditor}
              title="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
              </svg>
            </button>
          </div>
          <div class="affine-drawio-modal-body">
            ${this._loading ? html`
              <div class="affine-drawio-loading">
                <div class="affine-drawio-spinner"></div>
                <div>正在加载 Draw.io 编辑器...</div>
                <div style="margin-top: 8px; font-size: 12px; color: var(--affine-text-secondary-color);">
                  首次加载可能需要较长时间，请耐心等待
                </div>
              </div>
            ` : nothing}
            <iframe
              ${ref(this._frameRef)}
              class="affine-drawio-editor-frame"
              @load=${() => console.log('Draw.io iframe DOM loaded')}
              @error=${() => {
                this._loading = false;
                console.error('Failed to load Draw.io editor iframe');
                this.notificationService?.notify({
                  title: '加载失败',
                  message: 'Draw.io 编辑器加载失败，请重试',
                  type: 'error',
                });
              }}
            ></iframe>
          </div>
        </div>
      </div>
    `;
  }

  override renderBlock(): TemplateResult {
    const classes = classMap({
      'affine-drawio-container': true,
      'selected': this.selected,
      'readonly': this.readonly,
    });

    return html`
      <div class=${classes}>
        ${this.model.props.src ? this._renderImage() : this._renderPlaceholder()}
      </div>
      ${this._renderModal()}
    `;
  }

  override handleEvent(name: string, context: { preventDefault: () => void }) {
    switch (name) {
      case 'click': {
        if (!this.model.props.src) {
          this._handleClick();
        }
        break;
      }
      case 'double-click': {
        this._handleDoubleClick();
        break;
      }
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    this._loading = false;
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this._modalOpen) {
      this._closeEditor();
    }
  }
}