import { Component as IndexComponent } from '@yunke/core/desktop/pages/index';

import { AppFallback } from '../components/app-fallback';

// Default route fallback for mobile

export const Component = () => {
  console.info('[mobile root index] render');
  // TODO: replace with a mobile version
  return (
    <IndexComponent
      defaultIndexRoute={'home'}
      fallback={<AppFallback withGlobalDialogs={false} />}
    />
  );
};
