import { ModalConfigContext } from '@yunke/component';
import { NavigationGestureService } from '@yunke/core/mobile/modules/navigation-gesture';
import { globalVars } from '@yunke/core/mobile/styles/variables.css';
import { useService } from '@toeverything/infra';
import { type PropsWithChildren, useCallback } from 'react';

export const ModalConfigProvider = ({ children }: PropsWithChildren) => {
  const navigationGesture = useService(NavigationGestureService);

  const onOpen = useCallback(() => {
    const prev = navigationGesture.enabled$.value;
    if (prev) {
      navigationGesture.setEnabled(false);
      return () => {
        navigationGesture.setEnabled(prev);
      };
    }
    return;
  }, [navigationGesture]);

  return (
    <ModalConfigContext.Provider
      value={{ 
        onOpen, 
        // 传递键盘高度，让 Modal 能够动态调整位置，避免被键盘遮挡
        dynamicKeyboardHeight: globalVars.appKeyboardHeight 
      }}
    >
      {children}
    </ModalConfigContext.Provider>
  );
};

