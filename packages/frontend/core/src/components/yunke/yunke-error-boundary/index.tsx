import { ErrorBoundary, type FallbackRender } from '@sentry/react';
import type { FC, PropsWithChildren } from 'react';
import { useCallback } from 'react';

import { YunkeErrorFallback } from './yunke-error-fallback';

export { type FallbackProps } from './error-basic/fallback-creator';

export interface YunkeErrorBoundaryProps extends PropsWithChildren {
  height?: number | string;
  className?: string;
}

/**
 * TODO(@eyhn): Unify with SWRErrorBoundary
 */
export const YunkeErrorBoundary: FC<YunkeErrorBoundaryProps> = props => {
  const fallbackRender: FallbackRender = useCallback(
    fallbackProps => {
      return (
        <YunkeErrorFallback
          {...fallbackProps}
          height={props.height}
          className={props.className}
        />
      );
    },
    [props.height, props.className]
  );

  const onError = useCallback((error: unknown, componentStack?: string) => {
    console.error('未捕获错误：', error, componentStack);
  }, []);

  return (
    <ErrorBoundary fallback={fallbackRender} onError={onError}>
      {props.children}
    </ErrorBoundary>
  );
};
