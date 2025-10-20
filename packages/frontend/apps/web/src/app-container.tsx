import type { PropsWithChildren } from 'react';
import { SocketIOTestButton } from '@yunke/core/components/socket-io-test-button';

interface AppContainerProps {
  fallback?: boolean;
}

export function AppContainer({ 
  children, 
  fallback = false 
}: PropsWithChildren<AppContainerProps>) {
  if (fallback) {
    return <div className="yunke-app-loading">Loading...</div>;
  }

  return (
    <div className="yunke-app" data-platform="web">
      {children}
      <SocketIOTestButton />
    </div>
  );
} 