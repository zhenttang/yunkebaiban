import { css } from 'lit';

export const listPrefix = css`
  .yunke-list-block__prefix {
    display: flex;
    color: var(--yunke-blue-700);
    font-size: var(--yunke-font-sm);
    user-select: none;
    position: relative;
  }

  .yunke-list-block__numbered {
    min-width: 22px;
    height: 24px;
    margin-left: 2px;
  }

  .yunke-list-block__todo-prefix {
    display: flex;
    align-items: center;
    cursor: pointer;
    width: 24px;
    height: 24px;
    color: var(--yunke-icon-color);
  }

  .yunke-list-block__todo-prefix.readonly {
    cursor: default;
  }

  .yunke-list-block__todo-prefix > svg {
    width: 20px;
    height: 20px;
  }
`;

export const listBlockStyles = css`
  yunke-list {
    display: block;
    font-size: var(--yunke-font-base);
  }

  yunke-list code {
    font-size: calc(var(--yunke-font-base) - 3px);
    padding: 0px 4px 2px;
  }

  .yunke-list-block-container {
    box-sizing: border-box;
    border-radius: 4px;
    position: relative;
  }
  .yunke-list-block-container .yunke-list-block-container {
    margin-top: 0;
  }
  .yunke-list-rich-text-wrapper {
    position: relative;
    display: flex;
  }
  .yunke-list-rich-text-wrapper rich-text {
    flex: 1;
  }

  .yunke-list--checked {
    color: var(--yunke-text-secondary-color);
  }

  ${listPrefix}
`;
