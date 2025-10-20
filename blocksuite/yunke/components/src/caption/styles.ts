import { css } from 'lit';

export const styles = css`
  .yunke-block-component.border.light .selected-style {
    border-radius: 8px;
    box-shadow: 0px 0px 0px 1px var(--yunke-brand-color);
  }
  .yunke-block-component.border.dark .selected-style {
    border-radius: 8px;
    box-shadow: 0px 0px 0px 1px var(--yunke-brand-color);
  }
  @media print {
    .yunke-block-component.border.light .selected-style,
    .yunke-block-component.border.dark .selected-style {
      box-shadow: none;
    }
  }
`;
