import { scrollbarStyle } from '@blocksuite/yunke-shared/styles';
import { css } from 'lit';

export const codeBlockStyles = css`
  yunke-code {
    display: block;
  }

  .yunke-code-block-container {
    font-size: var(--yunke-font-xs);
    line-height: var(--yunke-line-height);
    position: relative;
    padding: 32px 20px;
    background: var(--yunke-background-code-block);
    border-radius: 10px;
    box-sizing: border-box;
  }

  .yunke-code-block-container.mobile {
    padding: 12px;
  }

  /* 折叠状态下的样式调整 */
  .yunke-code-block-container.collapsed {
    padding-bottom: 16px;
  }

  .yunke-code-block-container.collapsed rich-text {
    max-height: 120px;
    overflow: hidden;
    position: relative;
  }

  .yunke-code-block-container.collapsed rich-text::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, var(--yunke-background-code-block));
    pointer-events: none;
  }

  /* 折叠指示器 */
  .collapsed-indicator {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    background: var(--yunke-background-secondary-color, #f5f5f5);
    border: 1px solid var(--yunke-border-color, #e0e0e0);
    border-radius: 16px;
    font-size: var(--yunke-font-xs);
    color: var(--yunke-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 2;
  }

  .collapsed-indicator:hover {
    background: var(--yunke-hover-color, #f0f0f0);
    color: var(--yunke-primary-color, #1976d2);
    border-color: var(--yunke-primary-color, #1976d2);
  }

  ${scrollbarStyle('.yunke-code-block-container rich-text')}

  .yunke-code-block-container .inline-editor {
    font-family: var(--yunke-font-code-family);
    font-variant-ligatures: none;
  }

  .yunke-code-block-container v-line {
    position: relative;
    display: inline-grid !important;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .yunke-code-block-container div:has(> v-line) {
    display: grid;
  }

  .yunke-code-block-container .line-number {
    position: sticky;
    text-align: left;
    padding-right: 12px;
    width: 32px;
    word-break: break-word;
    white-space: nowrap;
    left: -0.5px;
    z-index: 1;
    background: var(--yunke-background-code-block);
    font-size: var(--yunke-font-xs);
    line-height: var(--yunke-line-height);
    color: var(--yunke-text-secondary);
    box-sizing: border-box;
    user-select: none;
  }

  .yunke-code-block-container.disable-line-numbers .line-number {
    display: none;
  }

  yunke-code .yunke-code-block-preview {
    padding: 12px;
  }
`;
