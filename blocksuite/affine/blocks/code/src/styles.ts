import { scrollbarStyle } from '@blocksuite/affine-shared/styles';
import { css } from 'lit';

export const codeBlockStyles = css`
  affine-code {
    display: block;
  }

  .affine-code-block-container {
    font-size: var(--affine-font-xs);
    line-height: var(--affine-line-height);
    position: relative;
    padding: 32px 20px;
    background: var(--affine-background-code-block);
    border-radius: 10px;
    box-sizing: border-box;
  }

  .affine-code-block-container.mobile {
    padding: 12px;
  }

  /* 折叠状态下的样式调整 */
  .affine-code-block-container.collapsed {
    padding-bottom: 16px;
  }

  .affine-code-block-container.collapsed rich-text {
    max-height: 120px;
    overflow: hidden;
    position: relative;
  }

  .affine-code-block-container.collapsed rich-text::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    background: linear-gradient(transparent, var(--affine-background-code-block));
    pointer-events: none;
  }

  /* 折叠指示器 */
  .collapsed-indicator {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    padding: 4px 12px;
    background: var(--affine-background-secondary-color, #f5f5f5);
    border: 1px solid var(--affine-border-color, #e0e0e0);
    border-radius: 16px;
    font-size: var(--affine-font-xs);
    color: var(--affine-text-secondary-color);
    cursor: pointer;
    transition: all 0.2s ease;
    z-index: 2;
  }

  .collapsed-indicator:hover {
    background: var(--affine-hover-color, #f0f0f0);
    color: var(--affine-primary-color, #1976d2);
    border-color: var(--affine-primary-color, #1976d2);
  }

  ${scrollbarStyle('.affine-code-block-container rich-text')}

  .affine-code-block-container .inline-editor {
    font-family: var(--affine-font-code-family);
    font-variant-ligatures: none;
  }

  .affine-code-block-container v-line {
    position: relative;
    display: inline-grid !important;
    grid-template-columns: auto minmax(0, 1fr);
  }

  .affine-code-block-container div:has(> v-line) {
    display: grid;
  }

  .affine-code-block-container .line-number {
    position: sticky;
    text-align: left;
    padding-right: 12px;
    width: 32px;
    word-break: break-word;
    white-space: nowrap;
    left: -0.5px;
    z-index: 1;
    background: var(--affine-background-code-block);
    font-size: var(--affine-font-xs);
    line-height: var(--affine-line-height);
    color: var(--affine-text-secondary);
    box-sizing: border-box;
    user-select: none;
  }

  .affine-code-block-container.disable-line-numbers .line-number {
    display: none;
  }

  affine-code .affine-code-block-preview {
    padding: 12px;
  }
`;
