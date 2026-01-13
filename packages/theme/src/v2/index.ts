import { objectKeys } from '../utils/object-keys';
import {
  darkThemeV2,
  lightThemeV2,
  // only use for type inference
  type nestedDarkTheme,
  type nestedLightTheme,
} from './variables';

type NestedTheme = typeof nestedLightTheme | typeof nestedDarkTheme;

export { darkThemeV2, lightThemeV2 };
export type YunkeThemeV2 = typeof lightThemeV2;
export type YunkeThemeKeyV2 = keyof YunkeThemeV2;

export function themeToVar(theme: YunkeThemeKeyV2) {
  const parts = theme.split('/');
  return `--yunke-v2-${parts.join('-')}`;
}

function createVariables(theme: YunkeThemeV2) {
  const vars: Record<string, string> = {};
  objectKeys(theme).forEach(key => {
    vars[themeToVar(key)] = theme[key];
  });
  return vars;
}

export const lightCssVariablesV2 = createVariables(lightThemeV2);
export const darkCssVariablesV2 = createVariables(darkThemeV2);

function _cssVarV2(key: YunkeThemeKeyV2, fallback?: string) {
  return `var(${themeToVar(key)}${fallback ? `, ${fallback}` : ''})`;
}

function createCssVarProxy(prefix: string = ''): any {
  return new Proxy(_cssVarV2, {
    get(_, prop) {
      const newPrefix = prefix ? `${prefix}/${String(prop)}` : String(prop);

      if (typeof lightThemeV2[newPrefix as YunkeThemeKeyV2] !== 'string') {
        return createCssVarProxy(newPrefix);
      }

      // found the value
      return _cssVarV2(newPrefix as YunkeThemeKeyV2);
    },
    apply(_, __, [varName, fallback]) {
      return prefix
        ? _cssVarV2(prefix as YunkeThemeKeyV2, varName)
        : _cssVarV2(varName, fallback);
    },
  });
}

/**
 * Get Yunke css variable name type safely (v2)
 * @param key as copied from Figma design. __e.g. `text/primary`__
 *
 * ```ts
 * import { cssVarV2 } from '@toeverything/theme/v2';
 *
 * cssVarV2('text/primary');
 * cssVarV2('button/siderbarPrimary/background')
 *
 * // alternative syntax:
 * cssVarV2.text.primary;
 * cssVarV2.button.siderbarPrimary.background;
 * ```
 */
export const cssVarV2 = createCssVarProxy() as typeof _cssVarV2 & NestedTheme;

