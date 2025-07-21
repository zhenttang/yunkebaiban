import { describe, expect, it } from 'vitest';

import { FACTORIES } from '../routes';

describe('PATH_FACTORIES', () => {
  it('应该生成正确的路径', () => {
    expect(
      FACTORIES.admin.settings.module({
        module: 'auth',
      })
    ).toBe('/admin/settings/auth');
  });
});
