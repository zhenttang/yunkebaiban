import { unsafeCSSVar } from '@blocksuite/yunke-shared/theme';
import { baseTheme } from '@toeverything/theme';
import { css, unsafeCSS } from 'lit';

export const styles = css`
  bookmark-card {
    display: block;
    height: 100%;
    width: 100%;
  }

  .yunke-bookmark-card {
    container: yunke-bookmark-card / inline-size;
    margin: 0 auto;
    box-sizing: border-box;
    display: flex;
    width: 100%;

    border-radius: 8px;
    border: 1px solid var(--yunke-background-tertiary-color);

    background: var(--yunke-background-primary-color);
    user-select: none;
  }

  .yunke-bookmark-content {
    width: calc(100% - 204px);
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-self: stretch;
    gap: 4px;
    padding: 12px;
  }

  .yunke-bookmark-content-title {
    display: flex;
    flex-direction: row;
    gap: 8px;
    align-items: center;

    align-self: stretch;
  }

  .yunke-bookmark-content-title-icon {
    display: flex;
    width: 16px;
    height: 16px;
    justify-content: center;
    align-items: center;
  }

  .yunke-bookmark-content-title-icon img,
  .yunke-bookmark-content-title-icon object,
  .yunke-bookmark-content-title-icon svg {
    width: 16px;
    height: 16px;
    fill: var(--yunke-background-primary-color);
  }

  .yunke-bookmark-content-title-text {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--yunke-text-primary-color);

    font-family: var(--yunke-font-family);
    font-size: var(--yunke-font-sm);
    font-style: normal;
    font-weight: 600;
    line-height: 22px;
  }

  .yunke-bookmark-content-description {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;

    flex-grow: 1;

    white-space: normal;
    word-break: break-word;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--yunke-text-primary-color);

    font-family: var(--yunke-font-family);
    font-size: var(--yunke-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }

  .yunke-bookmark-content-url {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    width: max-content;
    max-width: 100%;
  }

  .yunke-bookmark-content-url > span {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;

    word-break: break-all;
    white-space: normal;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--yunke-text-secondary-color);

    font-family: ${unsafeCSS(baseTheme.fontSansFamily)};
    font-size: var(--yunke-font-xs);
    font-style: normal;
    font-weight: 400;
    line-height: 20px;
  }
  .yunke-bookmark-content-url:hover > span {
    color: var(--yunke-link-color);
  }
  .yunke-bookmark-content-url:hover {
    fill: var(--yunke-link-color);
  }

  .yunke-bookmark-content-url-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 20px;
  }
  .yunke-bookmark-content-url-icon {
    height: 12px;
    width: 12px;
    color: ${unsafeCSSVar('iconSecondary')};
  }

  .yunke-bookmark-banner {
    margin: 12px 12px 0px 0px;
    width: 204px;
    max-width: 100%;
    height: 102px;
  }

  .yunke-bookmark-banner img,
  .yunke-bookmark-banner object,
  .yunke-bookmark-banner svg {
    width: 204px;
    max-width: 100%;
    height: 102px;
    object-fit: cover;
    border-radius: 4px;
  }

  .yunke-bookmark-card.loading {
    .yunke-bookmark-content-title-text {
      color: var(--yunke-placeholder-color);
    }
  }

  .yunke-bookmark-card.error {
    .yunke-bookmark-content-description {
      color: var(--yunke-placeholder-color);
    }
  }

  .yunke-bookmark-card.selected {
    .yunke-bookmark-content-url > span {
      color: var(--yunke-link-color);
    }
    .yunke-bookmark-content-url .yunke-bookmark-content-url-icon {
      color: var(--yunke-link-color);
    }
  }

  .yunke-bookmark-card.list {
    .yunke-bookmark-content {
      width: 100%;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .yunke-bookmark-content-title {
      width: calc(100% - 204px);
    }

    .yunke-bookmark-content-url {
      width: 204px;
      justify-content: flex-end;
    }

    .yunke-bookmark-content-description {
      display: none;
    }

    .yunke-bookmark-banner {
      display: none;
    }
  }

  .yunke-bookmark-card.vertical {
    flex-direction: column-reverse;
    height: 100%;

    .yunke-bookmark-content {
      width: 100%;
    }

    .yunke-bookmark-content-description {
      -webkit-line-clamp: 6;
      max-height: 120px;
    }

    .yunke-bookmark-content-url-wrapper {
      max-width: fit-content;
      display: flex;
      align-items: flex-end;
      flex-grow: 1;
      cursor: pointer;
    }

    .yunke-bookmark-banner {
      width: 340px;
      height: 170px;
      margin-left: 12px;
    }

    .yunke-bookmark-banner img,
    .yunke-bookmark-banner object,
    .yunke-bookmark-banner svg {
      width: 340px;
      height: 170px;
    }
  }

  .yunke-bookmark-card.cube {
    .yunke-bookmark-content {
      width: 100%;
      flex-direction: column;
      align-items: flex-start;
      justify-content: space-between;
    }

    .yunke-bookmark-content-title {
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
    }

    .yunke-bookmark-content-title-text {
      -webkit-line-clamp: 2;
    }

    .yunke-bookmark-content-description {
      display: none;
    }

    .yunke-bookmark-banner {
      display: none;
    }
  }

  @container yunke-bookmark-card (width < 375px) {
    .yunke-bookmark-content {
      width: 100%;
    }
    .yunke-bookmark-card:not(.edgeless) .yunke-bookmark-banner {
      display: none;
    }
  }
`;
