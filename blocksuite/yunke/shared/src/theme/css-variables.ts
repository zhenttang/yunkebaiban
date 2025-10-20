/* CSS variables. You need to handle all places where `CSS variables` are marked. */

import { LINE_COLORS } from '@blocksuite/yunke-model';
import {
  type YunkeCssVariables,
  type YunkeTheme,
  cssVar,
} from '@toeverything/theme';
export { cssVar } from '@toeverything/theme';
import { type YunkeThemeKeyV2, cssVarV2 } from '@toeverything/theme/v2';
import { unsafeCSS } from 'lit';
export { cssVarV2 } from '@toeverything/theme/v2';
export const ColorVariables = [
  '--yunke-brand-color',
  '--yunke-primary-color',
  '--yunke-secondary-color',
  '--yunke-tertiary-color',
  '--yunke-hover-color',
  '--yunke-icon-color',
  '--yunke-icon-secondary',
  '--yunke-border-color',
  '--yunke-divider-color',
  '--yunke-placeholder-color',
  '--yunke-quote-color',
  '--yunke-link-color',
  '--yunke-edgeless-grid-color',
  '--yunke-success-color',
  '--yunke-warning-color',
  '--yunke-error-color',
  '--yunke-processing-color',
  '--yunke-text-emphasis-color',
  '--yunke-text-primary-color',
  '--yunke-text-secondary-color',
  '--yunke-text-disable-color',
  '--yunke-black-10',
  '--yunke-black-30',
  '--yunke-black-50',
  '--yunke-black-60',
  '--yunke-black-80',
  '--yunke-black-90',
  '--yunke-black',
  '--yunke-white-10',
  '--yunke-white-30',
  '--yunke-white-50',
  '--yunke-white-60',
  '--yunke-white-80',
  '--yunke-white-90',
  '--yunke-white',
  '--yunke-background-code-block',
  '--yunke-background-tertiary-color',
  '--yunke-background-processing-color',
  '--yunke-background-error-color',
  '--yunke-background-warning-color',
  '--yunke-background-success-color',
  '--yunke-background-primary-color',
  '--yunke-background-secondary-color',
  '--yunke-background-modal-color',
  '--yunke-background-overlay-panel-color',
  '--yunke-tag-blue',
  '--yunke-tag-green',
  '--yunke-tag-teal',
  '--yunke-tag-white',
  '--yunke-tag-purple',
  '--yunke-tag-red',
  '--yunke-tag-pink',
  '--yunke-tag-yellow',
  '--yunke-tag-orange',
  '--yunke-tag-gray',
  ...LINE_COLORS,
  '--yunke-tooltip',
  '--yunke-blue',
];

export const SizeVariables = [
  '--yunke-font-h-1',
  '--yunke-font-h-2',
  '--yunke-font-h-3',
  '--yunke-font-h-4',
  '--yunke-font-h-5',
  '--yunke-font-h-6',
  '--yunke-font-base',
  '--yunke-font-sm',
  '--yunke-font-xs',
  '--yunke-line-height',
  '--yunke-z-index-modal',
  '--yunke-z-index-popover',
];

export const FontFamilyVariables = [
  '--yunke-font-family',
  '--yunke-font-number-family',
  '--yunke-font-code-family',
];

export const StyleVariables = [
  '--yunke-editor-width',

  '--yunke-theme-mode',
  '--yunke-editor-mode',
  /* --yunke-palette-transparent: special values added for the sake of logical consistency. */
  '--yunke-palette-transparent',

  '--yunke-popover-shadow',
  '--yunke-menu-shadow',
  '--yunke-float-button-shadow',
  '--yunke-shadow-1',
  '--yunke-shadow-2',
  '--yunke-shadow-3',

  '--yunke-paragraph-space',
  '--yunke-popover-radius',
  '--yunke-scale',
  ...SizeVariables,
  ...ColorVariables,
  ...FontFamilyVariables,
] as const;

type VariablesType = typeof StyleVariables;
export type CssVariableName = Extract<
  VariablesType[keyof VariablesType],
  string
>;

export type CssVariablesMap = Record<CssVariableName, string>;

export const unsafeCSSVar = (
  key: keyof YunkeCssVariables | keyof YunkeTheme,
  fallback?: string
) => unsafeCSS(cssVar(key, fallback));

export const unsafeCSSVarV2 = (key: YunkeThemeKeyV2, fallback?: string) =>
  unsafeCSS(cssVarV2(key, fallback));
