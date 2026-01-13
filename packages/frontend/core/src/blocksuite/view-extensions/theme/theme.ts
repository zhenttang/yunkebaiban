import { DocService, DocsService } from '@yunke/core/modules/doc';
import { AppThemeService } from '@yunke/core/modules/theme';
import type { Container } from '@blocksuite/yunke/global/di';
import { ColorScheme } from '@blocksuite/yunke/model';
import {
  type ThemeExtension,
  ThemeExtensionIdentifier,
} from '@blocksuite/yunke/shared/services';
import {
  createSignalFromObservable,
  type Signal,
} from '@blocksuite/yunke/shared/utils';
import { LifeCycleWatcher, StdIdentifier } from '@blocksuite/yunke/std';
import { type FrameworkProvider } from '@toeverything/infra';
import type { Observable } from 'rxjs';
import { combineLatest, map } from 'rxjs';

export function getThemeExtension(
  framework: FrameworkProvider
): typeof LifeCycleWatcher {
  class YunkeThemeExtension
    extends LifeCycleWatcher
    implements ThemeExtension
  {
    static override readonly key = 'yunke-theme';

    private readonly themes: Map<string, Signal<ColorScheme>> = new Map();

    protected readonly disposables: (() => void)[] = [];

    static override setup(di: Container) {
      super.setup(di);
      di.override(ThemeExtensionIdentifier, YunkeThemeExtension, [
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

  return YunkeThemeExtension;
}
