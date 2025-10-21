import {
  combinedDarkCssVariables,
  combinedLightCssVariables,
} from '@toeverything/theme';

type VariableRecord = Record<string, string>;

const styleElementId = 'yunke-theme-css-variables';

const formatVariables = (variables: VariableRecord) => {
  const entries = Object.entries(variables);
  console.log('[DEBUG] Total variables:', entries.length);
  console.log('[DEBUG] First 5 variable names:', entries.slice(0, 5).map(([name]) => name));
  
  const filtered = entries.filter(([name]) => name.startsWith('--yunke-'));
  console.log('[DEBUG] Filtered yunke- variables:', filtered.length);
  console.log('[DEBUG] First 5 filtered:', filtered.slice(0, 5).map(([name]) => name));
  
  return filtered
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n');
};

const buildCssText = () => {
  const light = formatVariables(combinedLightCssVariables);
  const dark = formatVariables(combinedDarkCssVariables);
  const sections = [`:root, :root[data-theme='light'] {\n${light}\n}`];

  if (dark.length) {
    sections.push(`:root[data-theme='dark'] {\n${dark}\n}`);
  }

  return sections.join('\n');
};

const ensureStyleElement = () => {
  const head = document.head || document.getElementsByTagName('head')[0];
  if (!head) return null;
  let styleEl = document.getElementById(styleElementId) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleElementId;
    styleEl.type = 'text/css';
    head.prepend(styleEl);
  }

  return styleEl;
};

const injectThemeCssVariables = () => {
  if (typeof document === 'undefined') return;
  const styleEl = ensureStyleElement();
  if (!styleEl) return;
  styleEl.textContent = buildCssText();
};

injectThemeCssVariables();

if (typeof window !== 'undefined') {
  (window as typeof window & { __forceRefreshYunkeTheme?: () => void }).__forceRefreshYunkeTheme =
    injectThemeCssVariables;
}
