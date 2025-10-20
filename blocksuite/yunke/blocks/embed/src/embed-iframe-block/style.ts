import { css } from 'lit';

export const embedIframeBlockStyles = css`
  .yunke-embed-iframe-block-container {
    display: flex;
    width: 100%;
    border-radius: 8px;
    user-select: none;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .yunke-embed-iframe-block-container.in-surface {
    height: 100%;
  }

  .yunke-embed-iframe-block-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: none;
  }
  .yunke-embed-iframe-block-overlay.show {
    display: block;
  }
`;
