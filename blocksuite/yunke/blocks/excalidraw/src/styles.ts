import { css } from 'lit';

export const excalidrawBlockStyles = css`
  .yunke-excalidraw-container {
    position: relative;
    border: 1px solid var(--yunke-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin: 8px 0;
    background: var(--yunke-background-primary-color);
  }

  .yunke-excalidraw-container:hover {
    border-color: var(--yunke-primary-color);
  }

  .yunke-excalidraw-container.selected {
    border-color: var(--yunke-primary-color);
    box-shadow: 0 0 0 2px var(--yunke-primary-color-20);
  }

  .yunke-excalidraw-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 300px;
    color: var(--yunke-text-secondary-color);
    font-size: 14px;
    background: var(--yunke-background-secondary-color);
    border: 2px dashed var(--yunke-border-color);
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

  .yunke-excalidraw-placeholder:hover {
    border-color: var(--yunke-primary-color);
    color: var(--yunke-primary-color);
  }

  .yunke-excalidraw-image {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
  }

  .yunke-excalidraw-image img {
    width: 100%;
    height: auto;
    display: block;
  }

  .yunke-excalidraw-toolbar {
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
    box-shadow: var(--yunke-shadow-2);
  }

  .yunke-excalidraw-container:hover .yunke-excalidraw-toolbar {
    opacity: 1;
  }

  .yunke-excalidraw-edit-button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--yunke-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 12px;
  }

  .yunke-excalidraw-edit-button:hover {
    background: var(--yunke-hover-color);
    color: var(--yunke-text-primary-color);
  }

  .yunke-excalidraw-modal-overlay {
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

  .yunke-excalidraw-modal {
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

  .yunke-excalidraw-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--yunke-background-secondary-color);
    border-bottom: 1px solid var(--yunke-border-color);
    flex-shrink: 0;
    min-height: 48px;
  }

  .yunke-excalidraw-modal-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--yunke-text-primary-color);
  }

  .header-buttons {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .save-button {
    background: var(--yunke-primary-color);
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
    background: var(--yunke-primary-color-hover);
  }

  .close-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: var(--yunke-text-secondary-color);
    font-size: 16px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    background: var(--yunke-hover-color);
    color: var(--yunke-text-primary-color);
  }

  .yunke-excalidraw-modal-body {
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
    color: var(--yunke-text-secondary-color);
    font-size: 14px;
  }
`;