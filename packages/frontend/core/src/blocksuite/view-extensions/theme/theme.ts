import { DocService, DocsService } from '@affine/core/modules/doc';
import { AppThemeService } from '@affine/core/modules/theme';
import type { Container } from '@blocksuite/affine/global/di';
import { ColorScheme } from '@blocksuite/affine/model';
import {
  type ThemeExtension,
  ThemeExtensionIdentifier,
} from '@blocksuite/affine/shared/services';
import {
  createSignalFromObservable,
  type Signal,
} from '@blocksuite/affine/shared/utils';
import { LifeCycleWatcher, StdIdentifier } from '@blocksuite/affine/std';
import { type FrameworkProvider } from '@toeverything/infra';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';

export function getThemeExtension(
  framework: FrameworkProvider
): typeof LifeCycleWatcher {
  class AffineThemeExtension
    extends LifeCycleWatcher
    implements ThemeExtension
  {
    static override readonly key = 'affine-theme';

    private readonly themes: Map<string, Signal<ColorScheme>> = new Map();

    protected readonly disposables: (() => void)[] = [];

    static override setup(di: Container) {
      super.setup(di);
      di.override(ThemeExtensionIdentifier, AffineThemeExtension, [
        StdIdentifier,
      ]);
    }

    getAppTheme() {
      const keyName = 'app-theme';
      const cache = this.themes.get(keyName);
      if (cache) return cache;

      const theme$: Observable<ColorScheme> = framework
        .get(AppThemeService)
        .appTheme.theme$.map(theme => {
          return theme === ColorScheme.Dark
            ? ColorScheme.Dark
            : ColorScheme.Light;
        });
      const { signal: themeSignal, cleanup } =
        createSignalFromObservable<ColorScheme>(theme$, ColorScheme.Light);
      this.disposables.push(cleanup);
      this.themes.set(keyName, themeSignal);
      return themeSignal;
    }

    getEdgelessTheme(_docId?: string) {
      // Force edgeless to follow global app theme, ignoring per-doc overrides
      const keyName = 'edgeless-app-theme';
      const cache = this.themes.get(keyName);
      if (cache) return cache;

      const theme$: Observable<ColorScheme> = framework
        .get(AppThemeService)
        .appTheme.theme$.map(theme => {
          return theme === ColorScheme.Dark
            ? ColorScheme.Dark
            : ColorScheme.Light;
        });
      const { signal: themeSignal, cleanup } =
        createSignalFromObservable<ColorScheme>(theme$, ColorScheme.Light);
      this.disposables.push(cleanup);
      this.themes.set(keyName, themeSignal);
      return themeSignal;
    }

    override unmounted() {
      this.dispose();
    }

    dispose() {
      this.disposables.forEach(dispose => dispose());
    }
  }

  return AffineThemeExtension;
}
