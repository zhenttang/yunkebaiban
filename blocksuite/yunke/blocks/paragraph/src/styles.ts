import { css } from 'lit';

export const paragraphBlockStyles = css`
  yunke-paragraph {
    box-sizing: border-box;
    display: block;
    font-size: var(--yunke-font-base);
    min-height: var(--yunke-paragraph-min-height, 1em);
  }

  .yunke-paragraph-block-container {
    position: relative;
    border-radius: 4px;
  }
  .yunke-paragraph-rich-text-wrapper {
    position: relative;
  }

  yunke-paragraph code {
    font-size: calc(var(--yunke-font-base) - 3px);
    padding: 0px 4px 2px;
  }

  .h1 {
    font-size: var(--yunke-font-h-1);
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: calc(1em + 8px);
    margin-top: 18px;
    margin-bottom: 10px;
  }

  .h1 code {
    font-size: calc(var(--yunke-font-base) + 10px);
    padding: 0px 4px;
  }

  .h2 {
    font-size: var(--yunke-font-h-2);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: calc(1em + 10px);
    margin-top: 14px;
    margin-bottom: 10px;
  }

  .h2 code {
    font-size: calc(var(--yunke-font-base) + 8px);
    padding: 0px 4px;
  }

  .h3 {
    font-size: var(--yunke-font-h-3);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: calc(1em + 8px);
    margin-top: 12px;
    margin-bottom: 10px;
  }

  .h3 code {
    font-size: calc(var(--yunke-font-base) + 6px);
    padding: 0px 4px;
  }

  .h4 {
    font-size: var(--yunke-font-h-4);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: calc(1em + 8px);
    margin-top: 12px;
    margin-bottom: 10px;
  }
  .h4 code {
    font-size: calc(var(--yunke-font-base) + 4px);
    padding: 0px 4px;
  }

  .h5 {
    font-size: var(--yunke-font-h-5);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: calc(1em + 8px);
    margin-top: 12px;
    margin-bottom: 10px;
  }
  .h5 code {
    font-size: calc(var(--yunke-font-base) + 2px);
    padding: 0px 4px;
  }

  .h6 {
    font-size: var(--yunke-font-h-6);
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: calc(1em + 8px);
    margin-top: 12px;
    margin-bottom: 10px;
  }

  .h6 code {
    font-size: var(--yunke-font-base);
    padding: 0px 4px 2px;
  }

  .quote {
    line-height: 26px;
    padding-left: 17px;
    margin-top: var(--yunke-paragraph-space);
    padding-top: 10px;
    padding-bottom: 10px;
    position: relative;
  }
  .quote::after {
    content: '';
    width: 2px;
    height: calc(100% - 20px);
    margin-top: 10px;
    margin-bottom: 10px;
    position: absolute;
    left: 0;
    top: 0;
    background: var(--yunke-quote-color);
    border-radius: 18px;
  }

  .yunke-paragraph-placeholder {
    position: absolute;
    display: none;
    max-width: 100%;
    overflow-x: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    left: 0;
    bottom: 0;
    pointer-events: none;
    color: var(--yunke-black-30);
    fill: var(--yunke-black-30);
  }
  @media print {
    .yunke-paragraph-placeholder {
      display: none !important;
    }
  }
  .yunke-paragraph-placeholder.visible {
    display: block;
  }
  @media print {
    .yunke-paragraph-placeholder.visible {
      display: none;
    }
  }
`;
