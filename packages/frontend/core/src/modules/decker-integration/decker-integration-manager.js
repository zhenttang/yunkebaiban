// Decker集成管理器
// 负责处理Decker编辑器与白板系统的通信
import { getDeckerUrl } from '@yunke/config';
export class DeckerIntegrationManager {
    constructor() {
        this.store = null;
        this.listeners = new Set();
        this.setupGlobalListener();
    }
    setStore(store) {
        this.store = store;
    }
    setupGlobalListener() {
        const globalHandler = (event) => {
            // 验证来源
            if (event.origin !== window.location.origin) {
                return;
            }
            const { type } = event.data;
            switch (type) {
                case 'DECK_EXPORT_COMPLETE':
                    this.handleDeckerExport(event.data);
                    break;
                case 'DECK_READY':
                    console.log('Decker编辑器已就绪');
                    break;
                case 'DECK_ERROR':
                    console.error('Decker错误:', event.data.error);
                    break;
            }
            // 通知其他监听器
            this.listeners.forEach(listener => {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error('Decker集成监听器错误:', error);
                }
            });
        };
        window.addEventListener('message', globalHandler);
    }
    async handleDeckerExport(data) {
        if (!this.store) {
            console.warn('白板Store未设置，无法处理Decker导出');
            return;
        }
        try {
            // 将GIF数据转换为Blob
            const gifBlob = new Blob([new Uint8Array(data.gifData)], { type: 'image/gif' });
            // 上传到白板存储系统
            const sourceId = await this.store.blobSync.set(gifBlob);
            // 准备自定义数据
            const customData = JSON.stringify({
                type: 'deck',
                deckData: data.deckData,
                metadata: {
                    ...data.metadata,
                    createdAt: Date.now(),
                    editor: 'decker'
                }
            });
            // 创建ImageBlock
            await this.createImageBlock(sourceId, customData, gifBlob.size);
            console.log('Decker导出内容已插入白板');
        }
        catch (error) {
            console.error('处理Decker导出失败:', error);
        }
    }
    async createImageBlock(sourceId, customData, size) {
        if (!this.store)
            return;
        // 获取当前文档的根页面
        const collection = this.store.collection;
        const rootDoc = collection.getDoc();
        if (!rootDoc) {
            console.error('未找到根文档');
            return;
        }
        // 获取页面块
        const pageBlock = rootDoc.getBlockByFlavour('yunke:page')[0];
        if (!pageBlock) {
            console.error('未找到页面块');
            return;
        }
        // 在页面中添加图片块
        const imageBlockId = rootDoc.addBlock('yunke:image', {
            sourceId,
            customData,
            size,
            width: 0,
            height: 0,
            rotate: 0,
            index: 'a0',
            xywh: '[0,0,0,0]',
            lockedBySelf: false,
        }, pageBlock.id);
        console.log('ImageBlock已创建:', imageBlockId);
    }
    // 添加自定义监听器
    addListener(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    // 打开Decker编辑器进行新建
    openDeckerForNew() {
        this.openDeckerModal();
    }
    // 打开Decker编辑器进行编辑
    openDeckerForEdit(deckData) {
        this.openDeckerModal(deckData);
    }
    openDeckerModal(deckData) {
        // 移除可能存在的旧模态框
        const existingModal = document.querySelector('#decker-new-modal');
        if (existingModal) {
            existingModal.remove();
        }
        // 创建模态框容器
        const overlay = document.createElement('div');
        overlay.id = 'decker-new-modal';
        overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.8) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    `;
        const modal = document.createElement('div');
        modal.style.cssText = `
      background: white !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
      width: 95vw !important;
      max-width: 1200px !important;
      height: 90vh !important;
      max-height: 800px !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    `;
        // 头部
        const header = document.createElement('div');
        header.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid #e0e0e0 !important;
      background: #f5f5f5 !important;
    `;
        const title = document.createElement('h3');
        title.textContent = deckData ? 'Decker 编辑器 - 编辑' : 'Decker 编辑器 - 新建';
        title.style.cssText = `
      margin: 0 !important;
      font-size: 18px !important;
      font-weight: 600 !important;
      color: #333 !important;
    `;
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
      display: flex !important;
      gap: 8px !important;
    `;
        const saveButton = document.createElement('button');
        saveButton.textContent = '保存并插入';
        saveButton.style.cssText = `
      padding: 8px 16px !important;
      background: #007bff !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.style.cssText = `
      padding: 8px 16px !important;
      background: #6c757d !important;
      color: white !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: pointer !important;
      font-size: 14px !important;
    `;
        // iframe容器
        const iframeContainer = document.createElement('div');
        iframeContainer.style.cssText = `
      flex: 1 !important;
      background: #000 !important;
      position: relative !important;
    `;
        // 创建iframe
        const iframe = document.createElement('iframe');
        const deckerUrl = `/yunke_whiteboard.html?whiteboard=true&origin=${encodeURIComponent(window.location.origin)}`;
        iframe.src = deckerUrl;
        iframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      border: none !important;
      background: white !important;
    `;
        // 事件处理
        const closeModal = () => {
            overlay.remove();
            window.removeEventListener('message', messageHandler);
        };
        const messageHandler = (event) => {
            // 从统一配置模块获取Decker服务URL
            const deckerUrl = getDeckerUrl();
            const allowedOrigins = [
                window.location.origin,
                deckerUrl,
                new URL(deckerUrl).origin
            ];
            if (!allowedOrigins.includes(event.origin)) {
                console.log('消息来源未授权:', event.origin);
                return;
            }
            const { type } = event.data;
            console.log('收到Decker消息:', type, event.data);
            if (type === 'DECK_EXPORT_COMPLETE') {
                closeModal();
            }
            else if (type === 'DECK_READY') {
                // Decker准备就绪
                if (deckData) {
                    // 如果有deck数据，发送进行加载
                    iframe.contentWindow?.postMessage({
                        type: 'LOAD_DECK_DATA',
                        payload: { deckData, metadata: { timestamp: Date.now() } }
                    }, '*');
                }
            }
        };
        const requestSave = () => {
            // 请求Decker导出当前内容
            iframe.contentWindow?.postMessage({
                type: 'EXPORT_GIF_REQUEST'
            }, '*');
        };
        // 绑定事件
        window.addEventListener('message', messageHandler);
        saveButton.addEventListener('click', requestSave);
        cancelButton.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay)
                closeModal();
        });
        // 组装DOM
        buttonContainer.appendChild(saveButton);
        buttonContainer.appendChild(cancelButton);
        header.appendChild(title);
        header.appendChild(buttonContainer);
        iframeContainer.appendChild(iframe);
        modal.appendChild(header);
        modal.appendChild(iframeContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        console.log('Decker新建编辑器模态框已创建');
    }
}
// 全局单例
export const deckerIntegrationManager = new DeckerIntegrationManager();
// 导出便捷函数供工具栏使用
export function openDeckerEditor() {
    deckerIntegrationManager.openDeckerForNew();
}
export function openDeckerEditorWithData(deckData) {
    deckerIntegrationManager.openDeckerForEdit(deckData);
}
//# sourceMappingURL=decker-integration-manager.js.map