import { css } from 'lit';

export const drawioBlockStyles = css`
  .affine-drawio-container {
    position: relative;
    border: 1px solid var(--affine-border-color);
    border-radius: 8px;
    overflow: hidden;
    margin: 8px 0;
    background: var(--affine-background-primary-color);
  }

  .affine-drawio-container:hover {
    border-color: var(--affine-primary-color);
  }

  .affine-drawio-container.selected {
    border-color: var(--affine-primary-color);
    box-shadow: 0 0 0 2px var(--affine-primary-color-20);
  }

  .affine-drawio-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--affine-text-secondary-color);
    font-size: 14px;
    background: var(--affine-background-secondary-color);
    border: 2px dashed var(--affine-border-color);
    border-radius: 8px;
    cursor: pointer;
    flex-direction: column;
    gap: 8px;
  }

  .affine-drawio-placeholder:hover {
    border-color: var(--affine-primary-color);
    color: var(--affine-primary-color);
  }

  .affine-drawio-image {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
  }

  .affine-drawio-toolbar {
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

  .affine-drawio-container:hover .affine-drawio-toolbar {
    opacity: 1;
  }

  .affine-drawio-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background: transparent;
    border: none;
    color: var(--affine-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s;
  }

  .affine-drawio-button:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .affine-drawio-modal {
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
  }

  .affine-drawio-modal-content {
    width: 90vw;
    height: 90vh;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }

  .affine-drawio-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: var(--affine-background-secondary-color);
    border-bottom: 1px solid var(--affine-border-color);
  }

  .affine-drawio-modal-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--affine-text-primary-color);
  }

  .affine-drawio-modal-close {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    color: var(--affine-text-secondary-color);
  }

  .affine-drawio-modal-close:hover {
    background: var(--affine-hover-color);
    color: var(--affine-text-primary-color);
  }

  .affine-drawio-editor-frame {
    width: 100%;
    height: calc(100% - 48px);
    border: none;
  }

  .affine-drawio-placeholder-icon {
    font-size: 24px;
    opacity: 0.5;
  }
`;