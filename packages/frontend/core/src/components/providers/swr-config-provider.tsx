import { notify } from '@yunke/component';
import { UserFriendlyError } from '@yunke/error';
import type { PropsWithChildren, ReactNode } from 'react';
import { useCallback } from 'react';
import type { SWRConfiguration } from 'swr';
import { SWRConfig } from 'swr';

const swrConfig: SWRConfiguration = {
  suspense: true,
  use: [
    useSWRNext => (key, fetcher, config) => {
      const fetcherWrapper = useCallback(
        async (...args: any[]) => {
          if (!fetcher) {
            throw new Error('fetcher 未找到');
          }
          const d = fetcher(...args);
          if (d instanceof Promise) {
            return d.catch(e => {
              let friendly: UserFriendlyError | undefined;
              try {
                friendly = UserFriendlyError.fromAny(e) as any;
              } catch (_err) {
                // 保底兜底，避免未预期异常导致崩溃
                friendly = new UserFriendlyError({
                  status: 500,
                  code: 'INTERNAL_SERVER_ERROR',
                  type: 'INTERNAL_SERVER_ERROR',
                  name: 'INTERNAL_SERVER_ERROR',
                  message: e?.message ?? 'Unknown error',
                } as any);
              }

              notify.error({
                title: String((friendly as any)?.name ?? 'Error'),
                message: String((friendly as any)?.message ?? 'Unknown error'),
              });

              throw e;
            });
          }
          return d;
        },
        [fetcher]
      );
      return useSWRNext(key, fetcher ? fetcherWrapper : fetcher, config);
    },
  ],
};

export const SWRConfigProvider = (props: PropsWithChildren): ReactNode => {
  return <SWRConfig value={swrConfig}>{props.children}</SWRConfig>;
};
