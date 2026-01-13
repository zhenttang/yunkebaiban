import { SignInPanel, type SignInStep } from '@yunke/core/components/sign-in';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
import { useCallback } from 'react';

import { MobileSignInLayout } from './layout';

export const MobileSignInPanel = ({
  onClose,
  server,
  initStep,
  onAuthenticated,
}: {
  onClose: () => void;
  server?: string;
  initStep?: SignInStep;
  onAuthenticated?: (status: AuthSessionStatus) => void;
}) => {
  const handleAuthenticated = useCallback(
    (status: AuthSessionStatus) => {
      onAuthenticated?.(status);
      if (!onAuthenticated && status === 'authenticated') {
        onClose();
      }
    },
    [onAuthenticated, onClose]
  );

  return (
    <MobileSignInLayout>
      <SignInPanel
        onSkip={onClose}
        onAuthenticated={handleAuthenticated}
        server={server}
        initStep={initStep}
      />
    </MobileSignInLayout>
  );
};
