import { ConfirmModalProvider, PromptModalProvider } from '@yunke/component';
import { ProviderComposer } from '@yunke/component/provider-composer';
import { ThemeProvider } from '@yunke/core/components/theme-provider';
import type { createStore } from 'jotai';
import { Provider } from 'jotai';
import type { PropsWithChildren } from 'react';
import { useMemo } from 'react';

export type AffineContextProps = PropsWithChildren<{
  store?: ReturnType<typeof createStore>;
}>;

export function AffineContext(props: AffineContextProps) {
  return (
    <ProviderComposer
      contexts={useMemo(
        () =>
          [
            <Provider key="JotaiProvider" store={props.store} />,
            <ThemeProvider key="ThemeProvider" />,
            <ConfirmModalProvider key="ConfirmModalProvider" />,
            <PromptModalProvider key="PromptModalProvider" />,
          ].filter(Boolean),
        [props.store]
      )}
    >
      {props.children}
    </ProviderComposer>
  );
}
