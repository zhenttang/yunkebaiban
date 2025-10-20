import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const AIChatBlockStyles = css`
  .yunke-ai-chat-block-container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 16px;
    background: var(--yunke-white);
    color: var(--yunke-text-primary-color);
    line-height: 22px;
    font-size: var(--yunke-font-sm);
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    border-radius: 8px;
    user-select: none;
    pointer-events: none;

    .ai-chat-messages-container {
      display: block;
      flex: 1 0 0;
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(to top, transparent, var(--yunke-white));
      -webkit-mask-image: linear-gradient(
        to bottom,
        var(--yunke-white) 25%,
        transparent
      );
      mask-image: linear-gradient(
        to bottom,
        var(--yunke-white) 25%,
        transparent
      );
      overflow: hidden;
    }

    .ai-chat-block-button {
      display: flex;
      width: 100%;
      height: 22px;
      flex-direction: row;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      svg {
        color: var(--yunke-icon-color);
      }
    }
  }
`;
