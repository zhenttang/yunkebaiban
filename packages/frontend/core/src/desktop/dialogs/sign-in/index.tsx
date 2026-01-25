import { Modal } from '@yunke/component';
import { SignInPanel, type SignInStep } from '@yunke/core/components/sign-in';
import { CLOUD_ENABLED_KEY } from '@yunke/core/modules/cloud/constant';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';
import type {
  DialogComponentProps,
  GLOBAL_DIALOG_SCHEMA,
} from '@yunke/core/modules/dialogs';
import { GlobalStateService } from '@yunke/core/modules/storage/services/global';
import { useService } from '@toeverything/infra';
import { useCallback, useEffect } from 'react';
export const SignInDialog = ({
  close,
  server: initialServerBaseUrl,
  step,
}: DialogComponentProps<GLOBAL_DIALOG_SCHEMA['sign-in']>) => {
  const globalStateService = useService(GlobalStateService);
  useEffect(() => {
    globalStateService.globalState.set(CLOUD_ENABLED_KEY, true);
  }, [globalStateService]);
  const onAuthenticated = useCallback(
    (status: AuthSessionStatus) => {
      if (status === 'authenticated') {
        close();
      }
    },
    [close]
  );
  return (
    <Modal
      open
      persistent
      onOpenChange={() => close()}
      width={400}
      height={550}
      contentOptions={{
        ['data-testid' as string]: 'auth-modal',
        style: { padding: '44px 40px 20px' },
      }}
    >
      <SignInPanel
        onSkip={close}
        onAuthenticated={onAuthenticated}
        server={initialServerBaseUrl}
        initStep={step as SignInStep}
      />
    </Modal>
  );
};
