import { css } from 'lit';

export const embedNoteContentStyles = css`
  .yunke-embed-doc-content-note-blocks yunke-divider,
  .yunke-embed-doc-content-note-blocks yunke-divider > * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .yunke-embed-doc-content-note-blocks yunke-paragraph,
  .yunke-embed-doc-content-note-blocks yunke-list {
    margin-top: 4px !important;
    margin-bottom: 4px !important;
    padding: 0 2px;
  }
  .yunke-embed-doc-content-note-blocks yunke-paragraph *,
  .yunke-embed-doc-content-note-blocks yunke-list * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 0;
    padding-bottom: 0;
    line-height: 20px;
    font-size: var(--yunke-font-xs);
    font-weight: 400;
  }
  .yunke-embed-doc-content-note-blocks yunke-list .yunke-list-block__prefix {
    height: 20px;
  }
  .yunke-embed-doc-content-note-blocks yunke-paragraph .quote {
    padding-left: 15px;
    padding-top: 8px;
    padding-bottom: 8px;
  }
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h1),
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h2),
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h3),
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h4),
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h5),
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h6) {
    margin-top: 6px !important;
    margin-bottom: 4px !important;
    padding: 0 2px;
  }
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h1) *,
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h2) *,
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h3) *,
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h4) *,
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h5) *,
  .yunke-embed-doc-content-note-blocks yunke-paragraph:has(.h6) * {
    margin-top: 0px !important;
    margin-bottom: 0px !important;
    padding-top: 0;
    padding-bottom: 0;
    line-height: 20px;
    font-size: var(--yunke-font-xs);
    font-weight: 600;
  }

  .yunke-embed-linked-doc-block.horizontal {
    yunke-paragraph,
    yunke-list {
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      max-height: 40px;
      overflow: hidden;
      display: flex;
    }
    yunke-paragraph .quote {
      padding-top: 4px;
      padding-bottom: 4px;
      height: 28px;
    }
    yunke-paragraph .quote::after {
      height: 20px;
      margin-top: 4px !important;
      margin-bottom: 4px !important;
    }
  }
`;
