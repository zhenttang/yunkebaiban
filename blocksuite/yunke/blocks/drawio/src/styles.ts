import { css } from 'lit';

export const drawioBlockStyles = css`
  .affine-drawio-container {
    position: relative;
    margin: 16px 0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .affine-drawio-container.selected {
    box-shadow: 0 0 0 2px var(--affine-primary-color, #1e96eb);
  }

  .affine-drawio-container.readonly {
    pointer-events: none;
  }

  /* 占位符样式 */
  .affine-drawio-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    border: 2px dashed var(--affine-border-color, #e0e0e0);
    border-radius: 8px;
    background: var(--affine-background-secondary-color, #fafafa);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 32px;
  }

  .affine-drawio-placeholder:hover {
    border-color: var(--affine-primary-color, #1e96eb);
    background: var(--affine-hover-color, #f0f7ff);
  }

  .affine-drawio-placeholder-icon {
    margin-bottom: 16px;
    opacity: 0.8;
  }

  .affine-drawio-placeholder-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--affine-text-primary-color, #333);
    margin-bottom: 8px;
  }

  .affine-drawio-placeholder-desc {
    font-size: 14px;
    color: var(--affine-text-secondary-color, #666);
    text-align: center;
  }

  /* 图片容器样式 */
  .affine-drawio-image-container {
    position: relative;
    display: inline-block;
    max-width: 100%;
  }

  .affine-drawio-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .affine-drawio-image:hover {
    transform: scale(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  /* 编辑按钮样式 */
  .affine-drawio-edit-button {
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

  .affine-drawio-image-container:hover .affine-drawio-edit-button {
    opacity: 1;
  }

  .affine-drawio-edit-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.05);
  }

  /* 模态框样式 */
  .affine-drawio-modal {
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

  .affine-drawio-modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
  }

  .affine-drawio-modal-content {
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

  .affine-drawio-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--affine-border-color, #e0e0e0);
    background: var(--affine-background-secondary-color, #fafafa);
    flex-shrink: 0;
  }

  .affine-drawio-modal-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--affine-text-primary-color, #333);
  }

  .affine-drawio-modal-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    color: var(--affine-text-secondary-color, #666);
    transition: all 0.2s ease;
  }

  .affine-drawio-modal-close:hover {
    background: var(--affine-hover-color, #f0f0f0);
    color: var(--affine-text-primary-color, #333);
  }

  .affine-drawio-modal-body {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  .affine-drawio-editor-frame {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  /* 加载状态样式 */
  .affine-drawio-loading {
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
    color: var(--affine-text-secondary-color, #666);
  }

  .affine-drawio-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--affine-border-color, #e0e0e0);
    border-top: 3px solid var(--affine-primary-color, #1e96eb);
    border-radius: 50%;
    animation: drawio-spin 1s linear infinite;
  }

  @keyframes drawio-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 响应式设计 */
  @media (max-width: 768px) {
    .affine-drawio-modal {
      padding: 10px;
    }

    .affine-drawio-modal-content {
      width: 100vw;
      height: 100vh;
      border-radius: 0;
    }

    .affine-drawio-placeholder {
      min-height: 150px;
      padding: 24px;
    }

    .affine-drawio-placeholder-text {
      font-size: 14px;
    }

    .affine-drawio-placeholder-desc {
      font-size: 12px;
    }
  }

  /* 暗色主题支持 */
  @media (prefers-color-scheme: dark) {
    .affine-drawio-modal-content {
      background: var(--affine-background-primary-color, #1a1a1a);
      border: 1px solid var(--affine-border-color, #333);
    }

    .affine-drawio-placeholder {
      background: var(--affine-background-secondary-color, #252525);
      border-color: var(--affine-border-color, #333);
    }

    .affine-drawio-placeholder:hover {
      background: var(--affine-hover-color, #2a2a2a);
    }
  }

  /* 工具栏样式（如果需要） */
  .affine-drawio-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .affine-drawio-container:hover .affine-drawio-toolbar {
    opacity: 1;
  }

  .affine-drawio-button {
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

  .affine-drawio-button:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
`;