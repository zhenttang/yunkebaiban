import { unsafeCSSVar, unsafeCSSVarV2 } from '@blocksuite/yunke/shared/theme';
import { darkCssVariables, lightCssVariables } from '@toeverything/theme';
import {
  darkCssVariablesV2,
  lightCssVariablesV2,
} from '@toeverything/theme/v2';
import { css, unsafeCSS } from 'lit';

export const menuItemStyles = css`
  .menu-item {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 4px var(--item-padding, 12px);
    gap: 4px;
    align-self: stretch;
    border-radius: 4px;
    box-sizing: border-box;
  }

  .menu-item:hover {
    background: ${unsafeCSSVar('--yunke-hover-color')};
    cursor: pointer;
  }

  .item-icon {
    display: flex;
    color: ${unsafeCSSVar('--yunke-brand-color')};

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .menu-item:hover .item-icon {
    color: ${unsafeCSSVar('--yunke-brand-color')};
  }

  .menu-item.discard:hover {
    background: ${unsafeCSSVar('--yunke-background-error-color')};
    .item-name,
    .item-icon,
    .enter-icon {
      color: ${unsafeCSSVar('--yunke-error-color')};
    }
  }

  .item-name {
    display: flex;
    padding: 0px 4px;
    align-items: baseline;
    flex: 1 0 0;
    color: ${unsafeCSSVarV2('text/primary')};
    text-align: start;
    white-space: nowrap;
    font-feature-settings:
      'clig' off,
      'liga' off;
    font-size: var(--yunke-font-sm);
    font-style: normal;
    font-weight: 400;
    line-height: 22px;
  }

  .item-beta {
    color: ${unsafeCSSVarV2('text/secondary')};
    font-size: var(--yunke-font-xs);
    font-weight: 500;
    margin-left: 0.5em;
  }

  .enter-icon,
  .arrow-right-icon {
    color: ${unsafeCSSVarV2('icon/primary')};
    display: flex;
  }

  .enter-icon {
    opacity: 0;
  }

  .arrow-right-icon,
  .menu-item:hover .enter-icon {
    opacity: 1;
  }

  .menu-item[data-app-theme='light'] {
    .item-name {
      color: ${unsafeCSS(lightCssVariablesV2['--yunke-v2-text-primary'])};
    }

    .item-beta {
      color: ${unsafeCSS(lightCssVariablesV2['--yunke-v2-text-secondary'])};
    }

    .enter-icon,
    .arrow-right-icon {
      color: ${unsafeCSS(lightCssVariablesV2['--yunke-v2-icon-primary'])};
    }
  }

  .menu-item[data-app-theme='light']:hover {
    background: ${unsafeCSS(lightCssVariables['--yunke-hover-color'])};
  }

  .menu-item.discard[data-app-theme='light']:hover {
    background: ${unsafeCSS(
      lightCssVariables['--yunke-background-error-color']
    )};
  }

  .menu-item[data-app-theme='dark'] {
    .item-name {
      color: ${unsafeCSS(darkCssVariablesV2['--yunke-v2-text-primary'])};
    }

    .item-beta {
      color: ${unsafeCSS(darkCssVariablesV2['--yunke-v2-text-secondary'])};
    }

    .enter-icon,
    .arrow-right-icon {
      color: ${unsafeCSS(darkCssVariablesV2['--yunke-v2-icon-primary'])};
    }
  }

  .menu-item[data-app-theme='dark']:hover {
    background: ${unsafeCSS(darkCssVariables['--yunke-hover-color'])};
  }

  .menu-item.discard[data-app-theme='dark']:hover {
    background: ${unsafeCSS(
      darkCssVariables['--yunke-background-error-color']
    )};
  }
`;
