import { css } from 'lit';

export const drawioBlockStyles = css`
  .yunke-drawio-container {
    position: relative;
    margin: 16px 0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .yunke-drawio-container.selected {
    box-shadow: 0 0 0 2px var(--yunke-primary-color, #1e96eb);
  }

  .yunke-drawio-container.readonly {
    pointer-events: none;
  }

  /* 占位符样式 */
  .yunke-drawio-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    border: 2px dashed var(--yunke-border-color, #e0e0e0);
    border-radius: 8px;
    background: var(--yunke-background-secondary-color, #fafafa);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 32px;
  }

  .yunke-drawio-placeholder:hover {
    border-color: var(--yunke-primary-color, #1e96eb);
    background: var(--yunke-hover-color, #f0f7ff);
  }

  .yunke-drawio-placeholder-icon {
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .yunke-drawio-placeholder-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--yunke-text-primary-color, #333);
    margin-bottom: 8px;
  }

  .yunke-drawio-placeholder-desc {
    font-size: 14px;
    color: var(--yunke-text-secondary-color, #666);
    text-align: center;
  }

  /* 图片容器样式 */
  .yunke-drawio-image-container {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }

  .yunke-drawio-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .yunke-drawio-image:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* 编辑按钮样式 */
  .yunke-drawio-edit-button {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    opacity: 0;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .yunke-drawio-image-container:hover .yunke-drawio-edit-button {
    opacity: 1;
  }

  .yunke-drawio-edit-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.05);
  }

  /* 模态框样式 */
  .yunke-drawio-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .yunke-drawio-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .yunke-drawio-modal-content {
    position: relative;
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    width: 95vw;
    height: 90vh;
    max-width: 1400px;
    max-height: 900px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .yunke-drawio-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--yunke-border-color, #e0e0e0);
    background: var(--yunke-background-secondary-color, #fafafa);
    flex-shrink: 0;
  }

  .yunke-drawio-modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--yunke-text-primary-color, #333);
  }

  .yunke-drawio-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--yunke-text-secondary-color, #666);
    transition: all 0.2s ease;
  }

  .yunke-drawio-modal-close:hover {
    background: var(--yunke-hover-color, #f0f0f0);
    color: var(--yunke-text-primary-color, #333);
  }

  .yunke-drawio-modal-body {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .yunke-drawio-editor-frame {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  /* 加载状态样式 */
  .yunke-drawio-loading {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: white;
    z-index: 10;
    gap: 16px;
    font-size: 14px;
    color: var(--yunke-text-secondary-color, #666);
  }

  .yunke-drawio-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--yunke-border-color, #e0e0e0);
    border-top: 3px solid var(--yunke-primary-color, #1e96eb);
    border-radius: 50%;
    animation: drawio-spin 1s linear infinite;
  }

  @keyframes drawio-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .yunke-drawio-modal {
      padding: 10px;
    }

    .yunke-drawio-modal-content {
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    }

    .yunke-drawio-placeholder {
      min-height: 150px;
      padding: 24px;
    }

    .yunke-drawio-placeholder-text {
      font-size: 14px;
    }

    .yunke-drawio-placeholder-desc {
      font-size: 12px;
    }
  }

  /* 暗色主题支持 */
  @media (prefers-color-scheme: dark) {
    .yunke-drawio-modal-content {
      background: var(--yunke-background-primary-color, #1a1a1a);
      border: 1px solid var(--yunke-border-color, #333);
    }

    .yunke-drawio-placeholder {
      background: var(--yunke-background-secondary-color, #252525);
      border-color: var(--yunke-border-color, #333);
    }

    .yunke-drawio-placeholder:hover {
      background: var(--yunke-hover-color, #2a2a2a);
    }
  }

  /* 工具栏样式（如果需要） */
  .yunke-drawio-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .yunke-drawio-container:hover .yunke-drawio-toolbar {
    opacity: 1;
  }

  .yunke-drawio-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(4px);
  }

  .yunke-drawio-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
`;