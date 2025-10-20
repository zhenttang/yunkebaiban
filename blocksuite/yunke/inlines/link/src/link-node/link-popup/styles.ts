import { fontSMStyle, panelBaseStyle } from '@blocksuite/yunke-shared/styles';
import { css } from 'lit';

const editLinkStyle = css`
  .yunke-link-edit-popover {
    display: grid;
    grid-template-columns: auto auto;
    grid-template-rows: repeat(2, 1fr);
    grid-template-areas:
      'text-area .'
      'link-area btn';
    justify-items: center;
    align-items: center;
    width: 320px;
    gap: 8px 12px;
    padding: 8px;
    box-sizing: content-box;
  }

  ${fontSMStyle('.yunke-link-edit-popover label')}
  .yunke-link-edit-popover label {
    box-sizing: border-box;
    color: var(--yunke-icon-color);
    font-weight: 400;
  }

  ${fontSMStyle('.yunke-link-edit-popover input')}
  .yunke-link-edit-popover input {
    color: inherit;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--yunke-text-primary-color);
  }
  .yunke-link-edit-popover input::placeholder {
    color: var(--yunke-placeholder-color);
  }
  input:focus {
    outline: none;
  }
  .yunke-link-edit-popover input:focus ~ label,
  .yunke-link-edit-popover input:active ~ label {
    color: var(--yunke-primary-color);
  }

  .yunke-edit-area {
    width: 280px;
    padding: 4px 10px;
    display: grid;
    gap: 8px;
    grid-template-columns: 26px auto;
    grid-template-rows: repeat(1, 1fr);
    grid-template-areas: 'label input';
    user-select: none;
    box-sizing: border-box;

    border: 1px solid var(--yunke-border-color);
    box-sizing: border-box;

    outline: none;
    border-radius: 4px;
    background: transparent;
  }
  .yunke-edit-area:focus-within {
    border-color: var(--yunke-blue-700);
    box-shadow: var(--yunke-active-shadow);
  }

  .yunke-edit-area.text {
    grid-area: text-area;
  }

  .yunke-edit-area.link {
    grid-area: link-area;
  }

  .yunke-edit-label {
    grid-area: label;
  }

  .yunke-edit-input {
    grid-area: input;
  }

  .yunke-confirm-button {
    grid-area: btn;
    user-select: none;
  }
`;

export const linkPopupStyle = css`
  :host {
    box-sizing: border-box;
  }

  .mock-selection {
    position: absolute;
    background-color: rgba(35, 131, 226, 0.28);
  }

  ${panelBaseStyle('.popover-container')}
  .popover-container {
    z-index: var(--yunke-z-index-popover);
    animation: yunke-popover-fade-in 0.2s ease;
    position: absolute;
  }

  @keyframes yunke-popover-fade-in {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .overlay-root {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--yunke-z-index-popover);
  }

  .mock-selection-container {
    pointer-events: none;
  }

  .yunke-link-popover.create {
    display: flex;
    gap: 12px;
    padding: 8px;

    color: var(--yunke-text-primary-color);
  }

  .yunke-link-popover-input {
    min-width: 280px;
    height: 30px;
    box-sizing: border-box;
    padding: 4px 10px;
    background: var(--yunke-white-10);
    border-radius: 4px;
    border-width: 1px;
    border-style: solid;
    border-color: var(--yunke-border-color);
    color: var(--yunke-text-primary-color);
  }
  ${fontSMStyle('.yunke-link-popover-input')}
  .yunke-link-popover-input::placeholder {
    color: var(--yunke-placeholder-color);
  }
  .yunke-link-popover-input:focus {
    border-color: var(--yunke-blue-700);
    box-shadow: var(--yunke-active-shadow);
  }

  ${editLinkStyle}
`;
