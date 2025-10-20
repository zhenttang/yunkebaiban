import {
  type YunkeCssVariables,
  combinedDarkCssVariables,
  combinedLightCssVariables,
} from '@toeverything/theme';
import { unsafeCSS } from 'lit';

const toolbarColorKeys: Array<keyof YunkeCssVariables> = [
  '--yunke-background-overlay-panel-color',
  '--yunke-v2-layer-background-overlayPanel' as never,
  '--yunke-v2-layer-insideBorder-blackBorder' as never,
  '--yunke-v2-icon-primary' as never,
  '--yunke-background-error-color',
  '--yunke-background-primary-color',
  '--yunke-background-tertiary-color',
  '--yunke-icon-color',
  '--yunke-icon-secondary',
  '--yunke-border-color',
  '--yunke-divider-color',
  '--yunke-text-primary-color',
  '--yunke-hover-color',
  '--yunke-hover-color-filled',
];

export const lightToolbarStyles = (selector: string) => `
  ${selector}[data-app-theme='light'] {
    ${toolbarColorKeys
      .map(key => `${key}: ${unsafeCSS(combinedLightCssVariables[key])};`)
      .join('\n')}
  }
`;

export const darkToolbarStyles = (selector: string) => `
  ${selector}[data-app-theme='dark'] {
    ${toolbarColorKeys
      .map(key => `${key}: ${unsafeCSS(combinedDarkCssVariables[key])};`)
      .join('\n')}
  }
`;
