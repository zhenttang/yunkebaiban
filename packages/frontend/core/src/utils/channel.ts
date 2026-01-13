import { z } from 'zod';

export const appSchemes = z.enum([
  'yunke',
  'yunke-canary',
  'yunke-beta',
  'yunke-internal',
  'yunke-dev',
]);

export type Scheme = z.infer<typeof appSchemes>;
export type Channel = 'stable' | 'canary' | 'beta' | 'internal';

export const schemeToChannel = {
  yunke: 'stable',
  'yunke-canary': 'canary',
  'yunke-beta': 'beta',
  'yunke-internal': 'internal',
  'yunke-dev': 'canary', // dev 没有专门的应用，使用 canary 作为占位符
} as Record<Scheme, Channel>;

export const channelToScheme = {
  stable: 'yunke',
  canary: BUILD_CONFIG.debug ? 'yunke-dev' : 'yunke-canary',
  beta: 'yunke-beta',
  internal: 'yunke-internal',
} as Record<Channel, Scheme>;

export const appIconMap = {
  stable: '/imgs/app-icon-stable.ico',
  canary: '/imgs/app-icon-canary.ico',
  beta: '/imgs/app-icon-beta.ico',
  internal: '/imgs/app-icon-internal.ico',
} satisfies Record<Channel, string>;

export const appNames = {
  stable: 'YUNKE',
  canary: 'YUNKE Canary',
  beta: 'YUNKE Beta',
  internal: 'YUNKE Internal',
} satisfies Record<Channel, string>;

export const appSchemaUrl = z.custom<string>(
  (url: string) => {
    try {
      return appSchemes.safeParse(new URL(url).protocol.replace(':', ''))
        .success;
    } catch {
      return false;
    }
  },
          { message: '无效的URL或协议' }
);
