import '@toeverything/theme/style.css';
import '@blocksuite/yunke/gfx/pointer';

import type { EdgelessRootBlockComponent } from '@blocksuite/yunke/blocks/root';
import { DefaultTool } from '@blocksuite/yunke/blocks/surface';
import { ColorScheme } from '@blocksuite/yunke/model';
import { ThemeProvider } from '@blocksuite/yunke/shared/services';
import { beforeEach, describe, expect, test } from 'vitest';

import { getDocRootBlock } from '../utils/edgeless.js';
import { setupEditor } from '../utils/setup.js';

describe('theme service', () => {
  let edgeless!: EdgelessRootBlockComponent;

  beforeEach(async () => {
    const cleanup = await setupEditor('edgeless');

    edgeless = getDocRootBlock(doc, editor, 'edgeless');

    edgeless.gfx.tool.setTool(DefaultTool);

    const themeService = edgeless.gfx.std.get(ThemeProvider);
    themeService.theme$.value = ColorScheme.Light;

    return cleanup;
  });

  test('switches theme', () => {
    const themeService = edgeless.gfx.std.get(ThemeProvider);
    expect(themeService.theme).toBe(ColorScheme.Light);

    themeService.theme$.value = ColorScheme.Dark;
    expect(themeService.theme).toBe(ColorScheme.Dark);

    themeService.theme$.value = ColorScheme.Light;
    expect(themeService.theme).toBe(ColorScheme.Light);
  });

  test('generates a color property', () => {
    const themeService = edgeless.gfx.std.get(ThemeProvider);
    expect(themeService.theme).toBe(ColorScheme.Light);

    expect(themeService.generateColorProperty('--yunke-hover-color')).toBe(
      'var(--yunke-hover-color)'
    );

    expect(themeService.generateColorProperty('--yunke-transparent')).toBe(
      'transparent'
    );

    expect(themeService.generateColorProperty('transparent')).toBe(
      'transparent'
    );

    expect(
      themeService.generateColorProperty({ dark: 'white', light: 'black' })
    ).toBe('black');

    themeService.theme$.value = ColorScheme.Dark;
    expect(themeService.theme).toBe(ColorScheme.Dark);

    expect(
      themeService.generateColorProperty({ dark: 'white', light: 'black' })
    ).toBe('white');

    expect(themeService.generateColorProperty({ normal: 'grey' })).toBe('grey');

    expect(themeService.generateColorProperty('', 'blue')).toBe('blue');
  });

  test('gets a color value', () => {
    const themeService = edgeless.gfx.std.get(ThemeProvider);
    expect(themeService.theme).toBe(ColorScheme.Light);

    expect(themeService.getColorValue('--yunke-transparent')).toBe(
      '--yunke-transparent'
    );
    expect(
      themeService.getColorValue('--yunke-transparent', 'transparent', true)
    ).toBe('transparent');
    expect(
      themeService.getColorValue('--yunke-hover-color', 'transparent', true)
    ).toBe('rgba(0, 0, 0, 0.04)');
    expect(
      themeService.getColorValue('--yunke-tooltip', undefined, true)
    ).toBe('rgba(0, 0, 0, 1)');

    expect(
      themeService.getColorValue(
        { dark: 'white', light: 'black' },
        undefined,
        true
      )
    ).toBe('black');
    expect(
      themeService.getColorValue({ dark: 'white', light: '' }, undefined, true)
    ).toBe('transparent');
    expect(
      themeService.getColorValue({ normal: 'grey' }, undefined, true)
    ).toBe('grey');

    themeService.theme$.value = ColorScheme.Dark;
    expect(themeService.theme).toBe(ColorScheme.Dark);

    expect(
      themeService.getColorValue('--yunke-hover-color', 'transparent', true)
    ).toEqual('rgba(255, 255, 255, 0.1)');
    expect(
      themeService.getColorValue('--yunke-tooltip', undefined, true)
    ).toEqual('rgba(234, 234, 234, 1)'); // #eaeaea
  });
});
