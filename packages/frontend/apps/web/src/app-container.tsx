import type { PropsWithChildren } from 'react';

interface AppContainerProps {
  fallback?: boolean;
}

export function AppContainer({ 
  children, 
  fallback = false 
}: PropsWithChildren<AppContainerProps>) {
  if (fallback) {
    return <div className="affine-app-loading">Loading...</div>;
  }

  return (
    <div className="affine-app" data-platform="web">
      {children}
    </div>
  );
} 