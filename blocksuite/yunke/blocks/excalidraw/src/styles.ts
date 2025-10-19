import { css } from 'lit';

export const excalidrawBlockStyles = css`
  .affine-excalidraw-container {
    position: relative;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin: 8px 0;
    background: var(--affine-background-primary-color);
  }

  .affine-excalidraw-container:hover {
    border-color: var(--affine-primary-color);
  }

  .affine-excalidraw-container.selected {
    border-color: var(--affine-primary-color);
    box-shadow: 0 0 0 2px var(--affine-primary-color-20);
  }

  .affine-excalidraw-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
    background: var(--affine-background-secondary-color);
    border: 2px dashed var(--affine-border-color);
    border-radius: 8px;
    cursor: pointer;
    flex-direction: column;
    gap: 8px;
  }

  .placeholder-content {
    text-align: center;
  }

  .placeholder-icon {
    font-size: 32px;
    margin-bottom: 8px;
    opacity: 0.6;
  }

  .placeholder-text {
    font-weight: 500;
    margin-bottom: 4px;
  }

  .placeholder-desc {
    font-size: 12px;
    opacity: 0.7;
  }

  .affine-excalidraw-placeholder:hover {
    border-color: var(--affine-primary-color);
    color: var(--affine-primary-color);
  }

  .affine-excalidraw-image {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
  }

  .affine-excalidraw-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .affine-excalidraw-toolbar {
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
    box-shadow: var(--affine-shadow-2);
  }

  .affine-excalidraw-container:hover .affine-excalidraw-toolbar {
    opacity: 1;
  }

  .affine-excalidraw-edit-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--affine-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
  }

  .affine-excalidraw-edit-button:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .affine-excalidraw-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;
  }

  .affine-excalidraw-modal {
    width: calc(100vw - 40px);
    height: calc(100vh - 40px);
    max-width: 1200px;
    max-height: 800px;
    background: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  }

  .affine-excalidraw-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--affine-background-secondary-color);
    border-bottom: 1px solid var(--affine-border-color);
    flex-shrink: 0;
    min-height: 48px;
  }

  .affine-excalidraw-modal-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--affine-text-primary-color);
  }

  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-button {
    background: var(--affine-primary-color);
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .save-button:hover {
    background: var(--affine-primary-color-hover);
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: var(--affine-text-secondary-color);
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .affine-excalidraw-modal-body {
    flex: 1;
    overflow: hidden;
    position: relative;
    min-height: 500px;
    background: #f8f9fa;
    display: flex;
    flex-direction: column;
  }

  .excalidraw-container {
    width: 100%;
    height: 100%;
    min-height: 500px;
    background: #f8f9fa;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
  }
`;