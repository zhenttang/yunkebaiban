import { registerPlugin } from '@capacitor/core';

import type { YunkeThemePlugin } from './definitions';

const YunkeTheme = registerPlugin<YunkeThemePlugin>('YunkeTheme');

export * from './definitions';
export { YunkeTheme };
