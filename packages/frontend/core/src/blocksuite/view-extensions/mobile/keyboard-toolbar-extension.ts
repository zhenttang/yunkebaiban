import { VirtualKeyboardProvider } from '@yunke/core/mobile/modules/virtual-keyboard';
import type { Container } from '@blocksuite/yunke/global/di';
import { DisposableGroup } from '@blocksuite/yunke/global/disposable';
import {
  VirtualKeyboardProvider as BSVirtualKeyboardProvider,
  type VirtualKeyboardProviderWithAction,
} from '@blocksuite/yunke/shared/services';
import { LifeCycleWatcher } from '@blocksuite/yunke/std';
import type { ExtensionType } from '@blocksuite/yunke/store';
import { batch, signal } from '@preact/signals-core';
import type { FrameworkProvider } from '@toeverything/infra';

export function KeyboardToolbarExtension(
  framework: FrameworkProvider
): ExtensionType {
  const yunkeVirtualKeyboardProvider = framework.get(VirtualKeyboardProvider);

  class BSVirtualKeyboardService
    extends LifeCycleWatcher
    implements BSVirtualKeyboardProvider
  {
    static override key = BSVirtualKeyboardProvider.identifierName;

    private readonly _disposables = new DisposableGroup();

    // eslint-disable-next-line rxjs/finnish
    readonly visible$ = signal(false);

    // eslint-disable-next-line rxjs/finnish
    readonly height$ = signal(0);

    static override setup(di: Container) {
      super.setup(di);
      di.addImpl(BSVirtualKeyboardProvider, provider => {
        return provider.get(this);
      });
    }

    override mounted() {
      this._disposables.add(
        yunkeVirtualKeyboardProvider.onChange(({ visible, height }) => {
          batch(() => {
            this.visible$.value = visible;
            this.height$.value = height;
          });
        })
      );
    }

    override unmounted() {
      this._disposables.dispose();
    }
  }

  if ('show' in yunkeVirtualKeyboardProvider) {
    const providerWithAction = yunkeVirtualKeyboardProvider;

    class BSVirtualKeyboardServiceWithShowAndHide
      extends BSVirtualKeyboardService
      implements VirtualKeyboardProviderWithAction
    {
      show() {
        providerWithAction.show();
      }

      hide() {
        providerWithAction.hide();
      }
    }

    return BSVirtualKeyboardServiceWithShowAndHide;
  }

  return BSVirtualKeyboardService;
}
