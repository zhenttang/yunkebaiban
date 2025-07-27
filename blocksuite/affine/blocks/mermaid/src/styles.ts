import { css } from 'lit';

export const mermaidBlockStyles = css`
  .affine-mermaid-container {
    position: relative;
    background: var(--affine-background-primary-color);
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin: 8px 0;
  }

  .affine-mermaid-container:hover {
    border-color: var(--affine-primary-color);
  }

  .affine-mermaid-container.selected {
    border-color: var(--affine-primary-color);
    box-shadow: 0 0 0 2px var(--affine-primary-color-20);
  }

  .affine-mermaid-preview {
    padding: 16px;
    min-height: 200px;
    background: var(--affine-background-primary-color);
    text-align: center;
    position: relative;
  }

  .affine-mermaid-preview svg {
    max-width: 100%;
    height: auto;
  }

  .affine-mermaid-error {
    color: var(--affine-error-color);
    background: var(--affine-background-error-color);
    padding: 16px;
    border-radius: 4px;
    font-family: var(--affine-font-code-family);
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .affine-mermaid-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: var(--affine-background-secondary-color);
    border: 2px dashed var(--affine-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .affine-mermaid-placeholder:hover {
    border-color: var(--affine-primary-color);
    background: var(--affine-hover-color);
  }

  .placeholder-content {
    text-align: center;
    color: var(--affine-text-secondary-color);
  }

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .placeholder-text {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--affine-text-primary-color);
  }

  .placeholder-desc {
    font-size: 14px;
    color: var(--affine-text-secondary-color);
  }

  .affine-mermaid-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--affine-text-secondary-color);
  }

  .affine-mermaid-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    background: var(--affine-background-overlay-panel-color);
    border-radius: 4px;
    padding: 4px;
  }

  .affine-mermaid-container:hover .affine-mermaid-toolbar {
    opacity: 1;
  }

  .affine-mermaid-edit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--affine-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    gap: 4px;
  }

  .affine-mermaid-edit-button:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  /* 弹窗样式 */
  .affine-mermaid-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
  }

  .affine-mermaid-modal {
    background: var(--affine-background-primary-color);
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    width: 80vw;
    max-width: 900px;
    height: 70vh;
    max-height: 600px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .affine-mermaid-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--affine-border-color);
    background: var(--affine-background-secondary-color);
  }

  .affine-mermaid-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--affine-text-primary-color);
  }

  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-button, .close-button {
    padding: 6px 12px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
  }

  .save-button {
    background: var(--affine-primary-color);
    color: white;
  }

  .save-button:hover {
    background: var(--affine-primary-color-hover);
  }

  .close-button {
    background: var(--affine-background-tertiary-color);
    color: var(--affine-text-secondary-color);
  }

  .close-button:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .affine-mermaid-modal-body {
    flex: 1;
    padding: 20px;
    overflow: hidden;
  }

  .editor-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .code-editor {
    flex: 1;
    width: 100%;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    padding: 16px;
    font-family: var(--affine-font-code-family);
    font-size: 14px;
    line-height: 1.5;
    background: var(--affine-background-code-block);
    color: var(--affine-text-primary-color);
    resize: none;
    outline: none;
  }

  .code-editor:focus {
    border-color: var(--affine-primary-color);
    box-shadow: 0 0 0 2px var(--affine-primary-color-20);
  }

  .code-editor::placeholder {
    color: var(--affine-text-secondary-color);
  }
`;