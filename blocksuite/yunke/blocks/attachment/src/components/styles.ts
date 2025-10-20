import { fontXSStyle, panelBaseStyle } from '@blocksuite/yunke-shared/styles';
import { css } from 'lit';

export const renameStyles = css`
  ${panelBaseStyle('.yunke-attachment-rename-container')}
  .yunke-attachment-rename-container {
    position: relative;
    display: flex;
    align-items: center;
    width: 320px;
    gap: 12px;
    padding: 12px;
    z-index: var(--yunke-z-index-popover);
  }

  .yunke-attachment-rename-input-wrapper {
    display: flex;
    min-width: 280px;
    height: 30px;
    box-sizing: border-box;
    padding: 4px 10px;
    background: var(--yunke-white-10);
    border-radius: 4px;
    border: 1px solid var(--yunke-border-color);
  }

  .yunke-attachment-rename-input-wrapper:focus-within {
    border-color: var(--yunke-blue-700);
    box-shadow: var(--yunke-active-shadow);
  }

  .yunke-attachment-rename-input-wrapper input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    color: var(--yunke-text-primary-color);
  }
  ${fontXSStyle('.yunke-attachment-rename-input-wrapper input')}

  .yunke-attachment-rename-input-wrapper input::placeholder {
    color: var(--yunke-placeholder-color);
  }

  .yunke-attachment-rename-extension {
    font-size: var(--yunke-font-xs);
    color: var(--yunke-text-secondary-color);
  }

  .yunke-attachment-rename-overlay-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--yunke-z-index-popover);
  }
`;

export const styles = css`
  :host {
    z-index: 1;
  }
`;
