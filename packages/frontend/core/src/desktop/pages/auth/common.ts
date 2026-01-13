import { z } from 'zod';

export const supportedClient = z.enum([
  'web',
  'yunke',
  'yunke-canary',
  'yunke-beta',
  ...(BUILD_CONFIG.debug ? ['yunke-dev'] : []),
]);
