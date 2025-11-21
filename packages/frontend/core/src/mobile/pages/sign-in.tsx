// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useNavigate, useSearchParams } from 'react-router-dom';

import type { SignInStep } from '@yunke/core/components/sign-in';
import type { AuthSessionStatus } from '@yunke/core/modules/cloud/entities/session';

import { MobileSignInPanel } from '../components/sign-in';

export const Component = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const redirectUri = searchParams.get('redirect_uri') ?? undefined;
  const server = searchParams.get('server') ?? undefined;
  const stepParam = searchParams.get('step');
  const initStep: SignInStep | undefined = stepParam && ['signIn', 'signInWithPassword', 'signInWithEmail', 'addSelfhosted', 'signInWithMobile', 'signInWithWeChat', 'signInWithWeChatOfficial'].includes(stepParam)
    ? (stepParam as SignInStep)
    : undefined;

  const handleClose = () => {
    navigate(redirectUri || '/', { replace: true });
  };

  const handleAuthenticated = (status: AuthSessionStatus) => {
    if (status !== 'authenticated') return;
    if (redirectUri) {
      navigate(redirectUri, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <MobileSignInPanel
      onClose={handleClose}
      server={server}
      initStep={initStep}
      onAuthenticated={handleAuthenticated}
    />
  );
};
