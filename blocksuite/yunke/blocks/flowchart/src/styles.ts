import { cssVarV2 } from '@blocksuite/yunke-shared/theme';
import { css, unsafeCSS } from 'lit';

export const flowchartBlockStyles = css`
  .yunke-flowchart-container {
    position: relative;
    margin: 8px 0;
    border-radius: 8px;
    border: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    transition: all 0.2s ease;
  }

  .yunke-flowchart-container.selected {
    border-color: ${unsafeCSS(cssVarV2('button/primary'))};
    box-shadow: 0 0 0 2px ${unsafeCSS(cssVarV2('button/primary'))}20;
  }

  .yunke-flowchart-toolbar {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    background: ${unsafeCSS(cssVarV2('layer/background/secondary'))};
    border-radius: 8px 8px 0 0;
  }

  .yunke-flowchart-edit-button,
  .yunke-flowchart-type-toggle {
    padding: 6px 12px;
    border: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    border-radius: 4px;
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    color: ${unsafeCSS(cssVarV2('text/primary'))};
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .yunke-flowchart-edit-button:hover,
  .yunke-flowchart-type-toggle:hover {
    background: ${unsafeCSS(cssVarV2('layer/background/hoverOverlay'))};
    border-color: ${unsafeCSS(cssVarV2('button/primary'))};
  }

  .yunke-flowchart-type-toggle.active {
    background: ${unsafeCSS(cssVarV2('button/primary'))};
    color: white;
    border-color: ${unsafeCSS(cssVarV2('button/primary'))};
  }

  .yunke-flowchart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .yunke-flowchart-placeholder:hover {
    background: ${unsafeCSS(cssVarV2('layer/background/hoverOverlay'))};
  }

  .placeholder-content {
    text-align: center;
  }

  .placeholder-icon {
    font-size: 48px;
    margin-bottom: 12px;
  }

  .placeholder-text {
    font-size: 16px;
    font-weight: 500;
    color: ${unsafeCSS(cssVarV2('text/primary'))};
    margin-bottom: 4px;
  }

  .placeholder-desc {
    font-size: 13px;
    color: ${unsafeCSS(cssVarV2('text/secondary'))};
  }

  .yunke-flowchart-preview {
    padding: 24px;
    min-height: 200px;
    overflow: auto;
  }

  .yunke-flowchart-preview svg {
    max-width: 100%;
    height: auto;
  }

  .yunke-flowchart-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: ${unsafeCSS(cssVarV2('text/secondary'))};
    font-size: 14px;
  }

  .yunke-flowchart-error {
    padding: 24px;
    min-height: 200px;
    color: ${unsafeCSS(cssVarV2('status/error'))};
    background: ${unsafeCSS(cssVarV2('status/error'))}10;
    border-radius: 4px;
    margin: 12px;
    font-family: monospace;
    font-size: 13px;
    white-space: pre-wrap;
  }

  .yunke-flowchart-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .yunke-flowchart-modal {
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    border-radius: 12px;
    width: 90%;
    max-width: 1200px;
    height: 80%;
    max-height: 800px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .yunke-flowchart-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
  }

  .yunke-flowchart-modal-header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${unsafeCSS(cssVarV2('text/primary'))};
  }

  .header-buttons {
    display: flex;
    gap: 8px;
  }

  .save-button,
  .close-button {
    padding: 8px 16px;
    border: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    border-radius: 6px;
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    color: ${unsafeCSS(cssVarV2('text/primary'))};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .save-button {
    background: ${unsafeCSS(cssVarV2('button/primary'))};
    color: white;
    border-color: ${unsafeCSS(cssVarV2('button/primary'))};
  }

  .save-button:hover {
    opacity: 0.9;
  }

  .close-button:hover {
    background: ${unsafeCSS(cssVarV2('layer/background/hoverOverlay'))};
  }

  .yunke-flowchart-modal-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    overflow: hidden;
  }

  .editor-container,
  .preview-container {
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    overflow: auto;
    position: relative;
  }

  .code-editor {
    width: 100%;
    height: 100%;
    padding: 16px;
    border: none;
    background: ${unsafeCSS(cssVarV2('layer/background/codeBlock'))};
    color: ${unsafeCSS(cssVarV2('text/primary'))};
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    line-height: 1.6;
    resize: none;
    outline: none;
  }

  .code-editor::placeholder {
    color: ${unsafeCSS(cssVarV2('text/placeholder'))};
    opacity: 0.5;
  }

  .preview-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .preview-content {
    width: 100%;
    height: 100%;
    overflow: auto;
  }

  .preview-content svg {
    max-width: 100%;
    height: auto;
  }

  .diagram-stats {
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 8px;
    background: ${unsafeCSS(cssVarV2('layer/background/secondary'))};
    border-radius: 4px;
    font-size: 11px;
    color: ${unsafeCSS(cssVarV2('text/secondary'))};
  }

  .example-selector {
    padding: 12px;
    background: ${unsafeCSS(cssVarV2('layer/background/secondary'))};
    border-bottom: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
  }

  .example-selector label {
    font-size: 12px;
    color: ${unsafeCSS(cssVarV2('text/secondary'))};
    margin-right: 8px;
  }

  .example-selector select {
    padding: 4px 8px;
    border: 1px solid ${unsafeCSS(cssVarV2('layer/insideBorder/border'))};
    border-radius: 4px;
    background: ${unsafeCSS(cssVarV2('layer/background/primary'))};
    color: ${unsafeCSS(cssVarV2('text/primary'))};
    font-size: 12px;
  }
`;

