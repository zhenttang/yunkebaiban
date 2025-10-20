import { css } from 'lit';

export const mermaidBlockStyles = css`
  .yunke-mermaid-container {
    position: relative;
    background: var(--yunke-background-primary-color);
    border: 1px solid var(--yunke-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin: 8px 0;
  }

  .yunke-mermaid-container:hover {
    border-color: var(--yunke-primary-color);
  }

  .yunke-mermaid-container.selected {
    border-color: var(--yunke-primary-color);
    box-shadow: 0 0 0 2px var(--yunke-primary-color-20);
  }

  .yunke-mermaid-preview {
    padding: 16px;
    min-height: 200px;
    background: var(--yunke-background-primary-color);
    text-align: center;
    position: relative;
  }

  .yunke-mermaid-preview svg {
    max-width: 100%;
    height: auto;
  }

  .yunke-mermaid-error {
    color: var(--yunke-error-color);
    background: var(--yunke-background-error-color);
    padding: 16px;
    border-radius: 4px;
    font-family: var(--yunke-font-code-family);
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .yunke-mermaid-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    background: var(--yunke-background-secondary-color);
    border: 2px dashed var(--yunke-border-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .yunke-mermaid-placeholder:hover {
    border-color: var(--yunke-primary-color);
    background: var(--yunke-hover-color);
  }

  .placeholder-content {
    text-align: center;
    color: var(--yunke-text-secondary-color);
  }

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .placeholder-text {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 4px;
    color: var(--yunke-text-primary-color);
  }

  .placeholder-desc {
    font-size: 14px;
    color: var(--yunke-text-secondary-color);
  }

  .yunke-mermaid-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--yunke-text-secondary-color);
  }

  .yunke-mermaid-toolbar {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
    background: var(--yunke-background-overlay-panel-color);
    border-radius: 4px;
    padding: 4px;
  }

  .yunke-mermaid-container:hover .yunke-mermaid-toolbar {
    opacity: 1;
  }

  .yunke-mermaid-edit-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px 8px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--yunke-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
    gap: 4px;
  }

  .yunke-mermaid-edit-button:hover {
    background: var(--yunke-hover-color);
    color: var(--yunke-text-primary-color);
  }

  /* 弹窗样式 */
  .yunke-mermaid-modal-overlay {
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

  .yunke-mermaid-modal {
    background: var(--yunke-background-primary-color);
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

  .yunke-mermaid-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--yunke-border-color);
    background: var(--yunke-background-secondary-color);
  }

  .yunke-mermaid-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--yunke-text-primary-color);
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
    background: var(--yunke-primary-color);
    color: white;
  }

  .save-button:hover {
    background: var(--yunke-primary-color-hover);
  }

  .close-button {
    background: var(--yunke-background-tertiary-color);
    color: var(--yunke-text-secondary-color);
  }

  .close-button:hover {
    background: var(--yunke-hover-color);
    color: var(--yunke-text-primary-color);
  }

  .yunke-mermaid-modal-body {
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
    border: 1px solid var(--yunke-border-color);
    border-radius: 8px;
    padding: 16px;
    font-family: var(--yunke-font-code-family);
    font-size: 14px;
    line-height: 1.5;
    background: var(--yunke-background-code-block);
    color: var(--yunke-text-primary-color);
    resize: none;
    outline: none;
  }

  .code-editor:focus {
    border-color: var(--yunke-primary-color);
    box-shadow: 0 0 0 2px var(--yunke-primary-color-20);
  }

  .code-editor::placeholder {
    color: var(--yunke-text-secondary-color);
  }
`;