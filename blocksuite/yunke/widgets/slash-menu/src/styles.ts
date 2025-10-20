import { scrollbarStyle } from '@blocksuite/yunke-shared/styles';
import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const styles = css`
  .overlay-mask {
    pointer-events: auto;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: var(--yunke-z-index-popover);
  }

  .slash-menu {
    position: fixed;
    left: 0;
    top: 0;
    box-sizing: border-box;
    padding: 12px;
    width: 320px;
    overflow-y: auto;
    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};

    background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-radius: 12px;
    border: 1px solid #F3F4F6;
    z-index: var(--yunke-z-index-popover);
    user-select: none;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
  }

  ${scrollbarStyle('.slash-menu')}

  .slash-menu-group-name {
    box-sizing: border-box;
    padding: 0 4px;
    margin: 12px 0 8px 0;

    font-size: 11px;
    font-weight: 600;
    line-height: var(--yunke-line-height);
    text-align: left;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .slash-menu-group-name:first-child {
    margin-top: 0;
  }

  .slash-menu-item {
    padding: 12px 8px;
    justify-content: flex-start;
    gap: 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    border: 1px solid transparent;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
  }

  .slash-menu-item:hover {
    background: #F1F3F5;
    border-color: #E5E7EB;
    transform: translateY(-1px);
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  }

  .slash-menu-item:active {
    transform: translateY(0);
    box-shadow: none;
  }

  .slash-menu-item[hover="true"] {
    background: rgba(91, 156, 255, 0.08);
    border-color: #5B9CFF;
    color: #5B9CFF;
  }

  .slash-menu-item-icon {
    box-sizing: border-box;
    width: 36px;
    height: 36px;
    padding: 8px;
    border: 1px solid #F3F4F6;
    border-radius: 6px;
    color: var(--yunke-icon-color);
    background: #F8F9FB;
    transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);

    display: flex;
    justify-content: center;
    align-items: center;
  }

  .slash-menu-item:hover .slash-menu-item-icon {
    background: white;
    border-color: #E5E7EB;
  }

  .slash-menu-item[hover="true"] .slash-menu-item-icon {
    background: rgba(91, 156, 255, 0.1);
    border-color: #5B9CFF;
    color: #5B9CFF;
  }

  .slash-menu-item-icon svg {
    display: block;
    width: 20px;
    height: 20px;
  }

  .slash-menu-item.ask-ai {
    color: var(--yunke-brand-color);
  }
  .slash-menu-item.github .github-icon {
    color: var(--yunke-black);
  }
`;

export const slashItemToolTipStyle = css`
  .yunke-tooltip {
    display: flex;
    padding: 4px 4px 2px 4px;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }

  .tooltip-figure svg {
    display: block;
  }

  .tooltip-caption {
    padding-left: 4px;
    color: var(
      --light-textColor-textSecondaryColor,
      var(--textColor-textSecondaryColor, #8e8d91)
    );
    font-family: var(--yunke-font-family);
    font-size: var(--yunke-font-xs);
    line-height: var(--yunke-line-height);
  }
`;
